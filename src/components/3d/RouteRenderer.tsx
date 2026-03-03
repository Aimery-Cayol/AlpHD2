"use client";

// =============================================================================
// RouteRenderer — Affichage 3D de toutes les voies visibles simultanément
// =============================================================================
// Architecture :
//   RouteRenderer          → itère sur visibleRoutes du store
//     SingleRouteRenderer  → gère UNE voie (son propre useRouteGeo + géométrie)
//
// Pour chaque voie :
//   1. Fetch GPS C2C via useRouteGeo (fallback sur route.track hardcodé)
//   2. Conversion WGS84 → scène Lambert-93 km
//   3. Raycast vers le bas pour coller le tracé au terrain (snap)
//   4. TubeGeometry (compatible logarithmicDepthBuffer)
//   5. Sphères départ (vert) / arrivée (rouge)
//   6. Label Html au point médian
// =============================================================================

import { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useRouteStore } from "@/store/route-store";
import { useRouteGeo } from "@/hooks/useRouteGeo";
import { useColliders } from "@/contexts/ColliderContext";
import { wgs84ToLambert93Km } from "@/utils/coordinateUtils";
import { gradeToColor } from "@/data/climbingRoutes";
import type { TileModel } from "@/types/models";
import type { ClimbingRoute, RoutePoint } from "@/types/routes";

interface RouteRendererProps {
  models: TileModel[];
}

/** Offset vertical (km) au-dessus de la surface du terrain */
const VERTICAL_OFFSET_KM = 0.003; // 3 m
/** Rayon du tube (km) */
const TUBE_RADIUS_KM = 0.012; // 12 m
/** Rayon des sphères de départ / arrivée */
const SPHERE_RADIUS_KM = 0.025; // 25 m

/** Raycaster réutilisé (allocation unique partagée entre toutes les voies) */
const _raycaster = new THREE.Raycaster();
const _rayOrigin = new THREE.Vector3();
const _rayDown = new THREE.Vector3(0, -1, 0);

/**
 * Snap d'un point (sx, sz) sur le terrain via raycast vertical.
 * Retourne Y + offset ou null si hors des dalles chargées.
 */
function snapToTerrain(
  sx: number,
  sz: number,
  colliders: THREE.Mesh[]
): number | null {
  if (colliders.length === 0) return null;
  _rayOrigin.set(sx, 20, sz);
  _raycaster.set(_rayOrigin, _rayDown);
  _raycaster.far = 30;
  const hits = _raycaster.intersectObjects(colliders, false);
  if (hits.length === 0) return null;
  return hits[0].point.y + VERTICAL_OFFSET_KM;
}

// =============================================================================
// SingleRouteRenderer — UN composant par voie visible
// Chaque instance gère son propre fetch GPS et sa propre géométrie THREE.
// =============================================================================

interface SingleRouteRendererProps {
  route: ClimbingRoute;
  refX: number;
  refY: number;
}

function SingleRouteRenderer({ route, refX, refY }: SingleRouteRendererProps) {
  const { invalidate } = useThree();
  const { collidersRef, version } = useColliders();
  const { gpsPoints, loading } = useRouteGeo(route.c2cId);

  // Force re-render frameloop="demand" à chaque changement de terrain ou GPS
  useEffect(() => {
    invalidate();
  }, [version, loading, invalidate]);

  // Garde une ref de la dernière TubeGeometry pour dispose()
  const prevTubeRef = useRef<THREE.TubeGeometry | null>(null);

  const { tube, color, startPt, endPt, midPoint } = useMemo(() => {
    const empty = {
      tube: null,
      color: "#ffffff",
      startPt: null,
      endPt: null,
      midPoint: null,
    };

    // Source : GPS C2C si disponible, sinon tracé hardcodé
    const rawPoints: RoutePoint[] = gpsPoints ?? route.track;
    if (rawPoints.length < 2) return empty;

    const col = route.color ?? gradeToColor(route.grade);
    const colliders = collidersRef.current;

    // Conversion WGS84 → coordonnées scène + snap terrain
    const scenePoints: THREE.Vector3[] = [];
    for (const p of rawPoints) {
      const { lx, ly } = wgs84ToLambert93Km(p.lon, p.lat);
      const sx = lx - refX;
      const sz = -(ly - refY);
      const terrainY = snapToTerrain(sx, sz, colliders);
      if (terrainY === null) continue; // point hors terrain chargé → ignoré
      scenePoints.push(new THREE.Vector3(sx, terrainY, sz));
    }

    if (scenePoints.length < 2) return { ...empty, color: col };

    // Dispose géométrie précédente avant d'en créer une nouvelle
    if (prevTubeRef.current) {
      prevTubeRef.current.dispose();
    }

    const segments = Math.max(scenePoints.length * 4, 32);
    const curve = new THREE.CatmullRomCurve3(
      scenePoints,
      false,
      "catmullrom",
      0.5
    );
    const tubeGeo = new THREE.TubeGeometry(
      curve,
      segments,
      TUBE_RADIUS_KM,
      6,
      false
    );
    prevTubeRef.current = tubeGeo;

    const mid = scenePoints[Math.floor(scenePoints.length / 2)];
    const firstPt = scenePoints[0];
    const lastPt = scenePoints[scenePoints.length - 1];

    // Sphères légèrement au-dessus du tube pour visibilité
    const sphereOffset = VERTICAL_OFFSET_KM * 3;
    return {
      tube: tubeGeo,
      color: col,
      startPt: new THREE.Vector3(
        firstPt.x,
        firstPt.y + sphereOffset,
        firstPt.z
      ),
      endPt: new THREE.Vector3(lastPt.x, lastPt.y + sphereOffset, lastPt.z),
      midPoint: mid,
    };
  }, [route, gpsPoints, refX, refY, collidersRef, version]); // eslint-disable-line react-hooks/exhaustive-deps

  // Libère la géométrie THREE au démontage
  useEffect(() => {
    return () => {
      if (prevTubeRef.current) {
        prevTubeRef.current.dispose();
        prevTubeRef.current = null;
      }
    };
  }, []);

  if (!tube) return null;

  const activityLabel =
    route.activity === "alpinisme"
      ? "Alpinisme"
      : route.activity === "escalade"
      ? "Escalade"
      : "Ski";

  return (
    <group>
      {/* Tracé de la voie — tube */}
      <mesh geometry={tube}>
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Marqueur départ — sphère verte */}
      {startPt && (
        <mesh position={startPt}>
          <sphereGeometry args={[SPHERE_RADIUS_KM, 8, 8]} />
          <meshBasicMaterial color="#22c55e" depthWrite={false} />
        </mesh>
      )}

      {/* Marqueur arrivée — sphère rouge */}
      {endPt && (
        <mesh position={endPt}>
          <sphereGeometry args={[SPHERE_RADIUS_KM, 8, 8]} />
          <meshBasicMaterial color="#ef4444" depthWrite={false} />
        </mesh>
      )}

      {/* Label au point médian */}
      {midPoint && (
        <Html
          position={midPoint}
          center
          zIndexRange={[200, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              border: `1.5px solid ${color}`,
              borderRadius: "10px",
              padding: "5px 9px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "2px",
              minWidth: "110px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  background: color,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  letterSpacing: "0.04em",
                }}
              >
                {route.grade}
              </span>
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {activityLabel}
              </span>
            </div>
            <span
              style={{
                color: "#f1f5f9",
                fontSize: "10px",
                fontWeight: 600,
                lineHeight: 1.2,
                maxWidth: "140px",
              }}
            >
              {route.name}
            </span>
            {route.gradeText && (
              <span
                style={{
                  color: "#64748b",
                  fontSize: "8px",
                  lineHeight: 1.2,
                  maxWidth: "140px",
                }}
              >
                {route.gradeText}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// =============================================================================
// RouteRenderer — composant racine injecté dans SceneContent
// =============================================================================

export default function RouteRenderer({ models }: RouteRendererProps) {
  const { visibleRoutes } = useRouteStore();

  // Référence de scène (coin SW de la dalle la plus ancienne)
  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  if (visibleRoutes.length === 0) return null;

  return (
    <>
      {visibleRoutes.map((route) => (
        <SingleRouteRenderer
          key={route.id}
          route={route}
          refX={refX}
          refY={refY}
        />
      ))}
    </>
  );
}
