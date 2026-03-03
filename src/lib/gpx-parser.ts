// =============================================================================
// gpx-parser.ts — Parseur GPX minimal (server-safe, no external lib)
// =============================================================================
// Supporte GPX 1.1 : <trkpt>, <wpt>, <rtept> avec <ele> et <time>
// Usage :
//   import { parseGPX } from '@/lib/gpx-parser'
//   const points = parseGPX(xmlString) // → RoutePoint[]
// =============================================================================

import type { RoutePoint } from "@/types/routes";

/**
 * Parse un fichier GPX (string XML) et retourne un tableau de RoutePoint.
 * Lit les track points (<trkpt>), route points (<rtept>) et waypoints (<wpt>),
 * dans cet ordre de priorité.
 */
export function parseGPX(xml: string): RoutePoint[] {
  const points: RoutePoint[] = [];

  // Extrait tous les éléments de type point (trkpt en priorité, puis rtept, puis wpt)
  const tagPriority = ["trkpt", "rtept", "wpt"];

  for (const tag of tagPriority) {
    const regex = new RegExp(
      `<${tag}[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>[\\s\\S]*?<\\/${tag}>`,
      "g"
    );
    let match: RegExpExecArray | null;
    const eleRegex = /<ele>\s*([\d.+-]+)\s*<\/ele>/;

    while ((match = regex.exec(xml)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const eleMatch = eleRegex.exec(match[0]);
      const altM = eleMatch ? parseFloat(eleMatch[1]) : 0;

      points.push({ lat, lon, altM });
    }

    if (points.length > 0) break; // On a trouvé des points avec ce tag, on s'arrête
  }

  return points;
}

/**
 * Sous-échantillonne un tableau de points à maxPoints points maximum,
 * en gardant le premier, le dernier, et en sautant régulièrement.
 */
export function downsamplePoints(
  points: RoutePoint[],
  maxPoints: number
): RoutePoint[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const result: RoutePoint[] = [];
  for (let i = 0; i < points.length; i += step) {
    result.push(points[i]);
  }
  // Toujours inclure le dernier point
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }
  return result;
}
