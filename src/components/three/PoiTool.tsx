"use client";

import * as THREE from "three";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useAppContext, Poi } from "@/contexts/AppContext";

type PoiType = "sommet" | "col" | "refuge";

const COLOR_BY_TYPE: Record<PoiType, string> = {
  sommet: "#f97316",
  col: "#3b82f6",
  refuge: "#22c55e",
};

export const POI_LABEL_HEIGHT = 0.42; // ~420m au-dessus du terrain
const STAGGER_STEP = 0.22;  // ~220m par niveau supplémentaire
const COLLISION_DIST = 0.25; // 250m en unités scène (1 unité = 1 km)

/** Calcule la hauteur de trait pour chaque POI afin d'éviter les chevauchements. */
function computePoiHeights(pois: Poi[]): Map<string, number> {
  // Tri par altitude croissante : le POI le plus bas est traité en premier (niveau 0 = trait court)
  // → en cas de conflit, le POI le plus haut obtient un niveau supérieur (trait plus long)
  const sorted = [...pois].sort((a, b) => a.position.y - b.position.y || a.id.localeCompare(b.id));
  const levelOf = new Map<string, number>();

  for (const poi of sorted) {
    let level = 0;
    // Cherche le plus petit niveau sans conflit avec les POIs déjà traités
    let found = false;
    while (!found) {
      found = true;
      for (const other of sorted) {
        if (other.id === poi.id) break; // on n'a pas encore traité les suivants
        if (levelOf.get(other.id) !== level) continue;
        const dx = poi.position.x - other.position.x;
        const dz = poi.position.z - other.position.z;
        if (Math.sqrt(dx * dx + dz * dz) < COLLISION_DIST) {
          found = false;
          level++;
          break;
        }
      }
    }
    levelOf.set(poi.id, level);
  }

  const heights = new Map<string, number>();
  for (const [id, level] of levelOf) {
    heights.set(id, POI_LABEL_HEIGHT + level * STAGGER_STEP);
  }
  return heights;
}

import type { TileModel } from "@/types/models";

export default function PoiTool({ models }: { models: TileModel[] }) {
  const { camera, gl, invalidate } = useThree();
  const { collidersRef, version } = useColliders();
  const { poiEnabled, poiPlacing, pois } = useAppContext();
  const raycaster = useRef(new THREE.Raycaster());

  // Refs factices pour occlude — drei raycast uniquement contre les meshes terrain
  const colliderOccludeRefs = useMemo(
    () => collidersRef.current.map(mesh => ({ current: mesh })),
    [collidersRef, version]
  );

  // Identifiants des dalles chargées — inclut le format padded "0696_6278" ET non-padded
  // "696_6278" pour la compatibilité avec les POIs créés avant la migration
  const loadedIds = useMemo(() =>
    models.flatMap(m => {
      const [px, py] = m.coord.split('_');
      return [m.coord, `${parseInt(px)}_${parseInt(py)}`];
    }), [models]);

  // Filtrer : n'afficher que les POIs sur les dalles actuellement chargées
  const visiblePois = useMemo(
    () => pois.filter(poi => {
      // Coordonnées Lambert absolues : le POI est visible si son lx/ly tombe dans l'emprise
      // d'une dalle chargée [m.x, m.x+1) × [m.y, m.y+1) (1 unité = 1 km)
      if (poi.lx != null && poi.ly != null) {
        const inBounds = models.some(m => {
          const mx = m.coordinates.x / 1000; // Lambert93 km
          const my = m.coordinates.y / 1000;
          return poi.lx! >= mx - 0.01 && poi.lx! < mx + 1.01 &&
                 poi.ly! >= my - 0.01 && poi.ly! < my + 1.01;
        });
        if (inBounds) return true;
        // Fallback : si le filtre géométrique échoue (POI en bordure), vérifier via tileIds
      }

      if (!poi.tileIds?.length) return poi.lx == null; // anciens POIs sans info : toujours visibles

      // POI avec une seule dalle : any-match
      if (poi.tileIds.length === 1) {
        return loadedIds.includes(poi.tileIds[0]);
      }

      // POI avec plusieurs dalles : visible si TOUTES ses dalles sont chargées
      return poi.tileIds.every(id => loadedIds.includes(id));
    }),
    [pois, models, loadedIds]
  );

  // Hauteurs calculées pour chaque POI (anti-chevauchement)
  const poiHeights = useMemo(() => computePoiHeights(visiblePois), [visiblePois]);

  // Forcer un rendu WebGL quand les POIs visibles changent (frameloop="demand")
  useEffect(() => { invalidate(); }, [visiblePois, invalidate]);

  // Position du trait pointillé en attente
  const [pendingPosition, setPendingPosition] = useState<THREE.Vector3 | null>(null);

  const raycastTerrain = useCallback((event: MouseEvent): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.current.setFromCamera(mouse, camera);
    const colliders = collidersRef.current;
    if (colliders.length === 0) return null;
    const intersects = raycaster.current.intersectObjects(colliders, false);
    return intersects.length > 0 ? intersects[0].point.clone() : null;
  }, [camera, gl, collidersRef]);

  // Trouve la dalle la plus proche d'un point dans l'espace scène
  const nearestTileId = useCallback((point: THREE.Vector3): string => {
    if (models.length === 0) return "";
    const refX = models[0].coordinates.x / 1000;
    const refY = models[0].coordinates.y / 1000;
    let best = models[0].coord;
    let minDist = Infinity;
    for (const m of models) {
      const sceneX = m.coordinates.x / 1000 - refX;
      const sceneZ = -(m.coordinates.y / 1000 - refY);
      const dx = point.x - sceneX;
      const dz = point.z - sceneZ;
      const dist = dx * dx + dz * dz;
      if (dist < minDist) { minDist = dist; best = m.coord; }
    }
    return best;
  }, [models]);

  // Clic sur le terrain → uniquement en mode placement
  useEffect(() => {
    if (!poiPlacing) return;

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const point = raycastTerrain(event);
      if (point) {
        setPendingPosition(point);
        window.dispatchEvent(new CustomEvent("poi-pending", {
          detail: {
            x: point.x, y: point.y, z: point.z,
            tileId: nearestTileId(point),
            lx: refX + point.x,
            ly: refY - point.z,
          },
        }));
        window.dispatchEvent(new CustomEvent("poi-look-at", {
          detail: { x: point.x, y: point.y + POI_LABEL_HEIGHT * 0.35, z: point.z },
        }));
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [poiPlacing, raycastTerrain, nearestTileId, gl]);

  // Effacer le trait quand le formulaire est confirmé ou annulé
  useEffect(() => {
    const clear = () => setPendingPosition(null);
    window.addEventListener("poi-confirm", clear);
    window.addEventListener("poi-cancel", clear);
    return () => {
      window.removeEventListener("poi-confirm", clear);
      window.removeEventListener("poi-cancel", clear);
    };
  }, []);

  // Origine de la scène pour la session courante (même logique que ModelPositioner)
  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  return (
    <>
      {/* Labels des POIs existants — visibles uniquement quand le mode POI est actif et la dalle correspondante chargée */}
      {poiEnabled && visiblePois.map((poi) => {
        // Recalculer X/Z depuis les coordonnées Lambert absolues (lx/ly) pour corriger
        // le décalage quand la dalle de référence diffère de la session d'origine du POI.
        let x: number, z: number;
        if (poi.lx != null && poi.ly != null) {
          x = poi.lx - refX;
          z = -(poi.ly - refY);
        } else if (poi.tileIds?.length === 1) {
          // Ancien POI sans lx/ly sur un sommet à dalle unique :
          // la dalle du POI ÉTAIT la dalle de référence à la création.
          // On recalcule lx/ly absolus puis on re-projette avec refX/refY courants.
          const [tx, ty] = poi.tileIds[0].split("_").map(Number);
          const lxEst = tx + poi.position.x;
          const lyEst = ty - poi.position.z;
          x = lxEst - refX;
          z = -(lyEst - refY);
        } else {
          x = poi.position.x;
          z = poi.position.z;
        }
        const y = poi.position.y;
        const color = COLOR_BY_TYPE[poi.type as PoiType];
        const h = poiHeights.get(poi.id) ?? POI_LABEL_HEIGHT;
        return (
          <React.Fragment key={poi.id}>
            {/* Ligne drei/Line2 : fiable avec logarithmicDepthBuffer et frameloop="demand" */}
            <Line
              points={[[x, y, z], [x, y + h, z]]}
              color={color}
              lineWidth={1}
            />
            <Html
              position={[x, y + h, z]}
              center
              distanceFactor={4}
              zIndexRange={[10, 0]}
              occlude={colliderOccludeRefs}
            >
              <div
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  color,
                  fontSize: 5.5,
                  fontWeight: 500,
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: "0.03em",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("poi-edit", { detail: poi }));
                }}
              >
                {poi.name}
              </div>
            </Html>
          </React.Fragment>
        );
      })}

      {/* Trait pointillé pour la position en attente */}
      {pendingPosition && (
        <Line
          points={[
            [pendingPosition.x, pendingPosition.y, pendingPosition.z],
            [pendingPosition.x, pendingPosition.y + POI_LABEL_HEIGHT, pendingPosition.z],
          ]}
          color="#94a3b8"
          lineWidth={1}
          dashed
          dashSize={0.015}
          gapSize={0.008}
        />
      )}
    </>
  );
}
