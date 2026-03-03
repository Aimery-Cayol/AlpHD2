// =============================================================================
// GET /api/route-geo?id={c2cId}
// Récupère le tracé GPS depuis l'API CampToCamp, convertit EPSG:3857 → WGS84
// Retourne : RoutePoint[] (lon, lat, altM)
// Cache 1h côté client (revalidation Next.js)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import proj4 from "proj4";

proj4.defs(
  "EPSG:3857",
  "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "id manquant ou invalide" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`https://api.camptocamp.org/routes/${id}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // cache 1h
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `C2C API ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    const geomDetailStr: string | null = data?.geometry?.geom_detail ?? null;

    if (!geomDetailStr) {
      // Route sans tracé GPS détaillé → tableau vide (le composant utilisera le tracé codé)
      return NextResponse.json([], {
        headers: { "Cache-Control": "public, max-age=3600" },
      });
    }

    const geomDetail = JSON.parse(geomDetailStr) as {
      type: string;
      coordinates: [number, number, number][];
    };

    const points = geomDetail.coordinates.map(([x3857, y3857, altM]) => {
      const [lon, lat] = proj4("EPSG:3857", "EPSG:4326", [x3857, y3857]);
      return { lon, lat, altM };
    });

    return NextResponse.json(points, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
