"use client";

import React, { useEffect, useState, useRef } from "react";

interface LoadingOverlayProps {
  visible: boolean;
  progress: number; // 0 to 1
}

// Le bonhomme grimpe le flanc gauche de la montagne (de bas-gauche vers le sommet)
// Flanc gauche : de (60, 170) à (150, 50)
function getClimberPosition(progress: number) {
  const startX = 65, startY = 165;
  const peakX = 150, peakY = 55;
  const t = Math.min(1, Math.max(0, progress));
  return {
    x: startX + (peakX - startX) * t,
    y: startY + (peakY - startY) * t,
  };
}

const MAX_OVERLAY_DURATION_MS = 7000;

export default function LoadingOverlay({ visible, progress }: LoadingOverlayProps) {
  const [show, setShow] = useState(visible);
  const [fadeOut, setFadeOut] = useState(false);
  const [forceHide, setForceHide] = useState(false);

  // Quand visible passe à true : afficher, reset le forceHide et lancer le timer de 7s
  useEffect(() => {
    if (visible) {
      setShow(true);
      setFadeOut(false);
      setForceHide(false);

      const maxTimer = setTimeout(() => setForceHide(true), MAX_OVERLAY_DURATION_MS);
      return () => clearTimeout(maxTimer);
    } else if (show) {
      setFadeOut(true);
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quand le timer de 7s expire : fade-out
  useEffect(() => {
    if (forceHide && show) {
      setFadeOut(true);
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [forceHide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progression temporelle : avance de 0 à 1 en 7s (ease-out)
  const [timeProgress, setTimeProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const t = Math.min(1, elapsed / MAX_OVERLAY_DURATION_MS);
      // ease-out cubique pour un mouvement naturel
      setTimeProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]);

  if (!show) return null;

  // Prendre le max entre progression réelle et progression temporelle
  const effectiveProgress = Math.max(progress, timeProgress);
  const pos = getClimberPosition(effectiveProgress);
  const pct = Math.round(effectiveProgress * 100);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <svg
        viewBox="0 0 300 220"
        className="w-96 h-64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Montagne principale */}
        <path
          d="M60 170 L150 50 L240 170 Z"
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: 600,
            strokeDashoffset: 0,
            animation: "mountain-draw 1.5s ease-out forwards",
          }}
        />
        {/* Neige au sommet */}
        <path
          d="M130 82 L150 50 L170 82 L160 78 L150 85 L140 78 Z"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: 600,
            strokeDashoffset: 0,
            animation: "mountain-draw 1.5s ease-out forwards 0.4s",
          }}
        />
        {/* Petite montagne derriere */}
        <path
          d="M170 170 L210 110 L250 170"
          stroke="white"
          strokeWidth="1"
          strokeLinejoin="round"
          fill="none"
          opacity="0.3"
          style={{
            strokeDasharray: 600,
            strokeDashoffset: 0,
            animation: "mountain-draw 1.5s ease-out forwards 0.6s",
          }}
        />
        {/* Sol */}
        <line
          x1="30" y1="170" x2="270" y2="170"
          stroke="white" strokeWidth="1" opacity="0.2"
        />

        {/* Trace pointillee du chemin parcouru */}
        <line
          x1="65" y1="165"
          x2={pos.x} y2={pos.y}
          stroke="white" strokeWidth="1"
          strokeDasharray="3 4" opacity="0.3"
        />

        {/* Petits points de passage sur le chemin */}
        {[0.25, 0.5, 0.75].map((p) => {
          if (progress < p) return null;
          const dot = getClimberPosition(p);
          return (
            <circle
              key={p}
              cx={dot.x} cy={dot.y}
              r="1.5" fill="white" opacity="0.2"
            />
          );
        })}

        {/* Grimpeur : g externe = position, g interne = animation de marche */}
        <g transform={`translate(${pos.x}, ${pos.y})`}>
          <g style={{ animation: "climber-bob 0.6s ease-in-out infinite" }}>
            {/* Tete */}
            <circle cx="0" cy="-22" r="5" stroke="white" strokeWidth="1.5" fill="none" />
            {/* Corps */}
            <line x1="0" y1="-17" x2="0" y2="-2" stroke="white" strokeWidth="1.5" />
            {/* Bras gauche (tient le piolet) */}
            <line x1="0" y1="-12" x2="-10" y2="-6" stroke="white" strokeWidth="1.5" />
            {/* Bras droit (en haut, grimpe) */}
            <line x1="0" y1="-12" x2="8" y2="-18" stroke="white" strokeWidth="1.5" />
            {/* Jambe gauche (en avant) */}
            <line x1="0" y1="-2" x2="-6" y2="10" stroke="white" strokeWidth="1.5" />
            {/* Jambe droite (en arriere) */}
            <line x1="0" y1="-2" x2="5" y2="10" stroke="white" strokeWidth="1.5" />

            {/* Piolet dans la main gauche */}
            <line x1="-10" y1="-6" x2="-16" y2="-20" stroke="white" strokeWidth="1.2" />
            {/* Lame du piolet */}
            <path
              d="M-16 -20 L-22 -18 L-16 -16"
              stroke="white" strokeWidth="1.2"
              strokeLinejoin="round" fill="none"
            />
            {/* Pique en bas du piolet */}
            <line x1="-10" y1="-6" x2="-9" y2="-2" stroke="white" strokeWidth="1.2" />
          </g>
        </g>

        {/* Drapeau au sommet (visible si progres > 90%) */}
        {progress > 0.9 && (
          <g opacity={Math.min(1, (progress - 0.9) * 10)}>
            <line x1="150" y1="50" x2="150" y2="35" stroke="white" strokeWidth="1.5" />
            <path d="M150 35 L162 39 L150 43" fill="white" opacity="0.7" />
          </g>
        )}
      </svg>

      {/* Texte et progression */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
          Chargement du relief
        </p>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] font-bold text-white/40 tabular-nums">
          {pct}%
        </p>
      </div>

      <style jsx>{`
        @keyframes mountain-draw {
          from { stroke-dashoffset: 600; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes climber-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
