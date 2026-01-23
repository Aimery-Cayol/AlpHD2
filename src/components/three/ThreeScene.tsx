"use client";

import * as THREE from "three";
import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Grid,
  Stats,
  CameraControls,
  CameraControlsImpl,
  Sky,
} from "@react-three/drei";
import {
  EffectComposer,
  ToneMapping,
  Vignette,
  BrightnessContrast,
  Bloom
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import ModelPositioner from "./ModelPositioner";
import SceneUI from "./SceneUI";
import MyLevaUI, { useSceneControls } from "./LevaUI";
import CameraTargetDebug from "./CameraTargetDebug";
import JEasingsComponent from "./JEasings";

interface Model {
  name: string;
  url: string;
  format?: "ply" | "drc";
  x?: number;
  y?: number;
}

interface ThreeSceneProps {
  models: Model[];
  selectedModels: string[];
}

function SceneContent({ models, selectedModels }: ThreeSceneProps) {
  const controls = useSceneControls();
  const { ACTION } = CameraControlsImpl;
  const cameraControlsRef = useRef<CameraControls>(null);

  // --- 1. LOGIQUE DE RECENTRAGE AUTOMATIQUE ---
  // Dès que la liste des modèles change, on force la caméra à regarder le centre [0,0,0]
  // car ModelPositioner positionne les dalles relativement à la première à l'origine.
  useEffect(() => {
    if (models.length > 0 && cameraControlsRef.current) {
      // On attend un court instant que le MeshLoader ait fini de parser la géométrie
      const timer = setTimeout(() => {
        // FitToSphere permet d'englober la zone centrale (rayon de 5 unités ici)
        // pour être sûr que la montagne soit dans le cadre.
        cameraControlsRef.current?.setLookAt(0, 10, 10, 0, 0, 0, true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [models]);

  // LOGIQUE SPÉCIFIQUE MAC : Basculement Shift
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" && cameraControlsRef.current) {
        cameraControlsRef.current.mouseButtons.left = ACTION.ROTATE;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift" && cameraControlsRef.current) {
        cameraControlsRef.current.mouseButtons.left = ACTION.TRUCK;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [ACTION]);

  const getSunDirection = (azimuth: number, elevation: number, distance = 10) => {
    const azRad = (azimuth * Math.PI) / 180;
    const elRad = (elevation * Math.PI) / 180;
    return [
      distance * Math.cos(elRad) * Math.sin(azRad),
      distance * Math.sin(elRad),
      -distance * Math.cos(elRad) * Math.cos(azRad),
    ] as [number, number, number];
  };

  const sunPosition = getSunDirection(controls.sunAzimuth, controls.sunElevation);
  const lightDirection = new THREE.Vector3(...sunPosition).normalize();

  function Ground() {
    return (
      <Grid 
        position={[0, -0.05, 0]} // Légèrement rabaissé pour éviter le flickering
        args={[20, 20]} 
        cellSize={1} 
        cellThickness={1} 
        cellColor="#333333"
        sectionSize={5} 
        sectionThickness={1.5}
        sectionColor="#444444" 
        fadeDistance={50} 
        infiniteGrid={true}
      />
    );
  }

  return (
    <>
      <JEasingsComponent />
      <EffectComposer enabled={controls.enablePostProcess}>
        <Vignette offset={0.3} darkness={0.4} blendFunction={BlendFunction.NORMAL} />
        <BrightnessContrast brightness={0.1} contrast={0.1} />
        <ToneMapping adaptive resolution={256} middleGrey={0.9} maxLuminance={16.0} />
        {controls.enableBloom && (
          <Bloom luminanceThreshold={controls.bloomThreshold} intensity={controls.bloomIntensity} />
        )}
      </EffectComposer>

      <PerspectiveCamera
        makeDefault
        position={[0, 15, 15]} // Reculé par défaut pour voir la montagne de loin
        fov={controls.fov}
        near={0.1}  // Augmenté (était 0.001) pour éviter les erreurs de clipping
        far={10000} // Augmenté pour voir les sommets lointains
      />

      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        mouseButtons={{
          left: ACTION.TRUCK,
          right: ACTION.ROTATE,
          middle: ACTION.NONE,
          wheel: ACTION.DOLLY,
        }}
        dollyToCursor={true}
        minDistance={0.1}
        maxDistance={2000}
      />

      {controls.showCameraTarget && (
        <CameraTargetDebug cameraControlsRef={cameraControlsRef} />
      )}

      {controls.showGrid && <Ground />}
      {controls.showStats && <Stats />}

      <ambientLight intensity={controls.ambientIntensity} />
      <directionalLight 
        position={sunPosition} 
        intensity={controls.directionalIntensity} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />

      <Sky sunPosition={sunPosition} distance={450000} />

      <ModelPositioner
        models={models}
        selectedModels={selectedModels}
        lightDirection={lightDirection}
      />
    </>
  );
}

export default function ThreeScene({ models, selectedModels }: ThreeSceneProps) {
  return (
    <div className="relative w-full h-full outline-none">
      <MyLevaUI>
        <Canvas 
          className="w-full h-full" 
          frameloop="always" 
          shadows 
          gl={{ antialias: true, logarithmicDepthBuffer: true }} // Optimisation pour les grandes scènes LiDAR
        >
          <SceneContent models={models} selectedModels={selectedModels} />
        </Canvas>
        <SceneUI models={models} selectedModels={selectedModels} />
      </MyLevaUI>
    </div>
  );
}