"use client";

import * as THREE from "three";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Grid,
  Stats,
  CameraControls,
  CameraControlsImpl,
  Sky,
} from "@react-three/drei";
import { ColliderProvider, useColliders } from "@/contexts/ColliderContext";
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
import MeasurementTool from "./MeasurementTool";
import { useAppContext } from "@/contexts/AppContext";

// Position caméra par défaut
const DEFAULT_CAMERA_POSITION = { x: 0, y: 4, z: 4 };
const DEFAULT_CAMERA_TARGET = { x: 0, y: 0, z: 0 };

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

// Système de collision caméra avec raycasting multi-directionnel
function CameraCollisionSystem({ cameraControlsRef }: { cameraControlsRef: React.RefObject<CameraControls | null> }) {
  const { collidersRef, version } = useColliders();
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const minDistanceFromSurface = 0.15;

  // Mémoriser les colliders seulement quand version change
  const colliderMeshes = useMemo(() => {
    return collidersRef.current;
  }, [collidersRef, version]);

  useFrame(() => {
    if (!cameraControlsRef.current || colliderMeshes.length === 0) return;

    const cameraPos = camera.position.clone();

    // 10 directions de test
    const directions = [
      new THREE.Vector3(0, -1, 0),   // bas
      new THREE.Vector3(0, 1, 0),    // haut
      new THREE.Vector3(1, 0, 0),    // droite
      new THREE.Vector3(-1, 0, 0),   // gauche
      new THREE.Vector3(0, 0, 1),    // devant
      new THREE.Vector3(0, 0, -1),   // derrière
      new THREE.Vector3(1, -1, 0).normalize(),
      new THREE.Vector3(-1, -1, 0).normalize(),
      new THREE.Vector3(0, -1, 1).normalize(),
      new THREE.Vector3(0, -1, -1).normalize(),
    ];

    let needsPush = false;
    const pushVector = new THREE.Vector3();

    for (const dir of directions) {
      raycaster.set(cameraPos, dir);
      raycaster.far = minDistanceFromSurface * 2;

      const intersects = raycaster.intersectObjects(colliderMeshes, false);

      if (intersects.length > 0 && intersects[0].distance < minDistanceFromSurface) {
        const pushAmount = minDistanceFromSurface - intersects[0].distance;
        pushVector.addScaledVector(dir, -pushAmount);
        needsPush = true;
      }
    }

    if (needsPush) {
      const newPos = cameraPos.add(pushVector);
      cameraControlsRef.current.setPosition(newPos.x, newPos.y, newPos.z, false);
    }
  });

  return null;
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

  // Reset caméra à la position par défaut
  const resetCameraToDefault = useCallback(() => {
    if (cameraControlsRef.current) {
      cameraControlsRef.current.setLookAt(
        DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.y, DEFAULT_CAMERA_POSITION.z,
        DEFAULT_CAMERA_TARGET.x, DEFAULT_CAMERA_TARGET.y, DEFAULT_CAMERA_TARGET.z,
        true
      );
    }
  }, []);

  // Reset caméra vers le nord
  const resetCameraToNorth = useCallback(() => {
    if (cameraControlsRef.current) {
      // Garde la position actuelle mais remet l'azimuth à 0 (nord)
      cameraControlsRef.current.rotateAzimuthTo(0, true);
    }
  }, []);

  // Écouter les événements de reset
  useEffect(() => {
    const handleResetCamera = () => resetCameraToDefault();
    const handleResetNorth = () => resetCameraToNorth();

    window.addEventListener("reset-camera", handleResetCamera);
    window.addEventListener("reset-camera-north", handleResetNorth);

    return () => {
      window.removeEventListener("reset-camera", handleResetCamera);
      window.removeEventListener("reset-camera-north", handleResetNorth);
    };
  }, [resetCameraToDefault, resetCameraToNorth]);

  // Position initiale de la caméra au chargement
  useEffect(() => {
    if (models.length > 0 && cameraControlsRef.current) {
      const timer = setTimeout(() => {
        resetCameraToDefault();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [models, resetCameraToDefault]);

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

      <CameraCollisionSystem cameraControlsRef={cameraControlsRef} />
      {controls.showCameraTarget && <CameraTargetDebug cameraControlsRef={cameraControlsRef} />}
      {controls.showGrid && !controls.showBasemap && (
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

      <MeasurementTool />
    </>
  );
}

export default function ThreeScene({ models, selectedModels }: ThreeSceneProps) {
  const { measurementEnabled, setMeasurementEnabled } = useAppContext();

  // Écouter l'événement toggle-measurement (pour compatibilité avec le bouton existant)
  useEffect(() => {
    const handleToggleMeasurement = () => setMeasurementEnabled(!measurementEnabled);
    window.addEventListener("toggle-measurement", handleToggleMeasurement);
    return () => window.removeEventListener("toggle-measurement", handleToggleMeasurement);
  }, [measurementEnabled, setMeasurementEnabled]);

  return (
    <div className="relative w-full h-full outline-none">
      <ColliderProvider>
        <MyLevaUI>
          <Canvas
            className={`w-full h-full ${measurementEnabled ? "cursor-crosshair" : ""}`}
            shadows
            gl={{ antialias: true, logarithmicDepthBuffer: true }}
          >
            <SceneContent models={models} selectedModels={selectedModels} />
          </Canvas>
          <SceneUI models={models} selectedModels={selectedModels} />
        </MyLevaUI>
      </ColliderProvider>

      {/* Indicateur mode mesure */}
      {measurementEnabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Clic gauche : ajouter un point | Clic droit : terminer
          </div>
        </div>
      )}
    </div>
  );
}