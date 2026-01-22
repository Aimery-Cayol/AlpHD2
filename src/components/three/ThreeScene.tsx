"use client";

import * as THREE from "three";
import React, { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
<<<<<<< Updated upstream
import { FaExpand, FaCompress } from "react-icons/fa";
import CameraTargetDebug from "./CameraTargetDebug";

import JEASINGS from "jeasings";
=======
>>>>>>> Stashed changes
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

function SceneContent({ models, selectedModels }: ThreeSceneProps) {
  const controls = useSceneControls();
  const { ACTION } = CameraControlsImpl;
<<<<<<< Updated upstream
  const cameraControlsRef = useRef<CameraControlsImpl | null>(null);
=======
  const cameraControlsRef = useRef<CameraControls>(null);
>>>>>>> Stashed changes

  // LOGIQUE SPÉCIFIQUE MAC : Forcer le basculement Rotation/Pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift" && cameraControlsRef.current) {
        // Quand Maj est pressé, le clic gauche devient ROTATE
        cameraControlsRef.current.mouseButtons.left = ACTION.ROTATE;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift" && cameraControlsRef.current) {
        // Quand Maj est relâché, le clic gauche redevient TRUCK (Pan)
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
        position={[0, -0.01, 0]} 
        args={[10.5, 10.5]} 
        cellSize={0.2} 
        cellThickness={0.5} 
        cellColor="#6f6f6f"
        sectionSize={1} 
        sectionThickness={1}
        sectionColor="#9d4b4b" 
        fadeDistance={30} 
        fadeStrength={2}
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
        position={[0, 5, 3]} 
        fov={controls.fov}
        near={0.001}
      />

      <CameraControls
        ref={cameraControlsRef}
<<<<<<< Updated upstream
=======
        makeDefault
>>>>>>> Stashed changes
        mouseButtons={{
          left: ACTION.TRUCK,   // Par défaut : Glisser (Maps)
          right: ACTION.ROTATE,  // Clic droit : Pivoter
          middle: ACTION.NONE,
          wheel: ACTION.DOLLY,
        }}
        dollyToCursor={true}
        minDistance={0.2}
        maxDistance={5}
      />

<<<<<<< Updated upstream
      {/* Cube de debug pour la cible de la caméra */}
      {controls.showCameraTarget && (
        <CameraTargetDebug cameraControlsRef={cameraControlsRef} />
      )}

      {/* {controls.showGrid && <gridHelper args={[10, 10]} />} */}
=======
>>>>>>> Stashed changes
      {controls.showGrid && <Ground />}
      {controls.showStats && <Stats />}

      <ambientLight intensity={controls.ambientIntensity} />
      <directionalLight position={sunPosition} intensity={controls.directionalIntensity} castShadow />

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
        <Canvas className="w-full h-full" frameloop="always">
          <SceneContent models={models} selectedModels={selectedModels} />
        </Canvas>
        <SceneUI models={models} selectedModels={selectedModels} />
      </MyLevaUI>
    </div>
  );
}