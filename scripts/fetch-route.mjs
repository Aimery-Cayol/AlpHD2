#!/usr/bin/env node
// =============================================================================
// scripts/fetch-route.mjs
// =============================================================================
// Télécharge toutes les sorties GPS d'une voie Camptocamp, fusionne les tracés
// en une trace consensus et génère le GPX prêt pour le visualisateur 3D.
//
// Usage :
//   node scripts/fetch-route.mjs <c2c_route_id> <slug>
//   npm run fetch-route -- 54000 mallory-porter
//
// Résultat :
//   public/routes/<slug>/index.json          → métadonnées de toutes les sorties GPS
//   public/routes/<slug>/outing-<id>.json    → géométrie brute de chaque sortie
//   public/routes/<slug>.gpx                 → trace consensus (utilisée par l'API)
// =============================================================================

import proj4 from "proj4";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

proj4.defs(
  "EPSG:3857",
  "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs"
);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

// ─── Utilitaires géographiques ────────────────────────────────────────────────

function to4326(x, y) {
  return proj4("EPSG:3857", "EPSG:4326", [x, y]);
}

function distM(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

/** Ré-échantillonnage à espacement régulier (interpolation linéaire) */
function resample(pts, stepM) {
  if (pts.length < 2) return pts;
  const out = [pts[0]];
  let rem = stepM;
  for (let i = 1; i < pts.length; i++) {
    let prev = out[out.length - 1];
    let d = distM(prev, pts[i]);
    while (d >= rem) {
      const t = rem / d;
      const interp = {
        lon: prev.lon + t * (pts[i].lon - prev.lon),
        lat: prev.lat + t * (pts[i].lat - prev.lat),
        alt: prev.alt + t * (pts[i].alt - prev.alt),
      };
      out.push(interp);
      prev = interp;
      d -= rem;
      rem = stepM;
    }
    rem -= d;
  }
  const last = pts[pts.length - 1];
  if (distM(out[out.length - 1], last) > 5) out.push(last);
  return out;
}

/** Lissage altitude sur fenêtre glissante */
function smoothAlt(pts, window = 4) {
  return pts.map((p, i) => {
    const w = pts.slice(Math.max(0, i - window), i + window + 1);
    return { ...p, alt: w.reduce((s, q) => s + q.alt, 0) / w.length };
  });
}

/** Extrait la portion ascendante principale (du bas jusqu'à l'altitude max) */
function extractAscent(pts) {
  const maxIdx = pts.reduce((iMax, p, i) => (p.alt > pts[iMax].alt ? i : iMax), 0);
  // Garde les pts avant le sommet, en filtrant les redescentes > 80m
  const ascent = [];
  let maxSoFar = -Infinity;
  for (const p of pts.slice(0, maxIdx + 1)) {
    if (p.alt >= maxSoFar - 80) {
      ascent.push(p);
      if (p.alt > maxSoFar) maxSoFar = p.alt;
    }
  }
  return ascent;
}

// ─── Fetch API C2C ────────────────────────────────────────────────────────────

const C2C = "https://api.camptocamp.org";
const HEADERS = { Accept: "application/json" };

async function fetchJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

/** Extrait les points WGS84 depuis un geom_detail C2C (EPSG:3857) */
function parseGeomDetail(gdStr) {
  if (!gdStr) return null;
  try {
    const gd = JSON.parse(gdStr);
    let coords = [];
    if (gd.type === "LineString") coords = gd.coordinates;
    else if (gd.type === "MultiLineString") coords = gd.coordinates.flat();
    else return null;
    if (coords.length < 5) return null;
    return coords.map(([x, y, alt]) => {
      const [lon, lat] = to4326(x, y);
      return { lon, lat, alt: alt ?? 0 };
    });
  } catch {
    return null;
  }
}

// ─── Fusion N traces → trace consensus ───────────────────────────────────────
//
// Algorithme :
//  1. Pour chaque trace, on extrait la portion ascendante
//  2. On choisit comme SQUELETTE la trace avec la plus grande amplitude alt
//  3. Pour chaque point du squelette, on cherche les points proches dans toutes
//     les autres traces (< HORIZ_M horizontal ET < ALT_M d'altitude)
//  4. Médiane pondérée des positions (poids = 1/distance)
//  5. Lissage altimétrique

const HORIZ_M = 250; // rayon de recherche consensus
const ALT_M   = 200; // tolérance altitude
const STEP_M  = 30;  // espacement ré-échantillonnage

function mergeTraces(allTraces) {
  if (allTraces.length === 0) throw new Error("Aucune trace valide");
  if (allTraces.length === 1) return smoothAlt(allTraces[0], 3);

  // Ré-échantillonnage + extraction ascente
  const resampled = allTraces
    .map((t) => resample(t, STEP_M))
    .map(extractAscent)
    .filter((t) => t.length >= 5);

  if (resampled.length === 0) throw new Error("Traces trop courtes après filtrage");

  // Squelette = trace avec amplitude alt max
  const skeleton = resampled.reduce((best, t) => {
    const amp = Math.max(...t.map((p) => p.alt)) - Math.min(...t.map((p) => p.alt));
    const bestAmp = Math.max(...best.map((p) => p.alt)) - Math.min(...best.map((p) => p.alt));
    return amp > bestAmp ? t : best;
  });

  const others = resampled.filter((t) => t !== skeleton);

  const merged = skeleton.map((sk) => {
    // Collecte les points proches de toutes les autres traces
    const candidates = [{ p: sk, w: 1.0 }]; // le squelette lui-même, poids 1
    for (const trace of others) {
      let bestDist = HORIZ_M;
      let bestPt   = null;
      for (const gp of trace) {
        const dH = distM(sk, gp);
        const dV = Math.abs(gp.alt - sk.alt);
        if (dH < bestDist && dV < ALT_M) {
          bestDist = dH;
          bestPt = gp;
        }
      }
      if (bestPt) {
        candidates.push({ p: bestPt, w: 1 / (bestDist + 1) });
      }
    }
    // Moyenne pondérée
    const totalW = candidates.reduce((s, c) => s + c.w, 0);
    return {
      lon: candidates.reduce((s, c) => s + c.p.lon * c.w, 0) / totalW,
      lat: candidates.reduce((s, c) => s + c.p.lat * c.w, 0) / totalW,
      alt: candidates.reduce((s, c) => s + c.p.alt * c.w, 0) / totalW,
    };
  });

  return smoothAlt(merged, 4);
}

// ─── Génération GPX ───────────────────────────────────────────────────────────

function toGpx(pts, name) {
  const trkpts = pts
    .map(
      (p) =>
        `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}"><ele>${p.alt.toFixed(1)}</ele></trkpt>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AlpHD-fetch-route" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const [routeId, slug] = process.argv.slice(2);

if (!routeId || !slug) {
  console.error("Usage : node scripts/fetch-route.mjs <c2c_route_id> <slug>");
  console.error("Ex    : node scripts/fetch-route.mjs 54000 mallory-porter");
  process.exit(1);
}

const outDir = join("public", "routes", slug);
mkdirSync(outDir, { recursive: true });

// 1. Récupère le nom de la voie
console.log(`\n[1/4] Récupération des infos de la voie C2C #${routeId}…`);
const routeData = await fetchJSON(`${C2C}/routes/${routeId}`).catch(() => null);
const routeName = routeData?.locales?.[0]?.title ?? slug;
console.log(`      Voie : « ${routeName} »`);

// 2. Liste toutes les sorties (pagination jusqu'à 300)
console.log(`[2/4] Récupération des sorties avec tracé GPS…`);
const outingDocs = [];
for (let offset = 0; offset < 300; offset += 100) {
  const data = await fetchJSON(
    `${C2C}/outings?r=${routeId}&limit=100&offset=${offset}`
  );
  const docs = data?.documents ?? [];
  if (docs.length === 0) break;
  // Garde uniquement ceux avec geometry non nulle
  for (const doc of docs) {
    if (doc.geometry != null) {
      outingDocs.push({ id: doc.document_id, date: doc.date, geometry: doc.geometry });
    }
  }
  if (docs.length < 100) break;
}
console.log(`      ${outingDocs.length} sortie(s) avec geometry dans la liste`);

// 3. Fetch individuel pour obtenir geom_detail
console.log(`[3/4] Téléchargement des tracés détaillés (${outingDocs.length} sorties)…`);
const validTraces = [];
const index = [];

// Batch par 5 pour ne pas surcharger l'API
const BATCH = 5;
for (let i = 0; i < outingDocs.length; i += BATCH) {
  const batch = outingDocs.slice(i, i + BATCH);
  const results = await Promise.allSettled(
    batch.map((doc) => fetchJSON(`${C2C}/outings/${doc.id}`))
  );

  for (let j = 0; j < results.length; j++) {
    const res    = results[j];
    const docMeta = batch[j];
    if (res.status !== "fulfilled") continue;

    const outing     = res.value;
    const gdStr      = outing?.geometry?.geom_detail ?? null;
    const points     = parseGeomDetail(gdStr);
    const title      = outing?.locales?.[0]?.title ?? "(sans titre)";
    const author     = outing?.author?.name ?? "anonyme";
    const date       = outing?.date ?? docMeta.date ?? "?";
    const url        = `https://www.camptocamp.org/outings/${docMeta.id}`;

    const meta = { id: docMeta.id, date, author, title, url, pts: points?.length ?? 0 };

    if (!points || points.length < 5) {
      console.log(`      ⚠ #${docMeta.id} ignoré (geom_detail absent ou < 5 pts)`);
      index.push({ ...meta, status: "no_track" });
      continue;
    }

    // Sauvegarde géométrie brute
    const rawPath = join(outDir, `outing-${docMeta.id}.json`);
    writeFileSync(
      rawPath,
      JSON.stringify({ ...meta, coordinates: points }, null, 2),
      "utf-8"
    );

    validTraces.push({ meta, points });
    index.push({ ...meta, status: "ok", file: `outing-${docMeta.id}.json` });
    console.log(`      ✓ #${docMeta.id} (${points.length} pts) — ${date} — ${author}`);
  }
}

// Sauvegarde index
writeFileSync(join(outDir, "index.json"), JSON.stringify(index, null, 2), "utf-8");
console.log(`\n      ${validTraces.length} trace(s) GPS valide(s) sur ${outingDocs.length} sortie(s) avec geometry`);

if (validTraces.length === 0) {
  console.error("\n✗ Aucune trace GPS valide trouvée. Vérifiez le routeId.");
  process.exit(1);
}

// 4. Fusion + GPX
console.log(`[4/4] Fusion de ${validTraces.length} trace(s)…`);
const allPoints = validTraces.map((t) => t.points);
const consensus = mergeTraces(allPoints);

const altMin = Math.min(...consensus.map((p) => p.alt)).toFixed(0);
const altMax = Math.max(...consensus.map((p) => p.alt)).toFixed(0);
console.log(`      ${consensus.length} points consensus — ${altMin}m → ${altMax}m`);

const gpxPath = join("public", "routes", `${slug}.gpx`);
writeFileSync(gpxPath, toGpx(consensus, routeName), "utf-8");

console.log(`\n✓ GPX écrit       → ${gpxPath}`);
console.log(`✓ Données brutes  → ${outDir}/`);
console.log(`✓ Index           → ${outDir}/index.json`);
console.log(`\nPour l'afficher, assure-toi que la voie dans climbingRoutes.ts a id: "${slug}"`);
