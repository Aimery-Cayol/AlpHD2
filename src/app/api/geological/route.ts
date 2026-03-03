// =============================================================================
// GET /api/geological — risque avalanche, zones, événements (centré sur les dalles)
// =============================================================================
// Source principale : Météo-France API BRA (Bulletin de Risque d'Avalanche)
// Fallback : zones mock réalistes décalées vers les dalles demandées (param "tiles")
// Cache : 3 h
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { wgs84ToLambert93Km, lambert93KmToWgs84, nowISO, isoFromHoursAgo, uid } from "@/lib/geo";
import type {
  GeologicalData,
  AvalancheZone,
  AvalancheEvent,
  AvalancheRisk,
  GeoPoint,
  WindDirection,
} from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Centre de référence des données mock (Dent du Géant)
// ---------------------------------------------------------------------------

const REF_LAT = 45.8567;
const REF_LON = 6.9553;

function parseTileCenter(tilesParam: string | null): { lat: number; lon: number } {
  if (!tilesParam) return { lat: REF_LAT, lon: REF_LON };
  const coords = tilesParam
    .split(",")
    .map((t) => { const [x, y] = t.split("_").map(Number); return { x, y }; })
    .filter((c) => !isNaN(c.x) && !isNaN(c.y) && c.x > 0 && c.y > 0);
  if (coords.length === 0) return { lat: REF_LAT, lon: REF_LON };
  const avgX = coords.reduce((s, c) => s + c.x, 0) / coords.length + 0.5;
  const avgY = coords.reduce((s, c) => s + c.y, 0) / coords.length + 0.5;
  const [lon, lat] = lambert93KmToWgs84(avgX, avgY);
  return { lat, lon };
}

// ---------------------------------------------------------------------------
// Météo-France BRA (API publique non documentée — fragile)
// ---------------------------------------------------------------------------

const MF_BRA_URL = "https://api.meteo-forecast.com/mf/bra/massifs"; // placeholder

async function fetchMeteoranceBRA(massif: string): Promise<AvalancheRisk | null> {
  const apiKey = process.env.MF_BRA_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${MF_BRA_URL}/${massif}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 10800 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { risk?: number };
    const risk = data.risk;
    if (typeof risk === "number" && risk >= 1 && risk <= 5) {
      return risk as AvalancheRisk;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Zones mock (polygones en offsets lat/lon depuis le centre de référence)
// ---------------------------------------------------------------------------

function makeGeoPoints(
  offsets: [number, number, number][],
  centerLat: number,
  centerLon: number
): GeoPoint[] {
  return offsets.map(([dlat, dlon, alt]) => {
    const { lx, ly } = wgs84ToLambert93Km(centerLon + dlon, centerLat + dlat);
    return { lx, ly, altitude: alt };
  });
}

function buildMockZones(
  massifRisk: AvalancheRisk,
  centerLat: number,
  centerLon: number
): AvalancheZone[] {
  const now = nowISO();

  return [
    {
      id:        uid(),
      zoneId:    "z-face-nord",
      name:      "Face nord — plaques à vent",
      timestamp: now,
      updatedAt: now,
      polygon:   makeGeoPoints([
        [ 0.017, -0.013, 3400],
        [ 0.015,  0.001, 3500],
        [ 0.005,  0.008, 3800],
        [-0.002,  0.000, 4000],  // near summit
        [-0.003, -0.017, 3900],
        [ 0.010, -0.022, 3600],
      ], centerLat, centerLon),
      risk:         Math.min(5, massifRisk + 1) as AvalancheRisk,
      types:        ["slab"],
      aspects:      ["N", "NE", "NW"] as WindDirection[],
      elevationMin: 3400,
      elevationMax: 4100,
      comment:      "Plaques à vent persistantes après les dernières chutes",
    },
    {
      id:        uid(),
      zoneId:    "z-arete-e",
      name:      "Arête E — versant NE",
      timestamp: now,
      updatedAt: now,
      polygon:   makeGeoPoints([
        [ 0.023, -0.021, 3700],
        [ 0.015, -0.008, 3800],
        [ 0.006, -0.003, 4001],
        [-0.001, -0.015, 3900],
        [ 0.012, -0.027, 3750],
      ], centerLat, centerLon),
      risk:         massifRisk,
      types:        ["slab", "loose"],
      aspects:      ["NE", "E"] as WindDirection[],
      elevationMin: 3700,
      elevationMax: 4001,
    },
    {
      id:        uid(),
      zoneId:    "z-glacier-s",
      name:      "Glacier S — dévers",
      timestamp: now,
      updatedAt: now,
      polygon:   makeGeoPoints([
        [ 0.025, -0.037, 3300],
        [ 0.015, -0.019, 3450],
        [ 0.013, -0.027, 3500],
        [ 0.018, -0.042, 3380],
      ], centerLat, centerLon),
      risk:         Math.max(1, massifRisk - 1) as AvalancheRisk,
      types:        ["wet"],
      aspects:      ["S", "SE", "SW"] as WindDirection[],
      elevationMin: 3300,
      elevationMax: 3500,
      comment:      "Risque de plaquettes de neige humide l'après-midi",
    },
    {
      id:        uid(),
      zoneId:    "z-face-nw",
      name:      "Face NW",
      timestamp: now,
      updatedAt: now,
      polygon:   makeGeoPoints([
        [-0.007, -0.007, 3500],
        [ 0.001,  0.001, 3600],
        [ 0.005, -0.005, 3792],
        [-0.003, -0.012, 3750],
        [-0.009, -0.008, 3600],
      ], centerLat, centerLon),
      risk:         Math.min(5, massifRisk + 1) as AvalancheRisk,
      types:        ["slab", "gliding"],
      aspects:      ["N", "NW"] as WindDirection[],
      elevationMin: 3500,
      elevationMax: 3800,
    },
  ];
}

function buildMockEvents(centerLat: number, centerLon: number): AvalancheEvent[] {
  const now = nowISO();
  return [
    {
      id:             uid(),
      eventId:        "ev-recent-1",
      timestamp:      isoFromHoursAgo(14),
      updatedAt:      now,
      position:       { ...wgs84ToLambert93Km(centerLon + 0.002, centerLat - 0.006), altitude: 3700 },
      type:           "slab",
      size:           2,
      runoutDistance: 180,
      confirmed:      true,
    },
    {
      id:             uid(),
      eventId:        "ev-recent-2",
      timestamp:      isoFromHoursAgo(36),
      updatedAt:      now,
      position:       { ...wgs84ToLambert93Km(centerLon - 0.011, centerLat + 0.017), altitude: 3850 },
      type:           "loose",
      size:           1,
      runoutDistance: 80,
      confirmed:      false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Zod pour valider la réponse si on intègre une vraie API BRA
// ---------------------------------------------------------------------------

const BRAResponseSchema = z.object({
  massif:     z.string(),
  risk:       z.number().int().min(1).max(5),
  validUntil: z.string().optional(),
}).strict();

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const center = parseTileCenter(searchParams.get("tiles"));

    let massifRisk: AvalancheRisk = 3;
    const liveRisk = await fetchMeteoranceBRA("mont-blanc");
    if (liveRisk) {
      massifRisk = liveRisk;
      console.log(`[geological] Risque BRA live : ${massifRisk}/5`);
    } else {
      console.log(`[geological] BRA non disponible — risque mock ${massifRisk}/5`);
    }

    const zones  = buildMockZones(massifRisk, center.lat, center.lon);
    const events = buildMockEvents(center.lat, center.lon);

    const body: GeologicalData = {
      avalancheZones:  zones,
      avalancheEvents: events,
      seismicEvents:   [],
      rockfalls:       [],
      massifRisk,
    };

    console.log(`[geological] ${zones.length} zones @ (${center.lat.toFixed(4)}, ${center.lon.toFixed(4)})`);

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=10800, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("[geological] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
