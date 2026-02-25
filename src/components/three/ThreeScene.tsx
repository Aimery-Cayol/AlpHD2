"use client";

import React, { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import MyLevaUI, { useSceneControls } from "./LevaUI";
import ModelPositioner from "./ModelPositioner";
import MeasureTool from "./MeasureTool";
import PoiTool from "./PoiTool";
import TileExpander from "./TileExpander";
import type { TileModel } from "@/types/models";

// Import des hooks personnalisés
import { useWebGLDetection, useFullscreen } from "./hooks";
import { useLightDirection } from "./lighting";
import { CameraProvider, useCameraContext } from "./camera";
import { ColliderProvider, useColliders } from "@/contexts/ColliderContext";

// Import des composants UI
import {
  WebGLFallback,
  LoadingIndicator,
  SceneOverlay,
} from "./ui";

// Import des composants de scène
import { CameraSetup } from "./camera";
import { LightingSetup } from "./lighting";
import { EnvironmentSetup } from "./environment";
import { PostProcessingSetup } from "./effects";

interface ThreeSceneProps {
  models: TileModel[];
}

/** Empêche la caméra de passer à travers le terrain (raycast multi-directionnel) */
function CameraCollisionSystem({
  cameraControlsRef,
}: {
  cameraControlsRef: React.RefObject<CameraControls | null>;
}) {
  const { collidersRef, version } = useColliders();
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const minDist = 0.15;

  const colliderMeshes = useMemo(
    () => collidersRef.current,
    [collidersRef, version]
  );

  useFrame(() => {
    if (!cameraControlsRef.current || colliderMeshes.length === 0) return;
    const cameraPos = camera.position.clone();
    const directions = [
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(1, -1, 0).normalize(),
      new THREE.Vector3(-1, -1, 0).normalize(),
      new THREE.Vector3(0, -1, 1).normalize(),
      new THREE.Vector3(0, -1, -1).normalize(),
    ];
    const pushVector = new THREE.Vector3();
    let needsPush = false;
    for (const dir of directions) {
      raycaster.set(cameraPos, dir);
      raycaster.far = minDist * 2;
      const hits = raycaster.intersectObjects(colliderMeshes, false);
      if (hits.length > 0 && hits[0].distance < minDist) {
        pushVector.addScaledVector(dir, -(minDist - hits[0].distance));
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

/**
 * Composant interne qui orchestre tous les composants de la scène 3D
 */
function SceneContent({ models }: ThreeSceneProps) {
  const controls = useSceneControls();
  const { handleMeshDoubleClick, cameraControlsRef } = useCameraContext();
  const lightDirection = useLightDirection(controls.sunAzimuth, controls.sunElevation);

  return (
    <>
      {/* Post-processing */}
      <PostProcessingSetup
        enabled={controls.enablePostProcess}
        enableVignette={controls.enableVignette}
        enableBrightnessContrast={controls.enableBrightnessContrast}
        enableToneMapping={controls.enableToneMapping}
        enableBloom={controls.enableBloom}
        bloomThreshold={controls.bloomThreshold}
        bloomLuminanceSmoothing={controls.bloomLuminanceSmoothing}
        bloomIntensity={controls.bloomIntensity}
      />

      {/* Caméra */}
      <CameraSetup
        fov={controls.fov}
        showCameraTarget={controls.showCameraTarget}
        showStats={controls.showStats}
      />

      {/* Collision caméra / terrain */}
      <CameraCollisionSystem cameraControlsRef={cameraControlsRef} />

      {/* Debug */}
      {controls.showAxes && <axesHelper args={[2]} />}

      {/* Éclairage et ciel */}
      <LightingSetup
        showAmbientLight={controls.showAmbientLight}
        ambientIntensity={controls.ambientIntensity}
        showDirectionalLight={controls.showDirectionalLight}
        directionalIntensity={controls.directionalIntensity}
        sunAzimuth={controls.sunAzimuth}
        sunElevation={controls.sunElevation}
        turbidity={controls.turbidity}
        rayleigh={controls.rayleigh}
        mieCoefficient={controls.mieCoefficient}
        mieDirectionalG={controls.mieDirectionalG}
      />

      {/* Environnement */}
      <EnvironmentSetup showGrid={controls.showGrid} showWater={controls.water} />

      {/* Dalles 3D */}
      <ModelPositioner
        models={models}
        onMeshDoubleClick={handleMeshDoubleClick}
        lightDirection={lightDirection}
      />

      <MeasureTool />
      <PoiTool models={models} />
      <TileExpander models={models} />
    </>
  );
}

/**
 * Composant principal de la scène 3D
 */
export default function ThreeScene({ models }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAvalanchePentes, setShowAvalanchePentes] = useState(false);

  const webglSupported = useWebGLDetection();
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  if (webglSupported === null) return <LoadingIndicator />;
  if (!webglSupported) return <WebGLFallback />;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <MyLevaUI showAvalanchePentes={showAvalanchePentes}>
        <Canvas
          className="w-full h-full"
          frameloop="demand"
          gl={{ logarithmicDepthBuffer: true }}
        >
          <ColliderProvider>
            <CameraProvider>
              <SceneContent models={models} />
            </CameraProvider>
          </ColliderProvider>
        </Canvas>

        <SceneOverlay
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          showAvalanchePentes={showAvalanchePentes}
          onToggleAvalanchePentes={() => setShowAvalanchePentes(!showAvalanchePentes)}
        />
      </MyLevaUI>
    </div>
  );
}
