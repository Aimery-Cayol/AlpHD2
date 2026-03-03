"use client";

// =============================================================================
// useRouteGeo — récupère le tracé GPS détaillé d'une voie via /api/route-geo
// Retourne les points WGS84 du tracé C2C, ou null si absent / chargement
// =============================================================================

import useSWR from "swr";
import type { RoutePoint } from "@/types/routes";

const fetcher = async (url: string): Promise<RoutePoint[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function useRouteGeo(c2cId: string | undefined) {
  const { data, error, isLoading } = useSWR<RoutePoint[]>(
    c2cId ? `/api/route-geo?id=${c2cId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3_600_000, // 1h
    }
  );

  return {
    /** Points GPS du tracé (tableau vide si la voie n'a pas de tracé C2C) */
    gpsPoints: data && data.length > 0 ? data : null,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
