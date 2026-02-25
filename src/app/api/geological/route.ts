// =============================================================================
// GET /api/geological — risque avalanche, zones, événements
// =============================================================================
// Source principale : Météo-France API BRA (Bulletin de Risque d'Avalanche)
// Fallback : zones mock réalistes basées sur la topographie réelle du massif
// Cache : 3 h (les BRA sont publiés à 16h et vers 6h en période de crise)
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { wgs84ToLambert93Km, nowISO, isoFromHoursAgo, uid } from "@/lib/geo";
import type {
  GeologicalData,
  AvalancheZone,
  AvalancheEvent,
  AvalancheRisk,
  GeoPoint,
  WindDirection,
} from "@/types/data-layers";

export const revalidate = 10800; // 3 h

// ---------------------------------------------------------------------------
// Météo-France BRA (API publique non documentée — fragile)
// Endpoint : https://mf-api.com/bra  (wrapper communautaire)
// On essaie, en cas d'échec on utilise les zones mock.
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
// Zones de risque avalanche réalistes — Massif du Mont-Blanc
// Polygones basés sur les zones topographiques réelles (WGS-84)
// ---------------------------------------------------------------------------

function makeGeoPoints(coords: [number, number, number][]): GeoPoint[] {
  return coords.map(([lon, lat, alt]) => {
    const { lx, ly } = wgs84ToLambert93Km(lon, lat);
    return { lx, ly, altitude: alt };
  });
}

function buildMockZones(massifRisk: AvalancheRisk): AvalancheZone[] {
  const now = nowISO();

  // Zones topographiques du massif Mont-Blanc / Dent du Géant
  return [
    {
      id:          uid(),
      zoneId:      "z-glacier-geant-nord",
      name:        "Glacier du Géant — face nord",
      timestamp:   now,
      updatedAt:   now,
      polygon:     makeGeoPoints([
        [6.944, 45.874, 3400],
        [6.958, 45.872, 3500],
        [6.965, 45.862, 3800],
        [6.952, 45.855, 4000],
        [6.940, 45.858, 3900],
        [6.935, 45.867, 3600],
      ]),
      risk:          Math.min(5, massifRisk + 1) as AvalancheRisk,
      types:         ["slab"],
      aspects:       ["N", "NE", "NW"] as WindDirection[],
      elevationMin:  3400,
      elevationMax:  4013,
      comment:       "Plaques à vent persistantes après les dernières chutes",
    },
    {
      id:        uid(),
      zoneId:    "z-rochefort",
      name:      "Arête de Rochefort — versant NE",
      timestamp: now,
      updatedAt: now,
      polygon:   makeGeoPoints([
        [6.934, 45.875, 3700],
        [6.945, 45.872, 3800],
        [6.950, 45.865, 4001],
        [6.942, 45.862, 3900],
        [6.930, 45.869, 3750],
      ]),
      risk:          massifRisk,
      types:         ["slab", "loose"],
      aspects:       ["NE", "E"] as WindDirection[],
      elevationMin:  3700,
      elevationMax:  4001,
    },
    {
      id:        uid(),
      zoneId:    "z-vallee-blanche-sud",
      name:      "Vallée Blanche — dévers sud",
      timestamp: now,
      updatedAt: now,
      polygon:   makeGeoPoints([
        [6.920, 45.882, 3300],
        [6.938, 45.878, 3450],
        [6.940, 45.870, 3500],
        [6.925, 45.873, 3380],
      ]),
      risk:          Math.max(1, massifRisk - 1) as AvalancheRisk,
      types:         ["wet"],
      aspects:       ["S", "SE", "SW"] as WindDirection[],
      elevationMin:  3300,
      elevationMax:  3500,
      comment:       "Risque de plaquettes de neige humide l'après-midi",
    },
    {
      id:        uid(),
      zoneId:    "z-tour-ronde",
      name:      "Tour Ronde — face nord",
      timestamp: now,
      updatedAt: now,
      polygon:   makeGeoPoints([
        [6.950, 45.856, 3500],
        [6.958, 45.853, 3600],
        [6.962, 45.848, 3792],
        [6.954, 45.845, 3750],
        [6.948, 45.849, 3600],
      ]),
      risk:          Math.min(5, massifRisk + 1) as AvalancheRisk,
      types:         ["slab", "gliding"],
      aspects:       ["N", "NW"] as WindDirection[],
      elevationMin:  3500,
      elevationMax:  3792,
    },
  ];
}

function buildMockEvents(): AvalancheEvent[] {
  const now = nowISO();
  return [
    {
      id:        uid(),
      eventId:   "ev-2025-01",
      timestamp: isoFromHoursAgo(14),
      updatedAt: now,
      position:  { ...wgs84ToLambert93Km(6.951, 45.857), altitude: 3700 },
      type:      "slab",
      size:      2,
      runoutDistance: 180,
      confirmed: true,
    },
    {
      id:        uid(),
      eventId:   "ev-2025-02",
      timestamp: isoFromHoursAgo(36),
      updatedAt: now,
      position:  { ...wgs84ToLambert93Km(6.938, 45.874), altitude: 3850 },
      type:      "loose",
      size:      1,
      runoutDistance: 80,
      confirmed: false,
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

export async function GET() {
  try {
    // Tentative de récupération du risque réel (Météo-France ou autre)
    let massifRisk: AvalancheRisk = 3; // valeur par défaut conservative
    const liveRisk = await fetchMeteoranceBRA("mont-blanc");
    if (liveRisk) {
      massifRisk = liveRisk;
      console.log(`[geological] Risque BRA live : ${massifRisk}/5`);
    } else {
      console.log(`[geological] BRA non disponible — risque mock ${massifRisk}/5`);
    }

    const zones  = buildMockZones(massifRisk);
    const events = buildMockEvents();

    const body: GeologicalData = {
      avalancheZones:  zones,
      avalancheEvents: events,
      seismicEvents:   [],
      rockfalls:       [],
      massifRisk,
    };

    console.log(`[geological] ${zones.length} zones, ${events.length} événements`);

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=10800, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("[geological] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
