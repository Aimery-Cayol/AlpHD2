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
import { wgs84ToLambert93Km, lambert93KmToWgs84, degreesToWindDir, nowISO, uid } from "@/lib/geo";
import type { MediaData, WebcamFeed } from "@/types/data-layers";

// Centre de référence des webcams mock (Dent du Géant)
const REF_LAT = 45.8567;
const REF_LON = 6.9553;
const RADIUS_KM = 25;

/** Calcule le centre WGS-84 des dalles demandées, repli sur la référence */
function parseTileCenter(tilesParam: string | null): { lat: number; lon: number } {
  if (!tilesParam) return { lat: REF_LAT, lon: REF_LON };
  const coords = tilesParam
    .split(",")
    .map((t) => { const [x, y] = t.split("_").map(Number); return { x, y }; })
    .filter((c) => !isNaN(c.x) && !isNaN(c.y) && c.x > 0 && c.y > 0);
  if (coords.length === 0) return { lat: REF_LAT, lon: REF_LON };
  const avgX = coords.reduce((s, c) => s + c.x, 0) / coords.length + 0.5;
  const avgY = coords.reduce((s, c) => s + c.y, 0) / coords.length + 0.5;
  const [lon, lat] = lambert93KmToWgs84(avgX, avgY);
  return { lat, lon };
}

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
  url.searchParams.set("nearby",   `${REF_LAT},${REF_LON},${RADIUS_KM}`);
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
      // streamUrl = flux HLS natif si disponible
      const streamUrl = w.player?.live?.hls ?? "";
      // embedUrl = player embarquable en iframe (Windy day embed)
      const embedUrl  = w.player?.day?.embed ?? undefined;
      return {
        id:          uid(),
        webcamId:    w.webcamId,
        name:        w.title,
        timestamp:   now,
        updatedAt:   now,
        position:    { lx, ly, altitude: w.location.altitude },
        streamUrl,
        snapshotUrl,
        embedUrl,
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

function buildMockWebcams(centerLat: number, centerLon: number): WebcamFeed[] {
  const now = nowISO();
  // Offsets [dlat, dlon, alt] par rapport au centre de la dalle
  const cams: Array<{
    id: string; name: string; dlat: number; dlon: number; alt: number;
    dir: string; operator: string; snapshot: string; stream: string; embed?: string;
  }> = [
    {
      // Aiguille du Midi : 45.8788°N, 6.8873°E — offset depuis Dent du Géant (REF)
      id:       "cam-aiguille-midi",
      name:     "Aiguille du Midi — 3 842 m",
      dlat: 0.0221, dlon: -0.0680, alt: 3842,
      dir:      "S",
      operator: "Compagnie du Mont-Blanc",
      // Windy public snapshot + player embed (ID 1237897571 = Aiguille du Midi)
      snapshot: "https://images-webcams.windy.com/71/1237897571/current/full/1237897571.jpg",
      stream:   "",
      embed:    "https://webcams.windy.com/webcams/public/embed/player/1237897571/day",
    },
    {
      // Chamonix centre — 45.9237°N, 6.8694°E
      id:       "cam-chamonix",
      name:     "Chamonix centre — 1 035 m",
      dlat: 0.0670, dlon: -0.0859, alt: 1035,
      dir:      "SE",
      operator: "Office du Tourisme de Chamonix",
      // Windy webcam Chamonix (ID 1237875837)
      snapshot: "https://images-webcams.windy.com/37/1237875837/current/full/1237875837.jpg",
      stream:   "",
      embed:    "https://webcams.windy.com/webcams/public/embed/player/1237875837/day",
    },
    {
      // Mer de Glace / Montenvers — 45.9283°N, 6.9158°E
      id:       "cam-mer-de-glace",
      name:     "Mer de Glace — Montenvers",
      dlat: 0.0716, dlon: -0.0395, alt: 1913,
      dir:      "S",
      operator: "Compagnie du Mont-Blanc",
      snapshot: "https://images-webcams.windy.com/92/1237893092/current/full/1237893092.jpg",
      stream:   "",
      embed:    "https://webcams.windy.com/webcams/public/embed/player/1237893092/day",
    },
    {
      // Refuge du Goûter — 45.8456°N, 6.8618°E
      id:       "cam-refuge-gouter",
      name:     "Refuge du Goûter — 3 835 m",
      dlat: -0.0111, dlon: -0.0935, alt: 3835,
      dir:      "W",
      operator: "Refuge du Goûter",
      snapshot: "",
      stream:   "",
    },
  ];

  return cams.map((c) => {
    const { lx, ly } = wgs84ToLambert93Km(centerLon + c.dlon, centerLat + c.dlat);
    return {
      id:          uid(),
      webcamId:    c.id,
      name:        c.name,
      timestamp:   now,
      updatedAt:   now,
      position:    { lx, ly, altitude: c.alt },
      streamUrl:   c.stream,
      snapshotUrl: c.snapshot,
      embedUrl:    c.embed,
      direction:   degreesToWindDir(
        c.dir === "N" ? 0 : c.dir === "NE" ? 45 : c.dir === "E" ? 90 :
        c.dir === "SE" ? 135 : c.dir === "S" ? 180 : c.dir === "SW" ? 225 :
        c.dir === "W" ? 270 : 315
      ),
      operator:    c.operator,
      online:      c.snapshot !== "" || c.embed !== undefined,
    } satisfies WebcamFeed;
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const center = parseTileCenter(searchParams.get("tiles"));

    // Windy en priorité, fallback mock centré sur la dalle
    let webcams = await fetchWindyWebcams();
    if (webcams.length === 0) {
      webcams = buildMockWebcams(center.lat, center.lon);
      console.log(`[media] Mock — ${webcams.length} webcams @ (${center.lat.toFixed(4)}, ${center.lon.toFixed(4)})`);
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
