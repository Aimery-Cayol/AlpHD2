import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, CameraControls, Stats } from "@react-three/drei";
import { useCameraContext } from "./CameraContext";
import CameraTargetDebug from "../CameraTargetDebug";
import { useAppContext } from "@/contexts/AppContext";

interface CameraSetupProps {
  fov: number;
  showCameraTarget: boolean;
  showStats: boolean;
}

/**
 * Composant de configuration de la caméra et des contrôles
 * Gère la caméra perspective, les contrôles CameraControls et les outils de debug
 */
export function CameraSetup(props: CameraSetupProps) {
  const { fov, showCameraTarget, showStats } = props;

  const { cameraControlsRef, mouseButtonsConfig, clickMarkers } = useCameraContext();
  const { setCameraRotation } = useAppContext();
  const prevAngles = useRef({ polar: -1, azimuth: -1 });

  // Met à jour la boussole en lisant les angles de la caméra à chaque frame
  useFrame(() => {
    if (!cameraControlsRef.current) return;
    const polar = cameraControlsRef.current.polarAngle;
    const azimuth = cameraControlsRef.current.azimuthAngle;
    if (
      Math.abs(polar - prevAngles.current.polar) > 0.005 ||
      Math.abs(azimuth - prevAngles.current.azimuth) > 0.005
    ) {
      prevAngles.current = { polar, azimuth };
      setCameraRotation({ x: polar, y: azimuth, z: 0 });
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 4, 2]}
        fov={fov}
        near={0.001}
        far={100}
      />

      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        mouseButtons={mouseButtonsConfig}
        dollyToCursor
        minDistance={0.2}
        maxDistance={6}
        infinityDolly
        dollySpeed={0.8}
        truckSpeed={0.8}
        azimuthRotateSpeed={0.5}
        polarRotateSpeed={0.5}
        draggingSmoothTime={0.4}
      />

      {/* Outils de debug de la caméra */}
      {showCameraTarget && (
        <>
          <CameraTargetDebug cameraControlsRef={cameraControlsRef} />
          {/* Marqueurs de double-clic */}
          {clickMarkers.map((position, index) => (
            <mesh key={index} position={position} castShadow receiveShadow>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial color="blue" />
            </mesh>
          ))}
        </>
      )}

      {showStats && <Stats />}
    </>
  );
}
