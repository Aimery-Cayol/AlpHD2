"use client";

import React, { useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";

export default function Compass3D() {
  const { cameraRotation } = useAppContext();

  const azimuthDeg = useMemo(() => {
    if (!cameraRotation) return 0;
    return -(cameraRotation.y * 180) / Math.PI;
  }, [cameraRotation]);

  // Taille de la rose
  const SIZE = 52;
  const CENTER = SIZE / 2;

  return (
    <div
      className="absolute bottom-3 right-3 z-50 pointer-events-none"
      style={{
        width: SIZE,
        // La flèche dépasse vers le haut depuis le centre de la rose
        // flèche : ~28px au-dessus du centre → total height = CENTER + 28
        height: CENTER + 28 + SIZE,
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Flèche verticale — base au centre de la rose                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          position: "absolute",
          left: CENTER,
          // Le bas de la tige est au centre de la rose (top = 28px = décalage flèche)
          bottom: CENTER,
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Pointe */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderBottom: "9px solid #2563eb",
          }}
        />
        {/* Tige — part de la pointe jusqu'au centre de la rose */}
        <div
          style={{
            width: 3,
            height: 19,
            background: "#2563eb",
            borderRadius: "0 0 2px 2px",
          }}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Rose de boussole                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: SIZE,
          height: SIZE,
        }}
      >
        {/* Cercle de fond */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "rgba(15, 23, 42, 0.80)",
            border: "1.5px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
          }}
        />

        {/* Contenu tournant (aiguille + graduations) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${azimuthDeg}deg)`,
            transition: "transform 60ms ease-out",
          }}
        >
          {/* Aiguille Nord (rouge) — pointe vers le haut */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translateX(-50%) translateY(-100%)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderBottom: "7px solid #ef4444",
                }}
              />
              <div
                style={{
                  width: 3,
                  height: 12,
                  background: "#ef4444",
                  borderRadius: "0 0 1px 1px",
                }}
              />
            </div>
          </div>

          {/* Aiguille Sud (gris) */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                width: 3,
                height: 12,
                background: "rgba(255,255,255,0.3)",
                borderRadius: "0 0 2px 2px",
              }}
            />
          </div>

          {/* Petits tirets cardinaux E / W */}
          {[90, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const r = CENTER - 4;
            return (
              <div
                key={angle}
                style={{
                  position: "absolute",
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                  left: CENTER + r * Math.sin(rad) - 1.5,
                  top: CENTER - r * Math.cos(rad) - 1.5,
                }}
              />
            );
          })}
        </div>

        {/* Label N — contre-rotatif pour rester lisible */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: "50%",
            transform: `translateX(-50%) rotate(${-azimuthDeg}deg)`,
            transition: "transform 60ms ease-out",
            fontSize: 8,
            fontWeight: 900,
            color: "#ef4444",
            lineHeight: 1,
            textShadow: "0 0 4px rgba(0,0,0,0.9)",
          }}
        >
          N
        </div>

        {/* Point central */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.7)",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 3px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </div>
  );
}
