"use client";

import React, { useEffect, useState, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { PLYLoader } from "three-stdlib";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { BufferGeometry, Material, Mesh } from "three";
import * as THREE from "three";
import { useSceneControls } from "./LevaUI";
import BoundingBoxHelper from "./BoundingBoxHelper";
import { geometryCache } from "./GeometryCache";
import ModelOptimizer from "./ModelOptimizer";
import { isLocalUrl, revokeBlobUrl } from "@/utils/fileUtils";

import SlopeMaterialImpl from "./SlopeMaterial";
import JEASINGS from "jeasings";

interface MeshLoaderProps {
  url: string;
  format?: "ply" | "drc";
  onDoubleClick?: (event: any) => void;
}

export default function MeshLoader({
  url,
  format,
  onDoubleClick,
}: MeshLoaderProps) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimized, setOptimized] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<
    "loading" | "cache" | "network" | "local"
  >("loading");
  const meshRef = useRef<Mesh>(null);
  const controls = useSceneControls();

  useEffect(() => {
    // Cleanup function pour éviter les fuites mémoire
    return () => {
      if (meshRef.current) {
        meshRef.current.geometry?.dispose();
      }
      // Nettoyer les URLs blob locales
      if (url && isLocalUrl(url)) {
        revokeBlobUrl(url);
      }
    };
  }, [url]);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setCacheStatus("loading");
      return;
    }

    const loadGeometry = async () => {
      setLoading(true);
      setError(null);

      try {
        // Vérifier d'abord le cache
        const cachedGeometry = geometryCache.get(url);

        if (cachedGeometry) {
          console.log("✅ Géométrie chargée depuis le cache:", url);
          console.log("📊 Statistiques cache:", geometryCache.getStats());
          setCacheStatus("cache");
          setGeometry(cachedGeometry);
          setLoading(false);
          return;
        }

        // Déterminer le type de source
        if (isLocalUrl(url)) {
          console.log("📁 Chargement du fichier local:", url, `(${format})`);
          setCacheStatus("local");
        } else {
          console.log("🌐 Chargement depuis le réseau:", url, `(${format})`);
          console.log(
            "📊 Statistiques cache avant chargement:",
            geometryCache.getStats()
          );
          setCacheStatus("network");
        }

        let loader;

        // Créer le loader approprié selon le format
        if (format === "drc") {
          console.log("🔧 Utilisation du DRACOLoader");
          loader = new DRACOLoader();
          // Utiliser JavaScript au lieu de WASM pour éviter les problèmes mémoire
          loader.setDecoderPath(
            "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
          );
          loader.setDecoderConfig({ type: "js" }); // Utiliser JavaScript au lieu de WASM
        } else {
          console.log("🔧 Utilisation du PLYLoader");
          loader = new PLYLoader();
        }

        loader.setCrossOrigin("anonymous");

        loader.load(
          url,
          (geometry: BufferGeometry) => {
            // Préparer la géométrie
            geometry.computeBoundingBox();
            geometry.computeVertexNormals();

            // Vérifier si la géométrie nécessite une optimisation
            const perfInfo = ModelOptimizer.getPerformanceInfo(geometry);
            console.log(`📊 Performance info for ${url}:`, perfInfo);

            // Optimiser si nécessaire
            const optimizedGeometry = ModelOptimizer.optimizeIfNeeded(geometry);
            const wasOptimized = optimizedGeometry !== geometry;
            setOptimized(wasOptimized);

            const finalGeometry =
              ModelOptimizer.getPerformanceInfo(optimizedGeometry);
            console.log(`✅ Final geometry info:`, finalGeometry);

            // Stocker dans le cache pour les prochaines fois
            geometryCache.set(url, optimizedGeometry);

            setGeometry(optimizedGeometry);
            setLoading(false);
          },
          (progress) => {
            console.log(
              "Chargement:",
              (progress.loaded / progress.total) * 100 + "%"
            );
          },
          (error) => {
            console.error(
              `Erreur lors du chargement du ${format?.toUpperCase()}:`,
              error
            );
            setError(
              `Erreur lors du chargement du modèle ${format?.toUpperCase()}`
            );
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError("Erreur lors du chargement du modèle");
        setLoading(false);
      }
    };

    loadGeometry();
  }, [url]);

  if (loading) {
    // Couleur différente selon la source : vert pour cache, orange pour réseau, bleu pour local
    const loadingColor = 
      cacheStatus === "cache" ? "#00ff00" : 
      cacheStatus === "local" ? "#0066cc" : 
      "#ffaa00";

    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={loadingColor} wireframe />
        </mesh>
        {/* Bounding box du cube de chargement */}
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
        {/* Bounding box de la sphère d'erreur */}

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
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        {controls.material === "normal" && (
          <meshNormalMaterial side={THREE.DoubleSide} />
        )}
        {controls.material === "standard" && (
          <meshStandardMaterial
            side={THREE.DoubleSide}
            color={controls.meshColor}
            roughness={controls.roughness}
            metalness={controls.metalness}
          />
        )}
        {controls.material === "slope" && (
          <primitive
            object={new SlopeMaterialImpl()}
            attach="material"
            side={THREE.DoubleSide}
            snowColor={controls.snowColor}
            rockColor={controls.rockColor}
            slopeThreshold={controls.slopeThreshold}
            smoothness={controls.smoothness}
          />
        )}
      </mesh>
      {/* Mesh invisible simplifié pour les clics */}
      {geometry.boundingBox && onDoubleClick && (
        <mesh
          onDoubleClick={onDoubleClick}
          visible={false}
          position={[
            (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2,
            (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2,
            (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2,
          ]}
        >
          <boxGeometry
            args={[
              geometry.boundingBox.max.x - geometry.boundingBox.min.x,
              geometry.boundingBox.max.y - geometry.boundingBox.min.y,
              geometry.boundingBox.max.z - geometry.boundingBox.min.z,
            ]}
          />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* Bounding box du mesh chargé */}
      {controls.showBoundingBoxes && geometry.boundingBox && (
        <BoundingBoxHelper
          box={geometry.boundingBox}
          color={
            cacheStatus === "cache" ? "#16a34a" : 
            cacheStatus === "local" ? "#0066cc" : 
            "#ffff00" // Vert foncé pour cache, bleu pour local, jaune pour réseau
          }
        />
      )}

      {/* Indicateur visuel pour la source du fichier */}
      {cacheStatus === "cache" && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
      
      {/* Indicateur pour les fichiers locaux */}
      {cacheStatus === "local" && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#0066cc" />
        </mesh>
      )}

      {/* Indicateur pour les modèles optimisés */}
      {optimized && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
    </group>
  );
}
