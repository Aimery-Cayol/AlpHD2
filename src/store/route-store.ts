// =============================================================================
// store/route-store.ts — Zustand store pour la voie active
// =============================================================================

import { create } from "zustand";
import type { ClimbingRoute } from "@/types/routes";

interface RouteStore {
  activeRoute: ClimbingRoute | null;
  setActiveRoute: (route: ClimbingRoute | null) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  activeRoute: null,
  setActiveRoute: (route) => set({ activeRoute: route }),
}));
