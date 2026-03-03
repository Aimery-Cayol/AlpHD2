"use client";

// =============================================================================
// AltitudeProfile — profil altimétrique 2D des voies visibles
// =============================================================================
// Composant DOM (hors Canvas) superposé sur la vue 3D.
// Calcule et affiche un graphique SVG distance vs altitude pour chaque voie.
// Utilise les points du tracé hardcodé (route.track) — sans fetch GPS.
// =============================================================================

import React, { useMemo, useState } from "react";
import type { ClimbingRoute, RoutePoint } from "@/types/routes";
import { gradeToColor } from "@/data/climbingRoutes";

// ---------------------------------------------------------------------------
// Haversine distance (km) entre deux points WGS84
// ---------------------------------------------------------------------------

function haversineKm(p1: RoutePoint, p2: RoutePoint): number {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Construit le profil (distance cumulée, altitude) depuis le tracé
// ---------------------------------------------------------------------------

function buildProfile(
  track: RoutePoint[]
): { dist: number; alt: number }[] {
  if (track.length === 0) return [];
  const pts: { dist: number; alt: number }[] = [
    { dist: 0, alt: track[0].altM },
  ];
  let cum = 0;
  for (let i = 1; i < track.length; i++) {
    cum += haversineKm(track[i - 1], track[i]);
    pts.push({ dist: cum, alt: track[i].altM });
  }
  return pts;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AltitudeProfileProps {
  routes: ClimbingRoute[];
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export default function AltitudeProfile({ routes }: AltitudeProfileProps) {
  const [collapsed, setCollapsed] = useState(false);

  const profiles = useMemo(
    () =>
      routes.map((r) => ({
        route: r,
        pts: buildProfile(r.track),
        color: r.color ?? gradeToColor(r.grade),
      })),
    [routes]
  );

  if (profiles.length === 0) return null;

  // Bornes globales
  const allPts = profiles.flatMap((p) => p.pts);
  const minAlt = Math.min(...allPts.map((p) => p.alt));
  const maxAlt = Math.max(...allPts.map((p) => p.alt));
  const maxDist = Math.max(
    ...profiles.flatMap((p) => p.pts.map((pt) => pt.dist))
  );

  // Dimensions SVG
  const W = 300;
  const H = 80;
  const pad = { t: 8, r: 8, b: 20, l: 38 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const altRange = maxAlt - minAlt || 1;

  const xScale = (d: number) => pad.l + (d / maxDist) * cw;
  const yScale = (a: number) =>
    pad.t + ch - ((a - minAlt) / altRange) * ch;

  const toPath = (pts: { dist: number; alt: number }[]) =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${xScale(p.dist).toFixed(1)},${yScale(
            p.alt
          ).toFixed(1)}`
      )
      .join(" ");

  // 3 ticks altitude
  const yTicks = [minAlt, (minAlt + maxAlt) / 2, maxAlt];

  return (
    <div
      style={{
        background: "rgba(15,23,42,0.90)",
        backdropFilter: "blur(10px)",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: collapsed ? "7px 12px" : "10px 12px",
        width: W + 24,
        fontFamily: "system-ui, sans-serif",
        color: "#f1f5f9",
        userSelect: "none",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: collapsed ? 0 : 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11 }}>📈</span>
          <span style={{ fontWeight: 700, fontSize: 11 }}>
            Profil altimétrique
          </span>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 13,
            lineHeight: 1,
            padding: 0,
          }}
        >
          {collapsed ? "▾" : "▴"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Légende des voies */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {profiles.map(({ route, color }) => (
              <div
                key={route.id}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <div
                  style={{
                    width: 16,
                    height: 3,
                    background: color,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: "#94a3b8",
                    maxWidth: 110,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {route.name}
                </span>
              </div>
            ))}
          </div>

          {/* Graphique SVG */}
          <svg
            width={W}
            height={H}
            style={{ display: "block", overflow: "visible" }}
          >
            {/* Lignes de grille Y + labels altitude */}
            {yTicks.map((alt) => (
              <g key={alt}>
                <line
                  x1={pad.l}
                  y1={yScale(alt)}
                  x2={pad.l + cw}
                  y2={yScale(alt)}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={1}
                />
                <text
                  x={pad.l - 4}
                  y={yScale(alt)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#475569"
                  fontSize={8}
                >
                  {Math.round(alt)}
                </text>
              </g>
            ))}

            {/* Axe X */}
            <line
              x1={pad.l}
              y1={pad.t + ch}
              x2={pad.l + cw}
              y2={pad.t + ch}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />

            {/* Label distance totale */}
            <text
              x={pad.l + cw}
              y={H - 4}
              textAnchor="end"
              fill="#475569"
              fontSize={8}
            >
              {maxDist.toFixed(1)} km
            </text>
            <text
              x={pad.l}
              y={H - 4}
              textAnchor="start"
              fill="#475569"
              fontSize={8}
            >
              0
            </text>

            {/* Zone de fond sous chaque profil */}
            {profiles.map(({ pts, color, route }) => {
              if (pts.length < 2) return null;
              const areaPath =
                toPath(pts) +
                ` L${xScale(pts[pts.length - 1].dist).toFixed(1)},${(
                  pad.t + ch
                ).toFixed(1)} L${xScale(pts[0].dist).toFixed(1)},${(
                  pad.t + ch
                ).toFixed(1)} Z`;
              return (
                <path
                  key={`area-${route.id}`}
                  d={areaPath}
                  fill={color}
                  fillOpacity={0.08}
                />
              );
            })}

            {/* Tracés */}
            {profiles.map(({ pts, color, route }) => (
              <path
                key={route.id}
                d={toPath(pts)}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </>
      )}
    </div>
  );
}
