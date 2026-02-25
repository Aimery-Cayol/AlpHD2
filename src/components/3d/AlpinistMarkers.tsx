"use client";

// =============================================================================
// AlpinistMarkers — positions alpinistes en scène 3D
// =============================================================================
// • Sphère colorée par statut (actif / stationnaire / descente / urgence)
// • Trail GPS (dernières N positions) rendu comme polyligne
// • Popup Html au hover (nom anonymisé, altitude, heure, route)
// • Pulsation sur les urgences
// =============================================================================

import * as THREE from "three";
import React, { useRef, useState, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useAlpinistsData } from "@/hooks/useAlpinistsData";
import { useLayersStore } from "@/store/layers-store";
import type { TileModel } from "@/types/models";
import type { AlpinistMarker, AlpinistStatus } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const MARKER_RADIUS = 0.008;     // km (~8 m)
const TRAIL_MAX_POINTS = 20;
const HOVER_LABEL_HEIGHT = 0.05; // km au-dessus du marqueur

const STATUS_COLOR: Record<AlpinistStatus, string> = {
  active:      "#22c55e",
  stationary:  "#3b82f6",
  descending:  "#f97316",
  emergency:   "#ef4444",
};

const STATUS_LABEL: Record<AlpinistStatus, string> = {
  active:      "En progression",
  stationary:  "À l'arrêt",
  descending:  "Descente",
  emergency:   "🆘 URGENCE",
};

// ---------------------------------------------------------------------------
// Utilitaire
// ---------------------------------------------------------------------------

function toScene(
  lx: number,
  ly: number,
  altM: number,
  refX: number,
  refY: number
): [number, number, number] {
  return [lx - refX, altM / 1000, -(ly - refY)];
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

// ---------------------------------------------------------------------------
// Trail — historique des positions
// Hook interne qui maintient un buffer circulaire des N dernières positions
// ---------------------------------------------------------------------------

function useTrails(alpinists: AlpinistMarker[], refX: number, refY: number) {
  const trailsRef = useRef<Map<string, [number, number, number][]>>(new Map());

  return useMemo(() => {
    const map = trailsRef.current;
    for (const a of alpinists) {
      const pt = toScene(a.position.lx, a.position.ly, a.position.altitude, refX, refY);
      const existing = map.get(a.userId) ?? [];
      const last = existing[existing.length - 1];
      // N'ajouter que si la position a changé (évite les doublons sur polling)
      if (!last || last[0] !== pt[0] || last[2] !== pt[2]) {
        existing.push(pt);
        if (existing.length > TRAIL_MAX_POINTS) existing.shift();
        map.set(a.userId, existing);
      }
    }
    return map;
  }, [alpinists, refX, refY]);
}

// ---------------------------------------------------------------------------
// Marqueur unique
// ---------------------------------------------------------------------------

interface MarkerProps {
  alpinist: AlpinistMarker;
  position: [number, number, number];
  trail: [number, number, number][];
  opacity: number;
  colliderRefs: { current: THREE.Mesh }[];
}

function AlpinistMarker3D({ alpinist, position, trail, opacity, colliderRefs }: MarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isEmergency = alpinist.status === "emergency";
  const color = STATUS_COLOR[alpinist.status];

  // Pulsation d'urgence
  useFrame((state) => {
    if (!meshRef.current || !isEmergency) return;
    const scale = 1 + 0.35 * Math.sin(state.clock.elapsedTime * 5);
    meshRef.current.scale.setScalar(scale);
    state.invalidate();
  });

  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut  = useCallback(() => setHovered(false), []);

  return (
    <group position={position}>
      {/* Trail GPS */}
      {trail.length >= 2 && (
        <Line
          points={trail.map((p) => [p[0] - position[0], p[1] - position[1], p[2] - position[2]] as [number, number, number])}
          color={color}
          lineWidth={1.2}
          transparent
          opacity={0.45 * opacity}
        />
      )}

      {/* Sphère marqueur */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[MARKER_RADIUS, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isEmergency ? 0.9 : 0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Anneau directionnel (cap/heading) */}
      <mesh rotation={[-Math.PI / 2, 0, alpinist.heading * (Math.PI / 180)]}>
        <ringGeometry args={[MARKER_RADIUS * 1.3, MARKER_RADIUS * 1.6, 16, 1, 0, Math.PI]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6 * opacity} />
      </mesh>

      {/* Popup hover */}
      {hovered && (
        <Html
          position={[0, HOVER_LABEL_HEIGHT, 0]}
          center
          distanceFactor={3}
          zIndexRange={[50, 0]}
          occlude={colliderRefs}
        >
          <div
            style={{
              pointerEvents: "none",
              userSelect: "none",
              background: "rgba(15,23,42,0.88)",
              color: "#f1f5f9",
              borderRadius: 9,
              padding: "5px 9px",
              fontSize: 5.5,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
              border: `1px solid ${color}55`,
              backdropFilter: "blur(4px)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ fontWeight: 700, color }}>
              {STATUS_LABEL[alpinist.status]}
            </div>
            <div>👥 Groupe de {alpinist.groupSize}</div>
            <div>⛰ {Math.round(alpinist.position.altitude)} m</div>
            {alpinist.speed > 0 && (
              <div>🚶 {(alpinist.speed * 1000).toFixed(0)} m/h</div>
            )}
            {alpinist.route && (
              <div style={{ color: "#94a3b8", fontSize: 4.5 }}>
                📍 {alpinist.route}
              </div>
            )}
            <div style={{ color: "#64748b", fontSize: 4.5 }}>
              {formatTime(alpinist.timestamp)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

interface AlpinistMarkersProps {
  models: TileModel[];
}

export default function AlpinistMarkers({ models }: AlpinistMarkersProps) {
  const { collidersRef, version } = useColliders();
  const { layers, realTimeEnabled } = useLayersStore();
  const layerCfg = layers.alpinists;

  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  const { alpinists } = useAlpinistsData({
    tileCoords: models.map((m) => m.coord),
    polling: layerCfg.visible,
    realTime: layerCfg.visible && realTimeEnabled,
  });

  const trails = useTrails(alpinists, refX, refY);

  const colliderOccludeRefs = useMemo(
    () => collidersRef.current.map((m) => ({ current: m })),
    [collidersRef, version]
  );

  if (!layerCfg.visible || models.length === 0) return null;

  return (
    <>
      {alpinists.map((a) => {
        const pos = toScene(a.position.lx, a.position.ly, a.position.altitude, refX, refY);
        const trail = trails.get(a.userId) ?? [];
        return (
          <AlpinistMarker3D
            key={a.userId}
            alpinist={a}
            position={pos}
            trail={trail}
            opacity={layerCfg.opacity}
            colliderRefs={colliderOccludeRefs}
          />
        );
      })}
    </>
  );
}
