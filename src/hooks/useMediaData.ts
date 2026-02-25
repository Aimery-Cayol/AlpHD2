// =============================================================================
// useMediaData — photos, webcams, rapports, actualités
// =============================================================================

"use client";

import useSWR from "swr";
import { useEffect, useMemo } from "react";
import { useDataStore } from "@/store/data-store";
import { getWSClient } from "@/lib/websocket-client";
import type {
  MediaData,
  MediaItem,
  MediaType,
  WebcamFeed,
} from "@/types/data-layers";

const fetcher = async (url: string): Promise<MediaData> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

interface UseMediaDataOptions {
  tileCoords?: string[];
  /** Types de médias à inclure (undefined = tous) */
  types?: MediaType[];
  polling?: boolean;
  pollingInterval?: number;
  realTime?: boolean;
  /** Nombre max d'items retournés */
  limit?: number;
}

export function useMediaData({
  tileCoords,
  types,
  polling = true,
  pollingInterval = 10 * 60 * 1000,
  realTime = false,
  limit = 20,
}: UseMediaDataOptions = {}) {
  const {
    media,
    mediaStatus,
    mediaError,
    mediaLastFetch,
    setMedia,
    setMediaStatus,
    setMediaError,
  } = useDataStore();

  const params = new URLSearchParams();
  if (tileCoords?.length) params.set("tiles", tileCoords.join(","));
  if (types?.length) params.set("types", types.join(","));
  params.set("limit", String(limit));
  const apiUrl = `/api/media?${params}`;

  const { data, error, isLoading, mutate } = useSWR<MediaData>(
    polling ? apiUrl : null,
    fetcher,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000,
      onSuccess: (d) => setMedia(d),
      onError: (e: Error) => setMediaError(e.message),
    }
  );

  useEffect(() => {
    if (isLoading) setMediaStatus("loading");
  }, [isLoading, setMediaStatus]);

  // --- WebSocket : nouveau contenu publié ---
  useEffect(() => {
    if (!realTime) return;
    const client = getWSClient();

    const unsubMedia = client.on<MediaItem>("media:new", (item) => {
      const current = useDataStore.getState().media;
      if (!current) return;
      setMedia({
        ...current,
        items: [item, ...current.items].slice(0, limit),
        total: current.total + 1,
      });
    });

    const unsubWebcam = client.on<{ webcamId: string; online: boolean; snapshotUrl?: string }>(
      "webcam:status",
      (update) => {
        const current = useDataStore.getState().media;
        if (!current) return;
        setMedia({
          ...current,
          webcams: current.webcams.map((w) =>
            w.webcamId === update.webcamId ? { ...w, ...update } : w
          ),
        });
      }
    );

    return () => {
      unsubMedia();
      unsubWebcam();
    };
  }, [realTime, limit, setMedia]);

  const resolved = data ?? media;

  // Items filtrés par type si demandé
  const filteredItems = useMemo<MediaItem[]>(() => {
    const items = resolved?.items ?? [];
    if (!types?.length) return items;
    return items.filter((i) => types.includes(i.type));
  }, [resolved, types]);

  // Webcams en ligne
  const onlineWebcams = useMemo<WebcamFeed[]>(
    () => (resolved?.webcams ?? []).filter((w) => w.online),
    [resolved]
  );

  return {
    media: resolved,
    status: mediaStatus,
    error: error?.message ?? mediaError,
    lastFetch: mediaLastFetch,
    items: filteredItems,
    webcams: resolved?.webcams ?? [],
    onlineWebcams,
    total: resolved?.total ?? 0,
    refresh: () => mutate(),
    isLoading: mediaStatus === "loading",
  };
}
