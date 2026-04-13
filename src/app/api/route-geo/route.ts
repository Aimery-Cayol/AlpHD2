// =============================================================================
// GET /api/route-geo?id={routeId}
// =============================================================================
// Priorité de résolution du tracé GPS :
//   1. Fichier local  public/routes/{routeId}.gpx   (le plus précis)
//   2. API Camptocamp https://api.camptocamp.org/routes/{routeId}  (si geom_detail présent)
//   3. Tableau vide   (le composant utilisera le tracé hardcodé)
//
// Dépose un fichier .gpx dans public/routes/ pour overrider le C2C.
// Exemple : public/routes/verte-whymper.gpx (id = l'id de ClimbingRoute)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import proj4 from "proj4";
import fs from "fs";
import path from "path";
import { parseGPX, downsamplePoints } from "@/lib/gpx-parser";

proj4.defs(
  "EPSG:3857",
  "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

/** Max points renvoyés au client (au-delà on sous-échantillonne) */
const MAX_POINTS = 500;

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  // c2cId optionnel : utilisé si pas de GPX local et id non-numérique
  const c2cId = req.nextUrl.searchParams.get("c2cId") ?? id;

  if (!id || !/^[\w-]+$/.test(id)) {
    return NextResponse.json({ error: "id manquant ou invalide" }, { status: 400 });
  }

  // ------------------------------------------------------------------
  // 1. Fichier GPX local : public/routes/{id}.gpx
  // ------------------------------------------------------------------
  const gpxPath = path.join(process.cwd(), "public", "routes", `${id}.gpx`);
  if (fs.existsSync(gpxPath)) {
    try {
      const xml = fs.readFileSync(gpxPath, "utf-8");
      const raw = parseGPX(xml);
      const points = downsamplePoints(raw, MAX_POINTS);
      if (points.length >= 2) {
        return NextResponse.json(points, {
          headers: { "Cache-Control": "no-cache" },
        });
      }
    } catch (err) {
      console.error(`[route-geo] Erreur lecture GPX local ${gpxPath}:`, err);
    }
  }

  // ------------------------------------------------------------------
  // 2. API Camptocamp — avec c2cId numérique
  //    a) geom_detail de la route
  //    b) fallback : meilleures sorties (outings) associées à la route
  // ------------------------------------------------------------------
  if (c2cId && /^\d+$/.test(c2cId)) {
    try {
      const upstream = await fetch(`https://api.camptocamp.org/routes/${c2cId}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (upstream.ok) {
        const data = await upstream.json();
        const geomDetailStr: string | null =
          data?.geometry?.geom_detail ?? null;

        if (geomDetailStr) {
          const geomDetail = JSON.parse(geomDetailStr) as {
            type: string;
            coordinates: [number, number, number][];
          };

          const raw = geomDetail.coordinates.map(([x3857, y3857, altM]) => {
            const [lon, lat] = proj4("EPSG:3857", "EPSG:4326", [x3857, y3857]);
            return { lon, lat, altM };
          });

          const points = downsamplePoints(raw, MAX_POINTS);
          if (points.length >= 2) {
            return NextResponse.json(points, {
              headers: { "Cache-Control": "public, max-age=3600" },
            });
          }
        }

        // Pas de geom_detail sur la route → chercher dans les sorties associées
        const outingDocs: { document_id: number }[] =
          data?.associations?.recent_outings?.documents ?? [];

        if (outingDocs.length > 0) {
          // Récupère les sorties en parallèle (max 20)
          const candidates = outingDocs.slice(0, 20);
          const outingResults = await Promise.allSettled(
            candidates.map((o) =>
              fetch(`https://api.camptocamp.org/outings/${o.document_id}`, {
                headers: { Accept: "application/json" },
                next: { revalidate: 3600 },
              }).then((r) => r.json())
            )
          );

          // Garde la meilleure sortie : priorité aux traces avec altitudes,
          // puis au nombre de points. Score = nbPts * 10 + (hasAlt ? 1000 : 0)
          let bestPoints: { lon: number; lat: number; altM: number }[] = [];
          let bestScore = -1;
          for (const result of outingResults) {
            if (result.status !== "fulfilled") continue;
            const outing = result.value;
            const gdStr: string | null = outing?.geometry?.geom_detail ?? null;
            if (!gdStr) continue;
            try {
              const gd = JSON.parse(gdStr) as {
                type: string;
                coordinates: number[][];
              };
              const coords = gd.coordinates;
              if (coords.length < 2) continue;
              const hasAlt = coords[0].length >= 3 && coords[0][2] !== 0;
              const score = coords.length * 10 + (hasAlt ? 1000 : 0);
              if (score > bestScore) {
                bestScore = score;
                bestPoints = coords.map(([x, y, alt]) => {
                  const [lon, lat] = proj4("EPSG:3857", "EPSG:4326", [x, y]);
                  return { lon, lat, altM: alt ?? 0 };
                });
              }
            } catch {
              // ignore
            }
          }

          if (bestPoints.length >= 2) {
            const points = downsamplePoints(bestPoints, MAX_POINTS);
            return NextResponse.json(points, {
              headers: { "Cache-Control": "public, max-age=3600" },
            });
          }
        }
      }
    } catch (err) {
      console.error(`[route-geo] Erreur API C2C pour id=${id}:`, err);
    }
  }

  // ------------------------------------------------------------------
  // 3. Pas de tracé disponible → tableau vide (fallback sur route.track)
  // ------------------------------------------------------------------
  return NextResponse.json([], {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
