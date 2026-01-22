"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
<<<<<<< Updated upstream
import { useLoader } from "@react-three/fiber";
import { PLYLoader } from "three-stdlib";
=======
>>>>>>> Stashed changes
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { BufferGeometry, Mesh } from "three";
import * as THREE from "three";
import { useSceneControls } from "./LevaUI";
import { geometryCache } from "./GeometryCache";
<<<<<<< Updated upstream
import GeometryInspector from "./GeometryInspector";
import { isLocalUrl, revokeBlobUrl } from "@/utils/fileUtils";

=======
>>>>>>> Stashed changes
import HauteMontagne from "./HauteMontagneShader";
import BasseMontagne from "./BasseMontagneShader";

export default function MeshLoader({ url, onDoubleClick, lightDirection }: any) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
<<<<<<< Updated upstream
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState < "loading" | "cache" | "network" | "local"
  >("loading");
  const meshRef = useRef<Mesh>(null);
  const controls = useSceneControls();

  // 🎯 OPTIMISATION 1: Créer TOUS les matériaux une seule fois
  const materials = useMemo(() => {
    return {
      normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
      standard: new THREE.MeshStandardMaterial({ 
        side: THREE.DoubleSide,
        color: controls.meshColor,
        roughness: controls.roughness,
        metalness: controls.metalness,
      }),
      hauteMontagne: new HauteMontagne(),
      basseMontagne: new BasseMontagne(),
    };
  }, []); // ✅ Créé UNE SEULE FOIS

  // 🎯 OPTIMISATION 2: Sélectionner le matériau actif sans le recréer
  const activeMaterial = useMemo(() => {
    switch (controls.material) {
      case "Normales":
        return materials.normal;
      case "Standard":
        return materials.standard;
      case "HauteMontagne":
        return materials.hauteMontagne;
      case "BasseMontagne":
        return materials.basseMontagne;
      default:
        return materials.standard;
    }
  }, [controls.material, materials]);

  // 🎯 OPTIMISATION 3: Mettre à jour les uniforms/propriétés selon le matériau actif
  useEffect(() => {
    if (!activeMaterial) return;

    if (controls.material === "Standard") {
      const mat = activeMaterial as THREE.MeshStandardMaterial;
      mat.color.set(controls.meshColor);
      mat.roughness = controls.roughness;
      mat.metalness = controls.metalness;
      mat.needsUpdate = true;
    }

    if (controls.material === "HauteMontagne") {
      const mat = activeMaterial as any;
      mat.uniforms.snowColor.value.set(controls.snowColor);
      mat.uniforms.rockColor.value.set(controls.rockColor);
      mat.uniforms.slopeThreshold.value = controls.slopeThreshold;
      mat.uniforms.smoothness.value = controls.smoothness;
      mat.uniforms.lightDirection.value.copy(
        lightDirection || new THREE.Vector3(1, 1, 1).normalize()
      );
      mat.uniforms.ambientIntensity.value = controls.ambientIntensity;
    }

    if (controls.material === "BasseMontagne") {
      const mat = activeMaterial as any;
      mat.uniforms.snowColor.value.set(controls.snowColorBM);
      mat.uniforms.rockColor.value.set(controls.rockColorBM);
      mat.uniforms.slopeThreshold.value = controls.slopeThresholdBM;
      mat.uniforms.smoothness.value = controls.smoothnessBM;
      mat.uniforms.lightDirection.value.copy(
        lightDirection || new THREE.Vector3(1, 1, 1).normalize()
      );
      mat.uniforms.ambientIntensity.value = controls.ambientIntensity;
    }
  }, [
    activeMaterial,
    controls.material,
    controls.meshColor,
    controls.roughness,
    controls.metalness,
    controls.snowColor,
    controls.rockColor,
    controls.slopeThreshold,
    controls.smoothness,
    controls.snowColorBM,
    controls.rockColorBM,
    controls.slopeThresholdBM,
    controls.smoothnessBM,
    controls.ambientIntensity,
    lightDirection,
  ]);

  // 🎯 OPTIMISATION 4: Cleanup des matériaux à l'unmount
  useEffect(() => {
    return () => {
      // Dispose de TOUS les matériaux
      Object.values(materials).forEach(mat => mat.dispose());
      
      // Ne dispose la géométrie QUE si elle n'est pas en cache
      if (meshRef.current?.geometry && !geometryCache.has(url)) {
        meshRef.current.geometry.dispose();
      }
      
      // Nettoyer les URLs blob locales
      if (url && isLocalUrl(url)) {
        revokeBlobUrl(url);
      }
    };
  }, [materials, url]);

  // 🎯 OPTIMISATION 5: Mémoriser les calculs de bounding box
  const boundingCenter = useMemo(() => {
    if (!geometry?.boundingBox) return [0, 0, 0] as const;
    const box = geometry.boundingBox;
    return [
      (box.max.x + box.min.x) / 2,
      (box.max.y + box.min.y) / 2,
      (box.max.z + box.min.z) / 2,
    ] as const;
  }, [geometry]);

  const boundingSize = useMemo(() => {
    if (!geometry?.boundingBox) return [1, 1, 1];
    const box = geometry.boundingBox;
    return [
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z,
    ];
  }, [geometry]);
=======
  const meshRef = useRef<Mesh>(null);
  const controls = useSceneControls();

  // On initialise les matériaux une seule fois
  const hauteMat = useMemo(() => new HauteMontagne(), []);
  const basseMat = useMemo(() => new BasseMontagne(), []);
>>>>>>> Stashed changes

  useEffect(() => {
    if (!url) return;
    const cached = geometryCache.get(url);
    if (cached) {
      setGeometry(cached);
      return;
    }

<<<<<<< Updated upstream
    // 🎯 OPTIMISATION 6: Flag pour annuler les opérations async
    let cancelled = false;

    const loadGeometry = async () => {
      setLoading(true);
      setError(null);

      try {
        // Vérifier le cache
        const cachedGeometry = geometryCache.get(url);

        if (cachedGeometry) {
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ Géométrie depuis cache:", url);
          }
          setCacheStatus("cache");
          setGeometry(cachedGeometry);
          setLoading(false);
          return;
        }

        // Déterminer la source
        if (isLocalUrl(url)) {
          setCacheStatus("local");
        } else {
          setCacheStatus("network");
        }

        let loader;

        if (format === "drc") {
          loader = new DRACOLoader();
          const supportsWasm =
            typeof WebAssembly === "object" && WebAssembly.validate;
          const decoderType = supportsWasm ? "wasm" : "js";
          loader.setDecoderPath('/draco/');
          loader.setDecoderConfig({ type: decoderType });
        } else {
          loader = new PLYLoader();
        }

        loader.setCrossOrigin("anonymous");

        loader.load(
          url,
          async (geometry: BufferGeometry) => {
            if (cancelled) return; // ✅ Éviter les updates après unmount

            // 🎯 OPTIMISATION 7: Calculs asynchrones découplés
            await new Promise(resolve => setTimeout(resolve, 0));
            if (cancelled) return;
            
            geometry.computeVertexNormals();
            
            await new Promise(resolve => setTimeout(resolve, 0));
            if (cancelled) return;
            
            geometry.computeBoundingBox();

            await new Promise(resolve => setTimeout(resolve, 0));
            if (cancelled) return;
            
            const perfInfo = GeometryInspector.getPerformanceInfo(geometry);
            const meshName = url.split('/').pop() || 'mesh';
            
            console.log(`📊 Mesh chargé: ${meshName}`);
            console.log(`  └─ Vertices: ${perfInfo.vertices.toLocaleString()}`);
            if (perfInfo.indexed) {
              console.log(`  └─ Indices: ${perfInfo.indices.toLocaleString()}`);
            }
            console.log(`  └─ Triangles: ${Math.floor(perfInfo.triangles).toLocaleString()}`);
            console.log(`  └─ Mémoire: ${(perfInfo.memoryUsage / (1024 * 1024)).toFixed(2)} MB`);
            console.log(`  └─ Type: ${perfInfo.indexed ? 'Indexé' : 'Non-indexé'}`);
            
            if (cancelled) return;
            
            geometryCache.set(url, geometry);
            setGeometry(geometry);
            setLoading(false);
          },
          (progress) => {
            if (process.env.NODE_ENV === 'development') {
              console.log("Chargement:", (progress.loaded / progress.total) * 100 + "%");
            }
          },
          (error) => {
            if (cancelled) return;
            console.error(`Erreur chargement ${format?.toUpperCase()}:`, error);
            setError(`Erreur chargement ${format?.toUpperCase()}`);
            setLoading(false);
          }
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Erreur:", err);
        setError("Erreur chargement");
        setLoading(false);
      }
    };

    loadGeometry();

    return () => {
      cancelled = true; // ✅ Annuler les opérations en cours
    };
  }, [url, format]);

  if (loading) {
    const loadingColor =
      cacheStatus === "cache"
        ? "#00ff00"
        : cacheStatus === "local"
          ? "#0066cc"
          : "#ffaa00";

    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={loadingColor} wireframe />
        </mesh>
        {controls.showBoundingBoxes && (
          <BoundingBoxHelper
            box={
              new THREE.Box3(
                new THREE.Vector3(-0.5, -0.5, -0.5),
                new THREE.Vector3(0.5, 0.5, 0.5)
              )
            }
            color={loadingColor}
          />
        )}
      </group>
    );
  }

  if (error || !geometry) {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
        {controls.showBoundingBoxes && (
          <BoundingBoxHelper
            box={
              new THREE.Box3(
                new THREE.Vector3(-0.5, -0.5, -0.5),
                new THREE.Vector3(0.5, 0.5, 0.5)
              )
            }
            color="#ff0000"
          />
        )}
      </group>
    );
  }

  return (
    <group>
      {/* ✅ Un seul mesh avec le matériau actif */}
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        material={activeMaterial}
        castShadow 
        receiveShadow 
        userData={{ url }}
      />

      {/* Mesh invisible pour les clics - utilise les valeurs mémorisées */}
      {geometry.boundingBox && onDoubleClick && (
        <mesh
          onDoubleClick={onDoubleClick}
          visible={false}
          position={boundingCenter}
        >
          <boxGeometry args={boundingSize as [number, number, number]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* Bounding box */}
      {controls.showBoundingBoxes && geometry.boundingBox && (
        <BoundingBoxHelper
          box={geometry.boundingBox}
          color={
            cacheStatus === "cache"
              ? "#16a34a"
              : cacheStatus === "local"
                ? "#0066cc"
                : "#ffff00"
          }
        />
      )}

      {/* Indicateurs visuels */}
      {cacheStatus === "cache" && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}

      {cacheStatus === "local" && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#0066cc" />
        </mesh>
      )}
    </group>
=======
    const loader = new DRACOLoader();
    loader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.load(url, (loadedGeometry: BufferGeometry) => {
      loadedGeometry.computeBoundingBox();
      // SURTOUT PAS DE .center() : cela écraserait les coordonnées Lambert
      loadedGeometry.computeVertexNormals();
      geometryCache.set(url, loadedGeometry);
      setGeometry(loadedGeometry);
    });
  }, [url]);

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} onDoubleClick={onDoubleClick} castShadow receiveShadow>
      {controls.material === "HauteMontagne" && (
        <primitive
          object={hauteMat}
          attach="material"
          snowColor={controls.snowColor}
          rockColor={controls.rockColor}
          slopeThreshold={controls.slopeThreshold}
          smoothness={controls.smoothness}
          lightDirection={lightDirection || new THREE.Vector3(1, 1, 1).normalize()}
          ambientIntensity={controls.ambientIntensity}
        />
      )}
      {controls.material === "BasseMontagne" && (
        <primitive
          object={basseMat}
          attach="material"
          snowColor={controls.snowColorBM}
          rockColor={controls.rockColorBM}
          slopeThreshold={controls.slopeThresholdBM}
          smoothness={controls.smoothnessBM}
          lightDirection={lightDirection || new THREE.Vector3(1, 1, 1).normalize()}
        />
      )}
      {controls.material === "Standard" && (
        <meshStandardMaterial color={controls.meshColor} side={THREE.DoubleSide} />
      )}
    </mesh>
>>>>>>> Stashed changes
  );
}