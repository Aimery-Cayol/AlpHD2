"use client";

import { useMemo, useEffect, useState } from "react";
import * as THREE from "three";
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

type ButtonData = {
  key: TileCoord;
  ex: number; // centre de la dalle cible = position d'affichage du bouton
  ez: number;
  innerX: number; // 0.05km à l'intérieur du bord de la dalle source (raycast fiable)
  innerZ: number;
};

export default function TileExpander({ models }: { models: TileModel[] }) {
  const { collidersRef, version } = useColliders();
  const { tilesData, setSelectedTiles } = useAppContext();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  // Position 3D [x, y, z] par bouton, calculée par raycast
  const [buttonPositions, setButtonPositions] = useState<
    Record<string, [number, number, number]>
  >({});

  const { refX, refY } = useMemo(() => {
    if (models.length === 0) return { refX: 0, refY: 0 };
    return {
      refX: models[0].coordinates.x / 1000,
      refY: models[0].coordinates.y / 1000,
    };
  }, [models]);

  // Boutons "+" sur les bords extérieurs de toutes les dalles chargées (main + voisines)
  const buttons = useMemo((): ButtonData[] => {
    if (models.length === 0) return [];
    // Exclure toutes les dalles déjà chargées (haute ET basse résolution)
    const loadedSet = new Set(models.map((m) => m.coord as string));
    const seen = new Set<string>();
    const result: ButtonData[] = [];

    for (const m of models) {
      const mx = Math.round(m.coordinates.x / 1000);
      const my = Math.round(m.coordinates.y / 1000);
      for (const { dx, dy } of DIRS) {
        const nx = mx + dx;
        const ny = my + dy;
        const key = toCoord(nx, ny);
        if (loadedSet.has(key) || seen.has(key)) continue;
        if (!tilesData.has(key)) continue;
        seen.add(key);
        // En scène : Z = -Lambert Y → recul vers l'intérieur de la source = +dy sur Z
        const edgeEx = mx - refX + 0.5 + dx * 0.5;
        const edgeEz = -(my - refY) - 0.5 - dy * 0.5;
        result.push({
          key,
          ex: nx - refX + 0.5, // centre de la dalle cible
          ez: -(ny - refY) - 0.5,
          innerX: edgeEx - dx * 0.05, // 0.05km à l'intérieur du bord source
          innerZ: edgeEz + dy * 0.05,
        });
      }
    }
    return result;
  }, [models, tilesData, refX, refY]);

  // Raycast vers le bas pour chaque bouton :
  // 1. Centre de la dalle cible → fonctionne si elle a un mesh (voisine basse résolution)
  // 2. Légèrement à l'intérieur du bord de la dalle source (0.05km en retrait du bord)
  //    → hauteur correcte à cet endroit précis, le bouton s'affiche au bord
  // Le recul de 0.05km évite les problèmes de précision BVH sur le bord exact de la dalle.
  useEffect(() => {
    const colliders = collidersRef.current;
    if (buttons.length === 0 || colliders.length === 0) return;

    const raycaster = new THREE.Raycaster();
    const downDir = new THREE.Vector3(0, -1, 0);
    const newPositions: Record<string, [number, number, number]> = {};

    // Les colliders fraîchement ajoutés n'ont pas encore eu leur matrixWorld mis à jour
    // par le render loop Three.js (qui s'exécute après le commit React).
    // On force la mise à jour pour que les raycasts soient corrects.
    for (const mesh of colliders) {
      mesh.updateWorldMatrix(true, false);
    }

    const sample = (x: number, z: number): number | null => {
      raycaster.set(new THREE.Vector3(x, 100, z), downDir);
      const hits = raycaster.intersectObjects(colliders, false);
      return hits.length > 0 ? hits[0].point.y + 0.01 : null;
    };

    for (const { key, ex, ez, innerX, innerZ } of buttons) {
      // Tentative 1 : centre de la dalle cible (si elle a un mesh = voisine chargée)
      // Tentative 2 : 0.05km à l'intérieur du bord de la dalle source (toujours chargée)
      // Le bouton s'affiche dans la dalle cible (ex, ez)
      const y = sample(ex, ez) ?? sample(innerX, innerZ);
      if (y !== null) {
        newPositions[key] = [ex, y, ez];
      }
    }

    // Merger : conserver les positions existantes valides, ajouter/mettre à jour les nouvelles.
    // Ne supprimer que les clés dont le bouton n'existe plus (dalle ajoutée à loadedSet).
    const validKeys = new Set<string>(buttons.map((b) => b.key));
    setButtonPositions((prev) => {
      const filtered = Object.fromEntries(
        Object.entries(prev).filter(([k]) => validKeys.has(k))
      );
      return { ...filtered, ...newPositions };
    });
  }, [buttons, collidersRef, version]);

  // Refs pour occlude — empêche les boutons de traverser le terrain
  const colliderOccludeRefs = useMemo(
    () => collidersRef.current.map((mesh) => ({ current: mesh })),
    [collidersRef, version]
  );

  if (models.length === 0) return null;

  return (
    <>
      {buttons.map(({ key }) => {
        const pos = buttonPositions[key];
        if (!pos) return null;
        return (
          <Html
            key={key}
            position={pos}
            center
            zIndexRange={[100, 0]}
            occlude={colliderOccludeRefs}
          >
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {hoveredKey === key && (
                <div
                  style={{
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
                  }}
                >
                  Afficher la dalle voisine
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTiles((prev) =>
                    prev.includes(key) ? prev : [...prev, key]
                  );
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
        );
      })}
    </>
  );
}
