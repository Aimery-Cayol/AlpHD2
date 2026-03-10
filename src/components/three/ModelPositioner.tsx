"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import MeshLoader from "./MeshLoader";
import IGNBasemap from "./IGNBasemap";
import { useSceneControls } from "./LevaUI";
import type { TileModel } from "@/types/models";
import type { IGNLayer } from "@/utils/coordinateUtils";

interface ModelPositionerProps {
  models: TileModel[];
  onMeshDoubleClick?: (event: any) => void;
  lightDirection?: THREE.Vector3;
  neighborCoords?: Set<string>;
  onNeighborHover?: (coord: string | null) => void;
  onNeighborClick?: (coord: string) => void;
}

export default function ModelPositioner({
  models,
  onMeshDoubleClick,
  lightDirection,
  neighborCoords,
  onNeighborHover,
  onNeighborClick,
}: ModelPositionerProps) {
  const controls = useSceneControls();
  const showBasemap = controls?.showBasemap ?? false;

  const { positionedModels, referenceX, referenceY, tileData } = useMemo(() => {
    if (models.length === 0) {
      return { positionedModels: [], referenceX: 0, referenceY: 0, tileData: [] };
    }
    const positioned = calculateRelativePositions(models);
    const firstWithCoords = models.find((m) => m.coordinates);
    const refX = firstWithCoords ? firstWithCoords.coordinates.x / 1000 : 0;
    const refY = firstWithCoords ? firstWithCoords.coordinates.y / 1000 : 0;
    const tiles = models
      .filter((m) => m.coordinates)
      .map((m) => ({ x: m.coordinates.x / 1000, y: m.coordinates.y / 1000 }));
    return { positionedModels: positioned, referenceX: refX, referenceY: refY, tileData: tiles };
  }, [models]);

  return (
    <>
      {/* Fond de carte IGN */}
      {showBasemap && tileData.length > 0 && (
        <IGNBasemap
          key={`basemap-${referenceX}-${referenceY}`}
          tiles={tileData}
          referenceX={referenceX}
          referenceY={referenceY}
          marginKm={7}
          opacity={controls?.basemapOpacity ?? 1}
          yOffset={2.5}
          layer={(controls?.basemapLayer as IGNLayer) ?? 'PLANIGNV2'}
        />
      )}

      {positionedModels.map((model) => {
        const isNeighbor = neighborCoords?.has(model.coord) ?? false;
        return (
          <group
            key={model.coord}
            position={model.position}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerEnter={isNeighbor ? () => onNeighborHover?.(model.coord) : undefined}
            onPointerLeave={isNeighbor ? () => onNeighborHover?.(null) : undefined}
            onClick={isNeighbor ? (e) => { e.stopPropagation(); onNeighborClick?.(model.coord); } : undefined}
          >
            <MeshLoader
              coord={model.coord}
              level={model.level}
              onDoubleClick={onMeshDoubleClick}
              lightDirection={lightDirection}
            />
          </group>
        );
      })}

    </>
  );
}

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
