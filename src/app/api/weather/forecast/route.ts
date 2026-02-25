// =============================================================================
// GET /api/weather/forecast — prévisions 7 jours (Open-Meteo)
// =============================================================================
// Retourne WeatherForecast[] — une entrée par station de référence
// Cache Next.js : revalidate 3600 s (1 h)
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { geoPointFromWgs84, degreesToWindDir, nowISO, uid, ALPINE_REFS } from "@/lib/geo";
import type { WeatherForecast, WeatherForecastPoint } from "@/types/data-layers";

export const revalidate = 3600; // 1 h

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------

const STATIONS = [
  { id: "dent-geant",   name: "Dent du Géant",  ...ALPINE_REFS.dentGeant },
  { id: "chamonix",     name: "Chamonix",        lat: 45.9237, lon: 6.8694, alt: 1035 },
] as const;

// ---------------------------------------------------------------------------
// Schéma Zod Open-Meteo
// ---------------------------------------------------------------------------

const OpenMeteoForecastSchema = z.object({
  hourly: z.object({
    time:              z.array(z.string()),
    temperature_2m:    z.array(z.number()),
    wind_speed_10m:    z.array(z.number()),
    wind_direction_10m:z.array(z.number()),
    precipitation:     z.array(z.number()),
    snowfall:          z.array(z.number()),
    cloud_cover:       z.array(z.number()),
    weather_code:      z.array(z.number()),
  }),
  daily: z.object({
    time:                    z.array(z.string()),
    temperature_2m_max:      z.array(z.number()),
    wind_speed_10m_max:      z.array(z.number()),
    wind_direction_10m_dominant: z.array(z.number()),
    precipitation_sum:       z.array(z.number()),
    snowfall_sum:            z.array(z.number()),
    weather_code:            z.array(z.number()),
  }),
});

// ---------------------------------------------------------------------------
// WMO weather code → symbol string
// ---------------------------------------------------------------------------

function wmoToSymbol(code: number): string {
  if (code === 0)              return "clear";
  if (code <= 3)               return "partly-cloudy";
  if (code <= 9)               return "fog";
  if (code <= 39)              return "drizzle";
  if (code <= 49)              return "fog";
  if (code <= 59)              return "rain";
  if (code <= 69)              return "snow";
  if (code <= 79)              return "ice";
  if (code <= 84)              return "rain";
  if (code <= 86)              return "snow";
  if (code <= 99)              return "thunderstorm";
  return "cloudy";
}

// ---------------------------------------------------------------------------
// Fetch d'une station
// ---------------------------------------------------------------------------

async function fetchForecast(
  station: (typeof STATIONS)[number]
): Promise<WeatherForecast | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",  String(station.lat));
  url.searchParams.set("longitude", String(station.lon));
  url.searchParams.set("elevation", String(station.alt));
  url.searchParams.set("hourly", [
    "temperature_2m",
    "wind_speed_10m",
    "wind_direction_10m",
    "precipitation",
    "snowfall",
    "cloud_cover",
    "weather_code",
  ].join(","));
  url.searchParams.set("daily", [
    "temperature_2m_max",
    "wind_speed_10m_max",
    "wind_direction_10m_dominant",
    "precipitation_sum",
    "snowfall_sum",
    "weather_code",
  ].join(","));
  url.searchParams.set("forecast_days",   "7");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone",        "Europe/Paris");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`[forecast] HTTP ${res.status} pour ${station.id}`);
      return null;
    }
    const raw: unknown = await res.json();
    const parsed = OpenMeteoForecastSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`[forecast] Validation échouée pour ${station.id}:`, parsed.error.flatten());
      return null;
    }

    const { hourly, daily } = parsed.data;
    const now = nowISO();

    // Limiter les horaires aux prochaines 48 h (index 0–47)
    const hourlyPoints: WeatherForecastPoint[] = hourly.time.slice(0, 48).map((t, i) => ({
      time:          t,
      temperature:   hourly.temperature_2m[i],
      windSpeed:     hourly.wind_speed_10m[i],
      windDirection: degreesToWindDir(hourly.wind_direction_10m[i]),
      precipitation: hourly.precipitation[i],
      snowfall:      hourly.snowfall[i],
      cloudCover:    hourly.cloud_cover[i],
      symbol:        wmoToSymbol(hourly.weather_code[i]),
    }));

    const dailyPoints: WeatherForecastPoint[] = daily.time.map((t, i) => ({
      time:          t,
      temperature:   daily.temperature_2m_max[i],
      windSpeed:     daily.wind_speed_10m_max[i],
      windDirection: degreesToWindDir(daily.wind_direction_10m_dominant[i]),
      precipitation: daily.precipitation_sum[i],
      snowfall:      daily.snowfall_sum[i],
      cloudCover:    0, // non fourni en daily
      symbol:        wmoToSymbol(daily.weather_code[i]),
    }));

    return {
      id:         uid(),
      stationId:  station.id,
      timestamp:  now,
      updatedAt:  now,
      position:   geoPointFromWgs84(station.lon, station.lat, station.alt),
      hourly:     hourlyPoints,
      daily:      dailyPoints,
    };
  } catch (err) {
    console.error(`[forecast] Erreur pour ${station.id}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const results = await Promise.all(STATIONS.map(fetchForecast));
    const forecasts = results.filter((f): f is WeatherForecast => f !== null);

    if (forecasts.length === 0) {
      return NextResponse.json({ error: "Aucune prévision disponible" }, { status: 503 });
    }

    console.log(`[forecast] ${forecasts.length} station(s) — 7 j`);

    return NextResponse.json(forecasts, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[forecast] Erreur inattendue:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
