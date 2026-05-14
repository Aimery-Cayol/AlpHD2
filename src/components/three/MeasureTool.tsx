"use client";

import * as THREE from "three";
import React, { useEffect, useCallback, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useColliders } from "@/contexts/ColliderContext";
import { useAppContext } from "@/contexts/AppContext";

const SEGMENT_SAMPLES = 25; // terrain-following samples per placed segment
const PROFILE_SAMPLES = 50; // samples for the elevation chart

export default function MeasureTool() {
  const { camera, gl } = useThree();
  const { collidersRef } = useColliders();
  const { measurementEnabled, measurementData, setMeasurementData, resetMeasurement } =
    useAppContext();

  const raycasterRef = useRef(new THREE.Raycaster());
  const prevEnabledRef = useRef(false);
  const isCapturingRef = useRef(false);
  const measurementDataRef = useRef(measurementData);
  const latestMouseRef = useRef({ clientX: 0, clientY: 0 });
  const rafRef = useRef<number | null>(null);

  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);
  // Terrain-following path for each segment between consecutive placed points
  const [terrainSegments, setTerrainSegments] = useState<THREE.Vector3[][]>([]);

  // Keep measurementDataRef in sync for stale-closure-safe reads in event handlers
  useEffect(() => {
    measurementDataRef.current = measurementData;
  }, [measurementData]);

  // Reset on fresh enable; clean up on disable
  useEffect(() => {
    if (measurementEnabled && !prevEnabledRef.current) {
      resetMeasurement();
      setTerrainSegments([]);
      setHoverPoint(null);
      isCapturingRef.current = true;
    }
    if (!measurementEnabled) {
      isCapturingRef.current = false;
      setHoverPoint(null);
      setTerrainSegments([]);
    }
    prevEnabledRef.current = measurementEnabled;
  }, [measurementEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const raycastTerrain = useCallback(
    (clientX: number, clientY: number): THREE.Intersection | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(mouse, camera);
      const colliders = collidersRef.current;
      if (colliders.length === 0) return null;
      const hits = raycasterRef.current.intersectObjects(colliders, false);
      return hits.length > 0 ? hits[0] : null;
    },
    [camera, gl, collidersRef],
  );

  // Raycast vertically downward to snap a horizontal (x, z) to the terrain surface
  const sampleAltitude = useCallback(
    (x: number, z: number): number | null => {
      raycasterRef.current.set(new THREE.Vector3(x, 10, z), new THREE.Vector3(0, -1, 0));
      raycasterRef.current.far = 20;
      const hits = raycasterRef.current.intersectObjects(collidersRef.current, false);
      raycasterRef.current.far = Infinity;
      return hits.length > 0 ? hits[0].point.y : null;
    },
    [collidersRef],
  );

  // Build a terrain-hugging polyline between two scene points
  const computeTerrainPath = useCallback(
    (start: THREE.Vector3, end: THREE.Vector3, samples: number): THREE.Vector3[] => {
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const path: THREE.Vector3[] = [];
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const sx = start.x + dx * t;
        const sz = start.z + dz * t;
        const altY = sampleAltitude(sx, sz);
        // +0.003 km (3 m) offset to stay above the surface
        const y = (altY !== null ? altY : start.y + (end.y - start.y) * t) + 0.003;
        path.push(new THREE.Vector3(sx, y, sz));
      }
      return path;
    },
    [sampleAltitude],
  );

  // Build the elevation profile (for the 2D chart) from start to end
  const computeProfile = useCallback(
    (start: THREE.Vector3, end: THREE.Vector3): { distance: number; altitude: number }[] => {
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const horizDistKm = Math.sqrt(dx * dx + dz * dz);
      const profile: { distance: number; altitude: number }[] = [];
      for (let i = 0; i <= PROFILE_SAMPLES; i++) {
        const t = i / PROFILE_SAMPLES;
        const sx = start.x + dx * t;
        const sz = start.z + dz * t;
        const altY = sampleAltitude(sx, sz);
        const altM =
          altY !== null ? altY * 1000 : (start.y + (end.y - start.y) * t) * 1000;
        profile.push({
          distance: Math.round(t * horizDistKm * 1000), // meters
          altitude: Math.round(altM), // meters
        });
      }
      return profile;
    },
    [sampleAltitude],
  );

  // Mousemove: update hover preview (RAF-throttled, always uses latest position)
  useEffect(() => {
    if (!measurementEnabled) return;
    const handleMove = (e: MouseEvent) => {
      if (!isCapturingRef.current) return;
      latestMouseRef.current = { clientX: e.clientX, clientY: e.clientY };
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const { clientX, clientY } = latestMouseRef.current;
        const hit = raycastTerrain(clientX, clientY);
        setHoverPoint(hit ? hit.point.clone() : null);
      });
    };
    gl.domElement.addEventListener("mousemove", handleMove);
    return () => {
      gl.domElement.removeEventListener("mousemove", handleMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [measurementEnabled, raycastTerrain, gl]);

  // Right-click: finish measurement (stop capturing, keep data)
  useEffect(() => {
    if (!measurementEnabled) return;
    const handleContext = (e: MouseEvent) => {
      e.preventDefault();
      isCapturingRef.current = false;
      setHoverPoint(null);
    };
    gl.domElement.addEventListener("contextmenu", handleContext);
    return () => gl.domElement.removeEventListener("contextmenu", handleContext);
  }, [measurementEnabled, gl]);

  // Click: place a measurement point
  useEffect(() => {
    if (!measurementEnabled) return;
    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!isCapturingRef.current) return;
      const hit = raycastTerrain(e.clientX, e.clientY);
      if (!hit) return;

      const { point } = hit;
      const altitude = point.y * 1000; // km → meters
      const prevPoints = measurementDataRef.current.points;

      // Terrain-following segment from the previous point to this new one
      if (prevPoints.length >= 1) {
        const prev = prevPoints[prevPoints.length - 1];
        const startVec = new THREE.Vector3(
          prev.position.x,
          prev.position.y,
          prev.position.z,
        );
        const seg = computeTerrainPath(startVec, point, SEGMENT_SAMPLES);
        setTerrainSegments((s) => [...s, seg]);
      }

      // Elevation profile from the very first point to this new one
      let elevationProfile: { distance: number; altitude: number }[] = [];
      if (prevPoints.length >= 1) {
        const firstPt = prevPoints[0];
        const startVec = new THREE.Vector3(
          firstPt.position.x,
          firstPt.position.y,
          firstPt.position.z,
        );
        elevationProfile = computeProfile(startVec, point);
      }

      setMeasurementData((prev) => {
        const newPoint = {
          position: { x: point.x, y: point.y, z: point.z },
          altitude,
        };
        const newPoints = [...prev.points, newPoint];

        if (newPoints.length < 2) {
          return { ...prev, points: newPoints, startPoint: newPoint };
        }

        let totalDistM = 0;
        const segments = newPoints.slice(1).map((pt, i) => {
          const a = newPoints[i].position;
          const b = pt.position;
          const segDistM = Math.sqrt((b.x - a.x) ** 2 + (b.z - a.z) ** 2) * 1000;
          const elevDiffM = (b.y - a.y) * 1000;
          const slope =
            segDistM > 0
              ? Math.atan2(Math.abs(elevDiffM), segDistM) * (180 / Math.PI)
              : 0;
          totalDistM += segDistM;
          return { distance: segDistM, slope, elevationDiff: elevDiffM };
        });

        const startPt = newPoints[0];
        const endPt = newPoints[newPoints.length - 1];
        const totalElevDiffM = (endPt.position.y - startPt.position.y) * 1000;
        const avgSlope =
          totalDistM > 0
            ? Math.atan2(Math.abs(totalElevDiffM), totalDistM) * (180 / Math.PI)
            : 0;

        return {
          points: newPoints,
          segments,
          startPoint: startPt,
          endPoint: endPt,
          totalDistance: totalDistM / 1000,
          distance: totalDistM / 1000, // km (display: ≥1 → km, <1 → m)
          slope: avgSlope,
          elevationDiff: totalElevDiffM,
          elevationProfile,
        };
      });
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [measurementEnabled, raycastTerrain, setMeasurementData, computeTerrainPath, computeProfile, gl]);

  const points = measurementData.points;
  if (!measurementEnabled || (points.length === 0 && !hoverPoint)) return null;

  const lastPt = points.length >= 1 ? points[points.length - 1].position : null;

  return (
    <>
      {/* Terrain-following lines between consecutive placed points */}
      {terrainSegments.map((seg, i) => (
        <Line
          key={i}
          points={seg.map((v) => [v.x, v.y, v.z] as [number, number, number])}
          color="#3b82f6"
          lineWidth={2}
        />
      ))}

      {/* Rubber-band preview from last placed point to cursor */}
      {hoverPoint && lastPt && (
        <Line
          points={[
            [lastPt.x, lastPt.y + 0.003, lastPt.z],
            [hoverPoint.x, hoverPoint.y + 0.003, hoverPoint.z],
          ] as [number, number, number][]}
          color="#94a3b8"
          lineWidth={1.5}
        />
      )}

      {/* Hover cursor sphere — plus visible avant le premier point placé */}
      {hoverPoint && points.length === 0 && (
        <mesh position={[hoverPoint.x, hoverPoint.y + 0.003, hoverPoint.z]}>
          <sphereGeometry args={[0.008, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} />
        </mesh>
      )}
      {hoverPoint && points.length > 0 && (
        <mesh position={[hoverPoint.x, hoverPoint.y + 0.003, hoverPoint.z]}>
          <sphereGeometry args={[0.003, 8, 8]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Placed point spheres */}
      {points.map((pt, idx) => {
        const color =
          idx === 0 ? "#22c55e" : idx === points.length - 1 ? "#ef4444" : "#3b82f6";
        return (
          <mesh
            key={idx}
            position={[pt.position.x, pt.position.y + 0.003, pt.position.z]}
          >
            <sphereGeometry args={[0.0015, 10, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
        );
      })}
    </>
  );
}
