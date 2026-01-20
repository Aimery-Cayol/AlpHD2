import * as THREE from "three";
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraControlsImpl } from "@react-three/drei";

interface CameraTargetDebugProps {
  cameraControlsRef: React.RefObject<CameraControlsImpl | null>;
}

export default function CameraTargetDebug({ cameraControlsRef }: CameraTargetDebugProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && cameraControlsRef.current) {
      const target = new THREE.Vector3();
      cameraControlsRef.current.getTarget(target);
      meshRef.current.position.copy(target);
      
      // Projeter l'ombre au sol (y=0)
      if (shadowRef.current) {
        shadowRef.current.position.set(target.x, 0.001, target.z);
      }
    }
  });

  return (
    <>
      {/* Cube bleu */}
      <mesh ref={meshRef}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshBasicMaterial color="blue" />
      </mesh>
      
      {/* Ombre projetée au sol */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <circleGeometry args={[0.01, 4]} />
        <meshBasicMaterial color="black" opacity={0.5} transparent />
      </mesh>
    </>
  );
}
