// =============================================================================
// useEnvironmentData — enneigement, glaciers, hydrologie, végétation
// =============================================================================

"use client";

import useSWR from "swr";
import { useEffect, useMemo } from "react";
import { useDataStore } from "@/store/data-store";
import { getWSClient } from "@/lib/websocket-client";
import type {
  EnvironmentData,
  SnowpackStation,
} from "@/types/data-layers";

const fetcher = async (url: string): Promise<EnvironmentData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

interface UseEnvironmentDataOptions {
  tileCoords?: string[];
  polling?: boolean;
  /** Enneigement : mise à jour toutes les 3h suffit */
  pollingInterval?: number;
  realTime?: boolean;
}

export function useEnvironmentData({
  tileCoords,
  polling = true,
  pollingInterval = 3 * 60 * 60 * 1000,
  realTime = false,
}: UseEnvironmentDataOptions = {}) {
  const {
    environment,
    environmentStatus,
    environmentError,
    environmentLastFetch,
    setEnvironment,
    setEnvironmentStatus,
    setEnvironmentError,
  } = useDataStore();

  const params = tileCoords?.length ? `?tiles=${tileCoords.join(",")}` : "";
  const apiUrl = `/api/environment${params}`;

  const { data, error, isLoading, mutate } = useSWR<EnvironmentData>(
    polling ? apiUrl : null,
    fetcher,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60 * 1000,
      onSuccess: (d) => setEnvironment(d),
      onError: (e: Error) => setEnvironmentError(e.message),
    }
  );

  useEffect(() => {
    if (isLoading) setEnvironmentStatus("loading");
  }, [isLoading, setEnvironmentStatus]);

  // --- WebSocket : mise à jour enneigement ---
  useEffect(() => {
    if (!realTime) return;
    const client = getWSClient();

    const unsubSnow = client.on<SnowpackStation>("snowpack:update", (updated) => {
      const current = useDataStore.getState().environment;
      if (!current) return;
      setEnvironment({
        ...current,
        snowpack: current.snowpack.map((s) =>
          s.stationId === updated.stationId ? updated : s
        ),
      });
    });

    return () => unsubSnow();
  }, [realTime, setEnvironment]);

  const resolved = data ?? environment;

  // Station avec le plus de neige fraîche (24h)
  const snowLeader = useMemo<SnowpackStation | null>(
    () =>
      (resolved?.snowpack ?? []).reduce<SnowpackStation | null>(
        (max, s) => (!max || s.newSnow24h > max.newSnow24h ? s : max),
        null
      ),
    [resolved]
  );

  // Hauteur de neige maximale parmi les stations
  const maxSnowDepth = useMemo(
    () =>
      (resolved?.snowpack ?? []).reduce(
        (max, s) => Math.max(max, s.snowDepth),
        0
      ),
    [resolved]
  );

  return {
    environment: resolved,
    status: environmentStatus,
    error: error?.message ?? environmentError,
    lastFetch: environmentLastFetch,
    snowpack: resolved?.snowpack ?? [],
    glaciers: resolved?.glaciers ?? [],
    hydrology: resolved?.hydrology ?? [],
    vegetation: resolved?.vegetation ?? [],
    snowLeader,
    maxSnowDepth,
    refresh: () => mutate(),
    isLoading: environmentStatus === "loading",
  };
}
