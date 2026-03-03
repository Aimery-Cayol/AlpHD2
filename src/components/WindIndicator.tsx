"use client";

// =============================================================================
// WindIndicator — jauge DOM des vents dominants (overlay sur la scène 3D)
// =============================================================================
// Lit les données météo depuis le DataStore et calcule la direction dominante
// par moyenne vectorielle. S'affiche en overlay fixe quand la couche "winds"
// est activée, indépendamment de l'angle de caméra.
// =============================================================================

import { useMemo } from "react";
import { useLayersStore } from "@/store/layers-store";
import { useDataStore } from "@/store/data-store";
import type { WeatherStation } from "@/types/data-layers";

// Conversion direction météo → degrés (d'où vient le vent)
const WIND_DIR_DEG: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
};

const WIND_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

interface DominantWind {
  direction: string;
  speedKmh: number;
  /** Angle CSS en degrés pour la flèche SVG (0 = nord, sens horaire) */
  angleDeg: number;
}

function computeDominantWind(stations: WeatherStation[]): DominantWind | null {
  if (!stations.length) return null;

  let sumSin = 0, sumCos = 0, sumSpeed = 0;
  for (const st of stations) {
    const deg = WIND_DIR_DEG[st.windDirection] ?? 0;
    const rad = (deg * Math.PI) / 180;
    // Vecteur "là où va le vent" (opposé de la direction source)
    sumSin   += Math.sin(rad + Math.PI);
    sumCos   += Math.cos(rad + Math.PI);
    sumSpeed += st.windSpeed;
  }

  const avgSin = sumSin / stations.length;
  const avgCos = sumCos / stations.length;
  const avgSpeed = sumSpeed / stations.length;

  // Angle polaire (0 = nord, sens horaire) — pour flèche CSS/SVG
  const angleDeg = ((Math.atan2(avgSin, avgCos) * 180) / Math.PI + 360) % 360;

  // Direction string la plus proche
  const direction = WIND_DIRS[Math.round(angleDeg / 45) % 8];

  return { direction, speedKmh: avgSpeed, angleDeg };
}

function beauforts(kmh: number): string {
  if (kmh < 1)   return "Calme";
  if (kmh < 12)  return "Légère brise";
  if (kmh < 30)  return "Petite brise";
  if (kmh < 50)  return "Bonne brise";
  if (kmh < 75)  return "Grand vent";
  if (kmh < 100) return "Tempête";
  return "Ouragan";
}

export default function WindIndicator() {
  const { layers } = useLayersStore();
  const weatherData = useDataStore((s) => s.weather);
  const weatherStatus = useDataStore((s) => s.weatherStatus);

  const dominant = useMemo(
    () => computeDominantWind(weatherData?.stations ?? []),
    [weatherData]
  );

  if (!layers.winds?.visible) return null;

  const color =
    dominant && dominant.speedKmh > 80 ? "#ef4444"
    : dominant && dominant.speedKmh > 50 ? "#f97316"
    : dominant && dominant.speedKmh > 25 ? "#eab308"
    : "#22c55e";

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 35,
        background: "rgba(10,18,36,0.92)",
        backdropFilter: "blur(12px)",
        border: `1.5px solid ${color}`,
        borderRadius: 14,
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "system-ui, sans-serif",
        color: "#f1f5f9",
        pointerEvents: "none",
        userSelect: "none",
        boxShadow: `0 0 20px ${color}33`,
      }}
    >
      {/* Icône + flèche directionnelle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>💨</span>

        {/* Rose des vents SVG */}
        <svg
          width={36}
          height={36}
          viewBox="-18 -18 36 36"
          style={{ flexShrink: 0 }}
        >
          {/* Cercle fond */}
          <circle r={16} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
          {/* Repères cardinaux */}
          {(["N","E","S","W"] as const).map((d, i) => {
            const a = i * 90 * Math.PI / 180;
            return (
              <text
                key={d}
                x={11 * Math.sin(a)}
                y={-11 * Math.cos(a) + 2}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize={5}
                fontFamily="system-ui"
              >
                {d}
              </text>
            );
          })}
          {/* Flèche de direction */}
          {dominant && (
            <g transform={`rotate(${dominant.angleDeg})`}>
              {/* Corps */}
              <rect x={-1} y={-12} width={2} height={12} fill={color} rx={1} />
              {/* Pointe */}
              <polygon points="0,-14 -3,-10 3,-10" fill={color} />
              {/* Queue */}
              <rect x={-1} y={0} width={2} height={6} fill={color} opacity={0.4} rx={1} />
            </g>
          )}
          {dominant && (
            <circle r={2} fill={color} />
          )}
        </svg>
      </div>

      {/* Données textuelles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color, letterSpacing: "-0.5px" }}>
            {dominant ? `${Math.round(dominant.speedKmh)} km/h` : "—"}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
            {dominant?.direction ?? "—"}
          </span>
        </div>
        <div style={{ fontSize: 10, color: "#64748b" }}>
          {weatherStatus === "loading"
            ? "Chargement…"
            : dominant
            ? beauforts(dominant.speedKmh)
            : "En attente de données"}
        </div>
      </div>

      {/* Label section */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#334155",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          paddingLeft: 10,
        }}
      >
        Vents<br />dominants
      </div>
    </div>
  );
}
