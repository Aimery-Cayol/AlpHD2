// =============================================================================
// useRealTimeLayers — façade combinant toutes les couches temps réel
// =============================================================================
// Utilise ce hook dans les composants qui ont besoin de plusieurs couches.
// Pour un seul domaine, préférer useWeatherData, useAlpinistsData, etc.
// =============================================================================

"use client";

import { useEffect } from "react";
import { useDataStore } from "@/store/data-store";
import { getWSClient } from "@/lib/websocket-client";
import { useWeatherData } from "./useWeatherData";
import { useAlpinistsData } from "./useAlpinistsData";
import { useGeologicalData } from "./useGeologicalData";
import { useEnvironmentData } from "./useEnvironmentData";
import { useMediaData } from "./useMediaData";

interface UseRealTimeLayersOptions {
  tileCoords?: string[];
  /** Activer les connexions WebSocket */
  realTime?: boolean;
  /** Activer le polling HTTP */
  polling?: boolean;
  /** Couches à activer (undefined = toutes) */
  layers?: Array<"weather" | "alpinists" | "geological" | "environment" | "media">;
}

export function useRealTimeLayers({
  tileCoords,
  realTime = false,
  polling = true,
  layers,
}: UseRealTimeLayersOptions = {}) {
  const all = !layers;
  const enable = (key: typeof layers extends undefined ? true : NonNullable<typeof layers>[number]) =>
    all || (layers as string[])?.includes(key as string);

  const weather = useWeatherData({
    tileCoords,
    polling: polling && enable("weather"),
    realTime: realTime && enable("weather"),
  });

  const alpinists = useAlpinistsData({
    tileCoords,
    polling: polling && enable("alpinists"),
    realTime: realTime && enable("alpinists"),
  });

  const geological = useGeologicalData({
    tileCoords,
    polling: polling && enable("geological"),
    realTime: realTime && enable("geological"),
  });

  const environment = useEnvironmentData({
    tileCoords,
    polling: polling && enable("environment"),
    realTime: realTime && enable("environment"),
  });

  const media = useMediaData({
    tileCoords,
    polling: polling && enable("media"),
    realTime: realTime && enable("media"),
  });

  // Connexion WebSocket unique pour toutes les couches
  const { setWsConnected, incrementWsReconnect } = useDataStore();

  useEffect(() => {
    if (!realTime) return;
    const client = getWSClient();
    const unsubConnect = client.onConnect(() => setWsConnected(true));
    const unsubDisconnect = client.onDisconnect(() => setWsConnected(false));
    const unsubReconnect = client.onReconnect(() => incrementWsReconnect());
    client.connect();
    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubReconnect();
      // Ne pas fermer ici — le singleton doit rester actif
    };
  }, [realTime, setWsConnected, incrementWsReconnect]);

  const wsConnected = useDataStore((s) => s.wsConnected);

  const isLoading =
    weather.isLoading ||
    alpinists.isLoading ||
    geological.isLoading ||
    environment.isLoading ||
    media.isLoading;

  const hasError = !!(
    weather.error ||
    alpinists.error ||
    geological.error ||
    environment.error ||
    media.error
  );

  return {
    weather,
    alpinists,
    geological,
    environment,
    media,
    wsConnected,
    isLoading,
    hasError,
  };
}
