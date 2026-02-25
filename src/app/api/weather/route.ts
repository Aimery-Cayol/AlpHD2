// =============================================================================
// GET /api/weather — stations météo actuelles (Open-Meteo, gratuit, sans clé)
// =============================================================================
// Retourne WeatherData (WeatherStation[] + WeatherAlert[] vides)
// Cache Next.js : revalidate 300 s (5 min)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geoPointFromWgs84, degreesToWindDir, nowISO, uid, ALPINE_REFS } from "@/lib/geo";
import type { WeatherData, WeatherStation } from "@/types/data-layers";

export const revalidate = 300; // 5 min

// ---------------------------------------------------------------------------
// Stations à interroger (WGS-84)
// ---------------------------------------------------------------------------

const STATIONS = [
  { id: "dent-geant",    name: "Dent du Géant",    ...ALPINE_REFS.dentGeant },
  { id: "chamonix",      name: "Chamonix (1035m)",  lat: 45.9237, lon: 6.8694, alt: 1035 },
  { id: "col-du-geant",  name: "Col du Géant",      lat: 45.8697, lon: 6.9711, alt: 3371 },
] as const;

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
});

type OpenMeteoCurrent = z.infer<typeof OpenMeteoCurrentSchema>;

// ---------------------------------------------------------------------------
// Fetch d'une station
// ---------------------------------------------------------------------------

async function fetchStation(
  station: (typeof STATIONS)[number]
): Promise<WeatherStation | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",  String(station.lat));
  url.searchParams.set("longitude", String(station.lon));
  url.searchParams.set("elevation", String(station.alt));
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
    return mapToWeatherStation(station, parsed.data);
  } catch (err) {
    console.error(`[weather] Fetch échoué pour ${station.id}:`, err);
    return null;
  }
}

function mapToWeatherStation(
  station: (typeof STATIONS)[number],
  data: OpenMeteoCurrent
): WeatherStation {
  const c = data.current;
  const now = nowISO();
  return {
    id:                   uid(),
    stationId:            station.id,
    name:                 station.name,
    timestamp:            now,
    updatedAt:            now,
    position:             geoPointFromWgs84(station.lon, station.lat, station.alt),
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
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const start = Date.now();

  try {
    // Fetch toutes les stations en parallèle
    const results = await Promise.all(STATIONS.map(fetchStation));
    const stations = results.filter((s): s is WeatherStation => s !== null);

    if (stations.length === 0) {
      console.warn("[weather] Aucune station disponible");
      return NextResponse.json({ error: "Aucune donnée météo disponible" }, { status: 503 });
    }

    const body: WeatherData = {
      stations,
      forecasts: [], // servi par /api/weather/forecast
      alerts:    [],
    };

    console.log(
      `[weather] ${stations.length} station(s) — ${Date.now() - start}ms`
    );

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
