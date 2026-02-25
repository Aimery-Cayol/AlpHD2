"use client";

// =============================================================================
// WeatherOverlay — météo temps réel en scène 3D
// =============================================================================
// • Label Html par station (température, vent, icône conditions)
// • Particules de neige THREE.Points animées si chute > 0
// • Brouillard THREE.Fog si visibilité < 3 km
// • Couleur du ciel adaptée aux conditions nuageuses
// =============================================================================

import * as THREE from "three";
import React, { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useLayersStore } from "@/store/layers-store";
import type { TileModel } from "@/types/models";
import type { WeatherStation } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const SNOW_COUNT = 1_500;
const SNOW_AREA_KM = 2.5;   // rayon de la zone de neige autour de l'origine
const SNOW_MAX_Y_KM = 1.2;   // hauteur max des flocons (km)
const SNOW_FALL_SPEED = 0.00012; // km/frame (~12 cm/s)

// ---------------------------------------------------------------------------
// Utilitaires coordonnées
// ---------------------------------------------------------------------------

function toSceneXZ(
  lx: number,
  ly: number,
  refX: number,
  refY: number
): [number, number] {
  return [lx - refX, -(ly - refY)];
}

// ---------------------------------------------------------------------------
// Composant particules neige
// ---------------------------------------------------------------------------

interface SnowParticlesProps {
  intensity: number; // 0-1
  minAltitudeKm: number;
}

function SnowParticles({ intensity, minAltitudeKm }: SnowParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * SNOW_AREA_KM * 2;
      arr[i * 3 + 1] = minAltitudeKm + Math.random() * SNOW_MAX_Y_KM;
      arr[i * 3 + 2] = (Math.random() - 0.5) * SNOW_AREA_KM * 2;
    }
    return arr;
  }, [minAltitudeKm]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const speed = SNOW_FALL_SPEED * intensity;
    for (let i = 0; i < SNOW_COUNT; i++) {
      arr[i * 3 + 1] -= speed;
      // Légère dérive horizontale (vent)
      arr[i * 3]     += (Math.random() - 0.5) * 0.00003;
      // Réinitialiser en haut quand le flocon touche le sol
      if (arr[i * 3 + 1] < minAltitudeKm) {
        arr[i * 3]     = (Math.random() - 0.5) * SNOW_AREA_KM * 2;
        arr[i * 3 + 1] = minAltitudeKm + SNOW_MAX_Y_KM;
        arr[i * 3 + 2] = (Math.random() - 0.5) * SNOW_AREA_KM * 2;
      }
    }
    pos.needsUpdate = true;
    state.invalidate(); // maintient le frameloop en mode "demand"
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.003}
        color="#dbeafe"
        transparent
        opacity={0.7 * intensity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// Label Html d'une station météo
// ---------------------------------------------------------------------------

interface StationLabelProps {
  station: WeatherStation;
  sceneX: number;
  sceneY: number;
  sceneZ: number;
  opacity: number;
  colliderRefs: { current: THREE.Mesh }[];
}

const CONDITION_ICON: Record<string, string> = {
  clear: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  fog: "🌫️",
  rain: "🌧️",
  snow: "❄️",
  thunderstorm: "⛈️",
  default: "🌡️",
};

function StationLabel({
  station,
  sceneX,
  sceneY,
  sceneZ,
  opacity,
  colliderRefs,
}: StationLabelProps) {
  const icon =
    CONDITION_ICON[station.visibility < 1 ? "fog" : "default"] ??
    CONDITION_ICON.default;

  const windColor =
    station.windSpeed > 80
      ? "#ef4444"
      : station.windSpeed > 50
      ? "#f97316"
      : "#94a3b8";

  return (
    <Html
      position={[sceneX, sceneY + 0.18, sceneZ]}
      center
      distanceFactor={3.5}
      zIndexRange={[20, 0]}
      occlude={colliderRefs}
    >
      <div
        style={{
          pointerEvents: "none",
          userSelect: "none",
          background: "rgba(15,23,42,0.82)",
          color: "#f1f5f9",
          borderRadius: 10,
          padding: "5px 9px",
          fontSize: 5.5,
          fontFamily: "system-ui, sans-serif",
          whiteSpace: "nowrap",
          opacity,
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          minWidth: 70,
        }}
      >
        {/* Nom + icône */}
        <div style={{ fontWeight: 600, fontSize: 5, color: "#cbd5e1", marginBottom: 1 }}>
          {icon} {station.name}
        </div>
        {/* Température */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>🌡 {station.temperature > 0 ? "+" : ""}{Math.round(station.temperature)}°C</span>
          <span style={{ color: "#94a3b8", fontSize: 4.5 }}>
            ressenti {Math.round(station.temperatureFeelsLike)}°
          </span>
        </div>
        {/* Vent */}
        <div style={{ color: windColor }}>
          💨 {Math.round(station.windSpeed)} km/h {station.windDirection}
          {station.windGust > station.windSpeed + 10 && (
            <span style={{ color: "#f97316", marginLeft: 3 }}>
              (rafales {Math.round(station.windGust)})
            </span>
          )}
        </div>
        {/* Précipitations / neige */}
        {station.snowfall > 0 && (
          <div style={{ color: "#bfdbfe" }}>
            ❄ {station.snowfall.toFixed(1)} cm/h
          </div>
        )}
        {station.snowfall === 0 && station.precipitation > 0 && (
          <div style={{ color: "#7dd3fc" }}>
            🌧 {station.precipitation.toFixed(1)} mm/h
          </div>
        )}
        {/* Visibilité si faible */}
        {station.visibility < 5 && (
          <div style={{ color: "#94a3b8", fontSize: 4.5 }}>
            👁 {station.visibility < 1
              ? `${Math.round(station.visibility * 1000)} m`
              : `${station.visibility.toFixed(1)} km`}
          </div>
        )}
      </div>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

interface WeatherOverlayProps {
  models: TileModel[];
}

export default function WeatherOverlay({ models }: WeatherOverlayProps) {
  const { scene } = useThree();
  const { collidersRef, version } = useColliders();
  const { layers } = useLayersStore();
  const layerCfg = layers.weather;

  const { stations, weather } = useWeatherData({
    tileCoords: models.map((m) => m.coord),
    polling: layerCfg.visible,
    realTime: useLayersStore.getState().realTimeEnabled,
  });

  // Référence scène (même logique que ModelPositioner / PoiTool)
  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  // Altitude minimale du terrain pour les particules
  const minAltitudeKm = useMemo(() => {
    const colliders = collidersRef.current;
    if (colliders.length === 0) return 0;
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

  // Refs pour l'occluding der étiquettes
  const colliderOccludeRefs = useMemo(
    () => collidersRef.current.map((m) => ({ current: m })),
    [collidersRef, version]
  );

  // --- Brouillard si visibilité très basse ---
  const avgVisibility = useMemo(() => {
    if (!stations.length) return Infinity;
    return stations.reduce((s, st) => s + st.visibility, 0) / stations.length;
  }, [stations]);

  useEffect(() => {
    if (!layerCfg.visible) return;
    if (avgVisibility < 3) {
      const dist = Math.max(0.3, avgVisibility);
      scene.fog = new THREE.Fog(0xb0b8c8, dist * 0.3, dist);
    } else {
      scene.fog = null;
    }
    return () => {
      scene.fog = null;
    };
  }, [avgVisibility, layerCfg.visible, scene]);

  // --- Chute de neige globale ---
  const totalSnowfall = useMemo(
    () => stations.reduce((s, st) => s + st.snowfall, 0),
    [stations]
  );
  const isSnowing = layerCfg.visible && totalSnowfall > 0;
  const snowIntensity = isSnowing ? Math.min(1, totalSnowfall / 5) : 0; // 0-1

  if (!layerCfg.visible || models.length === 0 || !weather) {
    return null;
  }

  return (
    <>
      {/* Particules de neige */}
      {isSnowing && (
        <SnowParticles intensity={snowIntensity} minAltitudeKm={minAltitudeKm} />
      )}

      {/* Labels des stations (max 5 pour ne pas surcharger la scène) */}
      {stations.slice(0, 5).map((st) => {
        const [sx, sz] = toSceneXZ(st.position.lx, st.position.ly, refX, refY);
        const sy = st.position.altitude / 1000;
        return (
          <StationLabel
            key={st.stationId}
            station={st}
            sceneX={sx}
            sceneY={sy}
            sceneZ={sz}
            opacity={layerCfg.opacity}
            colliderRefs={colliderOccludeRefs}
          />
        );
      })}
    </>
  );
}
