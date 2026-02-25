// =============================================================================
// GET /api/environment — enneigement, glaciers, hydrologie
// =============================================================================
// Open-Meteo snow depth pour les stations fixes + données mock glaciaire.
// Cache : 3 h
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { geoPointFromWgs84, nowISO, isoFromHoursAgo, uid } from "@/lib/geo";
import type {
  EnvironmentData,
  SnowpackStation,
  GlacierSensor,
  HydrologicalStation,
} from "@/types/data-layers";

export const revalidate = 10800; // 3 h

// ---------------------------------------------------------------------------
// Stations d'enneigement (WGS-84)
// ---------------------------------------------------------------------------

const SNOW_STATIONS = [
  { id: "col-du-geant",     name: "Col du Géant",       lat: 45.8697, lon: 6.9711, alt: 3371 },
  { id: "aiguille-du-midi", name: "Aiguille du Midi",   lat: 45.8790, lon: 6.8870, alt: 3842 },
  { id: "chamonix",         name: "Chamonix village",   lat: 45.9237, lon: 6.8694, alt: 1035 },
  { id: "grands-montets",   name: "Grands Montets top", lat: 45.9494, lon: 6.9072, alt: 3295 },
] as const;

// ---------------------------------------------------------------------------
// Schéma Zod Open-Meteo (snowfall / snow depth en daily)
// ---------------------------------------------------------------------------

const SnowSchema = z.object({
  current: z.object({
    snow_depth:    z.number(), // mètres → *100 pour cm
    snowfall:      z.number(), // cm/h
    precipitation: z.number(), // mm/h
    temperature_2m:z.number(),
    relative_humidity_2m: z.number(),
  }),
});

// ---------------------------------------------------------------------------
// Fetch enneigement d'une station via Open-Meteo
// ---------------------------------------------------------------------------

async function fetchSnowpack(
  station: (typeof SNOW_STATIONS)[number]
): Promise<SnowpackStation | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",  String(station.lat));
  url.searchParams.set("longitude", String(station.lon));
  url.searchParams.set("elevation", String(station.alt));
  url.searchParams.set("current", [
    "snow_depth",
    "snowfall",
    "precipitation",
    "temperature_2m",
    "relative_humidity_2m",
  ].join(","));
  url.searchParams.set("timezone", "Europe/Paris");

  // Neige des dernières 24h et 72h via hourly puis agrégat
  url.searchParams.set("hourly", "snowfall");
  url.searchParams.set("past_days", "3");
  url.searchParams.set("forecast_days", "0");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 10800 } });
    if (!res.ok) return null;
    const raw: unknown = await res.json();

    const parsed = SnowSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn(`[environment] Validation snow échouée pour ${station.id}`);
      return null;
    }

    // Calcul neige fraîche 24h et 72h depuis les données hourly
    const hourly = (raw as { hourly?: { snowfall?: number[] } })?.hourly?.snowfall ?? [];
    const last24 = hourly.slice(-24).reduce((s, v) => s + (v ?? 0), 0);
    const last72 = hourly.slice(-72).reduce((s, v) => s + (v ?? 0), 0);

    const c = parsed.data.current;
    const now = nowISO();
    const humidity = c.relative_humidity_2m;
    const wetness =
      c.temperature_2m > 1 ? "wet" : humidity > 70 ? "moist" : "dry";

    return {
      id:          uid(),
      stationId:   station.id,
      name:        station.name,
      timestamp:   now,
      updatedAt:   now,
      position:    geoPointFromWgs84(station.lon, station.lat, station.alt),
      snowDepth:   Math.round(c.snow_depth * 100),  // m → cm
      snowDensity: wetness === "wet" ? 420 : wetness === "moist" ? 320 : 220,
      wetness,
      newSnow24h:  Math.round(last24),
      newSnow72h:  Math.round(last72),
    };
  } catch (err) {
    console.error(`[environment] Erreur pour ${station.id}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Données glaciaires mock (mesures UAV / GPS terrain réelles en ordre de grandeur)
// ---------------------------------------------------------------------------

function buildGlacierData(): GlacierSensor[] {
  const now = nowISO();
  return [
    {
      id:          uid(),
      sensorId:    "mer-de-glace-gps",
      glacierName: "Mer de Glace",
      timestamp:   now,
      updatedAt:   now,
      position:    geoPointFromWgs84(6.9300, 45.9000, 1913),
      icevelocity: 0.82,    // m/jour (valeur mesurée ~0.8-1 m/j)
      massBalance: -1_850,  // mm w.e. /an (perte annuelle mesurée)
      surfaceAlbedo: 0.31,
    },
    {
      id:          uid(),
      sensorId:    "glacier-geant-gps",
      glacierName: "Glacier du Géant",
      timestamp:   now,
      updatedAt:   now,
      position:    geoPointFromWgs84(6.9500, 45.8700, 3400),
      icevelocity: 0.65,
      massBalance: -1_200,
      surfaceAlbedo: 0.58,
    },
    {
      id:          uid(),
      sensorId:    "glacier-argentiere",
      glacierName: "Glacier d'Argentière",
      timestamp:   now,
      updatedAt:   now,
      position:    geoPointFromWgs84(6.9800, 45.9600, 2100),
      icevelocity: 0.95,
      massBalance: -2_100,
      surfaceAlbedo: 0.28,
    },
  ];
}

// ---------------------------------------------------------------------------
// Données hydrologiques mock (cours d'eau mesurés par DREAL AuRA)
// ---------------------------------------------------------------------------

function buildHydrologyData(): HydrologicalStation[] {
  const now = nowISO();
  // Débit saisonnier simulé (source: Arve à Chamonix, valeurs typiques)
  const month = new Date().getMonth(); // 0-11
  const baseDébit = month >= 4 && month <= 8 ? 18 : 4; // fonte estivale
  return [
    {
      id:          uid(),
      stationId:   "arve-chamonix",
      name:        "L'Arve — Chamonix",
      timestamp:   now,
      updatedAt:   now,
      position:    geoPointFromWgs84(6.870, 45.924, 1030),
      waterLevel:  Math.round(90 + baseDébit * 2.5),    // cm
      flowRate:    Math.round(baseDébit * 10) / 10,      // m³/s
      temperature: month >= 4 && month <= 8 ? 6.5 : 2.1,
      turbidity:   month >= 5 && month <= 9 ? 120 : 18, // NTU (fonte = turbide)
    },
  ];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const snowResults = await Promise.all(SNOW_STATIONS.map(fetchSnowpack));
    const snowpack = snowResults.filter((s): s is SnowpackStation => s !== null);

    if (snowpack.length === 0) {
      console.warn("[environment] Aucune donnée enneigement");
    }

    const body: EnvironmentData = {
      snowpack,
      glaciers:   buildGlacierData(),
      hydrology:  buildHydrologyData(),
      vegetation: [],
    };

    console.log(
      `[environment] ${snowpack.length} stations neige, ${body.glaciers.length} glaciers`
    );

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=10800, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("[environment] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
