"use client";

import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import MyLevaUI, { useSceneControls } from "./LevaUI";
import ModelPositioner from "./ModelPositioner";

// Import des hooks personnalisés
import { useWebGLDetection, useFullscreen } from "./hooks";
import { useLightDirection } from "./lighting";
import { CameraProvider, useCameraContext } from "./camera";

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

interface Model {
  name: string;
  url?: string;
  urlHigh?: string;
  urlLow?: string;
  urlUltraLow?: string;
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
  filesize?: number;
  lodEnabled?: boolean;
}

interface ThreeSceneProps {
  models: Model[];
  selectedModels: string[];
}

/**
 * Composant interne qui utilise les contrôles de scène
 * Orchestre tous les composants de la scène 3D
 */
function SceneContent({ models, selectedModels }: ThreeSceneProps) {
  const controls = useSceneControls();

  // Hook pour obtenir le handler de double-clic depuis le Context
  const { handleMeshDoubleClick } = useCameraContext();

  // Hook pour obtenir la direction de la lumière pour les shaders
  const lightDirection = useLightDirection(
    controls.sunAzimuth,
    controls.sunElevation
  );

  return (
    <>
      {/* Post-processing effects */}
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

      {/* Caméra et contrôles */}
      <CameraSetup
        fov={controls.fov}
        showCameraTarget={controls.showCameraTarget}
        showStats={controls.showStats}
      />

      {/* Helpers de debug */}
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

      {/* Environnement (grille, eau) */}
      <EnvironmentSetup
        showGrid={controls.showGrid}
        showWater={controls.water}
      />

      {/* Modèles 3D */}
      <ModelPositioner
        models={models}
        selectedModels={selectedModels}
        onMeshDoubleClick={handleMeshDoubleClick}
        lightDirection={lightDirection}
      />
    </>
  );
}

/**
 * Composant principal de la scène 3D
 * Gère la détection WebGL, le mode plein écran et l'UI
 */
export default function ThreeScene({
  models,
  selectedModels,
}: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAvalanchePentes, setShowAvalanchePentes] = useState(false);

  // Hooks personnalisés
  const webglSupported = useWebGLDetection();
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  // Indicateur de chargement pendant la détection
  if (webglSupported === null) {
    return <LoadingIndicator />;
  }

  // Fallback si WebGL n'est pas supporté
  if (!webglSupported) {
    return <WebGLFallback />;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <MyLevaUI showAvalanchePentes={showAvalanchePentes}>
        <Canvas className="w-full h-full" frameloop="demand">
          <CameraProvider>
            <SceneContent models={models} selectedModels={selectedModels} />
          </CameraProvider>
        </Canvas>

        {/* Overlay UI avec tous les boutons de contrôle */}
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
