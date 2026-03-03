"use client";

// =============================================================================
// useRouteGeo — récupère le tracé GPS d'une voie via /api/route-geo
// Priorité : fichier GPX local > API Camptocamp > fallback route.track
// =============================================================================

import useSWR from "swr";
import type { RoutePoint } from "@/types/routes";

const fetcher = async (url: string): Promise<RoutePoint[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

/**
 * @param routeId  id de la voie (ex: "verte-whymper") — utilisé pour GPX local
 * @param c2cId    identifiant numérique C2C (ex: "182176") — fallback API
 */
export function useRouteGeo(
  routeId: string | undefined,
  c2cId?: string | undefined
) {
  // Construction de l'URL : id obligatoire + c2cId optionnel
  const url =
    routeId
      ? `/api/route-geo?id=${routeId}${c2cId ? `&c2cId=${c2cId}` : ""}`
      : null;

  const { data, error, isLoading } = useSWR<RoutePoint[]>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3_600_000, // 1h
  });

  return {
    gpsPoints: data && data.length > 0 ? data : null,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
