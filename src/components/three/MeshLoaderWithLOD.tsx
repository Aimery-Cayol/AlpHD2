"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { BufferGeometry, Mesh } from "three";
import * as THREE from "three";
import { Detailed } from "@react-three/drei";
import { useSceneControls } from "./LevaUI";
import BoundingBoxHelper from "./BoundingBoxHelper";
import { geometryCache } from "./GeometryCache";
import GeometryInspector from "./GeometryInspector";
import { isLocalUrl, revokeBlobUrl } from "@/utils/fileUtils";

import HauteMontagne from "./HauteMontagneShader";
import BasseMontagne from "./BasseMontagneShader";
import { MeshPhysicalMaterial } from "three";

interface MeshLoaderWithLODProps {
  urlHigh: string; // mesh niveau 11 (haute résolution)
  urlLow: string; // mesh niveau 09 (basse résolution)
  urlUltraLow?: string; // mesh niveau 01 (ultra basse résolution) - optionnel
  format?: "drc";
  onDoubleClick?: (event: any) => void;
  lightDirection?: THREE.Vector3;
  distances?: [number, number, number?]; // [distance haute, distance basse, distance ultra basse?]
}

export default function MeshLoaderWithLOD({
  urlHigh,
  urlLow,
  urlUltraLow,
  format = "drc",
  onDoubleClick,
  lightDirection,
  distances = [0, 2, 5], // Distances par défaut : [haute, basse, ultra basse]
}: MeshLoaderWithLODProps) {
  const [geometryHigh, setGeometryHigh] = useState<BufferGeometry | null>(null);
  const [geometryLow, setGeometryLow] = useState<BufferGeometry | null>(null);
  const [geometryUltraLow, setGeometryUltraLow] =
    useState<BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingHigh, setLoadingHigh] = useState(true);
  const [loadingLow, setLoadingLow] = useState(true);
  const [loadingUltraLow, setLoadingUltraLow] = useState(!!urlUltraLow);
  const [cacheStatusHigh, setCacheStatusHigh] = useState<
    "loading" | "cache" | "network" | "local"
  >("loading");
  const [cacheStatusLow, setCacheStatusLow] = useState<
    "loading" | "cache" | "network" | "local"
  >("loading");
  const [cacheStatusUltraLow, setCacheStatusUltraLow] = useState<
    "loading" | "cache" | "network" | "local"
  >("loading");
  const meshRefHigh = useRef<Mesh>(null);
  const meshRefLow = useRef<Mesh>(null);
  const meshRefUltraLow = useRef<Mesh>(null);
  const controls = useSceneControls();

  // 🎯 Créer TOUS les matériaux une seule fois et les partager entre les niveaux LoD
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
  }, []);

  // Sélectionner le matériau actif
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

  // Mettre à jour les uniforms/propriétés selon le matériau actif
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
      const slopeRadians = controls.slopeThreshold * (Math.PI / 180);
      mat.uniforms.slopeThreshold.value = Math.cos(slopeRadians);
      mat.uniforms.smoothness.value = controls.smoothness;
      mat.uniforms.lightDirection.value.copy(
        lightDirection || new THREE.Vector3(1, 1, 1).normalize(),
      );
      mat.uniforms.ambientIntensity.value = controls.ambientIntensity;
      mat.uniforms.directionalIntensity.value = controls.directionalIntensity;
      mat.uniforms.showAvalanchePentes.value = controls.showAvalanchePentes;
      mat.uniforms.avalanche0Color.value.set("#00FF00");
      mat.uniforms.avalanche1Color.value.set("#F1E70B");
      mat.uniforms.avalanche2Color.value.set("#F86F21");
      mat.uniforms.avalanche3Color.value.set("#E3035B");
      mat.uniforms.avalanche4Color.value.set("#CB87BA");
      mat.uniforms.avalanche5Color.value.set("#120688");
      mat.uniforms.avalancheIntensity.value = 0.6;
      mat.uniforms.fogColor.value.set(controls.fogColor);
      mat.uniforms.fogDensity.value = controls.fogDensity;
      mat.uniforms.fogExponent.value = controls.fogExponent;
    }

    if (controls.material === "BasseMontagne") {
      const mat = activeMaterial as any;
      mat.uniforms.snowColor.value.set(controls.snowColorBM);
      mat.uniforms.rockColor.value.set(controls.rockColorBM);
      const slopeRadians = controls.slopeThresholdBM * (Math.PI / 180);
      mat.uniforms.slopeThreshold.value = Math.cos(slopeRadians);
      mat.uniforms.smoothness.value = controls.smoothnessBM;
      mat.uniforms.lightDirection.value.copy(
        lightDirection || new THREE.Vector3(1, 1, 1).normalize(),
      );
      mat.uniforms.ambientIntensity.value = controls.ambientIntensity;
      mat.uniforms.directionalIntensity.value = controls.directionalIntensity;
      mat.uniforms.fogColor.value.set(controls.fogColor);
      mat.uniforms.fogDensity.value = controls.fogDensity;
      mat.uniforms.fogExponent.value = controls.fogExponent;
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
    controls.showAvalanchePentes,
    controls.snowColorBM,
    controls.rockColorBM,
    controls.slopeThresholdBM,
    controls.smoothnessBM,
    controls.ambientIntensity,
    controls.directionalIntensity,
    controls.fogColor,
    controls.fogDensity,
    controls.fogExponent,
    lightDirection,
  ]);

  // Cleanup des matériaux à l'unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach((mat) => mat.dispose());

      if (meshRefHigh.current?.geometry && !geometryCache.has(urlHigh)) {
        meshRefHigh.current.geometry.dispose();
      }
      if (meshRefLow.current?.geometry && !geometryCache.has(urlLow)) {
        meshRefLow.current.geometry.dispose();
      }
      if (
        meshRefUltraLow.current?.geometry &&
        urlUltraLow &&
        !geometryCache.has(urlUltraLow)
      ) {
        meshRefUltraLow.current.geometry.dispose();
      }

      if (urlHigh && isLocalUrl(urlHigh)) {
        revokeBlobUrl(urlHigh);
      }
      if (urlLow && isLocalUrl(urlLow)) {
        revokeBlobUrl(urlLow);
      }
      if (urlUltraLow && isLocalUrl(urlUltraLow)) {
        revokeBlobUrl(urlUltraLow);
      }
    };
  }, [materials, urlHigh, urlLow]);

  // Mémoriser les calculs de bounding box (on utilise la géométrie haute pour le bounding box)
  const boundingCenter = useMemo(() => {
    if (!geometryHigh?.boundingBox) return [0, 0, 0] as const;
    const box = geometryHigh.boundingBox;
    return [
      (box.max.x + box.min.x) / 2,
      (box.max.y + box.min.y) / 2,
      (box.max.z + box.min.z) / 2,
    ] as const;
  }, [geometryHigh]);

  const boundingSize = useMemo(() => {
    if (!geometryHigh?.boundingBox) return [1, 1, 1];
    const box = geometryHigh.boundingBox;
    return [
      box.max.x - box.min.x,
      box.max.y - box.min.y,
      box.max.z - box.min.z,
    ];
  }, [geometryHigh]);

  // Fonction pour charger une géométrie
  const loadGeometry = async (
    url: string,
    setGeometry: React.Dispatch<React.SetStateAction<BufferGeometry | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setCacheStatus: React.Dispatch<
      React.SetStateAction<"loading" | "cache" | "network" | "local">
    >,
    levelName: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier le cache
      const cachedGeometry = geometryCache.get(url);

      if (cachedGeometry) {
        if (process.env.NODE_ENV === "development") {
          console.log(`✅ Géométrie ${levelName} depuis cache:`, url);
        }
        setCacheStatus("cache");
        setGeometry(cachedGeometry);
        setLoading(false);
        return cachedGeometry;
      }

      // Déterminer la source
      if (isLocalUrl(url)) {
        setCacheStatus("local");
      } else {
        setCacheStatus("network");
      }

      const loader = new DRACOLoader();
      const supportsWasm =
        typeof WebAssembly === "object" && WebAssembly.validate;
      const decoderType = supportsWasm ? "wasm" : "js";
      loader.setDecoderPath("/draco/");
      loader.setDecoderConfig({ type: decoderType });
      loader.setCrossOrigin("anonymous");

      return new Promise<BufferGeometry>((resolve, reject) => {
        loader.load(
          url,
          async (geometry: BufferGeometry) => {
            await new Promise((r) => setTimeout(r, 0));
            geometry.computeVertexNormals();

            await new Promise((r) => setTimeout(r, 0));
            geometry.computeBoundingBox();

            await new Promise((r) => setTimeout(r, 0));
            const perfInfo = GeometryInspector.getPerformanceInfo(geometry);
            const meshName = url.split("/").pop() || "mesh";

            console.log(`📊 Mesh ${levelName} chargé: ${meshName}`);
            console.log(`  └─ Vertices: ${perfInfo.vertices.toLocaleString()}`);
            if (perfInfo.indexed) {
              console.log(`  └─ Indices: ${perfInfo.indices.toLocaleString()}`);
            }
            console.log(
              `  └─ Triangles: ${Math.floor(perfInfo.triangles).toLocaleString()}`,
            );
            console.log(
              `  └─ Mémoire: ${(perfInfo.memoryUsage / (1024 * 1024)).toFixed(2)} MB`,
            );

            geometryCache.set(url, geometry);
            setGeometry(geometry);
            setLoading(false);
            resolve(geometry);
          },
          (progress) => {
            if (process.env.NODE_ENV === "development") {
              console.log(
                `Chargement ${levelName}:`,
                (progress.loaded / progress.total) * 100 + "%",
              );
            }
          },
          (error) => {
            console.error(`Erreur chargement ${levelName}:`, error);
            setError(`Erreur chargement ${levelName}`);
            setLoading(false);
            reject(error);
          },
        );
      });
    } catch (err) {
      console.error(`Erreur ${levelName}:`, err);
      setError(`Erreur chargement ${levelName}`);
      setLoading(false);
      throw err;
    }
  };

  // Charger les géométries en parallèle (2 ou 3 selon si urlUltraLow existe)
  useEffect(() => {
    if (!urlHigh || !urlLow) return;

    let cancelled = false;

    const loadAllGeometries = async () => {
      try {
        const loadPromises = [
          loadGeometry(
            urlHigh,
            setGeometryHigh,
            setLoadingHigh,
            setCacheStatusHigh,
            "HAUTE RÉSOLUTION (11)",
          ),
          loadGeometry(
            urlLow,
            setGeometryLow,
            setLoadingLow,
            setCacheStatusLow,
            "BASSE RÉSOLUTION (09)",
          ),
        ];

        // Ajouter le niveau ultra low si présent
        if (urlUltraLow) {
          loadPromises.push(
            loadGeometry(
              urlUltraLow,
              setGeometryUltraLow,
              setLoadingUltraLow,
              setCacheStatusUltraLow,
              "ULTRA BASSE RÉSOLUTION (01)",
            ),
          );
        }

        await Promise.all(loadPromises);
      } catch (err) {
        if (!cancelled) {
          console.error("Erreur lors du chargement parallèle:", err);
        }
      }
    };

    loadAllGeometries();

    return () => {
      cancelled = true;
    };
  }, [urlHigh, urlLow, urlUltraLow]);

  // Affichage pendant le chargement
  const loading =
    loadingHigh || loadingLow || (urlUltraLow ? loadingUltraLow : false);

  if (loading) {
    const loadingColor =
      cacheStatusHigh === "cache" && cacheStatusLow === "cache"
        ? "#00ff00"
        : cacheStatusHigh === "local" || cacheStatusLow === "local"
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
                new THREE.Vector3(0.5, 0.5, 0.5),
              )
            }
            color={loadingColor}
          />
        )}
      </group>
    );
  }

  if (
    error ||
    !geometryHigh ||
    !geometryLow ||
    (urlUltraLow && !geometryUltraLow)
  ) {
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
                new THREE.Vector3(0.5, 0.5, 0.5),
              )
            }
            color="#ff0000"
          />
        )}
      </group>
    );
  }

  // Utiliser le composant Detailed pour le LoD automatique
  // Key basée sur les distances pour forcer le remontage quand elles changent
  const lodKey = `lod-${distances[0]}-${distances[1]}-${distances[2] || "none"}`;

  return (
    <group>
      {urlUltraLow && geometryUltraLow ? (
        // Mode 3 niveaux de LoD
        <Detailed
          key={lodKey}
          distances={[distances[0], distances[1], distances[2] || 10]}
        >
          {/* Niveau HAUTE RÉSOLUTION (11) - 0 à distances[0] mètres */}
          <mesh
            ref={meshRefHigh}
            geometry={geometryHigh}
            material={activeMaterial}
            castShadow
            receiveShadow
            userData={{ url: urlHigh, lodLevel: 11 }}
          />

          {/* Niveau BASSE RÉSOLUTION (09) - distances[0] à distances[1] mètres */}
          <mesh
            ref={meshRefLow}
            geometry={geometryLow}
            material={activeMaterial}
            castShadow
            receiveShadow
            userData={{ url: urlLow, lodLevel: 9 }}
          />

          {/* Niveau ULTRA BASSE RÉSOLUTION (01) - distances[1] à distances[2] mètres */}
          <mesh
            ref={meshRefUltraLow}
            geometry={geometryUltraLow}
            material={activeMaterial}
            castShadow
            receiveShadow
            userData={{ url: urlUltraLow, lodLevel: 1 }}
          />
        </Detailed>
      ) : (
        // Mode 2 niveaux de LoD
        <Detailed key={lodKey} distances={[distances[0], distances[1]]}>
          {/* Niveau HAUTE RÉSOLUTION (11) - 0 à distances[0] mètres */}
          <mesh
            ref={meshRefHigh}
            geometry={geometryHigh}
            material={activeMaterial}
            castShadow
            receiveShadow
            userData={{ url: urlHigh, lodLevel: 11 }}
          />

          {/* Niveau BASSE RÉSOLUTION (09) - distances[0] à distances[1] mètres */}
          <mesh
            ref={meshRefLow}
            geometry={geometryLow}
            material={activeMaterial}
            castShadow
            receiveShadow
            userData={{ url: urlLow, lodLevel: 9 }}
          />
        </Detailed>
      )}

      {/* Mesh ULTRALOW invisible pour le raycast pour double clic préics sur relief */}
      {geometryHigh.boundingBox && onDoubleClick && geometryUltraLow && (
        <mesh
          onDoubleClick={onDoubleClick}
          ref={meshRefUltraLow}
          geometry={geometryUltraLow}
          visible={false}
          userData={{ url: urlUltraLow, lodLevel: 1 }}
        />
      )}

      {/* Bounding box pour débug - affiche toujours celle de la haute résolution */}
      {controls.showBoundingBoxes && geometryHigh.boundingBox && (
        <BoundingBoxHelper
          box={geometryHigh.boundingBox}
          color={
            cacheStatusHigh === "cache" && cacheStatusLow === "cache"
              ? "#16a34a"
              : cacheStatusHigh === "local" || cacheStatusLow === "local"
                ? "#0066cc"
                : "#ffff00"
          }
        />
      )}

      {/* Indicateurs visuels */}
      {cacheStatusHigh === "cache" && cacheStatusLow === "cache" && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}

      {(cacheStatusHigh === "local" || cacheStatusLow === "local") && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#0066cc" />
        </mesh>
      )}
    </group>
  );
}
