"use client";

// =============================================================================
// WebcamMarkers — icônes de webcams en direct en scène 3D
// =============================================================================
// • Icône 📷 positionnée à l'emplacement géographique exact de chaque caméra
// • Pulsation pour les webcams en ligne
// • Popup au clic : snapshot auto-rafraîchi + iframe live si disponible
// =============================================================================

import * as THREE from "three";
import React, { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useMediaData } from "@/hooks/useMediaData";
import { useLayersStore } from "@/store/layers-store";
import type { TileModel } from "@/types/models";
import type { WebcamFeed } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Marqueur d'une webcam
// ---------------------------------------------------------------------------

interface WebcamMarkerProps {
  webcam: WebcamFeed;
  sceneX: number;
  sceneY: number;
  sceneZ: number;
  opacity: number;
  colliderRefs: { current: THREE.Mesh }[];
}

function WebcamMarker({
  webcam,
  sceneX,
  sceneY,
  sceneZ,
  opacity,
  colliderRefs,
}: WebcamMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [open, setOpen] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [snapshotTs, setSnapshotTs] = useState(Date.now());
  const [countdown, setCountdown] = useState(30);

  const handleClick = useCallback(() => {
    setOpen((v) => !v);
    setShowLive(false);
  }, []);

  // Auto-refresh du snapshot toutes les 30 s quand la popup est ouverte
  useEffect(() => {
    if (!open || showLive) return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setSnapshotTs(Date.now());
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, showLive]);

  // Pulsation légère pour les webcams en ligne
  useFrame((state) => {
    if (!meshRef.current || !webcam.online) return;
    const s = 1 + 0.12 * Math.sin(state.clock.elapsedTime * 2.5);
    meshRef.current.scale.setScalar(s);
    state.invalidate();
  });

  const color = webcam.online ? "#3b82f6" : "#64748b";
  const hasEmbed = Boolean(webcam.embedUrl);
  const hasSnapshot = Boolean(webcam.snapshotUrl);

  return (
    <group position={[sceneX, sceneY, sceneZ]}>
      {/* Sphère de fond (base cliquable) */}
      <mesh ref={meshRef} onClick={handleClick}>
        <sphereGeometry args={[0.005, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35 * opacity}
        />
      </mesh>

      {/* Label Html (icône + popup) */}
      <Html
        position={[0, 0.025, 0]}
        center
        distanceFactor={3}
        zIndexRange={[25, 0]}
        occlude={colliderRefs}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: "system-ui, sans-serif",
            userSelect: "none",
          }}
        >
          {/* Icône caméra */}
          <button
            onClick={handleClick}
            style={{
              background: open
                ? "rgba(59,130,246,0.9)"
                : "rgba(15,23,42,0.85)",
              border: `1.5px solid ${open ? "#3b82f6" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 8,
              padding: "4px 7px",
              cursor: "pointer",
              fontSize: 12,
              lineHeight: 1,
              backdropFilter: "blur(6px)",
              color: webcam.online ? "#fff" : "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: open ? "0 0 0 2px rgba(59,130,246,0.3)" : "none",
            }}
            title={webcam.name}
          >
            📷
            {webcam.online && (
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 4px #22c55e",
                }}
              />
            )}
          </button>

          {/* Popup déployée au clic */}
          {open && (
            <div
              style={{
                marginTop: 4,
                background: "rgba(10,18,36,0.97)",
                border: "1px solid rgba(59,130,246,0.5)",
                borderRadius: 12,
                overflow: "hidden",
                width: 240,
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* En-tête */}
              <div
                style={{
                  padding: "7px 10px 5px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 6,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 8, color: "#93c5fd", lineHeight: 1.3 }}>
                    {webcam.name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 6.5, marginTop: 1 }}>
                    {webcam.operator}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 6,
                      fontWeight: 700,
                      color: webcam.online ? "#22c55e" : "#ef4444",
                      background: webcam.online ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                      padding: "1px 5px",
                      borderRadius: 4,
                    }}
                  >
                    {webcam.online ? "● EN DIRECT" : "● HORS LIGNE"}
                  </span>
                  <button
                    onClick={handleClick}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#475569",
                      fontSize: 10,
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Zone de contenu vidéo */}
              {webcam.online && (hasEmbed || hasSnapshot) && (
                <>
                  {/* Onglets Snapshot / Live */}
                  {hasEmbed && (
                    <div
                      style={{
                        display: "flex",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {(["snapshot", "live"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setShowLive(tab === "live")}
                          style={{
                            flex: 1,
                            padding: "5px 0",
                            fontSize: 6.5,
                            fontWeight: 600,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color:
                              (tab === "live") === showLive
                                ? "#60a5fa"
                                : "#475569",
                            borderBottom:
                              (tab === "live") === showLive
                                ? "2px solid #3b82f6"
                                : "2px solid transparent",
                          }}
                        >
                          {tab === "live" ? "▶ Flux live" : "📷 Snapshot"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Contenu : iframe live */}
                  {showLive && webcam.embedUrl ? (
                    <iframe
                      src={webcam.embedUrl}
                      style={{
                        width: "100%",
                        height: 130,
                        border: "none",
                        display: "block",
                        background: "#000",
                      }}
                      allow="autoplay; fullscreen"
                      title={webcam.name}
                    />
                  ) : hasSnapshot ? (
                    /* Snapshot auto-rafraîchi */
                    <div style={{ position: "relative" }}>
                      <img
                        key={snapshotTs}
                        src={`${webcam.snapshotUrl}${webcam.snapshotUrl.includes("?") ? "&" : "?"}t=${snapshotTs}`}
                        alt={webcam.name}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          display: "block",
                        }}
                        loading="eager"
                        onError={(e) => {
                          // Si le cache-busting casse l'URL, réessayer sans
                          (e.target as HTMLImageElement).src = webcam.snapshotUrl;
                        }}
                      />
                      {/* Badge refresh */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 4,
                          right: 4,
                          background: "rgba(0,0,0,0.65)",
                          borderRadius: 4,
                          padding: "2px 5px",
                          fontSize: 6,
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: countdown <= 5 ? "#22c55e" : "#475569",
                          }}
                        />
                        {countdown}s
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSnapshotTs(Date.now());
                            setCountdown(30);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#60a5fa",
                            fontSize: 7,
                            cursor: "pointer",
                            padding: "0 0 0 3px",
                          }}
                          title="Rafraîchir maintenant"
                        >
                          ↺
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              {/* Pied de popup : liens */}
              <div
                style={{
                  padding: "5px 10px",
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  flexWrap: "wrap",
                }}
              >
                {webcam.streamUrl && (
                  <a
                    href={webcam.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#60a5fa",
                      fontSize: 6,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    ▶ Ouvrir en direct
                  </a>
                )}
                {webcam.snapshotUrl && !webcam.streamUrl && (
                  <a
                    href={webcam.snapshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#60a5fa",
                      fontSize: 6,
                      textDecoration: "none",
                    }}
                  >
                    ↗ Ouvrir l'image
                  </a>
                )}
                {!webcam.online && (
                  <span style={{ fontSize: 6, color: "#ef4444" }}>
                    Caméra hors ligne
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

interface WebcamMarkersProps {
  models: TileModel[];
}

export default function WebcamMarkers({ models }: WebcamMarkersProps) {
  const { collidersRef, version } = useColliders();
  const { layers, realTimeEnabled } = useLayersStore();
  const layerCfg = layers.media;

  // Référence scène (même logique que les autres data layers)
  const refX = models.length > 0 ? models[0].coordinates.x / 1000 : 0;
  const refY = models.length > 0 ? models[0].coordinates.y / 1000 : 0;

  const { webcams } = useMediaData({
    tileCoords: models.map((m) => m.coord),
    polling: layerCfg.visible,
    realTime: layerCfg.visible && realTimeEnabled,
  });

  const colliderOccludeRefs = useMemo(
    () => collidersRef.current.map((m) => ({ current: m })),
    [collidersRef, version]
  );

  if (!layerCfg.visible || models.length === 0) return null;

  return (
    <>
      {webcams.map((webcam) => {
        const sx = webcam.position.lx - refX;
        const sy = webcam.position.altitude / 1000;
        const sz = -(webcam.position.ly - refY);
        return (
          <WebcamMarker
            key={webcam.webcamId}
            webcam={webcam}
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
