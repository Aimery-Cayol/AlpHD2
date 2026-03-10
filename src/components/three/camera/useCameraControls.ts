import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";
import { useColliders } from "@/contexts/ColliderContext";

/**
 * Hook pour gérer les contrôles de la caméra
 * Gère les événements clavier (Shift), les marqueurs de debug et la configuration des boutons de souris
 * 
 * @returns Objet contenant la ref des contrôles, la config des boutons, le handler de double-clic et les marqueurs
 */
export function useCameraControls() {
  const { ACTION } = CameraControlsImpl;
  const cameraControlsRef = useRef<CameraControlsImpl | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [clickMarkers, setClickMarkers] = useState<THREE.Vector3[]>([]);
  const { collidersRef } = useColliders();

  // Gestion de l'appui de la touche Shift pour les contrôles caméra
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Configuration dynamique des boutons de souris
  // Shift + clic gauche = rotation, sinon = pan
  const mouseButtonsConfig = useMemo(
    () => ({
      left: isShiftPressed ? ACTION.ROTATE : ACTION.SCREEN_PAN,
      right: ACTION.ROTATE,
      middle: ACTION.TRUCK,
      wheel: ACTION.DOLLY,
    }),
    [isShiftPressed, ACTION]
  );

  // Gestionnaire de double-clic pour "Fit To Mesh" avec dolly
  const handleMeshDoubleClick = useCallback((event: any) => {
    event.stopPropagation();
    if (cameraControlsRef.current && event.intersections && event.intersections.length > 0) {
      const intersection = event.intersections[0];
      if (intersection.point) {
        // Ajoute un marqueur au point cliqué
        setClickMarkers((prev) => [...prev, intersection.point.clone()]);

        // Utilise moveTo pour animer la caméra vers le point cliqué
        cameraControlsRef.current.moveTo(
          intersection.point.x,
          intersection.point.y,
          intersection.point.z,
          true // Animation smooth
        );
      }
    }
  }, []);

  // Repositionne la caméra sur les dalles principales (haute résolution uniquement)
  useEffect(() => {
    const handleFitCamera = (event: Event) => {
      if (!cameraControlsRef.current || collidersRef.current.length === 0) return;
      const detail = (event as CustomEvent).detail as { mainCoords?: Set<string> } | undefined;
      const mainCoords = detail?.mainCoords;

      // Filtrer les colliders pour n'inclure que les dalles sélectionnées (haute résolution)
      const meshes =
        mainCoords && mainCoords.size > 0
          ? collidersRef.current.filter((m) => mainCoords.has(m.userData.coord))
          : collidersRef.current;
      const targetMeshes = meshes.length > 0 ? meshes : collidersRef.current;

      const box = new THREE.Box3();
      for (const mesh of targetMeshes) {
        box.expandByObject(mesh);
      }
      if (!box.isEmpty()) {
        cameraControlsRef.current.fitToBox(box, true, {
          paddingTop: 0.3,
          paddingBottom: 0.3,
          paddingLeft: 0.3,
          paddingRight: 0.3,
        });
      }
    };
    window.addEventListener("fit-camera", handleFitCamera);
    return () => window.removeEventListener("fit-camera", handleFitCamera);
  }, [collidersRef]);

  return {
    cameraControlsRef,
    mouseButtonsConfig,
    handleMeshDoubleClick,
    clickMarkers,
  };
}
