"use client";

import React, { useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";

// Composant flèche CSS 3D
function Arrow({
  rotateX = 0,
  rotateZ = 0,
  color,
  label,
  counterRotateX,
  counterRotateY,
}: {
  rotateX?: number;
  rotateZ?: number;
  color: string;
  label?: string;
  counterRotateX?: number;
  counterRotateY?: number;
}) {
  return (
    <div
      className="absolute top-1/2 left-1/2"
      style={{
        transform: `translate(-50%, -50%) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Tige - faces multiples pour visibilité 3D */}
      <div
        className="absolute"
        style={{
          width: "4px",
          height: "18px",
          backgroundColor: color,
          bottom: "0",
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "1px",
        }}
      />
      <div
        className="absolute"
        style={{
          width: "4px",
          height: "18px",
          backgroundColor: color,
          bottom: "0",
          left: "50%",
          transform: "translateX(-50%) rotateY(90deg)",
          borderRadius: "1px",
          opacity: 0.7,
        }}
      />
      {/* Pointe */}
      <div
        className="absolute"
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: `10px solid ${color}`,
          bottom: "18px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      {/* Label billboard */}
      {label && counterRotateX !== undefined && counterRotateY !== undefined && (
        <div
          className="absolute"
          style={{
            bottom: "32px",
            left: "50%",
            transform: `translateX(-50%) rotateZ(${-rotateZ}deg) rotateY(${counterRotateY}deg) rotateX(${-rotateX + counterRotateX}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <span
            className="text-[11px] font-black"
            style={{
              color: color,
              textShadow: "0 0 3px white, 0 0 3px white, 0 0 5px white",
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Compass3D() {
  const { cameraRotation } = useAppContext();

  const { rotateX, rotateY, counterRotateX, counterRotateY } = useMemo(() => {
    if (!cameraRotation) return { rotateX: -30, rotateY: 0, counterRotateX: 30, counterRotateY: 0 };

    const camRotX = (cameraRotation.x * 180) / Math.PI;
    const camRotY = (cameraRotation.y * 180) / Math.PI;

    // rotateX pour l'inclinaison (polar angle)
    const rx = camRotX - 90;
    // rotateY pour l'azimut (rotation horizontale) - les flèches pointent en Z
    const ry = camRotY;

    return {
      rotateX: rx,
      rotateY: ry,
      counterRotateX: -rx,
      counterRotateY: -ry,
    };
  }, [cameraRotation]);

  return (
    <div className="absolute bottom-3 right-3 z-50 pointer-events-none">
      <div
        className="w-16 h-16 flex items-center justify-center"
        style={{ perspective: "150px" }}
      >
        {/* Conteneur 3D */}
        <div
          className="relative w-12 h-12"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transition: "transform 50ms ease-out",
          }}
        >
          {/* Point central */}
          <div
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-slate-500"
            style={{ transform: "translate(-50%, -50%)" }}
          />

          {/* Flèche Nord */}
          <Arrow
            rotateX={-90}
            rotateZ={180}
            color="#1e293b"
            label="N"
            counterRotateX={counterRotateX}
            counterRotateY={counterRotateY}
          />

          {/* Flèche Sud */}
          <Arrow
            rotateX={-90}
            rotateZ={0}
            color="#1e293b"
            label="S"
            counterRotateX={counterRotateX}
            counterRotateY={counterRotateY}
          />

          {/* Flèche Ciel (bleue, sans label) */}
          <Arrow
            rotateX={0}
            rotateZ={0}
            color="#2563eb"
          />
        </div>
      </div>
    </div>
  );
}
