"use client";

import * as THREE from "three";

import React, { useEffect, useRef, useState } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Stats,
  OrbitControls,
  Clouds,
  Cloud,
  Sky,
} from "@react-three/drei";
import ModelPositioner from "./ModelPositioner";
import SceneUI from "./SceneUI";
import MyLevaUI, { useSceneControls } from "./LevaUI";

import JEASINGS from "jeasings";
import JEasingsComponent from "./JEasings";

interface Model {
  name: string;
  url: string;
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
}

interface ThreeSceneProps {
  models: Model[];
  selectedModels: string[];
}

function JEasings() {
  useFrame(() => {
    JEASINGS.update();
  });
}

// Composant de fallback pour les appareils sans WebGL
function WebGLFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          WebGL non supporté
        </h3>
        <p className="text-gray-600 mb-4">
          Votre navigateur ou appareil ne supporte pas WebGL, nécessaire pour
          afficher les visualisations 3D.
        </p>
        <div className="text-sm text-gray-500">
          <p>Essayez de :</p>
          <ul className="list-disc list-inside mt-2 text-left">
            <li>Mettre à jour votre navigateur</li>
            <li>Activer l'accélération matérielle dans les paramètres</li>
            <li>Utiliser un appareil plus récent</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Composant interne qui utilise les contrôles de scène
function SceneContent({ models, selectedModels }: ThreeSceneProps) {
  const controls = useSceneControls();
  const { scene } = useThree();

  //JEasing
  const orbitControlsRef = useRef<any>(null);
  const handleMeshDoubleClick = (event: any) => {
    event.stopPropagation();
    if (orbitControlsRef.current && event.point) {
      new JEASINGS.JEasing(orbitControlsRef.current.target)
        .to({ x: event.point.x, y: event.point.y, z: event.point.z }, 500)
        .easing(JEASINGS.Cubic.Out)
        .start();
    }
  };

  // Recentrer la caméra sur la bounding box des selectedModels
  useEffect(() => {
    if (selectedModels.length === 0) return;

    const timer = setTimeout(() => {
      const worldBox = new THREE.Box3();
      let hasMeshes = false;

      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh &&
          object.userData.url &&
          selectedModels.includes(object.userData.url)
        ) {
          if (object.geometry && object.geometry.boundingBox) {
            const localBox = object.geometry.boundingBox.clone();
            localBox.applyMatrix4(object.matrixWorld);
            worldBox.union(localBox);
            hasMeshes = true;
          }
        }
      });

      if (hasMeshes && orbitControlsRef.current) {
        const center = worldBox.getCenter(new THREE.Vector3());
        orbitControlsRef.current.target.copy(center);
      }
    }, 1000); // Délai pour permettre le chargement des mesh

    return () => clearTimeout(timer);
  }, [selectedModels, scene]);

  // Conversion sphérique → cartésien
  const getSunDirection = (
    azimuth: number,
    elevation: number,
    distance = 10
  ) => {
    const azRad = (azimuth * Math.PI) / 180;
    const elRad = (elevation * Math.PI) / 180;

    return [
      distance * Math.cos(elRad) * Math.sin(azRad),
      distance * Math.sin(elRad),
      -distance * Math.cos(elRad) * Math.cos(azRad), // Inversion nord/sud
    ] as [number, number, number];
  };

  const sunPosition = getSunDirection(
    controls.sunAzimuth,
    controls.sunElevation
  );

  // Calcul de la direction de la lumière pour le shader (direction vers la surface)
  const lightDirection = new THREE.Vector3(...sunPosition).normalize();

  return (
    <>
      <JEasingsComponent />
      <PerspectiveCamera
        makeDefault
        position={[0, 5, 3]} // 2ème coord = hauteur 3ème coord = recul
        fov={controls.fov}
        near={0.001}
      />
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0}
        maxDistance={50}
        maxPolarAngle={Math.PI}
        target={[0, 3, 0]}
        dampingFactor={0.13}
        autoRotate={controls.autoRotate}
      />

      {controls.showGrid && <gridHelper args={[10, 10]} />}
      {controls.showAxes && <axesHelper args={[2]} />}
      {controls.showStats && <Stats />}

      {/* Éclairage adapté aux unités normales */}
      {controls.showAmbientLight && (
        <ambientLight intensity={controls.ambientIntensity} />
      )}
      {controls.showDirectionalLight && (
        <directionalLight
          // position={[5, 5, 3]}
          position={sunPosition}
          intensity={controls.directionalIntensity}
          castShadow={true}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={20}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      )}

      <Sky
        distance={450000}
        sunPosition={sunPosition}
        inclination={0}
        azimuth={0.25}
      />

      <pointLight position={[-5, -5, -3]} intensity={0.5} />
      {/* <Environment preset="sunset" /> */}
      {/* Nuages contrôlés par Leva */}
      {controls.nuages && (
        <Clouds limit={400} material={THREE.MeshLambertMaterial}>
          <Cloud
            seed={10 + 1}
            fade={10}
            position={[0, 3, 0]}
            speed={0.1}
            growth={0.1}
            volume={1}
            opacity={1}
            bounds={[2, 0.1, 2]}
          />
        </Clouds>
      )}
      {/* Positionneur automatique de modèles */}
      <ModelPositioner
        models={models}
        selectedModels={selectedModels}
        onMeshDoubleClick={handleMeshDoubleClick}
        lightDirection={lightDirection}
      />
    </>
  );
}

export default function ThreeScene({
  models,
  selectedModels,
}: ThreeSceneProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Détecter le support WebGL
    const detectWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        setWebglSupported(!!gl);
      } catch (error) {
        console.warn("Erreur lors de la détection WebGL:", error);
        setWebglSupported(false);
      }
    };

    detectWebGL();
  }, []);

  // Afficher un indicateur de chargement pendant la détection
  if (webglSupported === null) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Vérification WebGL...</p>
        </div>
      </div>
    );
  }

  // Fallback si WebGL n'est pas supporté
  if (!webglSupported) {
    return <WebGLFallback />;
  }

  return (
    <div className="relative w-full h-full">
      <MyLevaUI>
        <Canvas>
          <SceneContent models={models} selectedModels={selectedModels} />
        </Canvas>

        {/* Interface utilisateur overlay */}
        <SceneUI models={models} selectedModels={selectedModels} />
      </MyLevaUI>
    </div>
  );
}
