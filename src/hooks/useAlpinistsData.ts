// =============================================================================
// useAlpinistsData — activité humaine (alpinistes, refuges, secours)
// =============================================================================
// Polling SWR + mises à jour positions en temps réel via WebSocket.
// =============================================================================

"use client";

import useSWR from "swr";
import { useEffect, useMemo } from "react";
import { useDataStore } from "@/store/data-store";
import { getWSClient } from "@/lib/websocket-client";
import type {
  HumanActivityData,
  AlpinistMarker,
  Refuge,
  RescueOperation,
} from "@/types/data-layers";

const fetcher = async (url: string): Promise<HumanActivityData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

interface UseAlpinistsDataOptions {
  tileCoords?: string[];
  /** Polling HTTP pour les données refuges/secours (moins temps-réel) */
  polling?: boolean;
  pollingInterval?: number;
  /** WS pour les positions alpinistes (très fréquent) */
  realTime?: boolean;
  /** Rayon de filtre autour de la scène (km Lambert-93) */
  radiusKm?: number;
}

export function useAlpinistsData({
  tileCoords,
  polling = true,
  pollingInterval = 2 * 60 * 1000,
  realTime = false,
  radiusKm,
}: UseAlpinistsDataOptions = {}) {
  const {
    humanActivity,
    humanActivityStatus,
    humanActivityError,
    humanActivityLastFetch,
    setHumanActivity,
    setHumanActivityStatus,
    setHumanActivityError,
  } = useDataStore();

  const params = new URLSearchParams();
  if (tileCoords?.length) params.set("tiles", tileCoords.join(","));
  if (radiusKm !== undefined) params.set("radius", String(radiusKm));
  const apiUrl = `/api/human-activity?${params}`;

  const { data, error, isLoading, mutate } = useSWR<HumanActivityData>(
    polling ? apiUrl : null,
    fetcher,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
      onSuccess: (d) => setHumanActivity(d),
      onError: (e: Error) => setHumanActivityError(e.message),
    }
  );

  useEffect(() => {
    if (isLoading) setHumanActivityStatus("loading");
  }, [isLoading, setHumanActivityStatus]);

  // --- Mises à jour WS des positions alpinistes ---
  useEffect(() => {
    if (!realTime) return;
    const client = getWSClient();

    const unsubPosition = client.on<AlpinistMarker>("alpinist:position", (updated) => {
      const current = useDataStore.getState().humanActivity;
      if (!current) return;
      const exists = current.alpinists.find((a) => a.userId === updated.userId);
      const alpinists = exists
        ? current.alpinists.map((a) => (a.userId === updated.userId ? updated : a))
        : [...current.alpinists, updated];
      setHumanActivity({
        ...current,
        alpinists,
        activeCount: alpinists.filter((a) => a.status !== "stationary").length,
      });
    });

    const unsubEmergency = client.on<AlpinistMarker>("alpinist:emergency", (alert) => {
      const current = useDataStore.getState().humanActivity;
      if (!current) return;
      const alpinists = current.alpinists.map((a) =>
        a.userId === alert.userId ? { ...a, status: "emergency" as const } : a
      );
      setHumanActivity({ ...current, alpinists });
    });

    const unsubRefuge = client.on<{ refugeId: string; occupancy: Refuge["occupancy"]; currentGuests: number }>(
      "refuge:occupancy",
      (update) => {
        const current = useDataStore.getState().humanActivity;
        if (!current) return;
        setHumanActivity({
          ...current,
          refuges: current.refuges.map((r) =>
            r.refugeId === update.refugeId ? { ...r, ...update } : r
          ),
        });
      }
    );

    const unsubRescue = client.on<RescueOperation>("rescue:new", (op) => {
      const current = useDataStore.getState().humanActivity;
      if (!current) return;
      setHumanActivity({
        ...current,
        rescueOps: [op, ...current.rescueOps],
      });
    });

    return () => {
      unsubPosition();
      unsubEmergency();
      unsubRefuge();
      unsubRescue();
    };
  }, [realTime, setHumanActivity]);

  const resolved = data ?? humanActivity;

  // Alpinistes avec urgence — utiles pour afficher des alertes prominentes
  const emergencies = useMemo(
    () => resolved?.alpinists.filter((a) => a.status === "emergency") ?? [],
    [resolved]
  );

  // Refuges triés par taux d'occupation
  const refugesSorted = useMemo<Refuge[]>(
    () =>
      (resolved?.refuges ?? []).slice().sort((a, b) => {
        const order = { full: 4, medium: 3, low: 2, empty: 1, closed: 0 };
        return order[b.occupancy] - order[a.occupancy];
      }),
    [resolved]
  );

  return {
    humanActivity: resolved,
    status: humanActivityStatus,
    error: error?.message ?? humanActivityError,
    lastFetch: humanActivityLastFetch,
    alpinists: resolved?.alpinists ?? [],
    refuges: refugesSorted,
    rescueOps: resolved?.rescueOps ?? [],
    activeCount: resolved?.activeCount ?? 0,
    emergencies,
    hasEmergency: emergencies.length > 0,
    refresh: () => mutate(),
    isLoading: humanActivityStatus === "loading",
  };
}
