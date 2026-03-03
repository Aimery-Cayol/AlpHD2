// =============================================================================
// GET /api/alpinists — positions alpinistes (mock réaliste, centré sur les dalles)
// =============================================================================
// Simule 4-6 cordées sur des itinéraires réels du massif.
// Les positions sont décalées pour être proches des dalles demandées (param "tiles").
// Chaque appel fait dériver légèrement les positions (simulation mouvement).
// Pas de cache (données "temps réel").
// =============================================================================

import { NextResponse } from "next/server";
import { wgs84ToLambert93Km, lambert93KmToWgs84, nowISO, uid } from "@/lib/geo";
import type { HumanActivityData, AlpinistMarker, Refuge, AlpinistStatus } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Centre de référence des données mock (Dent du Géant)
// ---------------------------------------------------------------------------

const REF_LAT = 45.8567;
const REF_LON = 6.9553;

/** Calcule le centre WGS-84 des dalles demandées (coord en km), repli sur la référence */
function parseTileCenter(tilesParam: string | null): { lat: number; lon: number } {
  if (!tilesParam) return { lat: REF_LAT, lon: REF_LON };
  const coords = tilesParam
    .split(",")
    .map((t) => { const [x, y] = t.split("_").map(Number); return { x, y }; })
    .filter((c) => !isNaN(c.x) && !isNaN(c.y) && c.x > 0 && c.y > 0);
  if (coords.length === 0) return { lat: REF_LAT, lon: REF_LON };
  // Centre du groupe de dalles (+ 0.5 pour le milieu de la dalle 1km×1km)
  const avgX = coords.reduce((s, c) => s + c.x, 0) / coords.length + 0.5;
  const avgY = coords.reduce((s, c) => s + c.y, 0) / coords.length + 0.5;
  const [lon, lat] = lambert93KmToWgs84(avgX, avgY);
  return { lat, lon };
}

// ---------------------------------------------------------------------------
// Itinéraires de référence (waypoints WGS-84 ancrés autour de REF_LAT/REF_LON)
// ---------------------------------------------------------------------------

const ROUTES: Array<{
  name: string;
  waypoints: Array<{ lat: number; lon: number; alt: number }>;
  status: AlpinistStatus;
  groupSize: number;
  speed: number; // km/h
  heading: number;
}> = [
  {
    name: "Voie normale",
    status: "active",
    groupSize: 2,
    speed: 0.35,
    heading: 45,
    waypoints: [
      { lat: REF_LAT + 0.0053, lon: REF_LON + 0.0037, alt: 3700 },
      { lat: REF_LAT + 0.0023, lon: REF_LON + 0.0007, alt: 3850 },
      { lat: REF_LAT + 0.0008, lon: REF_LON + 0.0002, alt: 3980 },
    ],
  },
  {
    name: "Arête E",
    status: "active",
    groupSize: 3,
    speed: 0.28,
    heading: 220,
    waypoints: [
      { lat: REF_LAT + 0.0113, lon: REF_LON - 0.0073, alt: 3820 },
      { lat: REF_LAT + 0.0083, lon: REF_LON - 0.0043, alt: 3900 },
      { lat: REF_LAT + 0.0058, lon: REF_LON - 0.0023, alt: 3970 },
    ],
  },
  {
    name: "Glacier N",
    status: "descending",
    groupSize: 2,
    speed: 0.40,
    heading: 170,
    waypoints: [
      { lat: REF_LAT + 0.0133, lon: REF_LON + 0.0047, alt: 3500 },
      { lat: REF_LAT + 0.0093, lon: REF_LON + 0.0027, alt: 3650 },
    ],
  },
  {
    name: "Face nord",
    status: "stationary",
    groupSize: 4,
    speed: 0,
    heading: 0,
    waypoints: [
      { lat: REF_LAT - 0.0037, lon: REF_LON - 0.0033, alt: 3500 },
    ],
  },
  {
    name: "Traversée glaciaire",
    status: "active",
    groupSize: 6,
    speed: 0.55,
    heading: 310,
    waypoints: [
      { lat: REF_LAT + 0.0173, lon: REF_LON + 0.0127, alt: 3450 },
      { lat: REF_LAT + 0.0153, lon: REF_LON + 0.0097, alt: 3500 },
      { lat: REF_LAT + 0.0133, lon: REF_LON + 0.0057, alt: 3550 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Refuges du massif (offsets relatifs à REF_LAT/REF_LON)
// ---------------------------------------------------------------------------

const REFUGE_OFFSETS = [
  { refugeId: "refuge-a", name: "Refuge du sommet", dlat: 0.0222, dlon: -0.0717, alt: 3613, capacity: 120, currentGuests: 98, guardianed: true, phone: "+33 4 50 54 40 16" },
  { refugeId: "refuge-b", name: "Refuge Torino",    dlat: 0.0111, dlon:  0.0291, alt: 3371, capacity: 130, currentGuests: 45, guardianed: true, phone: "+39 0165 846959" },
  { refugeId: "refuge-c", name: "Refuge de base",   dlat: -0.018, dlon:  0.0325, alt: 2431, capacity:  40, currentGuests: 12, guardianed: false },
] as const;

// ---------------------------------------------------------------------------
// Simulation de mouvement (dérive réaliste)
// ---------------------------------------------------------------------------

function deterministicDrift(seed: string, axis: "lat" | "lon"): number {
  const t = Math.floor(Date.now() / 30_000);
  const hash = [...(seed + t + axis)].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return (hash % 1000) / 1_000_000;
}

function simulatePosition(
  route: (typeof ROUTES)[number],
  idx: number,
  dlat: number,
  dlon: number
): { lat: number; lon: number; alt: number } {
  const base = route.waypoints[idx % route.waypoints.length];
  const shifted = { lat: base.lat + dlat, lon: base.lon + dlon, alt: base.alt };
  if (route.status === "stationary") return shifted;
  const seed = `${route.name}-${idx}`;
  return {
    lat: shifted.lat + deterministicDrift(seed, "lat"),
    lon: shifted.lon + deterministicDrift(seed, "lon"),
    alt: shifted.alt + Math.round(Math.sin(Date.now() / 60_000) * 15),
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const center = parseTileCenter(searchParams.get("tiles"));
    const dlat = center.lat - REF_LAT;
    const dlon = center.lon - REF_LON;

    const now = nowISO();
    const alpinists: AlpinistMarker[] = ROUTES.map((route, i) => {
      const pos = simulatePosition(route, i, dlat, dlon);
      const { lx, ly } = wgs84ToLambert93Km(pos.lon, pos.lat);
      return {
        id:        uid(),
        userId:    `alpinist-${i + 1}`,
        timestamp: now,
        updatedAt: now,
        position:  { lx, ly, altitude: pos.alt },
        speed:     route.speed,
        heading:   route.heading,
        status:    route.status,
        groupSize: route.groupSize,
        route:     route.name,
      };
    });

    const refuges: Refuge[] = REFUGE_OFFSETS.map((r) => {
      const lat = REF_LAT + r.dlat + dlat;
      const lon = REF_LON + r.dlon + dlon;
      const { lx, ly } = wgs84ToLambert93Km(lon, lat);
      const occ =
        r.currentGuests / r.capacity > 0.9 ? "full"
        : r.currentGuests / r.capacity > 0.5 ? "medium"
        : r.currentGuests > 0 ? "low"
        : "empty";
      return {
        id:            uid(),
        refugeId:      r.refugeId,
        name:          r.name,
        timestamp:     now,
        updatedAt:     now,
        position:      { lx, ly, altitude: r.alt },
        capacity:      r.capacity,
        occupancy:     occ,
        currentGuests: r.currentGuests,
        guardianed:    r.guardianed,
        phone:         "phone" in r ? r.phone : undefined,
      };
    });

    const body: HumanActivityData = {
      alpinists,
      refuges,
      rescueOps: [],
      activeCount: alpinists.filter((a) => a.status === "active" || a.status === "descending").length,
    };

    console.log(`[alpinists] ${alpinists.length} cordées @ (${center.lat.toFixed(4)}, ${center.lon.toFixed(4)})`);

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[alpinists] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
