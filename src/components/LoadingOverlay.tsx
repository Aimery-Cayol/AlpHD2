"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Ruler,
  Mountain,
  MapPin,
  Info,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

interface LoadingOverlayProps {
  visible: boolean;
  progress: number; // 0 to 1
}

const MAX_DURATION_MS = 9000;

const FEATURES = [
  {
    icon: <Plus className="w-4 h-4" />,
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.13)",
    border: "rgba(59,130,246,0.22)",
    title: "Zones voisines",
    desc: 'Les boutons "+" chargent les dalles adjacentes en haute résolution.',
  },
  {
    icon: <Ruler className="w-4 h-4" />,
    color: "#34d399",
    bg: "rgba(16,185,129,0.13)",
    border: "rgba(16,185,129,0.22)",
    title: "Mesure",
    desc: "Mesurez distances et dénivelés directement sur le terrain 3D.",
  },
  {
    icon: <Mountain className="w-4 h-4" />,
    color: "#fb923c",
    bg: "rgba(249,115,22,0.13)",
    border: "rgba(249,115,22,0.22)",
    title: "Voies",
    desc: "Visualisez les grandes voies d'alpinisme tracées en 3D sur le relief.",
  },
  {
    icon: <MapPin className="w-4 h-4" />,
    color: "#f472b6",
    bg: "rgba(244,114,182,0.13)",
    border: "rgba(244,114,182,0.22)",
    title: "Lieux",
    desc: "Épinglez et nommez vos points d'intérêt sur la carte.",
  },
  {
    icon: <Info className="w-4 h-4" />,
    color: "#c084fc",
    bg: "rgba(168,85,247,0.13)",
    border: "rgba(168,85,247,0.22)",
    title: "Info sommet",
    desc: "Accédez à l'historique, l'altitude et la description du sommet.",
  },
  {
    icon: <SlidersHorizontal className="w-4 h-4" />,
    color: "#94a3b8",
    bg: "rgba(100,116,139,0.13)",
    border: "rgba(100,116,139,0.22)",
    title: "Paramètres",
    desc: "Personnalisez matériaux, éclairage et fond de carte IGN.",
  },
];

export default function LoadingOverlay({ visible, progress }: LoadingOverlayProps) {
  const [show, setShow] = useState(visible);
  const [fadeOut, setFadeOut] = useState(false);
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      setFadeOut(false);
      setForceHide(false);
      const t = setTimeout(() => setForceHide(true), MAX_DURATION_MS);
      return () => clearTimeout(t);
    } else if (show) {
      setFadeOut(true);
      const t = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(t);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (forceHide && show) {
      setFadeOut(true);
      const t = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(t);
    }
  }, [forceHide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progression temporelle de secours (avance de 0→1 en MAX_DURATION_MS)
  const [timeProgress, setTimeProgress] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;
    startRef.current = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startRef.current) / MAX_DURATION_MS);
      setTimeProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  if (!show) return null;

  const eff = Math.max(progress, timeProgress);
  const pct = Math.round(eff * 100);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* ── En-tête ── */}
      <div className="text-center mb-6 px-6">
        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25 mb-2">
          Chargement du relief en cours
        </p>
        <h2 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
          Découvrez les outils disponibles
        </h2>
      </div>

      {/* ── Grille des fonctionnalités ── */}
      <div
        className="grid gap-2.5 px-5 w-full"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 480 }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 p-3 rounded-xl"
            style={{
              background: f.bg,
              border: `1px solid ${f.border}`,
            }}
          >
            {/* Icône colorée */}
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
              style={{ color: f.color, background: f.border }}
            >
              {f.icon}
            </div>
            {/* Nom */}
            <p
              className="text-[10px] font-bold leading-tight"
              style={{ color: f.color }}
            >
              {f.title}
            </p>
            {/* Description */}
            <p className="text-[9px] text-white/35 leading-[1.45]">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Barre de progression ── */}
      <div className="mt-8 flex flex-col items-center gap-2 w-full px-5" style={{ maxWidth: 480 }}>
        {/* Label */}
        <div className="flex justify-between w-full mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">
            Chargement des dalles
          </span>
          <span className="text-[10px] font-black text-white/40 tabular-nums">
            {pct}&thinsp;%
          </span>
        </div>

        {/* Barre */}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 60%, #93c5fd 100%)",
              boxShadow: "0 0 10px rgba(96,165,250,0.5)",
            }}
          />
        </div>

        {/* Segments discrets (jalons à 25, 50, 75 %) */}
        <div className="relative w-full h-1 -mt-1 pointer-events-none">
          {[0.25, 0.5, 0.75].map((p) => (
            <div
              key={p}
              className="absolute top-0 w-px h-3 -translate-x-1/2 -translate-y-1"
              style={{
                left: `${p * 100}%`,
                background: "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Navigation rapide ── */}
      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white/40 border border-white/10">
            clic gauche
          </kbd>
          <span className="text-[9px] text-white/25">Rotation</span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white/40 border border-white/10">
            molette
          </kbd>
          <span className="text-[9px] text-white/25">Zoom</span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white/40 border border-white/10">
            clic droit
          </kbd>
          <span className="text-[9px] text-white/25">Panoramique</span>
        </div>
      </div>
    </div>
  );
}
