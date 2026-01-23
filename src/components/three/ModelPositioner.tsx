"use client";

import React, { useMemo } from "react";
import MeshLoader from "./MeshLoader";

export default function ModelPositioner({
  models = [],           // Contient les objets créés dans page.tsx (avec .id, .url, .x, .y)
  selectedModels = [],   // Contient l'ID du sommet sélectionné (ex: ["verte"])
  onMeshDoubleClick,
  lightDirection,
}: any) {
  
  const positionedModels = useMemo(() => {
    // 1. CORRECTION CRITIQUE : On filtre par m.id (l'id du sommet) 
    // et non par m.url car selectedModels contient des IDs comme "verte" ou "drus".
    const selectedData = models.filter((m: any) => selectedModels.includes(m.id));
    
    // Debug pour voir si le lien se fait bien
    console.log("ModelPositioner - IDs recherchés:", selectedModels);
    console.log("ModelPositioner - Dalles trouvées:", selectedData.length);

    if (selectedData.length === 0) return [];

    // 2. REFERENCE : On prend la première dalle comme origine locale (0,0,0)
    // On utilise une valeur de secours pour éviter NaN
    const refX = selectedData[0].x ?? 0;
    const refY = selectedData[0].y ?? 0;
    
    // SCALE : Si tes dalles sont en km (ex: 1006, 1007), SCALE=1 est correct.
    // Si elles sont en mètres, il faudra peut-être SCALE=1000.
    const SCALE = 1; 

    return selectedData.map((model: any) => {
      // Calcul des positions relatives
      const posX = (model.x - refX) * SCALE;
      const posZ = -(model.y - refY) * SCALE; // Inversion Z pour le repère Three.js

      return {
        ...model,
        position: [posX, 0, posZ] as [number, number, number]
      };
    });
  }, [models, selectedModels]);

  if (positionedModels.length === 0) {
    return null;
  }

  return (
    <>
      {positionedModels.map((model: any, index: number) => (
        <group 
          key={`${model.url}-${index}`} 
          position={model.position} 
          // Note : La rotation dépend de comment tes fichiers DRC ont été exportés.
          // Si tes modèles apparaissent "couchés", garde [-Math.PI / 2, 0, 0].
          // Si ils sont invisibles, essaie [0, 0, 0] pour tester.
          rotation={[-Math.PI / 2, 0, 0]} 
        >
          <MeshLoader
            url={model.url}
            format={model.format || "drc"}
            onDoubleClick={onMeshDoubleClick}
            lightDirection={lightDirection}
          />
        </group>
      ))}
    </>
  );
}