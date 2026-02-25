"use client";

// =============================================================================
// DataLayersPanel — panneau DOM de contrôle des couches de données temps réel
// =============================================================================
// Composant React normal (hors Canvas) à poser par-dessus le viewport 3D.
// Communique avec les composants 3D via useLayersStore (Zustand).
// =============================================================================

import React, { useState } from "react";
import { useLayersStore } from "@/store/layers-store";
import { useDataStore } from "@/store/data-store";
import type { LayerKey } from "@/store/layers-store";

// ---------------------------------------------------------------------------
// Méta-données de chaque couche
// ---------------------------------------------------------------------------

interface LayerMeta {
  key: LayerKey;
  label: string;
  icon: string;
  description: string;
  /** Fréquence de mise à jour affichée */
  updateFreq: string;
}

const LAYERS: LayerMeta[] = [
  {
    key: "weather",
    label: "Météo",
    icon: "🌡",
    description: "Stations, prévisions, alertes",
    updateFreq: "5 min",
  },
  {
    key: "alpinists",
    label: "Alpinistes",
    icon: "🧗",
    description: "Positions, refuges, secours",
    updateFreq: "temps réel",
  },
  {
    key: "geological",
    label: "Avalanches",
    icon: "⚠️",
    description: "Zones à risque, événements",
    updateFreq: "3 h",
  },
  {
    key: "environment",
    label: "Environnement",
    icon: "❄️",
    description: "Enneigement, glaciers, eau",
    updateFreq: "3 h",
  },
  {
    key: "media",
    label: "Médias",
    icon: "📷",
    description: "Photos, webcams, rapports",
    updateFreq: "10 min",
  },
];

// ---------------------------------------------------------------------------
// Sélecteur du statut d'une couche dans le DataStore
// ---------------------------------------------------------------------------

type DataStatusKey =
  | "weatherStatus"
  | "humanActivityStatus"
  | "geologicalStatus"
  | "environmentStatus"
  | "mediaStatus";

const STATUS_KEY: Record<LayerKey, DataStatusKey> = {
  weather:     "weatherStatus",
  alpinists:   "humanActivityStatus",
  geological:  "geologicalStatus",
  environment: "environmentStatus",
  media:       "mediaStatus",
};

const ERROR_KEY: Record<LayerKey, keyof ReturnType<typeof useDataStore.getState>> = {
  weather:     "weatherError",
  alpinists:   "humanActivityError",
  geological:  "geologicalError",
  environment: "environmentError",
  media:       "mediaError",
};

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width: 34,
        height: 18,
        borderRadius: 9,
        background: on ? "#3b82f6" : "#334155",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.15s",
        flexShrink: 0,
      }}
      aria-checked={on}
      role="switch"
    >
      <span
        style={{
          display: "block",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Ligne de couche
// ---------------------------------------------------------------------------

interface LayerRowProps {
  meta: LayerMeta;
  visible: boolean;
  opacity: number;
  status: string;
  error: string | null;
  onToggle: () => void;
  onOpacity: (v: number) => void;
}

function LayerRow({ meta, visible, opacity, status, error, onToggle, onOpacity }: LayerRowProps) {
  const [expanded, setExpanded] = useState(false);

  const statusDot =
    !visible
      ? { color: "#475569", label: "désactivé" }
      : status === "loading"
      ? { color: "#eab308", label: "chargement…" }
      : status === "error"
      ? { color: "#ef4444", label: "erreur" }
      : status === "success"
      ? { color: "#22c55e", label: "actif" }
      : { color: "#475569", label: "en attente" };

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: 6,
        marginBottom: 6,
      }}
    >
      {/* Ligne principale */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Icône + nom */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            color: visible ? "#f1f5f9" : "#64748b",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flex: 1,
            padding: 0,
            textAlign: "left",
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span style={{ fontSize: 14 }}>{meta.icon}</span>
          <span style={{ fontWeight: 600 }}>{meta.label}</span>
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: statusDot.color,
              marginLeft: 2,
              flexShrink: 0,
            }}
          />
        </button>

        {/* Toggle on/off */}
        <Toggle on={visible} onChange={onToggle} />
      </div>

      {/* Panneau étendu : slider opacité + info */}
      {expanded && (
        <div style={{ marginTop: 6, paddingLeft: 22 }}>
          {/* Description */}
          <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>
            {meta.description} · maj. {meta.updateFreq}
          </div>

          {/* Opacité — seulement si la couche est active */}
          {visible && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#94a3b8", fontSize: 10, width: 48, flexShrink: 0 }}>
                Opacité
              </span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => onOpacity(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: "#3b82f6" }}
              />
              <span style={{ color: "#94a3b8", fontSize: 10, width: 28, textAlign: "right" }}>
                {Math.round(opacity * 100)}%
              </span>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div style={{ color: "#fca5a5", fontSize: 10, marginTop: 2 }}>
              ⚠ {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

interface DataLayersPanelProps {
  /** Classe CSS à ajouter au conteneur (positionnement, z-index, etc.) */
  className?: string;
}

export default function DataLayersPanel({ className }: DataLayersPanelProps) {
  const { layers, realTimeEnabled, toggleLayer, setLayerOpacity, setRealTimeEnabled, hideAll } =
    useLayersStore();

  // Statuts de chargement depuis le DataStore
  const dataStore = useDataStore();
  const wsConnected = dataStore.wsConnected;

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={className}
      style={{
        background: "rgba(15,23,42,0.88)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: collapsed ? "8px 12px" : "12px 14px",
        width: 220,
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
          <span style={{ fontSize: 12 }}>🗂</span>
          <span style={{ fontWeight: 700, fontSize: 12 }}>Couches de données</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Indicateur WS */}
          {realTimeEnabled && (
            <span
              title={wsConnected ? "Temps réel connecté" : "Déconnecté"}
              style={{
                fontSize: 8,
                color: wsConnected ? "#22c55e" : "#ef4444",
                fontWeight: 700,
              }}
            >
              {wsConnected ? "● LIVE" : "● OFF"}
            </span>
          )}
          {/* Collapse */}
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
      </div>

      {!collapsed && (
        <>
          {/* Couches */}
          {LAYERS.map((meta) => {
            const cfg = layers[meta.key];
            const statusKey = STATUS_KEY[meta.key];
            const errorKey  = ERROR_KEY[meta.key];
            const status = dataStore[statusKey] as string;
            const error  = dataStore[errorKey] as string | null;

            return (
              <LayerRow
                key={meta.key}
                meta={meta}
                visible={cfg.visible}
                opacity={cfg.opacity}
                status={status}
                error={error}
                onToggle={() => toggleLayer(meta.key)}
                onOpacity={(v) => setLayerOpacity(meta.key, v)}
              />
            );
          })}

          {/* Bas du panneau */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 8,
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {/* Toggle temps réel global */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#94a3b8", fontSize: 10 }}>Temps réel WS</span>
              <Toggle on={realTimeEnabled} onChange={setRealTimeEnabled} />
            </div>

            {/* Tout masquer */}
            <button
              onClick={hideAll}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                color: "#64748b",
                fontSize: 9,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Tout masquer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
