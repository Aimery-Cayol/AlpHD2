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
import PoiTool from "./PoiTool";
import TileExpander from "./TileExpander";
import { useAppContext, Poi } from "@/contexts/AppContext";

type PoiType = "sommet" | "col" | "refuge";
const COLOR_BY_TYPE: Record<PoiType, string> = { sommet: "#f97316", col: "#3b82f6", refuge: "#22c55e" };
const ICON_BY_TYPE: Record<PoiType, string> = { sommet: "▲", col: "⛰", refuge: "⌂" };

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
  onExpandTile?: (nx: number, ny: number, url: string) => void;
  tileUrlMap?: Map<string, string>;
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

function SceneContent({ models, selectedModels, onExpandTile, tileUrlMap }: ThreeSceneProps) {
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

  // Centrer la caméra sur les colliders chargés (fitToBox)
  const { collidersRef, version } = useColliders();
  const fitCameraToScene = useCallback(() => {
    if (!cameraControlsRef.current || collidersRef.current.length === 0) return;

    const box = new THREE.Box3();
    for (const mesh of collidersRef.current) {
      mesh.geometry.computeBoundingBox();
      const meshBox = mesh.geometry.boundingBox!.clone();
      meshBox.applyMatrix4(mesh.matrixWorld);
      box.union(meshBox);
    }

    if (box.isEmpty()) return;

    // Agrandir légèrement la boîte pour un peu de marge
    const padding = 0.5;
    box.expandByScalar(padding);
    cameraControlsRef.current.fitToBox(box, true, {
      paddingTop: padding,
      paddingRight: padding,
      paddingBottom: padding,
      paddingLeft: padding,
    });
  }, [collidersRef]);

  // Écouter les événements de reset
  useEffect(() => {
    const handleResetCamera = () => resetCameraToDefault();
    const handleResetNorth = () => resetCameraToNorth();
    const handleFitCamera = () => fitCameraToScene();
    const handlePoiLookAt = (e: Event) => {
      const { x, y, z } = (e as CustomEvent).detail;
      cameraControlsRef.current?.setTarget(x, y, z, true);
    };

    window.addEventListener("reset-camera", handleResetCamera);
    window.addEventListener("reset-camera-north", handleResetNorth);
    window.addEventListener("fit-camera", handleFitCamera);
    window.addEventListener("poi-look-at", handlePoiLookAt);

    return () => {
      window.removeEventListener("reset-camera", handleResetCamera);
      window.removeEventListener("reset-camera-north", handleResetNorth);
      window.removeEventListener("fit-camera", handleFitCamera);
      window.removeEventListener("poi-look-at", handlePoiLookAt);
    };
  }, [resetCameraToDefault, resetCameraToNorth, fitCameraToScene]);

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
      <PoiTool models={models} />
      {onExpandTile && <TileExpander models={models} onExpand={onExpandTile} availableTileUrls={tileUrlMap} />}
    </>
  );
}

export default function ThreeScene({ models, selectedModels, onExpandTile, tileUrlMap }: ThreeSceneProps) {
  const { measurementEnabled, setMeasurementEnabled, poiEnabled, setPoiEnabled, poiPlacing, setPoiPlacing, addPoi, updatePoi, removePoi, pois } = useAppContext();

  // État du formulaire POI (géré ici dans le DOM, pas dans le Canvas)
  const [poiPendingPos, setPoiPendingPos] = useState<{ x: number; y: number; z: number } | null>(null);
  const poiPendingTileId = useRef<string>("");
  const [poiEditingId, setPoiEditingId] = useState<string | null>(null);
  const [poiFormName, setPoiFormName] = useState("");
  const [poiFormType, setPoiFormType] = useState<PoiType>("sommet");
  const poiInputRef = useRef<HTMLInputElement>(null);

  // Écouter l'événement toggle-measurement
  useEffect(() => {
    const handleToggleMeasurement = () => setMeasurementEnabled(!measurementEnabled);
    window.addEventListener("toggle-measurement", handleToggleMeasurement);
    return () => window.removeEventListener("toggle-measurement", handleToggleMeasurement);
  }, [measurementEnabled, setMeasurementEnabled]);

  // Écouter l'événement toggle-poi
  useEffect(() => {
    const handleTogglePoi = () => setPoiEnabled(!poiEnabled);
    window.addEventListener("toggle-poi", handleTogglePoi);
    return () => window.removeEventListener("toggle-poi", handleTogglePoi);
  }, [poiEnabled, setPoiEnabled]);

  // Écouter les événements POI émis par PoiTool
  useEffect(() => {
    const handlePending = (e: Event) => {
      const { tileId, ...pos } = (e as CustomEvent).detail;
      poiPendingTileId.current = tileId ?? "";
      setPoiPendingPos(pos);
      setPoiEditingId(null);
      setPoiFormName("");
      setPoiFormType("sommet");
      setTimeout(() => poiInputRef.current?.focus(), 50);
    };
    const handleEdit = (e: Event) => {
      const poi = (e as CustomEvent).detail as Poi;
      setPoiEditingId(poi.id);
      setPoiPendingPos(null);
      setPoiFormName(poi.name);
      setPoiFormType(poi.type as PoiType);
      setTimeout(() => poiInputRef.current?.focus(), 50);
    };
    const handleCancel = () => {
      setPoiPendingPos(null);
      setPoiEditingId(null);
    };
    window.addEventListener("poi-pending", handlePending);
    window.addEventListener("poi-edit", handleEdit);
    window.addEventListener("poi-cancel", handleCancel);
    return () => {
      window.removeEventListener("poi-pending", handlePending);
      window.removeEventListener("poi-edit", handleEdit);
      window.removeEventListener("poi-cancel", handleCancel);
    };
  }, []);

  const handleConfirmAdd = () => {
    if (!poiPendingPos || !poiFormName.trim()) return;
    const tileId = poiPendingTileId.current;
    // Coordonnées Lambert 93 absolues : position scène + référence de la session
    // models[0] est l'origine de la scène (ModelPositioner utilise le 1er modèle comme référence)
    const refX = (models as any[]).length > 0 ? ((models as any[])[0].x ?? 0) : 0;
    const refY = (models as any[]).length > 0 ? ((models as any[])[0].y ?? 0) : 0;
    const lx = poiPendingPos.x + refX;
    const ly = -poiPendingPos.z + refY;
    addPoi({ name: poiFormName.trim(), type: poiFormType, position: poiPendingPos, tileIds: tileId ? [tileId] : [], lx, ly });
    window.dispatchEvent(new CustomEvent("poi-confirm"));
    setPoiPendingPos(null);
    setPoiPlacing(false);
  };

  const handleConfirmEdit = () => {
    if (!poiEditingId || !poiFormName.trim()) return;
    updatePoi(poiEditingId, { name: poiFormName.trim(), type: poiFormType });
    setPoiEditingId(null);
  };

  const handleDelete = () => {
    if (!poiEditingId) return;
    removePoi(poiEditingId);
    setPoiEditingId(null);
  };

  const handleCancelForm = () => {
    window.dispatchEvent(new CustomEvent("poi-cancel"));
    setPoiPendingPos(null);
    setPoiEditingId(null);
    setPoiPlacing(false);
  };

  const editingPoi = poiEditingId ? pois.find(p => p.id === poiEditingId) : null;
  const showForm = poiPendingPos !== null || poiEditingId !== null;
  const isCrosshair = measurementEnabled || poiEnabled;

  return (
    <div className="relative w-full h-full outline-none">
      <ColliderProvider>
        <MyLevaUI>
          <Canvas
            className={`w-full h-full ${isCrosshair ? "cursor-crosshair" : ""}`}
            shadows
            gl={{ antialias: true, logarithmicDepthBuffer: true }}
          >
            <SceneContent models={models} selectedModels={selectedModels} onExpandTile={onExpandTile} tileUrlMap={tileUrlMap} />
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

      {/* Indicateur mode POI */}
      {poiEnabled && !showForm && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Clic sur le terrain pour placer un lieu | Échap : annuler
          </div>
        </div>
      )}

      {/* Formulaire POI — rendu dans le DOM pour garantir le focus clavier */}
      {showForm && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-64">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {poiEditingId ? `Modifier — ${editingPoi?.name ?? ""}` : "Nouveau lieu"}
            </p>
            <input
              ref={poiInputRef}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              value={poiFormName}
              onChange={(e) => setPoiFormName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") poiEditingId ? handleConfirmEdit() : handleConfirmAdd();
                if (e.key === "Escape") handleCancelForm();
              }}
              placeholder="Nom du lieu"
              autoComplete="off"
            />
            <div className="flex gap-2">
              {(["sommet", "col", "refuge"] as PoiType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setPoiFormType(t)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all"
                  style={poiFormType === t
                    ? { background: COLOR_BY_TYPE[t], borderColor: COLOR_BY_TYPE[t], color: "#fff" }
                    : { background: "transparent", borderColor: "rgba(148,163,184,0.2)", color: "#94a3b8" }
                  }
                >
                  {ICON_BY_TYPE[t]} {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={poiEditingId ? handleConfirmEdit : handleConfirmAdd}
                disabled={!poiFormName.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all"
              >
                {poiEditingId ? "Enregistrer" : "Valider"}
              </button>
              {poiEditingId && (
                <button
                  onClick={handleDelete}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-bold transition-all"
                >
                  ✕
                </button>
              )}
              <button
                onClick={handleCancelForm}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-[11px] font-bold transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}