"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { BufferGeometry, Mesh } from "three";
import * as THREE from "three";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

// Patch THREE une seule fois pour activer le raycast accéléré sur tous les meshes
(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
(THREE.Mesh.prototype as any).raycast = acceleratedRaycast;
import { useSceneControls } from "./LevaUI";
import BoundingBoxHelper from "./BoundingBoxHelper";
import { geometryCache } from "./GeometryCache";
import GeometryInspector from "./GeometryInspector";
import { isLocalUrl, revokeBlobUrl } from "@/utils/fileUtils";
import { useAppContext } from "@/contexts/AppContext";
import { useColliders } from "@/contexts/ColliderContext";
import type { TileCoord } from "@/utils/fileUtils";

import HauteMontagne from "./HauteMontagneShader";
import BasseMontagne from "./BasseMontagneShader";

interface MeshLoaderProps {
  coord: TileCoord;
  level: string;
  onDoubleClick?: (event: any) => void;
  lightDirection?: THREE.Vector3;
}

export default function MeshLoader({
  coord,
  level,
  onDoubleClick,
  lightDirection,
}: MeshLoaderProps) {
  const { tilesData, incrementPendingLoads, decrementPendingLoads } = useAppContext();
  const { addCollider, removeCollider } = useColliders();

  // Résoudre l'URL à partir des données de la tuile dans le contexte
  const url = useMemo(() => {
    const tileData = tilesData.get(coord);
    return tileData?.files.find((f) => f.level === level)?.url ?? null;
  }, [tilesData, coord, level]);

  // URL pour le mesh de raycast léger : niveau "01"
  const urlRaycast = useMemo(() => {
    const tileData = tilesData.get(coord);
    if (!tileData) return null;
    return (
      tileData.files.find((f) => f.level === "01")?.url ??
      null
    );
  }, [tilesData, coord]);

  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [raycastGeometry, setRaycastGeometry] = useState<BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<
    "loading" | "cache" | "network" | "local"
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
      // Conversion degrés -> cosinus
      // 0° (horizontal) → angle = 0° → cos(0°) = 1
      // 90° (vertical) → angle = 90° → cos(90°) = 0
      const slopeRadians = controls.slopeThreshold * (Math.PI / 180);
      mat.uniforms.slopeThreshold.value = Math.cos(slopeRadians);
      mat.uniforms.smoothness.value = controls.smoothness;
      mat.uniforms.lightDirection.value.copy(
        lightDirection || new THREE.Vector3(1, 1, 1).normalize(),
      );
      mat.uniforms.ambientIntensity.value = controls.ambientIntensity;
      mat.uniforms.directionalIntensity.value = controls.directionalIntensity;
      // Paramètre d'activation des pentes avalancheuses
      mat.uniforms.showAvalanchePentes.value = controls.showAvalanchePentes;
      // Couleurs pour les pentes avalancheuses
      mat.uniforms.avalanche0Color.value.set("#00FF00"); // 0-5° : vert fluo
      mat.uniforms.avalanche1Color.value.set("#F1E70B"); // 30-35°
      mat.uniforms.avalanche2Color.value.set("#F86F21"); // 35-40°
      mat.uniforms.avalanche3Color.value.set("#E3035B"); // 40-45°
      mat.uniforms.avalanche4Color.value.set("#CB87BA"); // 45-50°
      mat.uniforms.avalanche5Color.value.set("#120688"); // 50-55° : bleu foncé
      mat.uniforms.avalancheIntensity.value = 0.6;
      mat.uniforms.fogColor.value.set(controls.fogColor);
      mat.uniforms.fogDensity.value = controls.fogDensity;
      mat.uniforms.fogExponent.value = controls.fogExponent;
    }

    if (controls.material === "BasseMontagne") {
      const mat = activeMaterial as any;
      mat.uniforms.snowColor.value.set(controls.snowColorBM);
      mat.uniforms.rockColor.value.set(controls.rockColorBM);
      // Conversion degrés -> cosinus
      // 0° (horizontal) → angle = 0° → cos(0°) = 1
      // 90° (vertical) → angle = 90° → cos(90°) = 0
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

  // 🎯 OPTIMISATION 4: Cleanup des matériaux à l'unmount
  useEffect(() => {
    return () => {
      // Dispose de TOUS les matériaux
      Object.values(materials).forEach((mat) => mat.dispose());

      // Ne dispose la géométrie QUE si elle n'est pas en cache
      if (meshRef.current?.geometry && url && !geometryCache.has(url)) {
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

  // Enregistrer le mesh comme collider pour les raycasts (PoiTool, TileExpander, etc.)
  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh && geometry) {
      addCollider(mesh);
      return () => removeCollider(mesh);
    }
  }, [geometry, addCollider, removeCollider]);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setCacheStatus("loading");
      return;
    }

    // 🎯 OPTIMISATION 6: Flag pour annuler les opérations async
    let cancelled = false;
    let loaded = false;
    const markLoaded = () => { if (!loaded) { loaded = true; decrementPendingLoads(); } };
    incrementPendingLoads();

    const loadGeometry = async () => {
      setLoading(true);
      setError(null);

      try {
        // Vérifier le cache
        const cachedGeometry = geometryCache.get(url);

        if (cachedGeometry) {
          if (process.env.NODE_ENV === "development") {
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

        const loader = new DRACOLoader();
        const supportsWasm =
          typeof WebAssembly === "object" && WebAssembly.validate;
        const decoderType = supportsWasm ? "wasm" : "js";
        loader.setDecoderPath("/draco/");
        loader.setDecoderConfig({ type: decoderType });
        loader.setCrossOrigin("anonymous");

        loader.load(
          url,
          async (geometry: BufferGeometry) => {
            if (cancelled) return; // ✅ Éviter les updates après unmount

            // 🎯 OPTIMISATION 7: Calculs asynchrones découplés
            await new Promise((resolve) => setTimeout(resolve, 0));
            if (cancelled) return;

            geometry.computeVertexNormals();

            await new Promise((resolve) => setTimeout(resolve, 0));
            if (cancelled) return;

            geometry.computeBoundingBox();
            (geometry as any).computeBoundsTree();

            await new Promise((resolve) => setTimeout(resolve, 0));
            if (cancelled) return;

            const perfInfo = GeometryInspector.getPerformanceInfo(geometry);
            const meshName = url.split("/").pop() || "mesh";

            console.log(`📊 Mesh chargé: ${meshName}`);
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
            console.log(
              `  └─ Type: ${perfInfo.indexed ? "Indexé" : "Non-indexé"}`,
            );

            if (cancelled) return;

            geometryCache.set(url, geometry);
            setGeometry(geometry);
            setLoading(false);
            markLoaded();
          },
          (progress) => {
            if (process.env.NODE_ENV === "development") {
              console.log(
                "Chargement:",
                (progress.loaded / progress.total) * 100 + "%",
              );
            }
          },
          (error) => {
            if (cancelled) return;
            console.error("Erreur chargement DRC:", error);
            setError("Erreur chargement DRC");
            setLoading(false);
            markLoaded();
          },
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Erreur:", err);
        setError("Erreur chargement");
        setLoading(false);
        markLoaded();
      }
    };

    loadGeometry();

    return () => {
      cancelled = true;
      markLoaded(); // libérer le compteur même si annulé
    };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chargement de la géométrie niveau "01" pour le mesh de raycast
  useEffect(() => {
    // Si l'URL du raycast est identique à l'URL principale, réutiliser la géométrie
    if (urlRaycast === url) {
      setRaycastGeometry(geometry);
      return;
    }

    if (!urlRaycast) return;

    let cancelled = false;

    const loadRaycastGeometry = async () => {
      // Vérifier le cache d'abord
      const cached = geometryCache.get(urlRaycast);
      if (cached) {
        setRaycastGeometry(cached);
        return;
      }

      const loader = new DRACOLoader();
      const supportsWasm = typeof WebAssembly === "object" && WebAssembly.validate;
      loader.setDecoderPath("/draco/");
      loader.setDecoderConfig({ type: supportsWasm ? "wasm" : "js" });
      loader.setCrossOrigin("anonymous");

      loader.load(
        urlRaycast,
        (geo: BufferGeometry) => {
          if (cancelled) return;
          geo.computeVertexNormals();
          geo.computeBoundingBox();
          geometryCache.set(urlRaycast, geo);
          setRaycastGeometry(geo);
        },
        undefined,
        (err) => {
          if (cancelled) return;
          console.warn("Impossible de charger la géométrie raycast:", err);
        },
      );
    };

    loadRaycastGeometry();

    return () => {
      cancelled = true;
    };
  }, [urlRaycast, level, geometry]);

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
                new THREE.Vector3(0.5, 0.5, 0.5),
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
                new THREE.Vector3(0.5, 0.5, 0.5),
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
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={activeMaterial}
        castShadow
        receiveShadow
        userData={{ url, coord }}
        // onDoubleClick={onDoubleClick}
      />

      {/* Mesh niveau 01 invisible pour le raycast (léger, haute performance) */}
      {onDoubleClick && (
        raycastGeometry ? (
          <mesh
            geometry={raycastGeometry}
            visible={false}
            onDoubleClick={onDoubleClick}
          >
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        ) : geometry.boundingBox ? (
          /* Fallback bounding box si niveau 01 non disponible */
          <mesh
            visible={false}
            position={boundingCenter}
            onDoubleClick={onDoubleClick}
          >
            <boxGeometry args={boundingSize as [number, number, number]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        ) : null
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

    </group>
  );
}
