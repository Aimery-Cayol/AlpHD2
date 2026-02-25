// =============================================================================
// Zustand store — données temps réel AlpHD
// =============================================================================
// Structure en "slices" : chaque couche est indépendante.
// Utiliser les hooks dédiés (src/hooks/) pour accéder aux données côté React.
// =============================================================================

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  WeatherData,
  HumanActivityData,
  GeologicalData,
  EnvironmentData,
  MediaData,
  DataStatus,
  WSMessage,
} from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Slice météo
// ---------------------------------------------------------------------------

interface WeatherSlice {
  weather: WeatherData | null;
  weatherStatus: DataStatus;
  weatherError: string | null;
  weatherLastFetch: number | null; // timestamp ms
  setWeather: (data: WeatherData) => void;
  setWeatherStatus: (s: DataStatus) => void;
  setWeatherError: (e: string | null) => void;
}

const createWeatherSlice = (
  set: (fn: (state: DataStore) => Partial<DataStore>) => void
): WeatherSlice => ({
  weather: null,
  weatherStatus: "idle",
  weatherError: null,
  weatherLastFetch: null,
  setWeather: (data) =>
    set(() => ({
      weather: data,
      weatherStatus: "success",
      weatherError: null,
      weatherLastFetch: Date.now(),
    })),
  setWeatherStatus: (s) => set(() => ({ weatherStatus: s })),
  setWeatherError: (e) =>
    set(() => ({ weatherError: e, weatherStatus: "error" })),
});

// ---------------------------------------------------------------------------
// Slice activité humaine
// ---------------------------------------------------------------------------

interface HumanActivitySlice {
  humanActivity: HumanActivityData | null;
  humanActivityStatus: DataStatus;
  humanActivityError: string | null;
  humanActivityLastFetch: number | null;
  setHumanActivity: (data: HumanActivityData) => void;
  setHumanActivityStatus: (s: DataStatus) => void;
  setHumanActivityError: (e: string | null) => void;
}

const createHumanActivitySlice = (
  set: (fn: (state: DataStore) => Partial<DataStore>) => void
): HumanActivitySlice => ({
  humanActivity: null,
  humanActivityStatus: "idle",
  humanActivityError: null,
  humanActivityLastFetch: null,
  setHumanActivity: (data) =>
    set(() => ({
      humanActivity: data,
      humanActivityStatus: "success",
      humanActivityError: null,
      humanActivityLastFetch: Date.now(),
    })),
  setHumanActivityStatus: (s) => set(() => ({ humanActivityStatus: s })),
  setHumanActivityError: (e) =>
    set(() => ({ humanActivityError: e, humanActivityStatus: "error" })),
});

// ---------------------------------------------------------------------------
// Slice géologique
// ---------------------------------------------------------------------------

interface GeologicalSlice {
  geological: GeologicalData | null;
  geologicalStatus: DataStatus;
  geologicalError: string | null;
  geologicalLastFetch: number | null;
  setGeological: (data: GeologicalData) => void;
  setGeologicalStatus: (s: DataStatus) => void;
  setGeologicalError: (e: string | null) => void;
}

const createGeologicalSlice = (
  set: (fn: (state: DataStore) => Partial<DataStore>) => void
): GeologicalSlice => ({
  geological: null,
  geologicalStatus: "idle",
  geologicalError: null,
  geologicalLastFetch: null,
  setGeological: (data) =>
    set(() => ({
      geological: data,
      geologicalStatus: "success",
      geologicalError: null,
      geologicalLastFetch: Date.now(),
    })),
  setGeologicalStatus: (s) => set(() => ({ geologicalStatus: s })),
  setGeologicalError: (e) =>
    set(() => ({ geologicalError: e, geologicalStatus: "error" })),
});

// ---------------------------------------------------------------------------
// Slice environnement
// ---------------------------------------------------------------------------

interface EnvironmentSlice {
  environment: EnvironmentData | null;
  environmentStatus: DataStatus;
  environmentError: string | null;
  environmentLastFetch: number | null;
  setEnvironment: (data: EnvironmentData) => void;
  setEnvironmentStatus: (s: DataStatus) => void;
  setEnvironmentError: (e: string | null) => void;
}

const createEnvironmentSlice = (
  set: (fn: (state: DataStore) => Partial<DataStore>) => void
): EnvironmentSlice => ({
  environment: null,
  environmentStatus: "idle",
  environmentError: null,
  environmentLastFetch: null,
  setEnvironment: (data) =>
    set(() => ({
      environment: data,
      environmentStatus: "success",
      environmentError: null,
      environmentLastFetch: Date.now(),
    })),
  setEnvironmentStatus: (s) => set(() => ({ environmentStatus: s })),
  setEnvironmentError: (e) =>
    set(() => ({ environmentError: e, environmentStatus: "error" })),
});

// ---------------------------------------------------------------------------
// Slice médias
// ---------------------------------------------------------------------------

interface MediaSlice {
  media: MediaData | null;
  mediaStatus: DataStatus;
  mediaError: string | null;
  mediaLastFetch: number | null;
  setMedia: (data: MediaData) => void;
  setMediaStatus: (s: DataStatus) => void;
  setMediaError: (e: string | null) => void;
}

const createMediaSlice = (
  set: (fn: (state: DataStore) => Partial<DataStore>) => void
): MediaSlice => ({
  media: null,
  mediaStatus: "idle",
  mediaError: null,
  mediaLastFetch: null,
  setMedia: (data) =>
    set(() => ({
      media: data,
      mediaStatus: "success",
      mediaError: null,
      mediaLastFetch: Date.now(),
    })),
  setMediaStatus: (s) => set(() => ({ mediaStatus: s })),
  setMediaError: (e) =>
    set(() => ({ mediaError: e, mediaStatus: "error" })),
});

// ---------------------------------------------------------------------------
// Slice WebSocket
// ---------------------------------------------------------------------------

interface WebSocketSlice {
  wsConnected: boolean;
  wsReconnectCount: number;
  setWsConnected: (v: boolean) => void;
  incrementWsReconnect: () => void;
  /** Applique un message WebSocket au bon slice */
  applyWsMessage: (msg: WSMessage) => void;
}

const createWebSocketSlice = (
  set: (fn: (state: DataStore) => Partial<DataStore>) => void,
  get: () => DataStore
): WebSocketSlice => ({
  wsConnected: false,
  wsReconnectCount: 0,
  setWsConnected: (v) => set(() => ({ wsConnected: v })),
  incrementWsReconnect: () =>
    set((s) => ({ wsReconnectCount: s.wsReconnectCount + 1 })),
  applyWsMessage: (msg) => {
    const { event, payload } = msg;
    const state = get();

    if (event === "weather:update") {
      state.setWeather(payload as WeatherData);
    } else if (event === "weather:alert") {
      // Ajouter l'alerte à la liste existante
      const current = state.weather;
      if (current) {
        state.setWeather({
          ...current,
          alerts: [...current.alerts, payload as WeatherData["alerts"][number]],
        });
      }
    } else if (event === "alpinist:position" || event === "alpinist:emergency") {
      const current = state.humanActivity;
      if (current) {
        const incoming = payload as import("@/types/data-layers").AlpinistMarker;
        const updated = current.alpinists.map((a) =>
          a.userId === incoming.userId ? incoming : a
        );
        state.setHumanActivity({
          ...current,
          alpinists: updated,
          activeCount: updated.filter((a) => a.status === "active").length,
        });
      }
    } else if (event === "refuge:occupancy") {
      const current = state.humanActivity;
      if (current) {
        const p = payload as { refugeId: string; occupancy: import("@/types/data-layers").RefugeOccupancy; currentGuests: number };
        state.setHumanActivity({
          ...current,
          refuges: current.refuges.map((r) =>
            r.refugeId === p.refugeId ? { ...r, occupancy: p.occupancy, currentGuests: p.currentGuests } : r
          ),
        });
      }
    } else if (event === "avalanche:zone" || event === "avalanche:event") {
      const current = state.geological;
      if (current) {
        state.setGeological({ ...current, ...(payload as Partial<GeologicalData>) });
      }
    } else if (event === "seismic:event") {
      const current = state.geological;
      if (current) {
        state.setGeological({
          ...current,
          seismicEvents: [
            payload as GeologicalData["seismicEvents"][number],
            ...current.seismicEvents,
          ],
        });
      }
    } else if (event === "snowpack:update") {
      const current = state.environment;
      if (current) {
        const p = payload as EnvironmentData["snowpack"][number];
        state.setEnvironment({
          ...current,
          snowpack: current.snowpack.map((s) =>
            s.stationId === p.stationId ? p : s
          ),
        });
      }
    } else if (event === "media:new") {
      const current = state.media;
      if (current) {
        state.setMedia({
          ...current,
          items: [payload as MediaData["items"][number], ...current.items],
          total: current.total + 1,
        });
      }
    } else if (event === "webcam:status") {
      const current = state.media;
      if (current) {
        const p = payload as { webcamId: string; online: boolean };
        state.setMedia({
          ...current,
          webcams: current.webcams.map((w) =>
            w.webcamId === p.webcamId ? { ...w, ...p } : w
          ),
        });
      }
    }
  },
});

// ---------------------------------------------------------------------------
// Store complet (union de tous les slices)
// ---------------------------------------------------------------------------

export type DataStore = WeatherSlice &
  HumanActivitySlice &
  GeologicalSlice &
  EnvironmentSlice &
  MediaSlice &
  WebSocketSlice;

export const useDataStore = create<DataStore>()(
  subscribeWithSelector((set, get) => ({
    ...createWeatherSlice(set),
    ...createHumanActivitySlice(set),
    ...createGeologicalSlice(set),
    ...createEnvironmentSlice(set),
    ...createMediaSlice(set),
    ...createWebSocketSlice(set, get),
  }))
);
