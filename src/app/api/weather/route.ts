// =============================================================================
// GET /api/weather — stations météo actuelles (Open-Meteo, gratuit, sans clé)
// =============================================================================
// La station principale est centrée sur les dalles demandées (param "tiles").
// Retourne WeatherData (WeatherStation[] + WeatherAlert[] vides)
// Cache : 5 min (via Cache-Control, dynamique selon le paramètre "tiles")
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geoPointFromWgs84, lambert93KmToWgs84, degreesToWindDir, nowISO, uid } from "@/lib/geo";
import type { WeatherData, WeatherStation } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Centre de référence (Dent du Géant / Chamonix)
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
// Schéma Zod de la réponse Open-Meteo (current)
// ---------------------------------------------------------------------------

const OpenMeteoCurrentSchema = z.object({
  current: z.object({
    temperature_2m:          z.number(),
    apparent_temperature:    z.number(),
    relative_humidity_2m:    z.number(),
    surface_pressure:        z.number(),
    wind_speed_10m:          z.number(),
    wind_gusts_10m:          z.number(),
    wind_direction_10m:      z.number(),
    precipitation:           z.number(),
    snowfall:                z.number(),
    visibility:              z.number(),
    cloud_cover:             z.number(),
    uv_index:                z.number().optional().default(0),
  }),
  elevation: z.number().optional().default(0),
});

type OpenMeteoCurrent = z.infer<typeof OpenMeteoCurrentSchema>;

// ---------------------------------------------------------------------------
// Fetch d'une station Open-Meteo
// ---------------------------------------------------------------------------

interface StationDef {
  id: string;
  name: string;
  lat: number;
  lon: number;
  alt?: number; // optionnel — Open-Meteo utilise son MNT si absent
}

async function fetchStation(station: StationDef): Promise<WeatherStation | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",  String(station.lat));
  url.searchParams.set("longitude", String(station.lon));
  if (station.alt !== undefined) url.searchParams.set("elevation", String(station.alt));
  url.searchParams.set("current", [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "surface_pressure",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
    "precipitation",
    "snowfall",
    "visibility",
    "cloud_cover",
    "uv_index",
  ].join(","));
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "Europe/Paris");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error(`[weather] Open-Meteo HTTP ${res.status} pour ${station.id}`);
      return null;
    }
    const raw: unknown = await res.json();
    const parsed = OpenMeteoCurrentSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`[weather] Validation échouée pour ${station.id}:`, parsed.error.flatten());
      return null;
    }
    const alt = station.alt ?? parsed.data.elevation ?? 0;
    const c = parsed.data.current;
    const now = nowISO();
    return {
      id:                   uid(),
      stationId:            station.id,
      name:                 station.name,
      timestamp:            now,
      updatedAt:            now,
      position:             geoPointFromWgs84(station.lon, station.lat, alt),
      temperature:          c.temperature_2m,
      temperatureFeelsLike: c.apparent_temperature,
      humidity:             c.relative_humidity_2m,
      pressure:             c.surface_pressure,
      windSpeed:            c.wind_speed_10m,
      windGust:             c.wind_gusts_10m,
      windDirection:        degreesToWindDir(c.wind_direction_10m),
      precipitation:        c.precipitation,
      snowfall:             c.snowfall,
      visibility:           c.visibility / 1000, // m → km
      cloudCover:           c.cloud_cover,
      uvIndex:              c.uv_index,
    } satisfies WeatherStation;
  } catch (err) {
    console.error(`[weather] Fetch échoué pour ${station.id}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Handler (dynamique — se base sur le paramètre "tiles")
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const start = Date.now();

  try {
    const tilesParam = req.nextUrl.searchParams.get("tiles");
    const center = parseTileCenter(tilesParam);

    // Station principale centrée sur les dalles visibles (haute altitude)
    const mainStation: StationDef = {
      id:   "station-summit",
      name: `Station altitude (${center.lat.toFixed(3)}°N)`,
      lat:  center.lat,
      lon:  center.lon,
      // Open-Meteo déduit l'altitude de son MNT — réaliste pour les sommets
    };

    // Station de vallée proche (offset -0.07° lat ≈ 7 km vers le bas)
    const valleyStation: StationDef = {
      id:   "station-vallee",
      name: "Station vallée",
      lat:  center.lat - 0.07,
      lon:  center.lon - 0.06,
      alt:  1035,
    };

    const results = await Promise.all([
      fetchStation(mainStation),
      fetchStation(valleyStation),
    ]);
    const stations = results.filter((s): s is WeatherStation => s !== null);

    if (stations.length === 0) {
      console.warn("[weather] Aucune station disponible");
      return NextResponse.json({ error: "Aucune donnée météo disponible" }, { status: 503 });
    }

    const body: WeatherData = {
      stations,
      forecasts: [],
      alerts:    [],
    };

    console.log(`[weather] ${stations.length} station(s) @ (${center.lat.toFixed(4)}, ${center.lon.toFixed(4)}) — ${Date.now() - start}ms`);

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[weather] Erreur inattendue:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
