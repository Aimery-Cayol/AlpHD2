// =============================================================================
// GET /api/alpinists — positions alpinistes (mock réaliste, Dent du Géant)
// =============================================================================
// Simule 4-6 cordées sur des itinéraires réels du massif.
// Chaque appel fait dériver légèrement les positions (simulation mouvement).
// Pas de cache (données "temps réel").
// =============================================================================

import { NextResponse } from "next/server";
import { wgs84ToLambert93Km, nowISO, isoFromHoursAgo, uid } from "@/lib/geo";
import type { HumanActivityData, AlpinistMarker, Refuge, AlpinistStatus } from "@/types/data-layers";

// ---------------------------------------------------------------------------
// Itinéraires de référence (waypoints WGS-84 le long de voies réelles)
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
    name: "Voie normale Dent du Géant",
    status: "active",
    groupSize: 2,
    speed: 0.35,
    heading: 45,
    waypoints: [
      { lat: 45.8620, lon: 6.9590, alt: 3700 },
      { lat: 45.8590, lon: 6.9560, alt: 3850 },
      { lat: 45.8575, lon: 6.9555, alt: 3980 },
    ],
  },
  {
    name: "Arête de Rochefort",
    status: "active",
    groupSize: 3,
    speed: 0.28,
    heading: 220,
    waypoints: [
      { lat: 45.8680, lon: 6.9480, alt: 3820 },
      { lat: 45.8650, lon: 6.9510, alt: 3900 },
      { lat: 45.8625, lon: 6.9530, alt: 3970 },
    ],
  },
  {
    name: "Glacier du Géant",
    status: "descending",
    groupSize: 2,
    speed: 0.40,
    heading: 170,
    waypoints: [
      { lat: 45.8700, lon: 6.9600, alt: 3500 },
      { lat: 45.8660, lon: 6.9580, alt: 3650 },
    ],
  },
  {
    name: "Tour Ronde face nord",
    status: "stationary",
    groupSize: 4,
    speed: 0,
    heading: 0,
    waypoints: [
      { lat: 45.8530, lon: 6.9520, alt: 3500 },
    ],
  },
  {
    name: "Vallée Blanche",
    status: "active",
    groupSize: 6,
    speed: 0.55,
    heading: 310,
    waypoints: [
      { lat: 45.8740, lon: 6.9680, alt: 3450 },
      { lat: 45.8720, lon: 6.9650, alt: 3500 },
      { lat: 45.8700, lon: 6.9610, alt: 3550 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Refuges du massif
// ---------------------------------------------------------------------------

const REFUGE_DATA = [
  {
    refugeId: "refuge-cosmiques",
    name: "Refuge des Cosmiques",
    lat: 45.8789, lon: 6.8836, alt: 3613,
    capacity: 120,
    currentGuests: 98,
    guardianed: true,
    phone: "+33 4 50 54 40 16",
  },
  {
    refugeId: "refuge-torino",
    name: "Refuge Torino",
    lat: 45.8678, lon: 6.9844, alt: 3371,
    capacity: 130,
    currentGuests: 45,
    guardianed: true,
    phone: "+39 0165 846959",
  },
  {
    refugeId: "refuge-leschaux",
    name: "Refuge de Leschaux",
    lat: 45.8389, lon: 6.9878, alt: 2431,
    capacity: 40,
    currentGuests: 12,
    guardianed: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Simulation de mouvement (dérive réaliste)
// ---------------------------------------------------------------------------

/** Dérive pseudo-aléatoire reproductible à partir d'un seed + timestamp */
function deterministicDrift(seed: string, axis: "lat" | "lon"): number {
  const t = Math.floor(Date.now() / 30_000); // change toutes les 30s
  const hash = [...(seed + t + axis)].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return (hash % 1000) / 1_000_000; // ~0–0.001° de dérive
}

function simulatePosition(
  route: (typeof ROUTES)[number],
  idx: number
): { lat: number; lon: number; alt: number } {
  const base = route.waypoints[idx % route.waypoints.length];
  if (route.status === "stationary") return base;
  const seed = `${route.name}-${idx}`;
  return {
    lat: base.lat + deterministicDrift(seed, "lat"),
    lon: base.lon + deterministicDrift(seed, "lon"),
    alt: base.alt + Math.round(Math.sin(Date.now() / 60_000) * 15),
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const now = nowISO();
    const alpinists: AlpinistMarker[] = ROUTES.map((route, i) => {
      const pos = simulatePosition(route, i);
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

    const refuges: Refuge[] = REFUGE_DATA.map((r) => {
      const { lx, ly } = wgs84ToLambert93Km(r.lon, r.lat);
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

    console.log(`[alpinists] ${alpinists.length} cordées, ${refuges.length} refuges`);

    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[alpinists] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
