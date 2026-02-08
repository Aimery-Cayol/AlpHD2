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
  x: number;
  y: number;
}

interface IGNBasemapProps {
  tiles: TileData[];
  referenceX: number;
  referenceY: number;
  marginKm?: number;
  opacity?: number;
  yOffset?: number;
  layer?: IGNLayer;
  resolution?: number;
}

// Composant séparé qui utilise useTexture (nécessite Suspense)
function BasemapPlane({
  textureUrl,
  planeWidth,
  planeHeight,
  positionX,
  positionZ,
  yOffset,
}: {
  textureUrl: string;
  planeWidth: number;
  planeHeight: number;
  positionX: number;
  positionZ: number;
  yOffset: number;
}) {
  const texture = useTexture(textureUrl);

  // Configuration de la texture
  React.useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }, [texture]);


  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[positionX, yOffset, positionZ]}
      renderOrder={1}
    >
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
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
  }, [tiles, referenceX, referenceY, marginKm, layer, resolution]);

  if (!basemapData) return null;

  return (
    <React.Suspense
      fallback={
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[basemapData.positionX, yOffset, basemapData.positionZ]}
          renderOrder={1}
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
      />
    </React.Suspense>
  );
}
