"use client";

// =============================================================================
// RouteLibrary — panneau DOM de sélection des voies d'alpinisme
// =============================================================================
// Composant React normal (hors Canvas) à superposer sur le viewport 3D.
// Communique avec le 3D via useRouteStore (Zustand).
//
// Fonctionnalités :
//   • Voies groupées par sommet
//   • Filtres par famille de difficulté (F/PD → ED)
//   • Toggle visibilité par voie
//   • Badge couleur + cotation + lien C2C
//   • Compteur de voies actives
// =============================================================================

import React, { useState } from "react";
import { CLIMBING_ROUTES, gradeToColor } from "@/data/climbingRoutes";
import { useRouteStore } from "@/store/route-store";
import type { ClimbingRoute, RouteGrade } from "@/types/routes";

// ---------------------------------------------------------------------------
// Familles de difficulté
// ---------------------------------------------------------------------------

type GradeFamily = "F/PD" | "AD" | "D" | "TD" | "ED";

function routeFamily(grade: RouteGrade): GradeFamily {
  if (grade.startsWith("ED") || grade === "EX") return "ED";
  if (grade.startsWith("TD")) return "TD";
  if (grade.startsWith("D")) return "D";
  if (grade.startsWith("AD")) return "AD";
  return "F/PD";
}

const FAMILIES: GradeFamily[] = ["F/PD", "AD", "D", "TD", "ED"];

const FAMILY_COLORS: Record<GradeFamily, string> = {
  "F/PD": "#3b82f6",
  AD: "#22c55e",
  D: "#eab308",
  TD: "#f97316",
  ED: "#ef4444",
};

// ---------------------------------------------------------------------------
// Noms lisibles des sommets (clés de CLIMBING_ROUTES)
// ---------------------------------------------------------------------------

const SUMMIT_NAMES: Record<string, string> = {
  verte: "Aiguille Verte · 4122m",
  "mont-blanc": "Mont Blanc · 4808m",
  jorasses: "Grandes Jorasses · 4208m",
  tacul: "Mont Blanc du Tacul · 4248m",
  drus: "Aiguille des Drus · 3754m",
  midi: "Aiguille du Midi · 3842m",
};

// ---------------------------------------------------------------------------
// Ligne de voie individuelle
// ---------------------------------------------------------------------------

function RouteRow({
  route,
  filterFamilies,
}: {
  route: ClimbingRoute;
  filterFamilies: Set<GradeFamily>;
}) {
  const { visibleRoutes, toggleRoute } = useRouteStore();

  // Appliquer le filtre : si un filtre est actif et que la voie n'en fait pas
  // partie, on ne l'affiche pas
  if (
    filterFamilies.size > 0 &&
    !filterFamilies.has(routeFamily(route.grade))
  ) {
    return null;
  }

  const visible = visibleRoutes.some((r) => r.id === route.id);
  const color = route.color ?? gradeToColor(route.grade);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Badge cotation */}
      <span
        style={{
          flexShrink: 0,
          fontSize: 9,
          fontWeight: 800,
          padding: "1px 5px",
          borderRadius: 4,
          background: color,
          color: "#fff",
          marginTop: 2,
          letterSpacing: "0.04em",
        }}
      >
        {route.grade}
      </span>

      {/* Nom + description courte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: visible ? "#f1f5f9" : "#94a3b8",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {route.name}
        </div>
        {route.gradeText && (
          <div
            style={{
              fontSize: 9,
              color: "#475569",
              marginTop: 1,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {route.gradeText}
          </div>
        )}
        {route.c2cUrl && (
          <a
            href={route.c2cUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 8,
              color: "#3b82f6",
              textDecoration: "none",
              marginTop: 1,
              display: "inline-block",
            }}
          >
            ↗ C2C
          </a>
        )}
      </div>

      {/* Bouton toggle */}
      <button
        onClick={() => toggleRoute(route)}
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: visible
            ? `1.5px solid ${color}`
            : "1.5px solid rgba(255,255,255,0.12)",
          background: visible ? color : "transparent",
          color: visible ? "#fff" : "#64748b",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s",
        }}
        title={visible ? "Masquer la voie" : "Afficher la voie"}
      >
        {visible ? "✓" : "○"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Groupe d'un sommet (collapsible)
// ---------------------------------------------------------------------------

function SummitGroup({
  summitId,
  filterFamilies,
}: {
  summitId: string;
  filterFamilies: Set<GradeFamily>;
}) {
  const routes = CLIMBING_ROUTES[summitId];
  const [open, setOpen] = useState(true);
  const { visibleRoutes } = useRouteStore();

  // Voies du sommet qui passent le filtre
  const matchingRoutes = routes.filter(
    (r) =>
      filterFamilies.size === 0 || filterFamilies.has(routeFamily(r.grade))
  );

  // Si aucune voie ne correspond au filtre, on masque le groupe entier
  if (matchingRoutes.length === 0) return null;

  const activeCount = routes.filter((r) =>
    visibleRoutes.some((v) => v.id === r.id)
  ).length;

  return (
    <div style={{ marginBottom: 8 }}>
      {/* En-tête sommet */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 0",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          textAlign: "left",
        }}
      >
        <span>{SUMMIT_NAMES[summitId] ?? summitId}</span>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {activeCount > 0 && (
            <span
              style={{
                background: "#3b82f6",
                color: "#fff",
                borderRadius: 8,
                fontSize: 9,
                fontWeight: 700,
                padding: "0 5px",
                minWidth: 16,
                textAlign: "center",
                lineHeight: "16px",
                height: 16,
                display: "inline-block",
              }}
            >
              {activeCount}
            </span>
          )}
          <span style={{ fontSize: 11, lineHeight: 1 }}>
            {open ? "▴" : "▾"}
          </span>
        </span>
      </button>

      {open && (
        <div style={{ paddingLeft: 4 }}>
          {routes.map((r) => (
            <RouteRow key={r.id} route={r} filterFamilies={filterFamilies} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panneau principal
// ---------------------------------------------------------------------------

interface RouteLibraryProps {
  className?: string;
}

export default function RouteLibrary({ className }: RouteLibraryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<GradeFamily>>(
    new Set()
  );
  const { visibleRoutes, clearRoutes } = useRouteStore();

  function toggleFilter(f: GradeFamily) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  const summitIds = Object.keys(CLIMBING_ROUTES);

  return (
    <div
      className={className}
      style={{
        background: "rgba(15,23,42,0.90)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: collapsed ? "8px 12px" : "12px 14px",
        width: 240,
        maxHeight: "70vh",
        overflowY: collapsed ? "hidden" : "auto",
        fontFamily: "system-ui, sans-serif",
        color: "#f1f5f9",
        userSelect: "none",
      }}
    >
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: collapsed ? 0 : 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12 }}>🏔</span>
          <span style={{ fontWeight: 700, fontSize: 12 }}>
            Voies d&apos;alpinisme
          </span>
          {visibleRoutes.length > 0 && (
            <span
              style={{
                background: "#3b82f6",
                color: "#fff",
                borderRadius: 8,
                fontSize: 9,
                fontWeight: 700,
                padding: "0 5px",
                lineHeight: "16px",
                height: 16,
                display: "inline-block",
              }}
            >
              {visibleRoutes.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
          }}
        >
          {collapsed ? "▾" : "▴"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Filtres par famille de difficulté */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 10,
              paddingBottom: 10,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {FAMILIES.map((f) => {
              const active = activeFilters.has(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 5,
                    border: `1px solid ${
                      active ? FAMILY_COLORS[f] : "rgba(255,255,255,0.1)"
                    }`,
                    background: active ? FAMILY_COLORS[f] : "transparent",
                    color: active ? "#fff" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.1s",
                  }}
                >
                  {f}
                </button>
              );
            })}
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 5,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Liste des sommets */}
          {summitIds.map((id) => (
            <SummitGroup
              key={id}
              summitId={id}
              filterFamilies={activeFilters}
            />
          ))}

          {/* Pied de panneau — tout masquer */}
          {visibleRoutes.length > 0 && (
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 8,
                marginTop: 4,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={clearRoutes}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#64748b",
                  fontSize: 9,
                  cursor: "pointer",
                  padding: "2px 8px",
                }}
              >
                Tout masquer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
