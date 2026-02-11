"use client";

import * as THREE from "three";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Grid,
  Stats,
  CameraControls,
  Sky,
} from "@react-three/drei";
import {
  Bloom,
  BrightnessContrast,
  DepthOfField,
  EffectComposer,
  SMAA,
  SSAO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import ModelPositioner from "./ModelPositioner";
import MyLevaUI, { useSceneControls } from "./LevaUI";
import { FaExpand, FaCompress } from "react-icons/fa";
import { TbMountain } from "react-icons/tb";
import CameraTargetDebug from "./CameraTargetDebug";

// Import des hooks personnalisés
import { useWebGLDetection, useFullscreen } from "./hooks";
import { useSunPosition } from "./lighting";
import { useCameraControls } from "./camera";

interface Model {
  name: string;
  url?: string; // Pour les meshes sans LoD
  urlHigh?: string; // Pour les meshes avec LoD (niveau 11)
  urlLow?: string; // Pour les meshes avec LoD (niveau 09)
  urlUltraLow?: string; // Pour les meshes avec LoD (niveau 01)
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
  filesize?: number;
  lodEnabled?: boolean; // Flag pour activer le LoD
}

interface ThreeSceneProps {
  models: Model[];
  selectedModels: string[];
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
  
  // Utilisation des hooks personnalisés
  const {
    cameraControlsRef,
    mouseButtonsConfig,
    handleMeshDoubleClick,
    clickMarkers,
  } = useCameraControls();

  const sunPosition = useSunPosition(controls.sunAzimuth, controls.sunElevation);

  // Calcul de la direction de la lumière pour le shader (direction vers la surface)
  const lightDirection = new THREE.Vector3(...sunPosition).normalize();

  function Ground() {
    const gridConfig = {
      cellSize: 0.2,
      cellThickness: 0.5,
      cellColor: "#6f6f6f",
      sectionSize: 1,
      sectionThickness: 1,
      sectionColor: "#9d4b4b",
      fadeDistance: 30,
      fadeStrength: 2,
      followCamera: false,
      infiniteGrid: true,
    };
    return (
      <Grid position={[0, -0.01, 0]} args={[10.5, 10.5]} {...gridConfig} />
    );
  }

  return (
    <>
      <EffectComposer
        enabled={controls.enablePostProcess}
        enableNormalPass={true}
      >
        {controls.enableVignette && (
          <Vignette
            offset={0.3} // vignette offset
            darkness={0.4} // vignette darkness
            eskil={false} // Eskil's vignette technique
            blendFunction={BlendFunction.NORMAL} // blend mode
          />
        )}

        {controls.enableBrightnessContrast && (
          <BrightnessContrast
            brightness={0.1} // brightness. min: -1, max: 1
            contrast={0.1} // contrast: min -1, max: 1
          />
        )}

        {controls.enableToneMapping && (
          <ToneMapping
            blendFunction={BlendFunction.NORMAL} // blend mode
            adaptive={true} // toggle adaptive luminance map usage
            resolution={256} // texture resolution of the luminance map
            middleGrey={0.9} // middle grey factor
            maxLuminance={16.0} // maximum luminance
            averageLuminance={1.0} // average luminance
            adaptationRate={1.0} // luminance adaptation rate
          />
        )}

        {controls.enableBloom && (
          <Bloom
            luminanceThreshold={controls.bloomThreshold}
            luminanceSmoothing={controls.bloomLuminanceSmoothing}
            intensity={controls.bloomIntensity}
          />
        )}
      </EffectComposer>

      <PerspectiveCamera
        makeDefault
        position={[0, 4, 2]} // 2ème coord = hauteur 3ème coord = recul
        fov={controls.fov}
        near={0.001}
        far={100}
      />

      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        mouseButtons={mouseButtonsConfig}
        dollyToCursor={true}
        minDistance={0.2}
        maxDistance={6}
        infinityDolly={true}
        dollySpeed={0.8}
        truckSpeed={0.8}
        azimuthRotateSpeed={0.5}
        polarRotateSpeed={0.5}
        // dampingFactor={0.53}

        draggingSmoothTime={0.4}
      />

      {/* Cube de debug pour la cible de la caméra */}
      {controls.showCameraTarget && (
        <CameraTargetDebug cameraControlsRef={cameraControlsRef} />
      )}

      {/* Marqueurs de double-clic */}
      {controls.showCameraTarget &&
        clickMarkers.map((position, index) => (
          <mesh key={index} position={position} castShadow receiveShadow>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        ))}

      {/* {controls.showGrid && <gridHelper args={[10, 10]} />} */}
      {controls.showGrid && <Ground />}
      {controls.showAxes && <axesHelper args={[2]} />}
      {controls.showStats && <Stats />}

      {controls.showAmbientLight && (
        <ambientLight intensity={controls.ambientIntensity} />
      )}

      {controls.showDirectionalLight && (
        <directionalLight
          // position={[5, 5, 3]}
          position={sunPosition}
          intensity={controls.directionalIntensity}
          castShadow={true}
          receiveShadow={true}
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
        turbidity={controls.turbidity}
        rayleigh={controls.rayleigh}
        mieCoefficient={controls.mieCoefficient}
        mieDirectionalG={controls.mieDirectionalG}
      />

      {/* Mer */}
      {controls.water && (
        <mesh position={[0, 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial
            color="lightblue"
            roughness={0.6}
            metalness={0.8}
          />
        </mesh>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showAvalanchePentes, setShowAvalanchePentes] = useState(false);

  // Utilisation des hooks personnalisés
  const webglSupported = useWebGLDetection();
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

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
    <div ref={containerRef} className="relative w-full h-full">
      <MyLevaUI showAvalanchePentes={showAvalanchePentes}>
        <Canvas className="w-full h-full" frameloop="demand">
          <SceneContent models={models} selectedModels={selectedModels} />
        </Canvas>

        {/* Bouton plein écran dans le coin supérieur droit */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border flex items-center justify-center hover:bg-white/95 transition-all duration-200"
          title={
            isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"
          }
        >
          {isFullscreen ? (
            <FaCompress className="w-4 h-4 text-gray-600" />
          ) : (
            <FaExpand className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Bouton pentes avalancheuses en bas à droite */}
        <button
          onClick={() => setShowAvalanchePentes(!showAvalanchePentes)}
          className={`absolute bottom-4 right-4 z-50 w-10 h-10 backdrop-blur-sm rounded-full shadow-lg border flex items-center justify-center transition-all duration-200 ${
            showAvalanchePentes
              ? "bg-orange-500/90 hover:bg-orange-500/95 border-orange-600"
              : "bg-white/90 hover:bg-white/95 border-gray-300"
          }`}
          title={
            showAvalanchePentes
              ? "Masquer les pentes avalancheuses"
              : "Afficher les pentes avalancheuses"
          }
        >
          <TbMountain
            className={`w-6 h-6 ${
              showAvalanchePentes ? "text-white" : "text-gray-600"
            }`}
          />
        </button>
      </MyLevaUI>
    </div>
  );
}
