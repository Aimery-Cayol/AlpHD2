"use client";

import { useMemo, useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useAppContext } from "@/contexts/AppContext";
import type { TileModel } from "@/types/models";
import type { TileCoord } from "@/utils/fileUtils";

const DIRS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

/** Construit le TileCoord padded depuis des entiers km : 696,6278 → "0696_6278" */
function toCoord(x: number, y: number): TileCoord {
  return `${x.toString().padStart(4, "0")}_${y.toString().padStart(4, "0")}` as TileCoord;
}

export default function TileExpander({ models }: { models: TileModel[] }) {
  const { collidersRef, version } = useColliders();
  const { pendingLoads, tilesData, setSelectedTiles } = useAppContext();
  const [minAltitude, setMinAltitude] = useState<number>(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Refs factices pour occlude — drei raycast uniquement contre les meshes terrain
  const colliderOccludeRefs = useMemo(
    () => collidersRef.current.map(mesh => ({ current: mesh })),
    [collidersRef, version]
  );

  const buttons = useMemo(() => {
    if (models.length === 0) return [];
    const refX = models[0].coordinates.x / 1000; // km
    const refY = models[0].coordinates.y / 1000; // km
    const loadedSet = new Set(models.map(m => m.coord));
    const seen = new Set<string>();
    const result: Array<{ key: TileCoord; ex: number; ez: number }> = [];

    for (const m of models) {
      const mx = Math.round(m.coordinates.x / 1000);
      const my = Math.round(m.coordinates.y / 1000);
      for (const { dx, dy } of DIRS) {
        const nx = mx + dx;
        const ny = my + dy;
        const key = toCoord(nx, ny);
        if (loadedSet.has(key) || seen.has(key)) continue;
        // Ne proposer que les dalles présentes dans le catalogue
        if (!tilesData.has(key)) continue;
        seen.add(key);
        const ex = (nx - refX) + 0.5;
        const ez = -(ny - refY) - 0.5;
        result.push({ key, ex, ez });
      }
    }
    return result;
  }, [models, tilesData]);

  // Altitude minimale des dalles chargées : positionner les "+" au niveau du bas du terrain
  useEffect(() => {
    const colliders = collidersRef.current;
    if (colliders.length === 0) return;
    let minY = Infinity;
    for (const mesh of colliders) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      if (box) {
        const worldBox = box.clone().applyMatrix4(mesh.matrixWorld);
        minY = Math.min(minY, worldBox.min.y);
      }
    }
    if (isFinite(minY)) setMinAltitude(minY);
  }, [collidersRef, version]);

  if (models.length === 0 || buttons.length === 0 || pendingLoads > 0) return null;

  return (
    <>
      {buttons.map(({ key, ex, ez }) => (
        <Html key={key} position={[ex, minAltitude, ez]} center zIndexRange={[100, 0]} occlude={colliderOccludeRefs}>
          <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            {hoveredKey === key && (
              <div style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: 6,
                background: "rgba(0,0,0,0.72)",
                color: "#fff",
                padding: "3px 8px",
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}>
                Afficher la dalle voisine
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTiles(prev => prev.includes(key) ? prev : [...prev, key]);
              }}
              onMouseEnter={() => setHoveredKey(key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                fontSize: 24,
                fontWeight: 700,
                lineHeight: "1",
                cursor: "pointer",
                userSelect: "none",
                padding: "4px",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                outline: "none",
              }}
            >
              +
            </button>
          </div>
        </Html>
      ))}
    </>
  );
}
