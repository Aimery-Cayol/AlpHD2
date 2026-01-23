"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { PLYLoader } from "three-stdlib";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { BufferGeometry, Mesh } from "three";
import * as THREE from "three";
import { useSceneControls } from "./LevaUI";
import { geometryCache } from "./GeometryCache";
import GeometryInspector from "./GeometryInspector";
import { isLocalUrl, revokeBlobUrl } from "@/utils/fileUtils";
import HauteMontagne from "./HauteMontagneShader";
import BasseMontagne from "./BasseMontagneShader";

// Helper simple pour la Bounding Box (si tu ne l'as pas ailleurs)
function BoundingBoxHelper({ box, color }: { box: THREE.Box3, color: string }) {
  return <box3Helper args={[box, new THREE.Color(color)]} />;
}

export default function MeshLoader({ url, format, onDoubleClick, lightDirection }: any) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<"loading" | "cache" | "network" | "local">("loading");
  
  const meshRef = useRef<Mesh>(null);
  const controls = useSceneControls();

  // 🎯 OPTIMISATION 1: Créer les matériaux une seule fois
  const materials = useMemo(() => ({
    normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
    standard: new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }),
    hauteMontagne: new HauteMontagne(),
    basseMontagne: new BasseMontagne(),
  }), []);

  // 🎯 OPTIMISATION 2: Sélectionner le matériau actif
  const activeMaterial = useMemo(() => {
    switch (controls.material) {
      case "Normales": return materials.normal;
      case "HauteMontagne": return materials.hauteMontagne;
      case "BasseMontagne": return materials.basseMontagne;
      default: return materials.standard;
    }
  }, [controls.material, materials]);

  // 🎯 OPTIMISATION 3: Mise à jour des uniforms
  useEffect(() => {
    if (!activeMaterial) return;

    if (controls.material === "Standard") {
      const mat = activeMaterial as THREE.MeshStandardMaterial;
      mat.color.set(controls.meshColor);
      mat.roughness = controls.roughness;
      mat.metalness = controls.metalness;
    } else if (controls.material === "HauteMontagne" || controls.material === "BasseMontagne") {
      const mat = activeMaterial as any;
      const prefix = controls.material === "HauteMontagne" ? "" : "BM";
      
      mat.uniforms.snowColor.value.set(controls[`snowColor${prefix}` as keyof typeof controls]);
      mat.uniforms.rockColor.value.set(controls[`rockColor${prefix}` as keyof typeof controls]);
      mat.uniforms.slopeThreshold.value = controls[`slopeThreshold${prefix}` as keyof typeof controls];
      mat.uniforms.smoothness.value = controls[`smoothness${prefix}` as keyof typeof controls];
      mat.uniforms.lightDirection.value.copy(lightDirection || new THREE.Vector3(1, 1, 1).normalize());
      mat.uniforms.ambientIntensity.value = controls.ambientIntensity;
    }
  }, [activeMaterial, controls, lightDirection]);

  // 🎯 OPTIMISATION 4: Chargement avec Draco/PLY et Cache
  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    const loadGeometry = async () => {
      setLoading(true);
      setError(null);

      const cachedGeometry = geometryCache.get(url);
      if (cachedGeometry) {
        setCacheStatus("cache");
        setGeometry(cachedGeometry);
        setLoading(false);
        return;
      }

      setCacheStatus(isLocalUrl(url) ? "local" : "network");

      const loader = format === "drc" ? new DRACOLoader() : new PLYLoader();
      if (format === "drc") {
        (loader as DRACOLoader).setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      }

      loader.load(url, (geo: BufferGeometry) => {
        if (cancelled) return;
        
        // SURTOUT PAS DE .center() : on garde les coordonnées Lambert
        geo.computeVertexNormals();
        geo.computeBoundingBox();

        geometryCache.set(url, geo);
        setGeometry(geo);
        setLoading(false);
      }, undefined, (err) => {
        if (cancelled) return;
        setError("Erreur chargement");
        setLoading(false);
      });
    };

    loadGeometry();
    return () => { cancelled = true; };
  }, [url, format]);

  // Mémorisation des dimensions pour le mesh invisible (clics)
  const boundingInfo = useMemo(() => {
    if (!geometry?.boundingBox) return null;
    const box = geometry.boundingBox;
    return {
      center: [(box.max.x + box.min.x) / 2, (box.max.y + box.min.y) / 2, (box.max.z + box.min.z) / 2] as [number, number, number],
      size: [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z] as [number, number, number]
    };
  }, [geometry]);

  if (loading) return <mesh><boxGeometry /><meshStandardMaterial wireframe color="orange" /></mesh>;
  if (error || !geometry) return null;

  return (
    <group>
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        material={activeMaterial}
        castShadow 
        receiveShadow 
      />

      {/* Mesh invisible pour faciliter le double-clic sur les gros reliefs */}
      {boundingInfo && onDoubleClick && (
        <mesh onDoubleClick={onDoubleClick} visible={false} position={boundingInfo.center}>
          <boxGeometry args={boundingInfo.size} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {controls.showBoundingBoxes && geometry.boundingBox && (
        <BoundingBoxHelper box={geometry.boundingBox} color={cacheStatus === "cache" ? "#00ff00" : "#ffff00"} />
      )}
    </group>
  );
}