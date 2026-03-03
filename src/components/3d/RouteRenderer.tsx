"use client";

// =============================================================================
// RouteRenderer — Affichage 3D du tracé de la voie active
// =============================================================================
// 1. Lit activeRoute depuis useRouteStore
// 2. Si la voie a un c2cId, récupère le tracé GPS réel via useRouteGeo
//    (sinon utilise le tracé hardcodé route.track)
// 3. Convertit chaque point WGS84 → coordonnées scène Lambert-93 km
// 4. Pour chaque point, raycast vers le bas pour coller le tracé au terrain DEM
//    (les points hors dalles chargées n'intersectent rien → filtrés)
// 5. Rendu : TubeGeometry (compatible logarithmicDepthBuffer) + label Html
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
import type { RoutePoint } from "@/types/routes";

interface RouteRendererProps {
  models: TileModel[];
}

/** Offset vertical (km) au-dessus de la surface du terrain */
const VERTICAL_OFFSET_KM = 0.003; // 3m
/** Rayon du tube */
const TUBE_RADIUS_KM = 0.012; // 12m

/** Raycaster réutilisé (allocation unique) */
const _raycaster = new THREE.Raycaster();
const _rayOrigin = new THREE.Vector3();
const _rayDown = new THREE.Vector3(0, -1, 0);

/**
 * Lance un rayon vers le bas depuis (sx, 20km, sz) sur les meshes du terrain.
 * Retourne Y d'intersection + offset, ou null si hors terrain chargé.
 */
function snapToTerrain(sx: number, sz: number, colliders: THREE.Mesh[]): number | null {
  if (colliders.length === 0) return null;
  _rayOrigin.set(sx, 20, sz);
  _raycaster.set(_rayOrigin, _rayDown);
  _raycaster.far = 30;
  const hits = _raycaster.intersectObjects(colliders, false);
  if (hits.length === 0) return null;
  return hits[0].point.y + VERTICAL_OFFSET_KM;
}

export default function RouteRenderer({ models }: RouteRendererProps) {
  const { activeRoute } = useRouteStore();
  const { invalidate } = useThree();
  const { collidersRef, version } = useColliders();

  // Référence scène — même logique que AlpinistMarkers / WebcamMarkers
  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  // Tracé GPS précis depuis C2C (null si voie sans c2cId ou sans geom_detail)
  const { gpsPoints, loading } = useRouteGeo(activeRoute?.c2cId);

  // Force un re-render en mode frameloop="demand"
  useEffect(() => {
    invalidate();
  }, [activeRoute, version, loading, invalidate]);

  // Garde une ref de la géométrie pour dispose()
  const prevTubeRef = useRef<THREE.TubeGeometry | null>(null);

  const { tube, color, midPoint } = useMemo(() => {
    if (!activeRoute) {
      return { tube: null, color: "#ffffff", midPoint: null };
    }

    // Source de points : GPS C2C (précis) ou tracé hardcodé (fallback)
    const rawPoints: RoutePoint[] = gpsPoints ?? activeRoute.track;
    if (rawPoints.length < 2) {
      return { tube: null, color: "#ffffff", midPoint: null };
    }

    const col = activeRoute.color ?? gradeToColor(activeRoute.grade);
    const colliders = collidersRef.current;

    // Conversion WGS84 → scène + snap terrain
    const scenePoints: THREE.Vector3[] = [];
    for (const p of rawPoints) {
      const { lx, ly } = wgs84ToLambert93Km(p.lon, p.lat);
      const sx = lx - refX;
      const sz = -(ly - refY);
      const terrainY = snapToTerrain(sx, sz, colliders);
      if (terrainY === null) continue; // hors terrain chargé → ignoré
      scenePoints.push(new THREE.Vector3(sx, terrainY, sz));
    }

    if (scenePoints.length < 2) {
      return { tube: null, color: col, midPoint: null };
    }

    // Dispose géométrie précédente
    if (prevTubeRef.current) {
      prevTubeRef.current.dispose();
    }

    const segments = Math.max(scenePoints.length * 4, 32);
    const curve = new THREE.CatmullRomCurve3(scenePoints, false, "catmullrom", 0.5);
    const tubeGeo = new THREE.TubeGeometry(curve, segments, TUBE_RADIUS_KM, 6, false);
    prevTubeRef.current = tubeGeo;

    const mid = scenePoints[Math.floor(scenePoints.length / 2)];
    return { tube: tubeGeo, color: col, midPoint: mid };
  }, [activeRoute, gpsPoints, refX, refY, collidersRef, version]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeRoute || !tube) return null;

  const activityLabel =
    activeRoute.activity === "alpinisme" ? "Alpinisme"
    : activeRoute.activity === "escalade" ? "Escalade"
    : "Ski";

  return (
    <group>
      {/* Tracé de la voie — tube pour compatibilité logarithmicDepthBuffer */}
      <mesh geometry={tube}>
        <meshBasicMaterial color={color} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

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
                {activeRoute.grade}
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
              {activeRoute.name}
            </span>
            {activeRoute.gradeText && (
              <span
                style={{
                  color: "#64748b",
                  fontSize: "8px",
                  lineHeight: 1.2,
                  maxWidth: "140px",
                }}
              >
                {activeRoute.gradeText}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
