// =============================================================================
// store/route-store.ts — Zustand store pour les voies d'alpinisme
// =============================================================================
// visibleRoutes : toutes les voies actuellement affichées en 3D
// toggleRoute   : ajoute ou retire une voie de l'affichage
// clearRoutes   : efface toutes les voies visibles
// setActiveRoute: compat. ancien code (affiche une seule voie)
// =============================================================================

import { create } from "zustand";
import type { ClimbingRoute } from "@/types/routes";

interface RouteStore {
  /** Voies actuellement affichées en 3D */
  visibleRoutes: ClimbingRoute[];
  /** Ajoute ou retire une voie de l'affichage */
  toggleRoute: (route: ClimbingRoute) => void;
  /** Efface toutes les voies */
  clearRoutes: () => void;

  // Compatibilité avec l'ancien code (affiche une seule voie)
  activeRoute: ClimbingRoute | null;
  setActiveRoute: (route: ClimbingRoute | null) => void;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  visibleRoutes: [],
  activeRoute: null,

  toggleRoute: (route) => {
    const prev = get().visibleRoutes;
    const exists = prev.some((r) => r.id === route.id);
    const next = exists
      ? prev.filter((r) => r.id !== route.id)
      : [...prev, route];
    set({ visibleRoutes: next, activeRoute: next[next.length - 1] ?? null });
  },

  clearRoutes: () => set({ visibleRoutes: [], activeRoute: null }),

  // Compat — remplace la voie unique visible
  setActiveRoute: (route) => {
    if (!route) {
      set({ visibleRoutes: [], activeRoute: null });
    } else {
      set({ visibleRoutes: [route], activeRoute: route });
    }
  },
}));
