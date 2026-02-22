import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";

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

  return {
    cameraControlsRef,
    mouseButtonsConfig,
    handleMeshDoubleClick,
    clickMarkers,
  };
}
