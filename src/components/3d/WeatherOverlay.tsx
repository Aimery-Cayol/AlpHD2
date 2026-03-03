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

// Conversion direction string → degrés météo (d'où vient le vent)
const WIND_DIR_DEG: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const SNOW_COUNT = 1_500;
const SNOW_AREA_KM = 2.5;   // rayon de la zone de neige autour de l'origine
const SNOW_MAX_Y_KM = 1.2;   // hauteur max des flocons (km)
const SNOW_FALL_SPEED = 0.00012; // km/frame (~12 cm/s)

const WIND_PARTICLE_COUNT = 2_000;

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
// Flèche de vent 3D
// ---------------------------------------------------------------------------

/**
 * En météo : windDirection = d'où vient le vent (N = vient du nord → va vers le sud).
 * En scène : Z+ = sud, X+ = est.
 * La flèche pointe dans la direction où le vent SE DIRIGE.
 */
const WIND_DIR_ANGLE: Record<string, number> = {
  N:  Math.PI,         // va vers S (+Z) → angle π dans XZ
  NE: Math.PI * 5 / 4,
  E:  Math.PI * 3 / 2, // va vers W (-X)
  SE: Math.PI * 7 / 4,
  S:  0,               // va vers N (-Z)
  SW: Math.PI / 4,
  W:  Math.PI / 2,     // va vers E (+X)
  NW: Math.PI * 3 / 4,
};

interface WindArrowProps {
  windDirection: string;
  windSpeed: number;   // km/h
  x: number;
  y: number;
  z: number;
  opacity: number;
}

function WindArrow({ windDirection, windSpeed, x, y, z, opacity }: WindArrowProps) {
  const angle = WIND_DIR_ANGLE[windDirection] ?? 0;
  const windColor =
    windSpeed > 80 ? "#ef4444"
    : windSpeed > 50 ? "#f97316"
    : windSpeed > 25 ? "#eab308"
    : "#22c55e";

  // Longueur proportionnelle à la vitesse (20 m → 120 m)
  const arrowLen = Math.max(0.02, Math.min(0.12, windSpeed / 800));
  const shaftLen = arrowLen * 0.65;
  const headLen  = arrowLen * 0.35;

  // rotation=[PI/2, angle, 0] : couche le cylindre (X), puis l'oriente dans XZ (Y)
  const rot: [number, number, number] = [Math.PI / 2, angle, 0];

  return (
    <group position={[x, y + 0.06, z]} rotation={rot}>
      <mesh position={[0, shaftLen / 2, 0]}>
        <cylinderGeometry args={[0.0008, 0.0008, shaftLen, 6]} />
        <meshBasicMaterial color={windColor} transparent opacity={0.85 * opacity} />
      </mesh>
      <mesh position={[0, shaftLen + headLen / 2, 0]}>
        <coneGeometry args={[0.0025, headLen, 8]} />
        <meshBasicMaterial color={windColor} transparent opacity={opacity} />
      </mesh>
    </group>
  );
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
// Particules de vent — style earth.nullschool.net
// ---------------------------------------------------------------------------
// Chaque particule se déplace dans la direction dominante du vent et s'estompe
// progressivement (fade in/out par cycle de vie). THREE.AdditiveBlending donne
// l'effet lumineux caractéristique.
// ---------------------------------------------------------------------------

interface WindParticlesProps {
  stations: WeatherStation[];
  minAltitudeKm: number;
  opacity: number;
  fieldHalfKm: number; // demi-largeur du champ de particules (km)
}

function WindParticles({ stations, minAltitudeKm, opacity, fieldHalfKm }: WindParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  // Données de cycle de vie : [curLife, maxLife, speedMult] par particule
  const lifeRef  = useRef<Float32Array | null>(null);
  // Direction/vitesse du vent mis à jour sans recréer la géométrie
  const windRef  = useRef({ angle: 0, speed: 20 });
  const windColorRef = useRef(new THREE.Color(0.38, 0.65, 1));

  // Met à jour la direction du vent dominant quand les stations changent
  useEffect(() => {
    if (!stations.length) return;
    let sumSin = 0, sumCos = 0, sumSpeed = 0;
    for (const st of stations) {
      const deg = WIND_DIR_DEG[st.windDirection] ?? 0;
      const rad = (deg * Math.PI) / 180;
      sumSin   += Math.sin(rad + Math.PI);
      sumCos   += Math.cos(rad + Math.PI);
      sumSpeed += st.windSpeed;
    }
    const n = stations.length;
    windRef.current = {
      angle: Math.atan2(sumSin / n, sumCos / n),
      speed: sumSpeed / n,
    };
    const spd = windRef.current.speed;
    windColorRef.current.set(
      spd > 80 ? "#ef4444" :
      spd > 50 ? "#f97316" :
      spd > 25 ? "#eab308" :
      "#60a5fa"
    );
  }, [stations]);

  // Géométrie — ne se recrée que si les bornes du terrain changent
  const { positions, colors } = useMemo(() => {
    const pos  = new Float32Array(WIND_PARTICLE_COUNT * 3);
    const col  = new Float32Array(WIND_PARTICLE_COUNT * 3);
    const life = new Float32Array(WIND_PARTICLE_COUNT * 3);
    for (let i = 0; i < WIND_PARTICLE_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * fieldHalfKm * 2;
      pos[i * 3 + 1] = minAltitudeKm + 0.05 + Math.random() * 0.45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * fieldHalfKm * 2;
      col[i * 3] = 0.38; col[i * 3 + 1] = 0.65; col[i * 3 + 2] = 1.0;
      life[i * 3]     = Math.random() * 120;          // démarrage échelonné
      life[i * 3 + 1] = 80 + Math.random() * 80;     // durée de vie (80–160 frames)
      life[i * 3 + 2] = 0.6 + Math.random() * 0.8;   // multiplicateur de vitesse
    }
    lifeRef.current = life;
    return { positions: pos, colors: col };
  }, [fieldHalfKm, minAltitudeKm]);

  useFrame((state) => {
    if (!pointsRef.current || !lifeRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = pointsRef.current.geometry.attributes.color   as THREE.BufferAttribute;
    const pos  = posAttr.array as Float32Array;
    const col  = colAttr.array as Float32Array;
    const life = lifeRef.current;

    const { angle, speed } = windRef.current;
    const c = windColorRef.current;
    // km / frame — à 30 km/h traverse ~2 km en ~5 s à 60 fps
    const frameSpeed = Math.max(5, speed) * 0.000222;
    const dx = Math.sin(angle)  * frameSpeed;
    const dz = -Math.cos(angle) * frameSpeed;

    for (let i = 0; i < WIND_PARTICLE_COUNT; i++) {
      const curLife = life[i * 3];
      const maxLife = life[i * 3 + 1];
      const sMult   = life[i * 3 + 2];

      // Courbe de luminosité : rampe 0→25%, pleine 25→75%, déclin 75→100%
      const t  = curLife / maxLife;
      const br = t < 0.25 ? t / 0.25 : t > 0.75 ? (1 - t) / 0.25 : 1.0;
      col[i * 3]     = c.r * br * opacity;
      col[i * 3 + 1] = c.g * br * opacity;
      col[i * 3 + 2] = c.b * br * opacity;

      // Déplacement dans la direction du vent
      pos[i * 3]     += dx * sMult;
      pos[i * 3 + 2] += dz * sMult;
      life[i * 3]    += 1;

      // Réinitialisation : cycle expiré ou hors du champ
      if (curLife >= maxLife ||
          pos[i * 3]     >  fieldHalfKm || pos[i * 3]     < -fieldHalfKm ||
          pos[i * 3 + 2] >  fieldHalfKm || pos[i * 3 + 2] < -fieldHalfKm) {
        pos[i * 3]     = (Math.random() - 0.5) * fieldHalfKm * 2;
        pos[i * 3 + 1] = minAltitudeKm + 0.05 + Math.random() * 0.45;
        pos[i * 3 + 2] = (Math.random() - 0.5) * fieldHalfKm * 2;
        life[i * 3]     = 0;
        life[i * 3 + 1] = 80 + Math.random() * 80;
        life[i * 3 + 2] = 0.6 + Math.random() * 0.8;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    state.invalidate();
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]}    />
      </bufferGeometry>
      <pointsMaterial
        size={0.004}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
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
// Vents dominants — grande flèche composite + label HTML
// ---------------------------------------------------------------------------

interface DominantWindProps {
  stations: WeatherStation[];
  refX: number;
  refY: number;
  opacity: number;
}

function DominantWindDisplay({ stations, refX, refY, opacity }: DominantWindProps) {
  // Moyenne vectorielle des directions de vent (méthode météo standard)
  const { dominantDir, avgSpeed, centerX, centerY, centerZ } = useMemo(() => {
    let sumX = 0, sumZ = 0, sumSpeed = 0;
    let sumLx = 0, sumLy = 0, sumAlt = 0;

    for (const st of stations) {
      const deg = WIND_DIR_DEG[st.windDirection] ?? 0;
      const rad = (deg * Math.PI) / 180;
      // Le vecteur pointe là OÙ va le vent (opposé de d'où il vient)
      sumX    += Math.sin(rad + Math.PI);
      sumZ    += Math.cos(rad + Math.PI);
      sumSpeed += st.windSpeed;
      sumLx   += st.position.lx;
      sumLy   += st.position.ly;
      sumAlt  += st.position.altitude;
    }

    const n = stations.length;
    const avgVx = sumX / n;
    const avgVz = sumZ / n;
    const avgSpeed = sumSpeed / n;

    // Angle dans le plan XZ (scène)
    const angle = Math.atan2(avgVx, avgVz);
    const dirDeg = ((angle * 180) / Math.PI + 360) % 360;
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
    const dominantDir = dirs[Math.round(dirDeg / 45) % 8];

    // Centre de la scène calculé depuis les positions des stations
    const cx = sumLx / n - refX;
    const cy = sumAlt / n / 1000 + 0.35; // 350 m au-dessus du centre
    const cz = -(sumLy / n - refY);

    return { dominantDir, avgSpeed, centerX: cx, centerY: cy, centerZ: cz };
  }, [stations, refX, refY]);

  const angle = WIND_DIR_ANGLE[dominantDir] ?? 0;
  const rot: [number, number, number] = [Math.PI / 2, angle, 0];

  const windColor =
    avgSpeed > 80 ? "#ef4444"
    : avgSpeed > 50 ? "#f97316"
    : avgSpeed > 25 ? "#eab308"
    : "#22c55e";

  // Flèche 5× plus grande que les flèches météo par station
  const arrowLen = Math.max(0.18, Math.min(0.45, avgSpeed / 180));
  const shaftLen = arrowLen * 0.65;
  const headLen  = arrowLen * 0.35;

  return (
    <>
      {/* Grande flèche 3D du vent dominant */}
      <group position={[centerX, centerY, centerZ]} rotation={rot}>
        <mesh position={[0, shaftLen / 2, 0]}>
          <cylinderGeometry args={[0.004, 0.004, shaftLen, 8]} />
          <meshBasicMaterial color={windColor} transparent opacity={0.9 * opacity} />
        </mesh>
        <mesh position={[0, shaftLen + headLen / 2, 0]}>
          <coneGeometry args={[0.014, headLen, 8]} />
          <meshBasicMaterial color={windColor} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Label HTML flottant */}
      <Html
        position={[centerX, centerY + arrowLen + 0.06, centerZ]}
        center
        distanceFactor={3.5}
        zIndexRange={[30, 0]}
      >
        <div
          style={{
            background: "rgba(15,23,42,0.88)",
            border: `1.5px solid ${windColor}`,
            borderRadius: 10,
            padding: "5px 10px",
            fontSize: 11,
            color: "#f1f5f9",
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <span style={{ fontSize: 14 }}>💨</span>
          <span style={{ fontWeight: 700, color: windColor }}>{dominantDir}</span>
          <span style={{ color: "#94a3b8" }}>·</span>
          <span>{Math.round(avgSpeed)} km/h</span>
          {avgSpeed > 80 && (
            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 9 }}>FORT</span>
          )}
        </div>
      </Html>
    </>
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
  const windsCfg = layers.winds;

  // Fetch dès que weather OU winds est actif (SWR déduplique si les deux le sont)
  const shouldFetch = layerCfg.visible || windsCfg.visible;

  const { stations, weather } = useWeatherData({
    tileCoords: models.map((m) => m.coord),
    polling: shouldFetch,
    realTime: useLayersStore.getState().realTimeEnabled,
  });

  // Référence scène (même logique que ModelPositioner / PoiTool)
  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  // Taille du champ de particules proportionnelle au nombre de dalles chargées
  const fieldHalfKm = useMemo(
    () => Math.max(1.0, Math.sqrt(models.length) * 0.7),
    [models.length]
  );

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
    if (!layerCfg.visible) return; // brouillard uniquement si météo active
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

  if (!shouldFetch || models.length === 0 || !weather) {
    return null;
  }

  return (
    <>
      {/* Particules de neige — layer météo uniquement */}
      {isSnowing && layerCfg.visible && (
        <SnowParticles intensity={snowIntensity} minAltitudeKm={minAltitudeKm} />
      )}

      {/* Labels des stations + petites flèches de vent — layer météo */}
      {layerCfg.visible && stations.slice(0, 5).map((st) => {
        const [sx, sz] = toSceneXZ(st.position.lx, st.position.ly, refX, refY);
        const sy = st.position.altitude / 1000;
        return (
          <React.Fragment key={st.stationId}>
            <StationLabel
              station={st}
              sceneX={sx}
              sceneY={sy}
              sceneZ={sz}
              opacity={layerCfg.opacity}
              colliderRefs={colliderOccludeRefs}
            />
            <WindArrow
              windDirection={st.windDirection}
              windSpeed={st.windSpeed}
              x={sx}
              y={sy}
              z={sz}
              opacity={layerCfg.opacity}
            />
          </React.Fragment>
        );
      })}

      {/* Particules de vent animées + grande flèche — layer winds */}
      {windsCfg.visible && stations.length > 0 && (
        <>
          <WindParticles
            stations={stations}
            minAltitudeKm={minAltitudeKm}
            opacity={windsCfg.opacity}
            fieldHalfKm={fieldHalfKm}
          />
          <DominantWindDisplay
            stations={stations}
            refX={refX}
            refY={refY}
            opacity={windsCfg.opacity}
          />
        </>
      )}
    </>
  );
}
