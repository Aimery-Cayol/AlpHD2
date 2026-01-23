"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Grid,
  Stats,
  CameraControls,
  CameraControlsImpl,
  Sky,
} from "@react-three/drei";
// ... autres imports inchangés
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
import { useAppContext } from "@/contexts/AppContext";

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
  const { setCameraRotation } = useAppContext();

  // 🎯 1. ÉTAT POUR LE SHIFT
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Shift") setIsShiftPressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === "Shift") setIsShiftPressed(false); };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // 🎯 2. CONFIGURATION DYNAMIQUE DES BOUTONS
  // On recalcule les boutons seulement quand isShiftPressed change
  const mouseButtonsConfig = useMemo(() => ({
    left: isShiftPressed ? ACTION.ROTATE : ACTION.TRUCK,
    right: ACTION.ROTATE,
    middle: ACTION.NONE,
    wheel: ACTION.DOLLY,
  }), [isShiftPressed, ACTION]);

  useEffect(() => {
    if (models.length > 0 && cameraControlsRef.current) {
      const timer = setTimeout(() => {
        cameraControlsRef.current?.setLookAt(0, 10, 10, 0, 0, 0, true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [models]);

  const handleCameraChange = useCallback(() => {
    if (cameraControlsRef.current && typeof setCameraRotation === "function") {
      setCameraRotation({
        x: cameraControlsRef.current.polarAngle,
        y: cameraControlsRef.current.azimuthAngle,
        z: 0
      });
    }
  }, [setCameraRotation]);

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
        position={[0, 15, 15]} 
        fov={controls.fov}
        near={0.1}
        far={10000}
      />

      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        // 🎯 ON PASSE LA CONFIGURATION DYNAMIQUE ICI
        mouseButtons={mouseButtonsConfig}
        dollyToCursor={true}
        minDistance={0.1}
        maxDistance={2000}
        onChange={handleCameraChange}
      />

      {controls.showCameraTarget && <CameraTargetDebug cameraControlsRef={cameraControlsRef} />}
      {controls.showGrid && (
        <Grid position={[0, -0.05, 0]} args={[20, 20]} cellColor="#333333" sectionColor="#444444" infiniteGrid />
      )}
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
        <Canvas 
          className="w-full h-full" 
          shadows 
          gl={{ antialias: true, logarithmicDepthBuffer: true }}
        >
          <SceneContent models={models} selectedModels={selectedModels} />
        </Canvas>
        <SceneUI models={models} selectedModels={selectedModels} />
      </MyLevaUI>
    </div>
  );
}