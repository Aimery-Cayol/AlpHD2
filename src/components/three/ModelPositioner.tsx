"use client";

import React from "react";
import { useMemo } from "react";
import * as THREE from "three";
import MeshLoader from "./MeshLoader";

interface Model {
  name: string;
  url: string;
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
}

interface ModelPositionerProps {
  models: Model[];
  selectedModels: string[];
  onMeshDoubleClick?: (event: any) => void;
  lightDirection?: THREE.Vector3;
}

export default function ModelPositioner({
  models,
  selectedModels,
  onMeshDoubleClick,
  lightDirection,
}: ModelPositionerProps) {
  // Calculer les positions relatives avec le premier modèle au centre
  const positionedModels = useMemo(() => {
    if (selectedModels.length === 0) return [];

    // Filtrer les modèles sélectionnés
    const selectedModelData = models.filter((model) =>
      selectedModels.includes(model.url)
    );

    if (selectedModelData.length === 0) return [];

    // Calculer les positions relatives
    return calculateRelativePositions(selectedModelData);
  }, [models, selectedModels]);

  return (
    <>
      {positionedModels.map((model) => (
        <group
          key={model.url}
          position={model.position}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <MeshLoader
            url={model.url}
            format={model.format}
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
  models: Model[]
): (Model & { position: [number, number, number] })[] {
  if (models.length === 0) return [];

  // Le premier modèle va au centre
  const positionedModels: (Model & { position: [number, number, number] })[] =
    [];

  // Trouver le premier modèle avec des coordonnées valides
  const firstModelWithCoords = models.find((model) => model.coordinates);

  if (!firstModelWithCoords || !firstModelWithCoords.coordinates) {
    // Si aucun modèle n'a de coordonnées, placer tous au centre
    return models.map((model) => ({ ...model, position: [0, 0, 0] }));
  }

  const baseX = firstModelWithCoords.coordinates.x;
  const baseY = firstModelWithCoords.coordinates.y;

  models.forEach((model) => {
    let position: [number, number, number] = [0, 0, 0];

    if (model.coordinates) {
      // Calculer la position relative basée sur les différences de coordonnées (inversées)
      const relativeX = (baseX - model.coordinates.x) * 1; // Échelle 1:1, inversé
      const relativeZ = (baseY - model.coordinates.y) * 1; // Z pour la profondeur, inversé

      position = [-relativeX, 0, relativeZ];
    }
    // Si pas de coordonnées, le modèle reste au centre

    positionedModels.push({
      ...model,
      position,
    });
  });

  return positionedModels;
}
