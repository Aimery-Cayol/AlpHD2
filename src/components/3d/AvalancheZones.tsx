"use client";

// =============================================================================
// AvalancheZones — zones de risque avalanche en scène 3D
// =============================================================================
// • Polygones plats projetés sur le terrain (rotation -PI/2 autour de X)
// • Couleur et opacité selon niveau de risque 1 → 5
// • Animation de pulsation pour les risques 4 et 5
// • Tooltip Html au hover (niveau, aspects, altitudes)
// • Événements ponctuels (départs avalanche confirmés) marqués par une sphère
// =============================================================================

import * as THREE from "three";
import React, { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useGeologicalData } from "@/hooks/useGeologicalData";
import { useLayersStore } from "@/store/layers-store";
import type { TileModel } from "@/types/models";
import type { AvalancheZone, AvalancheRisk, AvalancheEvent, GeoPoint } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Palette de couleurs risque (échelle européenne)
// ---------------------------------------------------------------------------

const RISK_COLOR: Record<AvalancheRisk, THREE.Color> = {
  1: new THREE.Color("#22c55e"),
  2: new THREE.Color("#eab308"),
  3: new THREE.Color("#f97316"),
  4: new THREE.Color("#ef4444"),
  5: new THREE.Color("#7f1d1d"),
};

const RISK_LABEL: Record<AvalancheRisk, string> = {
  1: "Faible",
  2: "Limité",
  3: "Marqué",
  4: "Fort",
  5: "Très fort",
};

// ---------------------------------------------------------------------------
// Conversion coordonnées → scène
// ---------------------------------------------------------------------------

function toSceneXZ(lx: number, ly: number, refX: number, refY: number) {
  return { x: lx - refX, z: -(ly - refY) };
}

// ---------------------------------------------------------------------------
// Géométrie d'un polygone avalanche
// THREE.ShapeGeometry est dans le plan XY ; on applique rotation=[-PI/2, 0, 0]
// pour l'aplatir en plan XZ (horizontal dans la scène).
// Mapping : shape.x = lx - refX  →  scene.x ✓
//            shape.y = ly - refY  →  scene.z (après rotation, signe corrigé) ✓
// ---------------------------------------------------------------------------

function buildZoneGeometry(polygon: GeoPoint[], refX: number, refY: number) {
  if (polygon.length < 3) return null;
  const shape = new THREE.Shape();
  const first = toSceneXZ(polygon[0].lx, polygon[0].ly, refX, refY);
  shape.moveTo(first.x, -first.z); // Note : shape.y deviendra -scene.z après rotation
  for (let i = 1; i < polygon.length; i++) {
    const p = toSceneXZ(polygon[i].lx, polygon[i].ly, refX, refY);
    shape.lineTo(p.x, -p.z);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

// ---------------------------------------------------------------------------
// Centroïde d'un polygone (pour positionner le label)
// ---------------------------------------------------------------------------

function centroid(polygon: GeoPoint[], refX: number, refY: number) {
  const n = polygon.length;
  let sx = 0;
  let sz = 0;
  for (const p of polygon) {
    const { x, z } = toSceneXZ(p.lx, p.ly, refX, refY);
    sx += x;
    sz += z;
  }
  const avgAlt = polygon.reduce((s, p) => s + p.altitude, 0) / n;
  return { x: sx / n, y: avgAlt / 1000, z: sz / n };
}

// ---------------------------------------------------------------------------
// Maillage d'une zone
// ---------------------------------------------------------------------------

interface ZoneMeshProps {
  zone: AvalancheZone;
  refX: number;
  refY: number;
  minAltKm: number;
  baseOpacity: number;
  colliderRefs: { current: THREE.Mesh }[];
}

function ZoneMesh({ zone, refX, refY, minAltKm, baseOpacity, colliderRefs }: ZoneMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const geometry = useMemo(
    () => buildZoneGeometry(zone.polygon, refX, refY),
    [zone.polygon, refX, refY]
  );

  const color = RISK_COLOR[zone.risk];
  const isPulsing = zone.risk >= 4;
  const yOffset = minAltKm + 0.005; // 5 m au-dessus du terrain

  // Pulsation pour les zones à fort risque
  useFrame((state) => {
    if (!matRef.current || !isPulsing) return;
    const pulse = 0.55 + 0.35 * Math.abs(Math.sin(state.clock.elapsedTime * 1.8));
    matRef.current.opacity = pulse * baseOpacity;
    state.invalidate();
  });

  const center = useMemo(
    () => centroid(zone.polygon, refX, refY),
    [zone.polygon, refX, refY]
  );

  const handleOver  = useCallback(() => setHovered(true), []);
  const handleOut   = useCallback(() => setHovered(false), []);

  if (!geometry) return null;

  return (
    <group>
      {/* Polygone plat */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[0, yOffset, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <meshBasicMaterial
          ref={matRef}
          color={color}
          transparent
          opacity={isPulsing ? 0.6 * baseOpacity : 0.45 * baseOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* Contour */}
      <lineLoop position={[0, yOffset + 0.001, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                zone.polygon.flatMap((p) => {
                  const { x, z } = toSceneXZ(p.lx, p.ly, refX, refY);
                  return [x, 0, z];
                })
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.9 * baseOpacity} />
      </lineLoop>

      {/* Label Html au hover */}
      {hovered && (
        <Html
          position={[center.x, yOffset + 0.04, center.z]}
          center
          distanceFactor={3.5}
          zIndexRange={[40, 0]}
          occlude={colliderRefs}
        >
          <div
            style={{
              pointerEvents: "none",
              userSelect: "none",
              background: "rgba(15,23,42,0.9)",
              color: "#f1f5f9",
              borderRadius: 9,
              padding: "5px 9px",
              fontSize: 5.5,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              backdropFilter: "blur(4px)",
              border: `1px solid ${color.getStyle()}55`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Niveau */}
            <div style={{ fontWeight: 700, color: color.getStyle() }}>
              Risque {zone.risk} — {RISK_LABEL[zone.risk]}
            </div>
            {/* Nom */}
            {zone.name && <div>{zone.name}</div>}
            {/* Altitudes concernées */}
            <div style={{ color: "#94a3b8", fontSize: 4.5 }}>
              ⛰ {zone.elevationMin}–{zone.elevationMax} m
            </div>
            {/* Aspects */}
            {zone.aspects.length > 0 && (
              <div style={{ color: "#94a3b8", fontSize: 4.5 }}>
                🧭 {zone.aspects.join(" · ")}
              </div>
            )}
            {/* Types */}
            {zone.types.length > 0 && (
              <div style={{ color: "#94a3b8", fontSize: 4.5 }}>
                {zone.types.join(", ")}
              </div>
            )}
            {/* Commentaire */}
            {zone.comment && (
              <div style={{ color: "#64748b", fontSize: 4.5, maxWidth: 120 }}>
                {zone.comment}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Marqueur d'événement ponctuel (départ avalanche confirmé)
// ---------------------------------------------------------------------------

interface AvalancheEventMarkerProps {
  event: AvalancheEvent;
  refX: number;
  refY: number;
  opacity: number;
}

function AvalancheEventMarker({ event, refX, refY, opacity }: AvalancheEventMarkerProps) {
  const { x, z } = toSceneXZ(event.position.lx, event.position.ly, refX, refY);
  const y = event.position.altitude / 1000;
  const color = event.confirmed ? "#ef4444" : "#f97316";

  return (
    <mesh position={[x, y + 0.005, z]}>
      <coneGeometry args={[0.006, 0.018, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

interface AvalancheZonesProps {
  models: TileModel[];
}

export default function AvalancheZones({ models }: AvalancheZonesProps) {
  const { collidersRef, version } = useColliders();
  const { layers, realTimeEnabled } = useLayersStore();
  const layerCfg = layers.geological;

  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  const { avalancheZones, avalancheEvents } = useGeologicalData({
    tileCoords: models.map((m) => m.coord),
    polling: layerCfg.visible,
    realTime: layerCfg.visible && realTimeEnabled,
  });

  // Altitude minimale du terrain
  const minAltKm = useMemo(() => {
    const colliders = collidersRef.current;
    if (!colliders.length) return 0;
    let minY = Infinity;
    for (const mesh of colliders) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox;
      if (box) {
        const world = box.clone().applyMatrix4(mesh.matrixWorld);
        minY = Math.min(minY, world.min.y);
      }
    }
    return isFinite(minY) ? minY : 0;
  }, [collidersRef, version]);

  const colliderOccludeRefs = useMemo(
    () => collidersRef.current.map((m) => ({ current: m })),
    [collidersRef, version]
  );

  if (!layerCfg.visible || models.length === 0) return null;

  return (
    <>
      {/* Zones de risque */}
      {avalancheZones.map((zone) => (
        <ZoneMesh
          key={zone.zoneId}
          zone={zone}
          refX={refX}
          refY={refY}
          minAltKm={minAltKm}
          baseOpacity={layerCfg.opacity}
          colliderRefs={colliderOccludeRefs}
        />
      ))}

      {/* Événements ponctuels (départs confirmés / probables) */}
      {avalancheEvents.map((ev) => (
        <AvalancheEventMarker
          key={ev.eventId}
          event={ev}
          refX={refX}
          refY={refY}
          opacity={layerCfg.opacity}
        />
      ))}
    </>
  );
}
