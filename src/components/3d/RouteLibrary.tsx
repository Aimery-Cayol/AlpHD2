"use client";

// =============================================================================
// RouteLibrary — panneau DOM de sélection des voies d'alpinisme
// =============================================================================

import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import {
  CLIMBING_ROUTES,
  gradeToColor,
  getRoutePaletteColor,
  MONT_BLANC_SUMMIT_IDS,
  GPX_ROUTE_IDS,
} from "@/data/climbingRoutes";
import { useRouteStore } from "@/store/route-store";
import type { ClimbingRoute, RouteGrade } from "@/types/routes";

// ---------------------------------------------------------------------------
// Contexte thème (dark = panneau flottant, light = intégré dans le panel)
// ---------------------------------------------------------------------------

const EmbeddedCtx = createContext(false);

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
  // --- Massif du Mont-Blanc ---
  tour: "Aiguille du Tour · 3540m",
  chardonnet: "Aiguille du Chardonnet · 3824m",
  verte: "Aiguille Verte · 4122m",
  drus: "Aiguille des Drus · 3754m",
  droites: "Les Droites · 4001m",
  courtes: "Les Courtes · 3856m",
  moine: "Aiguille du Moine · 3412m",
  midi: "Aiguille du Midi · 3842m",
  plan: "Aiguille du Plan · 3673m",
  "chamonix-needles": "Aiguilles de Chamonix · 3842m",
  "mont-blanc": "Mont Blanc · 4808m",
  tacul: "Mont Blanc du Tacul · 4248m",
  maudit: "Mont Maudit · 4465m",
  bionnassay: "Aiguille de Bionnassay · 4052m",
  "domes-miage": "Dômes de Miage · 3673m",
  "dome-gouter": "Dôme du Goûter · 4304m",
  geant: "Dent du Géant · 4013m",
  rochefort: "Arête de Rochefort · 4001m",
  jorasses: "Grandes Jorasses · 4208m",
  talefre: "Aiguille de Talèfre · 3730m",
  // --- Massif des Écrins ---
  meije: "La Meije · 3984m",
  rateau: "Le Râteau · 3809m",
  "pic-gaspard": "Pic Gaspard · 3883m",
  "barre-ecrins": "Barre des Écrins · 4102m",
  "dome-neige": "Dôme de Neige · 4015m",
  "roche-faurio": "Roche Faurio · 3730m",
  agneaux: "Montagne des Agneaux · 3664m",
  pelvoux: "Mont Pelvoux · 3946m",
  ailefroide: "Ailefroide · 3954m",
  olan: "L'Olan · 3564m",
  "les-bans": "Les Bans · 3669m",
  "les-rouies": "Les Rouies · 3589m",
  sirac: "Le Sirac · 3441m",
  muzelle: "La Muzelle · 3465m",
  // --- Montagne Sainte-Victoire ---
  "pic-mouches": "Pic des Mouches · 1011m",
};

// ---------------------------------------------------------------------------
// Ligne de voie individuelle
// ---------------------------------------------------------------------------

function RouteRow({
  route,
  filterFamilies,
  paletteColor,
  summitId,
}: {
  route: ClimbingRoute;
  filterFamilies: Set<GradeFamily>;
  paletteColor: string;
  summitId: string;
}) {
  const { visibleRoutes, toggleRoute } = useRouteStore();
  const embedded = useContext(EmbeddedCtx);

  if (
    filterFamilies.size > 0 &&
    !filterFamilies.has(routeFamily(route.grade))
  ) {
    return null;
  }

  const visible = visibleRoutes.some((r) => r.id === route.id);
  const color = paletteColor;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "5px 0",
        borderBottom: embedded ? "1px solid rgba(0,0,0,0.05)" : "1px solid rgba(255,255,255,0.05)",
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
            color: embedded ? (visible ? "#1e293b" : "#64748b") : (visible ? "#f1f5f9" : "#94a3b8"),
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
              color: embedded ? "#94a3b8" : "#475569",
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
      </div>

      {/* Bouton toggle */}
      <button
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          borderRadius: 6,
          border: visible
            ? `1.5px solid ${color}`
            : embedded ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(255,255,255,0.12)",
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
        onClick={() => toggleRoute({ ...route, color: paletteColor })}
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
  defaultOpen = true,
}: {
  summitId: string;
  filterFamilies: Set<GradeFamily>;
  defaultOpen?: boolean;
}) {
  const allRoutes = CLIMBING_ROUTES[summitId] ?? [];
  // Seulement les voies avec un tracé GPS réel
  const routes = allRoutes.filter((r) => GPX_ROUTE_IDS.has(r.id));
  const [open, setOpen] = useState(defaultOpen);
  const { visibleRoutes } = useRouteStore();
  const embedded = useContext(EmbeddedCtx);

  const matchingRoutes = routes.filter(
    (r) =>
      filterFamilies.size === 0 || filterFamilies.has(routeFamily(r.grade))
  );

  if (matchingRoutes.length === 0) return null;

  const activeCount = routes.filter((r) =>
    visibleRoutes.some((v) => v.id === r.id)
  ).length;

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          color: embedded ? "#64748b" : "#94a3b8",
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
            <RouteRow
              key={r.id}
              route={r}
              filterFamilies={filterFamilies}
              summitId={summitId}
              paletteColor={getRoutePaletteColor(summitId, r.id)}
            />
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
  selectedSummitId?: string | null;
  onHide?: () => void;
  embedded?: boolean;
}

export default function RouteLibrary({
  className,
  selectedSummitId,
  onHide,
  embedded = false,
}: RouteLibraryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<GradeFamily>>(
    new Set()
  );
  const [showAllSummits, setShowAllSummits] = useState(false);
  const { visibleRoutes, clearRoutes } = useRouteStore();

  // Réinitialiser "voir toutes les voies" quand le sommet sélectionné change
  useEffect(() => {
    setShowAllSummits(false);
  }, [selectedSummitId]);

  // Le sommet principal : celui sélectionné dans l'UI, s'il est dans le MB
  const primarySummitId =
    selectedSummitId && MONT_BLANC_SUMMIT_IDS.has(selectedSummitId)
      ? selectedSummitId
      : null;

  // Tous les sommets MB ayant au moins une voie avec GPX
  const allMBSummitIds = useMemo(
    () =>
      Object.keys(CLIMBING_ROUTES).filter(
        (id) =>
          MONT_BLANC_SUMMIT_IDS.has(id) &&
          (CLIMBING_ROUTES[id] ?? []).some((r) => GPX_ROUTE_IDS.has(r.id))
      ),
    []
  );

  function toggleFilter(f: GradeFamily) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }

  // Sommets à afficher en premier (le sommet sélectionné)
  // + éventuellement les autres si showAllSummits
  const primaryIds = primarySummitId ? [primarySummitId] : allMBSummitIds;
  const otherIds = primarySummitId
    ? allMBSummitIds.filter((id) => id !== primarySummitId)
    : [];
  const hasOthers = otherIds.length > 0;

  return (
    <EmbeddedCtx.Provider value={embedded}>
    <div
      className={className}
      style={embedded ? {
        padding: "8px 12px",
        maxHeight: 300,
        overflowY: "auto",
        fontFamily: "system-ui, sans-serif",
        color: "#334155",
        userSelect: "none",
      } : {
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
      {/* En-tête — masqué en mode embarqué */}
      {!embedded && <div
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
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
          {onHide && (
            <button
              onClick={onHide}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
              title="Fermer"
            >
              ✕
            </button>
          )}
        </div>
      </div>}

      {(!collapsed || embedded) && (
        <>
          {/* Filtres par famille de difficulté */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 10,
              paddingBottom: 10,
              borderBottom: embedded ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
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
                    border: `1px solid ${active ? FAMILY_COLORS[f] : (embedded ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)")}`,
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
                  border: embedded ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
                  background: "transparent",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sommets principaux */}
          {primaryIds.map((id) => (
            <SummitGroup
              key={id}
              summitId={id}
              filterFamilies={activeFilters}
              defaultOpen
            />
          ))}

          {/* Autres sommets (quand showAllSummits) */}
          {showAllSummits && otherIds.length > 0 && (
            <>
              <div
                style={{
                  borderTop: embedded ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
                  paddingTop: 8,
                  marginTop: 4,
                  marginBottom: 8,
                  fontSize: 9,
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Autres sommets
              </div>
              {otherIds.map((id) => (
                <SummitGroup
                  key={id}
                  summitId={id}
                  filterFamilies={activeFilters}
                  defaultOpen={false}
                />
              ))}
            </>
          )}

          {/* Bouton "Explorer d'autres voies" */}
          {hasOthers && !showAllSummits && (
            <div
              style={{
                borderTop: embedded ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <button
                onClick={() => setShowAllSummits(true)}
                style={{
                  width: "100%",
                  background: "none",
                  border: embedded ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#60a5fa",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "5px 8px",
                  textAlign: "center",
                }}
              >
                Explorer d&apos;autres voies →
              </button>
            </div>
          )}

          {/* Réduire la liste complète */}
          {showAllSummits && hasOthers && (
            <div
              style={{
                paddingTop: 8,
                marginTop: 4,
              }}
            >
              <button
                onClick={() => setShowAllSummits(false)}
                style={{
                  width: "100%",
                  background: "none",
                  border: embedded ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  color: "#475569",
                  fontSize: 10,
                  cursor: "pointer",
                  padding: "5px 8px",
                  textAlign: "center",
                }}
              >
                ← Réduire
              </button>
            </div>
          )}

          {/* Pied de panneau — tout masquer */}
          {visibleRoutes.length > 0 && (
            <div
              style={{
                borderTop: embedded ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
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
                  border: embedded ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
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
    </EmbeddedCtx.Provider>
  );
}
