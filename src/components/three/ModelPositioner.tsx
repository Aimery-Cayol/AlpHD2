"use client";

import React, { useMemo } from "react";
import MeshLoader from "./MeshLoader";

export default function ModelPositioner({
  models = [],
  selectedModels = [],
  onMeshDoubleClick,
  lightDirection,
}: any) {
  
  const positionedModels = useMemo(() => {
    // 1. On récupère les dalles sélectionnées
    const selectedData = models.filter((m: any) => selectedModels.includes(m.url));
    if (selectedData.length === 0) return [];

    // 2. REFERENCE : On prend la toute première dalle comme point 0
    const refX = selectedData[0].x || 0;
    const refY = selectedData[0].y || 0;
    
    // IMPORTANT : L'unité de tes coordonnées (1006, 1007) correspond déjà 
    // à la taille des dalles dans tes fichiers DRC.
    // On utilise donc un multiplicateur de 1 pour un alignement parfait.
    const SCALE = 1; 

    return selectedData.map((model: any) => ({
      ...model,
      // On calcule la position relative par rapport à la première dalle
      position: [
        ((model.x || 0) - refX) * SCALE, 
        0, 
        -((model.y || 0) - refY) * SCALE
      ] as [number, number, number]
    }));
  }, [models, selectedModels]);

  if (positionedModels.length === 0) return null;

  return (
    <>
      {positionedModels.map((model: any) => (
        <group key={model.url} position={model.position} rotation={[-Math.PI / 2, 0, 0]}>
          <MeshLoader
            url={model.url}
            onDoubleClick={onMeshDoubleClick}
            lightDirection={lightDirection}
          />
        </group>
      ))}
    </>
  );
}