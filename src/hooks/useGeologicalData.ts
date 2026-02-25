// =============================================================================
// useGeologicalData — risque avalanche, chutes de pierres, sismique
// =============================================================================

"use client";

import useSWR from "swr";
import { useEffect, useMemo } from "react";
import { useDataStore } from "@/store/data-store";
import { getWSClient } from "@/lib/websocket-client";
import type {
  GeologicalData,
  AvalancheZone,
  AvalancheEvent,
  AvalancheRisk,
  SeismicEvent,
} from "@/types/data-layers";

const fetcher = async (url: string): Promise<GeologicalData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

interface UseGeologicalDataOptions {
  tileCoords?: string[];
  polling?: boolean;
  /** Bulletin avalanche : revalidation matin/soir suffisante (défaut 3h) */
  pollingInterval?: number;
  realTime?: boolean;
}

export function useGeologicalData({
  tileCoords,
  polling = true,
  pollingInterval = 3 * 60 * 60 * 1000,
  realTime = false,
}: UseGeologicalDataOptions = {}) {
  const {
    geological,
    geologicalStatus,
    geologicalError,
    geologicalLastFetch,
    setGeological,
    setGeologicalStatus,
    setGeologicalError,
  } = useDataStore();

  const params = tileCoords?.length ? `?tiles=${tileCoords.join(",")}` : "";
  const apiUrl = `/api/geological${params}`;

  const { data, error, isLoading, mutate } = useSWR<GeologicalData>(
    polling ? apiUrl : null,
    fetcher,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000,
      onSuccess: (d) => setGeological(d),
      onError: (e: Error) => setGeologicalError(e.message),
    }
  );

  useEffect(() => {
    if (isLoading) setGeologicalStatus("loading");
  }, [isLoading, setGeologicalStatus]);

  // --- WebSocket : nouveaux événements ---
  useEffect(() => {
    if (!realTime) return;
    const client = getWSClient();

    const unsubZone = client.on<AvalancheZone>("avalanche:zone", (zone) => {
      const current = useDataStore.getState().geological;
      if (!current) return;
      const zones = current.avalancheZones.find((z) => z.zoneId === zone.zoneId)
        ? current.avalancheZones.map((z) => (z.zoneId === zone.zoneId ? zone : z))
        : [...current.avalancheZones, zone];
      setGeological({ ...current, avalancheZones: zones });
    });

    const unsubEvent = client.on<AvalancheEvent>("avalanche:event", (event) => {
      const current = useDataStore.getState().geological;
      if (!current) return;
      setGeological({
        ...current,
        avalancheEvents: [event, ...current.avalancheEvents],
      });
    });

    const unsubSeismic = client.on<SeismicEvent>("seismic:event", (event) => {
      const current = useDataStore.getState().geological;
      if (!current) return;
      setGeological({
        ...current,
        seismicEvents: [event, ...current.seismicEvents],
      });
    });

    return () => {
      unsubZone();
      unsubEvent();
      unsubSeismic();
    };
  }, [realTime, setGeological]);

  const resolved = data ?? geological;

  // Niveau de risque global (maximum parmi les zones actives)
  const maxRisk = useMemo<AvalancheRisk | null>(() => {
    if (!resolved?.avalancheZones.length) return null;
    return resolved.avalancheZones.reduce<AvalancheRisk>(
      (max, z) => (z.risk > max ? z.risk : max),
      1
    );
  }, [resolved]);

  // Couleur indicative pour le badge risque
  const riskColor: Record<AvalancheRisk, string> = {
    1: "#22c55e",
    2: "#eab308",
    3: "#f97316",
    4: "#ef4444",
    5: "#7f1d1d",
  };

  // Événements sismiques récents (< 24h)
  const recentSeismic = useMemo(
    () =>
      (resolved?.seismicEvents ?? []).filter(
        (e) => Date.now() - new Date(e.timestamp).getTime() < 86_400_000
      ),
    [resolved]
  );

  return {
    geological: resolved,
    status: geologicalStatus,
    error: error?.message ?? geologicalError,
    lastFetch: geologicalLastFetch,
    avalancheZones: resolved?.avalancheZones ?? [],
    avalancheEvents: resolved?.avalancheEvents ?? [],
    seismicEvents: resolved?.seismicEvents ?? [],
    rockfalls: resolved?.rockfalls ?? [],
    massifRisk: resolved?.massifRisk ?? maxRisk,
    maxRisk,
    riskColor: maxRisk ? riskColor[maxRisk] : "#6b7280",
    recentSeismic,
    refresh: () => mutate(),
    isLoading: geologicalStatus === "loading",
  };
}
