import { useMemo } from "react";
import * as THREE from "three";
import { Sky } from "@react-three/drei";
import { useSunPosition } from "./useSunPosition";

interface LightingSetupProps {
  // Lumière ambiante
  showAmbientLight: boolean;
  ambientIntensity: number;
  
  // Lumière directionnelle
  showDirectionalLight: boolean;
  directionalIntensity: number;
  sunAzimuth: number;
  sunElevation: number;
  
  // Ciel
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
}

/**
 * Composant de configuration de l'éclairage de la scène
 * Gère les lumières ambiante, directionnelle et le ciel
 * 
 * @returns Direction de la lumière normalisée pour les shaders, et les éléments de lumière
 */
export function LightingSetup(props: LightingSetupProps) {
  const {
    showAmbientLight,
    ambientIntensity,
    showDirectionalLight,
    directionalIntensity,
    sunAzimuth,
    sunElevation,
    turbidity,
    rayleigh,
    mieCoefficient,
    mieDirectionalG,
  } = props;

  const sunPosition = useSunPosition(sunAzimuth, sunElevation);

  // Calcul de la direction de la lumière pour le shader (direction vers la surface)
  const lightDirection = useMemo(
    () => new THREE.Vector3(...sunPosition).normalize(),
    [sunPosition]
  );

  return (
    <>
      {showAmbientLight && <ambientLight intensity={ambientIntensity} />}

      {showDirectionalLight && (
        <directionalLight
          position={sunPosition}
          intensity={directionalIntensity}
          castShadow
          receiveShadow
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
        turbidity={turbidity}
        rayleigh={rayleigh}
        mieCoefficient={mieCoefficient}
        mieDirectionalG={mieDirectionalG}
      />
    </>
  );
}

// Export Light Direction Hook pour l'utiliser dans d'autres composants
export function useLightDirection(sunAzimuth: number, sunElevation: number) {
  const sunPosition = useSunPosition(sunAzimuth, sunElevation);
  
  return useMemo(
    () => new THREE.Vector3(...sunPosition).normalize(),
    [sunPosition]
  );
}
