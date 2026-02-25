// =============================================================================
// useWeatherData — données météo avec SWR + WebSocket temps réel
// =============================================================================
// SWR gère le polling HTTP (cache, revalidation, déduplication des requêtes).
// Le WebSocket pousse les alertes instantanément.
// =============================================================================

"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useDataStore } from "@/store/data-store";
import { getWSClient } from "@/lib/websocket-client";
import type { WeatherData, WeatherStation, WeatherAlert } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Fetcher SWR
// ---------------------------------------------------------------------------

const fetcher = async (url: string): Promise<WeatherData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

interface UseWeatherDataOptions {
  /** Tuiles sélectionnées — pour filtrer par zone géographique */
  tileCoords?: string[];
  /** Activer le polling HTTP automatique */
  polling?: boolean;
  /** Intervalle de polling en ms (défaut : 5 min) */
  pollingInterval?: number;
  /** Activer les mises à jour WebSocket en temps réel */
  realTime?: boolean;
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

export function useWeatherData({
  tileCoords,
  polling = true,
  pollingInterval = 5 * 60 * 1000,
  realTime = false,
}: UseWeatherDataOptions = {}) {
  const {
    weather,
    weatherStatus,
    weatherError,
    weatherLastFetch,
    setWeather,
    setWeatherStatus,
    setWeatherError,
  } = useDataStore();

  // Construction de l'URL avec filtres optionnels
  const params = tileCoords?.length
    ? `?tiles=${tileCoords.join(",")}`
    : "";
  const apiUrl = `/api/weather${params}`;

  // --- Polling SWR ---
  const { data, error, isLoading, mutate } = useSWR<WeatherData>(
    polling ? apiUrl : null,
    fetcher,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      onSuccess: (d) => setWeather(d),
      onError: (e: Error) => setWeatherError(e.message),
    }
  );

  useEffect(() => {
    if (isLoading) setWeatherStatus("loading");
  }, [isLoading, setWeatherStatus]);

  // --- WebSocket temps réel ---
  useEffect(() => {
    if (!realTime) return;
    const client = getWSClient();
    const unsubUpdate = client.on<WeatherData>("weather:update", (payload) => {
      setWeather(payload);
      // Synchroniser le cache SWR
      mutate(payload, false);
    });
    const unsubAlert = client.on<WeatherAlert>("weather:alert", () => {
      // Re-fetch complet sur alerte pour garder la cohérence
      mutate();
    });
    return () => {
      unsubUpdate();
      unsubAlert();
    };
  }, [realTime, setWeather, mutate]);

  // Données finales : SWR ou store (en cas de mise à jour WS)
  const resolved = data ?? weather;

  return {
    weather: resolved,
    status: weatherStatus,
    error: error?.message ?? weatherError,
    lastFetch: weatherLastFetch,
    /** Stations triées par altitude décroissante */
    stations: resolved?.stations.slice().sort((a, b) => b.position.altitude - a.position.altitude) ?? [],
    /** Alertes actives (non expirées) */
    activeAlerts: resolved?.alerts.filter(
      (a) => new Date(a.expiresAt) > new Date()
    ) ?? [],
    /** Rafraîchir manuellement */
    refresh: () => mutate(),
    isLoading: weatherStatus === "loading",
  };
}

// ---------------------------------------------------------------------------
// Hook dérivé : météo d'une station précise
// ---------------------------------------------------------------------------

export function useStationWeather(stationId: string) {
  const { weather } = useWeatherData({ polling: true, pollingInterval: 60_000 });
  const station = weather?.stations.find((s) => s.stationId === stationId) ?? null;
  const forecast = weather?.forecasts.find((f) => f.stationId === stationId) ?? null;
  return { station, forecast };
}

// ---------------------------------------------------------------------------
// Sélecteurs Zustand (accès direct au store sans SWR, pour les composants légers)
// ---------------------------------------------------------------------------

export const selectWeather = (s: ReturnType<typeof useDataStore.getState>) =>
  s.weather;

export const selectWeatherAlerts = (s: ReturnType<typeof useDataStore.getState>) =>
  s.weather?.alerts ?? ([] as WeatherAlert[]);

export const selectHighestWindStation = (
  s: ReturnType<typeof useDataStore.getState>
): WeatherStation | null =>
  s.weather?.stations.reduce<WeatherStation | null>(
    (max, st) => (!max || st.windSpeed > max.windSpeed ? st : max),
    null
  ) ?? null;
