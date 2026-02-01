"use client";

import * as THREE from "three";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Grid,
  Stats,
  CameraControls,
  CameraControlsImpl,
  Sky,
  AccumulativeShadows,
  RandomizedLight,
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
import SceneUI from "./SceneUI";
import MyLevaUI, { useSceneControls } from "./LevaUI";
import { FaExpand, FaCompress } from "react-icons/fa";
import CameraTargetDebug from "./CameraTargetDebug";

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
  const { ACTION } = CameraControlsImpl;
  const cameraControlsRef = useRef<CameraControlsImpl | null>(null);
  // GESTION DE L'APPUI DE LA TOUCHE SHIFT POUR CONTROLES CAMERA
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

  // CONFIGURATION DYNAMIQUE DES BOUTONS
  // On recalcule les boutons seulement quand isShiftPressed change
  const mouseButtonsConfig = useMemo(() => ({
    left: isShiftPressed ? ACTION.ROTATE : ACTION.SCREEN_PAN,
    right: ACTION.ROTATE,
    middle: ACTION.TRUCK,
    wheel: ACTION.DOLLY,
  }), [isShiftPressed, ACTION]);

  //JEasing
  // const cameraControlsRef = useRef<any>(null);
  // const handleMeshDoubleClick = (event: any) => {
  //   event.stopPropagation();
  //   if (cameraControlsRef.current && event.point) {
  //     new JEASINGS.JEasing(cameraControlsRef.current.target)
  //       .to({ x: event.point.x, y: event.point.y, z: event.point.z }, 500)
  //       .easing(JEASINGS.Cubic.Out)
  //       .start();
  //   }
  // };

  // Recentrer la caméra sur la bounding box des selectedModels
  // useEffect(() => {
  //   if (selectedModels.length === 0) return;

  //   const timer = setTimeout(() => {
  //     const worldBox = new THREE.Box3();
  //     let hasMeshes = false;

  //     scene.traverse((object) => {
  //       if (
  //         object instanceof THREE.Mesh &&
  //         object.userData.url &&
  //         selectedModels.includes(object.userData.url)
  //       ) {
  //         if (object.geometry && object.geometry.boundingBox) {
  //           const localBox = object.geometry.boundingBox.clone();
  //           localBox.applyMatrix4(object.matrixWorld);
  //           worldBox.union(localBox);
  //           hasMeshes = true;
  //         }
  //       }
  //     });

  //     if (hasMeshes && cameraControlsRef.current) {
  //       const center = worldBox.getCenter(new THREE.Vector3());
  //       cameraControlsRef.current.target.copy(center);
  //     }
  //   }, 1000); // Délai pour permettre le chargement des mesh

  //   return () => clearTimeout(timer);
  // }, [selectedModels, scene]);

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
      <JEasingsComponent />
      <EffectComposer enabled={controls.enablePostProcess} enableNormalPass={true}>
        {/* <SMAA /> */}

        {controls.enableVignette && (
          <Vignette
          offset={0.3} // vignette offset
          darkness={0.4} // vignette darkness
          eskil={false} // Eskil's vignette technique
          blendFunction={BlendFunction.NORMAL} // blend mode
        />)}
        
        
        {controls.enableBrightnessContrast && (
          <BrightnessContrast
          brightness={0.1} // brightness. min: -1, max: 1
          contrast={0.1} // contrast: min -1, max: 1
        />)}

        {controls.enableToneMapping && (
          <ToneMapping
          blendFunction={BlendFunction.NORMAL} // blend mode
          adaptive={true} // toggle adaptive luminance map usage
          resolution={256} // texture resolution of the luminance map
          middleGrey={0.9} // middle grey factor
          maxLuminance={16.0} // maximum luminance
          averageLuminance={1.0} // average luminance
          adaptationRate={1.0} // luminance adaptation rate
        />)}

        {controls.enableBloom && (
          <Bloom
            luminanceThreshold={controls.bloomThreshold}
            luminanceSmoothing={controls.bloomLuminanceSmoothing}
            intensity={controls.bloomIntensity}
          />
        )}

        

        {/* {controls.enableSSAO && (
          <SSAO
            samples={30} // amount of samples per pixel (shouldn't be a multiple of the ring count)
            rings={4} // amount of rings in the occlusion sampling pattern
            distanceThreshold={10.0} // global distance threshold at which the occlusion effect starts to fade out. min: 0, max: 1
            distanceFalloff={0.0} // distance falloff. min: 0, max: 1
            rangeThreshold={0.05} // local occlusion range threshold at which the occlusion starts to fade out. min: 0, max: 1
            rangeFalloff={0.1} // occlusion range falloff. min: 0, max: 1
            luminanceInfluence={0.9} // how much the luminance of the scene influences the ambient occlusion
            radius={10} // occlusion sampling radius
            bias={0.5} // occlusion bias
          />
        )} */}
      </EffectComposer>

      <PerspectiveCamera
        makeDefault
        position={[0, 8, 8]} // 2ème coord = hauteur 3ème coord = recul
        
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
        maxDistance={3}
        infinityDolly={true}
        dollySpeed={0.8}
        truckSpeed={0.8}
        azimuthRotateSpeed={0.5}
        polarRotateSpeed={0.5}
        // autoRotate={controls.autoRotate}
        // dampingFactor={0.13}
      />

      {/* Cube de debug pour la cible de la caméra */}
      {controls.showCameraTarget && (
        <CameraTargetDebug cameraControlsRef={cameraControlsRef} />
      )}

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
        turbidity={2}
        rayleigh={3}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
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
        // onMeshDoubleClick={handleMeshDoubleClick}
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fonction pour basculer en plein écran
  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        // Entrer en plein écran sur le conteneur
        containerRef.current.requestFullscreen().catch((err) => {
          console.error("Erreur lors du passage en plein écran:", err);
        });
      } else {
        // Quitter le plein écran
        document.exitFullscreen();
      }
    }
  }, []);

  // Écouteur d'événement pour détecter les changements de mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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
    <div ref={containerRef} className="relative w-full h-full">
      <MyLevaUI>
        <Canvas className="w-full h-full" frameloop="demand">
          <SceneContent models={models} selectedModels={selectedModels} />
        </Canvas>

        {/* Interface utilisateur overlay */}
        <SceneUI models={models} selectedModels={selectedModels} />

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
      </MyLevaUI>
    </div>
  );
}
