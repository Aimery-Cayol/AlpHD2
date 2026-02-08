import proj4 from 'proj4';

// Définir les projections (même config que generate-geojson.ts)
proj4.defs('EPSG:2154', '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs +type=crs');

export interface BoundingBox {
  minX: number;  // Lambert 93 X min (meters)
  maxX: number;  // Lambert 93 X max (meters)
  minY: number;  // Lambert 93 Y min (meters)
  maxY: number;  // Lambert 93 Y max (meters)
}

export interface WGS84BoundingBox {
  west: number;   // Longitude min
  east: number;   // Longitude max
  south: number;  // Latitude min
  north: number;  // Latitude max
}

/**
 * Convertit des coordonnées Lambert 93 vers WGS84
 */
export function lambert93ToWgs84(x: number, y: number): [number, number] {
  const [lon, lat] = proj4('EPSG:2154', 'EPSG:4326', [x, y]);
  return [lon, lat];
}

/**
 * Calcule la bounding box à partir des dalles sélectionnées
 * Les dalles sont des carrés de 1km x 1km en Lambert 93
 * Convention de nommage: XXXX_YYYY où XXXX et YYYY sont en km
 */
export function calculateBoundingBox(
  tiles: Array<{ x: number; y: number }>,
  marginKm: number = 0.5
): BoundingBox {
  if (tiles.length === 0) {
    throw new Error('No tiles provided');
  }

  // x et y sont en km (ex: 1006, 6545)
  // Conversion en mètres: multiplier par 1000
  const xValues = tiles.map(t => t.x * 1000);
  const yValues = tiles.map(t => t.y * 1000);

  const marginMeters = marginKm * 1000;

  return {
    minX: Math.min(...xValues) - marginMeters,
    maxX: Math.max(...xValues) + 1000 + marginMeters, // +1000m pour la largeur de la dalle
    minY: Math.min(...yValues) - 1000 - marginMeters, // -1000m car les dalles s'étendent vers le sud
    maxY: Math.max(...yValues) + marginMeters,
  };
}

/**
 * Convertit une bounding box Lambert 93 en WGS84
 */
export function boundingBoxToWgs84(bbox: BoundingBox): WGS84BoundingBox {
  const [west, south] = lambert93ToWgs84(bbox.minX, bbox.minY);
  const [east, north] = lambert93ToWgs84(bbox.maxX, bbox.maxY);

  return { west, east, south, north };
}

export type IGNLayer = 'PLANIGNV2' | 'ORTHOPHOTOS' | 'MAPS';

export interface IGNLayerOptions {
  layer?: IGNLayer;
  width?: number;
  height?: number;
}

/**
 * Construit l'URL WMS pour récupérer une image IGN via le proxy local
 */
export function buildIGNWmsUrl(
  bbox: WGS84BoundingBox,
  options: IGNLayerOptions = {}
): string {
  const {
    layer = 'PLANIGNV2',
    width = 2048,
    height = 2048,
  } = options;

  const layerName = layer === 'PLANIGNV2'
    ? 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2'
    : layer === 'ORTHOPHOTOS'
    ? 'ORTHOIMAGERY.ORTHOPHOTOS'
    : 'GEOGRAPHICALGRIDSYSTEMS.MAPS';

  // Utilise le proxy local pour éviter les erreurs CORS
  // WMS 1.3.0 avec EPSG:4326 attend BBOX en ordre lat,lon (south,west,north,east)
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;

  return `/api/ign-basemap?bbox=${encodeURIComponent(bboxStr)}&layer=${encodeURIComponent(layerName)}&width=${width}&height=${height}`;
}
