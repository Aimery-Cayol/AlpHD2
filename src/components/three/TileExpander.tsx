"use client";

import { useMemo, useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useAppContext } from "@/contexts/AppContext";

type TileModel = { x: number; y: number; url: string };

const DIRS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

function buildNeighborUrl(refUrl: string, nx: number, ny: number): string {
  const decoded = decodeURIComponent(refUrl);
  const variantMatch = decoded.match(/_(\d{1,3})\.drc/);
  const variant = variantMatch ? `_${variantMatch[1]}` : "";
  const xStr = nx.toString().padStart(4, "0");
  const yStr = ny.toString().padStart(4, "0");
  return `/api/tiles?path=${encodeURIComponent(`meshes/${xStr}_${yStr}${variant}.drc`)}`;
}

export default function TileExpander({
  models,
  onExpand,
  availableTileUrls,
}: {
  models: TileModel[];
  onExpand: (nx: number, ny: number, url: string) => void;
  availableTileUrls?: Map<string, string>;
}) {
  const { collidersRef, version } = useColliders();
  const { pendingLoads } = useAppContext();
  const [minAltitude, setMinAltitude] = useState<number>(0);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const buttons = useMemo(() => {
    if (models.length === 0) return [];
    const refX = models[0].x;
    const refY = models[0].y;
    const loadedSet = new Set(models.map((m) => `${m.x}_${m.y}`));
    const seen = new Set<string>();
    const result: Array<{ key: string; ex: number; ez: number; nx: number; ny: number; url: string }> = [];

    for (const m of models) {
      for (const { dx, dy } of DIRS) {
        const nx = m.x + dx;
        const ny = m.y + dy;
        const key = `${nx}_${ny}`;
        if (loadedSet.has(key) || seen.has(key)) continue;

        if (availableTileUrls) {
          const catalogUrl = availableTileUrls.get(key);
          if (!catalogUrl) continue;
          seen.add(key);
          // Centre de la dalle voisine dans l'espace scène (géométrie 0→1 par dalle)
          result.push({ key, ex: (nx - refX) + 0.5, ez: -(ny - refY) - 0.5, nx, ny, url: catalogUrl });
        } else {
          seen.add(key);
          result.push({ key, ex: (nx - refX) + 0.5, ez: -(ny - refY) - 0.5, nx, ny, url: buildNeighborUrl(m.url, nx, ny) });
        }
      }
    }
    return result;
  }, [models, availableTileUrls]);

  // Altitude minimale des dalles chargées : tous les "+" au même niveau
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
      {buttons.map(({ key, ex, ez, nx, ny, url }) => (
        <Html key={key} position={[ex, minAltitude, ez]} center zIndexRange={[100, 0]} occlude>
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
              onClick={(e) => { e.stopPropagation(); onExpand(nx, ny, url); }}
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
