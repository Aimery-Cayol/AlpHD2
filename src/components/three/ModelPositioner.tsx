"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import MeshLoader from "./MeshLoader";
import type { TileModel } from "@/types/models";

interface ModelPositionerProps {
  models: TileModel[];
  onMeshDoubleClick?: (event: any) => void;
  lightDirection?: THREE.Vector3;
}

export default function ModelPositioner({
  models,
  onMeshDoubleClick,
  lightDirection,
}: ModelPositionerProps) {
  // Calculer les positions relatives avec le premier modèle au centre
  const positionedModels = useMemo(() => {
    if (models.length === 0) return [];
    return calculateRelativePositions(models);
  }, [models]);

  return (
    <>
      {positionedModels.map((model) => (
        <group
          key={model.coord}
          position={model.position}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <MeshLoader
            coord={model.coord}
            level={model.level}
            onDoubleClick={onMeshDoubleClick}
            lightDirection={lightDirection}
          />
        </group>
      ))}
    </>
  );
}

// Fonction pour calculer les positions relatives basées sur les coordonnées géographiques
function calculateRelativePositions(
  models: TileModel[],
): (TileModel & { position: [number, number, number] })[] {
  if (models.length === 0) return [];

  const firstWithCoords = models.find((m) => m.coordinates);

  if (!firstWithCoords || !firstWithCoords.coordinates) {
    return models.map((model) => ({ ...model, position: [0, 0, 0] }));
  }

  const baseX = firstWithCoords.coordinates.x / 1000;
  const baseY = firstWithCoords.coordinates.y / 1000;

  return models.map((model) => {
    let position: [number, number, number] = [0, 0, 0];

    if (model.coordinates) {
      const relativeX = (baseX - model.coordinates.x / 1000);
      const relativeZ = (baseY - model.coordinates.y / 1000);
      position = [-relativeX, 0, relativeZ];
    }

    return { ...model, position };
  });
}
