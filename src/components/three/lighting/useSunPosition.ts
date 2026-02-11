import { useMemo } from "react";

/**
 * Hook pour calculer la position du soleil en coordonnées cartésiennes
 * à partir d'angles sphériques (azimuth et élévation)
 * 
 * @param azimuth - Angle azimuthal en degrés (0-360°)
 * @param elevation - Angle d'élévation en degrés (0-90°)
 * @param distance - Distance du soleil (par défaut: 10)
 * @returns Position 3D du soleil [x, y, z]
 */
export function useSunPosition(
  azimuth: number,
  elevation: number,
  distance: number = 10
): [number, number, number] {
  return useMemo(() => {
    const azRad = (azimuth * Math.PI) / 180;
    const elRad = (elevation * Math.PI) / 180;

    return [
      distance * Math.cos(elRad) * Math.sin(azRad),
      distance * Math.sin(elRad),
      -distance * Math.cos(elRad) * Math.cos(azRad), // Inversion nord/sud
    ] as [number, number, number];
  }, [azimuth, elevation, distance]);
}
