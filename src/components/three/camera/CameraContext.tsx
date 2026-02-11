import React, { createContext, useContext, ReactNode, RefObject } from "react";
import * as THREE from "three";
import { CameraControlsImpl } from "@react-three/drei";
import { useCameraControls } from "./useCameraControls";

interface CameraContextType {
  handleMeshDoubleClick: (event: any) => void;
  cameraControlsRef: RefObject<CameraControlsImpl | null>;
  mouseButtonsConfig: any; // Type complexe de CameraControls
  clickMarkers: THREE.Vector3[];
}

const CameraContext = createContext<CameraContextType | null>(null);

/**
 * Hook pour accéder au context de la caméra
 */
export function useCameraContext() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error("useCameraContext doit être utilisé dans CameraProvider");
  }
  return context;
}

interface CameraProviderProps {
  children: ReactNode;
}

/**
 * Provider pour partager le handler de double-clic de la caméra
 * avec les composants enfants
 */
export function CameraProvider({ children }: CameraProviderProps) {
  const cameraData = useCameraControls();

  return (
    <CameraContext.Provider value={cameraData}>
      {children}
    </CameraContext.Provider>
  );
}
