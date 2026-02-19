"use client";

import * as THREE from "three";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useAppContext } from "@/contexts/AppContext";

interface MeasurementPoint {
  position: THREE.Vector3;
  normal: THREE.Vector3;
}

// Facteur d'échelle pour convertir les unités Three.js en mètres réels
// Les dalles sont en km, donc 1 unité = 1 km = 1000 mètres
const SCALE_TO_METERS = 1000;

export default function MeasurementTool() {
  const { camera, gl } = useThree();
  const { collidersRef } = useColliders();
  const { measurementEnabled, setMeasurementData, resetMeasurement, measurementData } = useAppContext();
  const raycaster = useRef(new THREE.Raycaster());

  const [points, setPoints] = useState<MeasurementPoint[]>([]);
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);
  const [isPlacingPoints, setIsPlacingPoints] = useState(true); // État pour savoir si on place des points

  // Raycast vers le terrain
  const raycastTerrain = useCallback((event: MouseEvent): MeasurementPoint | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.current.setFromCamera(mouse, camera);

    const colliders = collidersRef.current;
    if (colliders.length === 0) return null;

    const intersects = raycaster.current.intersectObjects(colliders, false);

    if (intersects.length > 0) {
      return {
        position: intersects[0].point.clone(),
        normal: intersects[0].face?.normal.clone() || new THREE.Vector3(0, 1, 0)
      };
    }
    return null;
  }, [camera, gl, collidersRef]);

  // Raycast à une position spécifique pour obtenir l'altitude
  const raycastAtPosition = useCallback((x: number, z: number): number | null => {
    const colliders = collidersRef.current;
    if (colliders.length === 0) return null;

    const origin = new THREE.Vector3(x, 1000, z);
    const direction = new THREE.Vector3(0, -1, 0);
    raycaster.current.set(origin, direction);

    const intersects = raycaster.current.intersectObjects(colliders, false);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }
    return null;
  }, [collidersRef]);

  // Calculer la distance horizontale entre deux points (ignore Y/altitude)
  const horizontalDistance = (p1: THREE.Vector3, p2: THREE.Vector3): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
  };

  // Calculer le profil altimétrique entre tous les points
  // Échantillonne le terrain réel pour montrer la vraie surface avec toutes les aspérités
  // Utilise la distance HORIZONTALE en abscisse (pas la distance sur la surface)
  const calculateFullElevationProfile = useCallback((allPoints: THREE.Vector3[], measurePoints: MeasurementPoint[]) => {
    if (allPoints.length < 2) return { profile: [], pointIndices: [] };

    const profile: { distance: number; altitude: number; isUserPoint: boolean; pointIndex: number | null }[] = [];
    const pointIndices: number[] = []; // Indices dans profile où se trouvent les points utilisateur
    let cumulativeDistance = 0;

    // Calculer la distance horizontale totale (pas la distance 3D)
    let totalDist = 0;
    for (let i = 0; i < allPoints.length - 1; i++) {
      totalDist += horizontalDistance(allPoints[i], allPoints[i + 1]);
    }

    // Échantillonner tous les ~5 mètres (0.005 km) pour avoir une résolution très fine
    // Maximum 500 points pour garder de bonnes performances
    const samplingInterval = 0.005; // 5 mètres en km
    const totalSamples = Math.min(500, Math.max(100, Math.ceil(totalDist / samplingInterval)));

    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];
      const segmentDist = horizontalDistance(start, end); // Distance horizontale du segment

      // Nombre de samples pour ce segment proportionnel à sa longueur
      const segmentSamples = Math.max(20, Math.ceil((segmentDist / totalDist) * totalSamples));

      for (let j = 0; j <= segmentSamples; j++) {
        // Skip the first point of each segment except the first one
        if (i > 0 && j === 0) continue;

        const t = j / segmentSamples;
        const x = start.x + (end.x - start.x) * t;
        const z = start.z + (end.z - start.z) * t;
        const altitude = raycastAtPosition(x, z);

        if (altitude !== null) {
          // Distance horizontale depuis le départ
          const distanceFromStart = (cumulativeDistance + segmentDist * t) * SCALE_TO_METERS;
          const isUserPoint = (j === 0 && i === 0) || (j === segmentSamples);
          const pointIndex = isUserPoint ? (j === 0 ? i : i + 1) : null;

          if (isUserPoint && pointIndex !== null) {
            pointIndices.push(profile.length);
          }

          profile.push({
            distance: distanceFromStart,
            altitude: altitude * SCALE_TO_METERS,
            isUserPoint,
            pointIndex
          });
        }
      }
      cumulativeDistance += segmentDist;
    }

    return { profile, pointIndices };
  }, [raycastAtPosition]);

  // Mettre à jour les données de mesure dans le contexte
  const updateMeasurementData = useCallback((newPoints: MeasurementPoint[]) => {
    if (newPoints.length < 2) {
      const contextPoints = newPoints.map(p => ({
        position: { x: p.position.x, y: p.position.y, z: p.position.z },
        altitude: p.position.y * SCALE_TO_METERS
      }));

      setMeasurementData({
        points: contextPoints,
        segments: [],
        startPoint: contextPoints[0] || null,
        endPoint: null,
        totalDistance: null,
        distance: null,
        slope: null,
        elevationDiff: null,
        elevationProfile: []
      });
      return;
    }

    // Calculer les segments
    const segments = [];
    let totalDistance = 0;

    for (let i = 0; i < newPoints.length - 1; i++) {
      const start = newPoints[i].position;
      const end = newPoints[i + 1].position;

      const distance3D = start.distanceTo(end);
      const distance2D = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
      );
      const elevationDiff = (end.y - start.y) * SCALE_TO_METERS;
      const slope = Math.atan2(
        Math.abs(elevationDiff),
        distance2D * SCALE_TO_METERS
      ) * (180 / Math.PI);

      segments.push({
        distance: distance3D,
        slope: slope,
        elevationDiff: elevationDiff
      });

      totalDistance += distance3D;
    }

    // Profil altimétrique complet avec indices des points
    const positions = newPoints.map(p => p.position);
    const { profile } = calculateFullElevationProfile(positions, newPoints);

    // Pente moyenne pondérée par la distance
    const avgSlope = segments.reduce((acc, seg) =>
      acc + seg.slope * seg.distance, 0) / totalDistance;

    // Points pour le contexte
    const contextPoints = newPoints.map(p => ({
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      altitude: p.position.y * SCALE_TO_METERS
    }));

    const firstPoint = newPoints[0].position;
    const lastPoint = newPoints[newPoints.length - 1].position;
    const totalElevationDiff = (lastPoint.y - firstPoint.y) * SCALE_TO_METERS;

    setMeasurementData({
      points: contextPoints,
      segments: segments,
      startPoint: contextPoints[0],
      endPoint: contextPoints[contextPoints.length - 1],
      totalDistance: totalDistance,
      distance: totalDistance,
      slope: avgSlope,
      elevationDiff: totalElevationDiff,
      elevationProfile: profile.map(p => ({ distance: p.distance, altitude: p.altitude }))
    });
  }, [calculateFullElevationProfile, setMeasurementData]);

  // Gérer le clic gauche pour placer un point
  const handleClick = useCallback((event: MouseEvent) => {
    if (!measurementEnabled || !isPlacingPoints) return;
    if (event.button !== 0) return; // Seulement clic gauche

    const hit = raycastTerrain(event);
    if (!hit) return;

    setPoints(prev => {
      const newPoints = [...prev, hit];
      setTimeout(() => updateMeasurementData(newPoints), 0);
      return newPoints;
    });
  }, [measurementEnabled, isPlacingPoints, raycastTerrain, updateMeasurementData]);

  // Gérer le clic droit pour arrêter de placer des points
  const handleRightClick = useCallback((event: MouseEvent) => {
    if (!measurementEnabled) return;
    event.preventDefault();

    // Arrêter de placer des points mais garder la mesure active
    setIsPlacingPoints(false);
    setHoverPoint(null);
  }, [measurementEnabled]);

  // Gérer le survol
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!measurementEnabled || !isPlacingPoints) return;

    const hit = raycastTerrain(event);
    setHoverPoint(hit ? hit.position : null);
  }, [measurementEnabled, isPlacingPoints, raycastTerrain]);

  // Attacher les événements
  useEffect(() => {
    if (!measurementEnabled) {
      setHoverPoint(null);
      return;
    }

    const canvas = gl.domElement;
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("contextmenu", handleRightClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("contextmenu", handleRightClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [measurementEnabled, gl, handleClick, handleRightClick, handleMouseMove]);

  // Référence pour savoir si c'était activé avant
  const wasEnabledRef = useRef(measurementEnabled);

  // Quand on active/désactive la mesure
  useEffect(() => {
    const wasEnabled = wasEnabledRef.current;
    wasEnabledRef.current = measurementEnabled;

    if (measurementEnabled && !wasEnabled) {
      // On vient d'activer la mesure
      // Toujours recommencer une nouvelle mesure
      setPoints([]);
      setIsPlacingPoints(true);
      resetMeasurement();
    } else if (!measurementEnabled && wasEnabled) {
      // On vient de désactiver la mesure
      setIsPlacingPoints(false);
      setHoverPoint(null);
      // On garde les données pour qu'elles restent visibles dans le panneau
    }
  }, [measurementEnabled, resetMeasurement]);

  if (!measurementEnabled) return null;

  // Construire les lignes entre tous les points
  const lineSegments: [number, number, number][][] = [];

  for (let i = 0; i < points.length - 1; i++) {
    lineSegments.push([
      [points[i].position.x, points[i].position.y + 0.01, points[i].position.z],
      [points[i + 1].position.x, points[i + 1].position.y + 0.01, points[i + 1].position.z]
    ]);
  }

  // Ligne vers le point de survol (seulement si on place des points)
  if (points.length > 0 && hoverPoint && isPlacingPoints) {
    const lastPoint = points[points.length - 1].position;
    lineSegments.push([
      [lastPoint.x, lastPoint.y + 0.01, lastPoint.z],
      [hoverPoint.x, hoverPoint.y + 0.01, hoverPoint.z]
    ]);
  }

  return (
    <group>
      {/* Points de mesure */}
      {points.map((point, index) => (
        <group key={index}>
          <mesh position={[point.position.x, point.position.y + 0.002, point.position.z]}>
            <sphereGeometry args={[0.004, 12, 12]} />
            <meshBasicMaterial color={index === 0 ? "#22c55e" : index === points.length - 1 ? "#ef4444" : "#3b82f6"} />
          </mesh>
          <Html position={[point.position.x, point.position.y + 0.02, point.position.z]} center>
            <div className="bg-slate-800/90 text-white px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">
              {index + 1}
            </div>
          </Html>
        </group>
      ))}

      {/* Point de survol */}
      {hoverPoint && isPlacingPoints && (
        <mesh position={[hoverPoint.x, hoverPoint.y + 0.002, hoverPoint.z]}>
          <sphereGeometry args={[0.003, 8, 8]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Lignes de mesure */}
      {lineSegments.map((segment, index) => (
        <Line
          key={index}
          points={segment}
          color={index < points.length - 1 ? "#ef4444" : "#3b82f6"}
          lineWidth={2}
          dashed={index === lineSegments.length - 1 && points.length > 0 && hoverPoint !== null && isPlacingPoints}
          dashSize={0.02}
          gapSize={0.01}
        />
      ))}

    </group>
  );
}
