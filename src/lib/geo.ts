// =============================================================================
// geo.ts — utilitaires géographiques côté serveur (API routes)
// =============================================================================
// proj4 est déjà dans les dépendances du projet.
// EPSG:2154 = Lambert-93 (unité : mètres)
// EPSG:4326 = WGS-84 (lon/lat en degrés)
// =============================================================================

import proj4 from "proj4";
import type { GeoPoint, WindDirection } from "@/types/data-layers";

// Projections déjà déclarées dans coordinateUtils.ts mais on les redéfinit
// ici pour l'usage server-only (API routes ne font pas tourner le bundle client).
proj4.defs(
  "EPSG:2154",
  "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

/** WGS-84 (lon, lat) → Lambert-93 en km */
export function wgs84ToLambert93Km(lon: number, lat: number): { lx: number; ly: number } {
  const [x, y] = proj4("EPSG:4326", "EPSG:2154", [lon, lat]);
  return { lx: x / 1000, ly: y / 1000 };
}

/** Lambert-93 km → WGS-84 (lon, lat) */
export function lambert93KmToWgs84(lx: number, ly: number): [number, number] {
  const [lon, lat] = proj4("EPSG:2154", "EPSG:4326", [lx * 1000, ly * 1000]);
  return [lon, lat];
}

/** GeoPoint depuis WGS-84 */
export function geoPointFromWgs84(lon: number, lat: number, altM: number): GeoPoint {
  return { ...wgs84ToLambert93Km(lon, lat), altitude: altM };
}

// ---------------------------------------------------------------------------
// Degrés → WindDirection
// ---------------------------------------------------------------------------

const WIND_DIRS: WindDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function degreesToWindDir(deg: number): WindDirection {
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return WIND_DIRS[idx];
}

// ---------------------------------------------------------------------------
// Centres de référence (Dent du Géant et massifs voisins)
// ---------------------------------------------------------------------------

/** Positions WGS-84 des points de référence alpins utilisés par les routes */
export const ALPINE_REFS = {
  dentGeant:  { lat: 45.8567, lon: 6.9553, alt: 4013 },
  meije:      { lat: 45.0086, lon: 6.3447, alt: 3983 },
  ecrins:     { lat: 44.9244, lon: 6.3578, alt: 4102 },
} as const;

// ---------------------------------------------------------------------------
// Timestamp ISO now()
// ---------------------------------------------------------------------------

export function nowISO(): string {
  return new Date().toISOString();
}

export function isoFromHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

// ---------------------------------------------------------------------------
// UUID sans crypto.randomUUID (compatible Edge Runtime)
// ---------------------------------------------------------------------------

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
