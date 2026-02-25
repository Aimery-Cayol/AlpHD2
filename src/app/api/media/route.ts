// =============================================================================
// GET /api/media — webcams et médias (Windy Webcams API + fallback mock)
// =============================================================================
// Windy Webcams API v3 : https://api.windy.com/webcams/api/v3/webcams
//   Header : x-windy-api-key: $WINDY_API_KEY
//   Param  : nearby={lat},{lon},{radius_km}
//   Param  : include=location,player,images
// Fallback : webcams mock si clé absente.
// Cache : 10 min
// =============================================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { wgs84ToLambert93Km, degreesToWindDir, nowISO, uid } from "@/lib/geo";
import type { MediaData, WebcamFeed } from "@/types/data-layers";

export const revalidate = 600; // 10 min

// Centre de recherche : Dent du Géant / massif Mont-Blanc
const CENTER_LAT  = 45.8567;
const CENTER_LON  = 6.9553;
const RADIUS_KM   = 25;

// ---------------------------------------------------------------------------
// Schéma Zod de la réponse Windy Webcams v3
// ---------------------------------------------------------------------------

const WindyWebcamSchema = z.object({
  webcamId:  z.string(),
  title:     z.string(),
  status:    z.enum(["active", "inactive"]),
  location: z.object({
    latitude:  z.number(),
    longitude: z.number(),
    altitude:  z.number().optional().default(0),
    city:      z.string().optional().default(""),
  }),
  player: z.object({
    day: z.object({
      preview: z.string().optional(),
      embed:   z.string().optional(),
    }).optional(),
    live: z.object({
      preview: z.string().optional(),
      hls:     z.string().optional(),
    }).optional(),
  }).optional(),
  images: z.object({
    current: z.object({
      preview: z.string().optional(),
    }).optional(),
  }).optional(),
});

const WindyResponseSchema = z.object({
  webcams: z.array(WindyWebcamSchema),
  total:   z.number().optional(),
});

// ---------------------------------------------------------------------------
// Fetch depuis Windy
// ---------------------------------------------------------------------------

async function fetchWindyWebcams(): Promise<WebcamFeed[]> {
  const apiKey = process.env.WINDY_API_KEY;
  if (!apiKey) {
    console.log("[media] WINDY_API_KEY absent — utilisation du mock");
    return [];
  }

  const url = new URL("https://api.windy.com/webcams/api/v3/webcams");
  url.searchParams.set("nearby",   `${CENTER_LAT},${CENTER_LON},${RADIUS_KM}`);
  url.searchParams.set("include",  "location,player,images");
  url.searchParams.set("limit",    "20");
  url.searchParams.set("orderby",  "popularity");

  try {
    const res = await fetch(url.toString(), {
      headers: { "x-windy-api-key": apiKey },
      next: { revalidate: 600 },
    });

    if (res.status === 401) {
      console.error("[media] Windy API key invalide (401)");
      return [];
    }
    if (!res.ok) {
      console.error(`[media] Windy HTTP ${res.status}`);
      return [];
    }

    const raw: unknown = await res.json();
    const parsed = WindyResponseSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("[media] Validation Windy échouée:", parsed.error.flatten());
      return [];
    }

    const now = nowISO();
    return parsed.data.webcams.map((w) => {
      const { lx, ly } = wgs84ToLambert93Km(w.location.longitude, w.location.latitude);
      const snapshotUrl =
        w.images?.current?.preview ??
        w.player?.day?.preview ??
        w.player?.live?.preview ??
        "";
      const streamUrl = w.player?.live?.hls ?? w.player?.day?.embed ?? "";
      return {
        id:          uid(),
        webcamId:    w.webcamId,
        name:        w.title,
        timestamp:   now,
        updatedAt:   now,
        position:    { lx, ly, altitude: w.location.altitude },
        streamUrl,
        snapshotUrl,
        direction:   "N",      // Windy ne fournit pas l'orientation dans v3
        operator:    "Windy.com",
        online:      w.status === "active",
      } satisfies WebcamFeed;
    });
  } catch (err) {
    console.error("[media] Erreur Windy:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Webcams mock — positions réelles, snapshots publics connus
// ---------------------------------------------------------------------------

function buildMockWebcams(): WebcamFeed[] {
  const now = nowISO();
  const cams: Array<{
    id: string; name: string; lat: number; lon: number; alt: number;
    dir: string; operator: string; snapshot: string; stream: string;
  }> = [
    {
      id:       "aiguille-du-midi-live",
      name:     "Aiguille du Midi — sommet",
      lat: 45.8789, lon: 6.8870, alt: 3842,
      dir:      "S",
      operator: "Mont-Blanc Webcam",
      snapshot: "https://www.n-tv.de/img/33/335246/Img_335246_webcam-aiguille-du-midi_full.jpg",
      stream:   "",
    },
    {
      id:       "chamonix-village",
      name:     "Chamonix — centre village",
      lat: 45.9237, lon: 6.8694, alt: 1035,
      dir:      "SE",
      operator: "Office du Tourisme Chamonix",
      snapshot: "https://www.chamonix.com/webcams/webcam-chamonix.jpg",
      stream:   "",
    },
    {
      id:       "mer-de-glace-montenvers",
      name:     "Mer de Glace — Montenvers",
      lat: 45.9283, lon: 6.9150, alt: 1913,
      dir:      "S",
      operator: "Compagnie du Mont-Blanc",
      snapshot: "",
      stream:   "",
    },
    {
      id:       "brevent-planpraz",
      name:     "Brévent — Plan Praz",
      lat: 45.9372, lon: 6.8494, alt: 2000,
      dir:      "E",
      operator: "Ski Club Chamonix",
      snapshot: "",
      stream:   "",
    },
    {
      id:       "torino-refuge",
      name:     "Refuge Torino — Col du Géant",
      lat: 45.8678, lon: 6.9844, alt: 3371,
      dir:      "W",
      operator: "Rifugio Torino",
      snapshot: "",
      stream:   "",
    },
  ];

  return cams.map((c) => {
    const { lx, ly } = wgs84ToLambert93Km(c.lon, c.lat);
    return {
      id:          uid(),
      webcamId:    c.id,
      name:        c.name,
      timestamp:   now,
      updatedAt:   now,
      position:    { lx, ly, altitude: c.alt },
      streamUrl:   c.stream,
      snapshotUrl: c.snapshot,
      direction:   degreesToWindDir(
        c.dir === "N" ? 0 : c.dir === "NE" ? 45 : c.dir === "E" ? 90 :
        c.dir === "SE" ? 135 : c.dir === "S" ? 180 : c.dir === "SW" ? 225 :
        c.dir === "W" ? 270 : 315
      ),
      operator:    c.operator,
      online:      true,
    } satisfies WebcamFeed;
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // Windy en priorité, fallback mock si clé absente
    let webcams = await fetchWindyWebcams();
    if (webcams.length === 0) {
      webcams = buildMockWebcams();
      console.log(`[media] Mock — ${webcams.length} webcams`);
    } else {
      console.log(`[media] Windy — ${webcams.length} webcams`);
    }

    const body: MediaData = {
      items:   [],   // photos CampToCamp à intégrer ultérieurement
      webcams,
      total:   webcams.length,
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("[media] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
