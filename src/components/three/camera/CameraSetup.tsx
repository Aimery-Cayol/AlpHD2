import { PerspectiveCamera, CameraControls, Stats } from "@react-three/drei";
import { useCameraControls } from "./useCameraControls";
import CameraTargetDebug from "../CameraTargetDebug";

interface CameraSetupProps {
  fov: number;
  showCameraTarget: boolean;
  showStats: boolean;
  onMeshDoubleClick?: (event: any) => void;
}

/**
 * Composant de configuration de la caméra et des contrôles
 * Gère la caméra perspective, les contrôles CameraControls et les outils de debug
 */
export function CameraSetup(props: CameraSetupProps) {
  const { fov, showCameraTarget, showStats, onMeshDoubleClick } = props;

  const { cameraControlsRef, mouseButtonsConfig, handleMeshDoubleClick, clickMarkers } =
    useCameraControls();

  // Si un handler externe est fourni, on l'encapsule
  const finalHandler = onMeshDoubleClick
    ? (event: any) => {
        handleMeshDoubleClick(event);
        onMeshDoubleClick(event);
      }
    : handleMeshDoubleClick;

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

// Export le handler de double-clic pour l'utiliser dans d'autres composants
export function useMeshDoubleClickHandler() {
  const { handleMeshDoubleClick } = useCameraControls();
  return handleMeshDoubleClick;
}
