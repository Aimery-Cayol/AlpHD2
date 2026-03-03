// =============================================================================
// layers-store.ts — visibilité et opacité des couches de données temps réel
// =============================================================================
// Store léger Zustand lu par DataLayersPanel (DOM) ET les composants 3D.
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LayerKey = "weather" | "winds" | "alpinists" | "geological" | "environment" | "media";

interface LayerConfig {
  visible: boolean;
  opacity: number; // 0–1
}

const DEFAULT: Record<LayerKey, LayerConfig> = {
  weather:     { visible: false, opacity: 1 },
  winds:       { visible: false, opacity: 1 },
  alpinists:   { visible: false, opacity: 1 },
  geological:  { visible: false, opacity: 0.7 },
  environment: { visible: false, opacity: 0.8 },
  media:       { visible: false, opacity: 1 },
};

interface LayersState {
  layers: Record<LayerKey, LayerConfig>;
  /** Activer la connexion WebSocket temps réel pour toutes les couches actives */
  realTimeEnabled: boolean;
  setLayerVisible: (key: LayerKey, visible: boolean) => void;
  setLayerOpacity: (key: LayerKey, opacity: number) => void;
  toggleLayer: (key: LayerKey) => void;
  setRealTimeEnabled: (v: boolean) => void;
  /** Masquer toutes les couches */
  hideAll: () => void;
}

export const useLayersStore = create<LayersState>()(
  persist(
    (set) => ({
      layers: { ...DEFAULT },
      realTimeEnabled: false,

      setLayerVisible: (key, visible) =>
        set((s) => ({
          layers: { ...s.layers, [key]: { ...s.layers[key], visible } },
        })),

      setLayerOpacity: (key, opacity) =>
        set((s) => ({
          layers: { ...s.layers, [key]: { ...s.layers[key], opacity } },
        })),

      toggleLayer: (key) =>
        set((s) => ({
          layers: {
            ...s.layers,
            [key]: { ...s.layers[key], visible: !s.layers[key].visible },
          },
        })),

      setRealTimeEnabled: (v) => set(() => ({ realTimeEnabled: v })),

      hideAll: () =>
        set((s) => ({
          layers: Object.fromEntries(
            (Object.keys(s.layers) as LayerKey[]).map((k) => [
              k,
              { ...s.layers[k], visible: false },
            ])
          ) as Record<LayerKey, LayerConfig>,
        })),
    }),
    {
      name: "alphd-layers",
      partialize: (s) => ({ layers: s.layers, realTimeEnabled: s.realTimeEnabled }),
      // Deep-merge : les nouvelles clés de DEFAULT (ex: "winds") sont toujours présentes
      // même si le localStorage date d'avant leur ajout.
      merge: (persisted: unknown, current: LayersState): LayersState => {
        const p = persisted as Partial<{ layers: Record<string, LayerConfig>; realTimeEnabled: boolean }>;
        return {
          ...current,
          realTimeEnabled: p.realTimeEnabled ?? current.realTimeEnabled,
          layers: {
            ...DEFAULT,          // toutes les clés avec leurs valeurs par défaut
            ...(p.layers ?? {}), // valeurs persistées (peuvent manquer des clés récentes)
          } as Record<LayerKey, LayerConfig>,
        };
      },
    }
  )
);
