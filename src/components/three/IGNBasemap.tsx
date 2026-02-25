"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import {
  calculateBoundingBox,
  boundingBoxToWgs84,
  buildIGNWmsUrl,
  IGNLayer,
} from "@/utils/coordinateUtils";

interface TileData {
  x: number; // km
  y: number; // km
}

interface IGNBasemapProps {
  tiles: TileData[];
  referenceX: number; // km
  referenceY: number; // km
  marginKm?: number;
  opacity?: number;
  yOffset?: number;
  layer?: IGNLayer;
  resolution?: number;
}

function BasemapPlane({
  textureUrl,
  planeWidth,
  planeHeight,
  positionX,
  positionZ,
  yOffset,
  opacity,
}: {
  textureUrl: string;
  planeWidth: number;
  planeHeight: number;
  positionX: number;
  positionZ: number;
  yOffset: number;
  opacity: number;
}) {
  const texture = useTexture(textureUrl);

  React.useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[positionX, yOffset, positionZ]}
    >
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

export default function IGNBasemap({
  tiles,
  referenceX,
  referenceY,
  marginKm = 3,
  opacity = 1,
  yOffset = 0,
  layer = 'PLANIGNV2',
  resolution = 2048,
}: IGNBasemapProps) {
  const basemapData = useMemo(() => {
    if (tiles.length === 0) return null;

    try {
      const bboxL93 = calculateBoundingBox(tiles, marginKm);
      const bboxWgs84 = boundingBoxToWgs84(bboxL93);
      const textureUrl = buildIGNWmsUrl(bboxWgs84, { layer, width: resolution, height: resolution });

      const planeWidth = (bboxL93.maxX - bboxL93.minX) / 1000;
      const planeHeight = (bboxL93.maxY - bboxL93.minY) / 1000;

      const centerXkm = (bboxL93.minX + bboxL93.maxX) / 2 / 1000;
      const centerYkm = (bboxL93.minY + bboxL93.maxY) / 2 / 1000;

      const positionX = centerXkm - referenceX;
      const positionZ = -(centerYkm - referenceY);

      return { textureUrl, planeWidth, planeHeight, positionX, positionZ };
    } catch (e) {
      console.warn("IGNBasemap: erreur calcul bbox, fond de carte désactivé", e);
      return null;
    }
  }, [tiles, referenceX, referenceY, marginKm, layer, resolution]);

  if (!basemapData) return null;

  return (
    <React.Suspense
      fallback={
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[basemapData.positionX, yOffset, basemapData.positionZ]}
        >
          <planeGeometry args={[basemapData.planeWidth, basemapData.planeHeight]} />
          <meshBasicMaterial color="#888888" side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      }
    >
      <BasemapPlane
        textureUrl={basemapData.textureUrl}
        planeWidth={basemapData.planeWidth}
        planeHeight={basemapData.planeHeight}
        positionX={basemapData.positionX}
        positionZ={basemapData.positionZ}
        yOffset={yOffset}
        opacity={opacity}
      />
    </React.Suspense>
  );
}
