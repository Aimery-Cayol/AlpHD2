// =============================================================================
// Types stricts pour les couches de données temps réel — AlpHD
// =============================================================================

// ---------------------------------------------------------------------------
// Communs
// ---------------------------------------------------------------------------

export type DataStatus = "idle" | "loading" | "success" | "error";
export type AlertLevel = "info" | "warning" | "danger" | "critical";

export interface GeoPoint {
  /** Lambert-93 en km (même repère que la scène 3D) */
  lx: number;
  ly: number;
  /** Altitude en mètres */
  altitude: number;
}

export interface TimestampedRecord {
  id: string;
  timestamp: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

// ---------------------------------------------------------------------------
// 1. MÉTÉO
// ---------------------------------------------------------------------------

export type WindDirection =
  | "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

export interface WeatherStation extends TimestampedRecord {
  stationId: string;
  name: string;
  position: GeoPoint;

  // Mesures actuelles
  temperature: number;           // °C
  temperatureFeelsLike: number;  // °C
  humidity: number;              // %
  pressure: number;              // hPa
  windSpeed: number;             // km/h
  windGust: number;              // km/h
  windDirection: WindDirection;
  precipitation: number;         // mm/h
  snowfall: number;              // cm/h
  visibility: number;            // km
  cloudCover: number;            // % (0-100)
  uvIndex: number;
}

export interface WeatherForecastPoint {
  time: string;             // ISO-8601
  temperature: number;      // °C
  windSpeed: number;        // km/h
  windDirection: WindDirection;
  precipitation: number;    // mm
  snowfall: number;         // cm
  cloudCover: number;       // %
  symbol: string;           // ex. "partly-cloudy", "snow", "clear"
}

export interface WeatherForecast extends TimestampedRecord {
  stationId: string;
  position: GeoPoint;
  hourly: WeatherForecastPoint[];  // 48h
  daily: WeatherForecastPoint[];   // 7 jours (agrégats)
}

export interface WeatherAlert extends TimestampedRecord {
  type: "wind" | "snow" | "ice" | "fog" | "thunderstorm" | "avalanche-risk";
  level: AlertLevel;
  message: string;
  expiresAt: string;
  affectedZones: string[]; // coord ex. "0696_6278"
}

export interface WeatherData {
  stations: WeatherStation[];
  forecasts: WeatherForecast[];
  alerts: WeatherAlert[];
}

// ---------------------------------------------------------------------------
// 2. ACTIVITÉ HUMAINE (alpinistes, refuges, secours)
// ---------------------------------------------------------------------------

export type AlpinistStatus = "active" | "stationary" | "descending" | "emergency";
export type RefugeOccupancy = "closed" | "empty" | "low" | "medium" | "full";

export interface AlpinistMarker extends TimestampedRecord {
  userId: string;         // anonymisé
  position: GeoPoint;
  speed: number;          // km/h
  heading: number;        // degrés (0 = Nord)
  status: AlpinistStatus;
  groupSize: number;
  route?: string;         // nom de la voie si renseigné
}

export interface Refuge extends TimestampedRecord {
  refugeId: string;
  name: string;
  position: GeoPoint;
  capacity: number;
  occupancy: RefugeOccupancy;
  currentGuests: number;
  guardianed: boolean;    // gardienné ?
  openFrom?: string;      // date ISO
  openUntil?: string;
  phone?: string;
  reservationUrl?: string;
}

export interface RescueOperation extends TimestampedRecord {
  operationId: string;
  type: "search" | "evacuation" | "injury" | "fatality";
  status: "active" | "resolved";
  position: GeoPoint;
  description: string;
  involvedPersons: number;
  authority: string;      // ex. "PGHM Grenoble"
}

export interface HumanActivityData {
  alpinists: AlpinistMarker[];
  refuges: Refuge[];
  rescueOps: RescueOperation[];
  /** Nombre d'alpinistes actifs en zone visible */
  activeCount: number;
}

// ---------------------------------------------------------------------------
// 3. ÉVÉNEMENTS GÉOLOGIQUES
// ---------------------------------------------------------------------------

export type AvalancheRisk = 1 | 2 | 3 | 4 | 5; // échelle européenne
export type AvalancheType = "slab" | "loose" | "wet" | "gliding";

export interface AvalancheZone extends TimestampedRecord {
  zoneId: string;
  name?: string;
  polygon: GeoPoint[];   // contour de la zone à risque
  risk: AvalancheRisk;
  types: AvalancheType[];
  aspects: WindDirection[];  // expositions concernées
  elevationMin: number;  // m
  elevationMax: number;  // m
  probableTime?: string; // heure de départ probable
  comment?: string;
}

export interface AvalancheEvent extends TimestampedRecord {
  eventId: string;
  position: GeoPoint;
  type: AvalancheType;
  size: 1 | 2 | 3 | 4 | 5; // D1-D5
  runoutDistance: number;   // mètres
  confirmed: boolean;
}

export interface SeismicEvent extends TimestampedRecord {
  eventId: string;
  position: GeoPoint;
  magnitude: number;       // Richter
  depth: number;           // km
  felt: boolean;
}

export interface RockfallReport extends TimestampedRecord {
  reportId: string;
  position: GeoPoint;
  volume?: number;         // m³
  affectedRoute?: string;
  dangerous: boolean;
}

export interface GeologicalData {
  avalancheZones: AvalancheZone[];
  avalancheEvents: AvalancheEvent[];
  seismicEvents: SeismicEvent[];
  rockfalls: RockfallReport[];
  /** Niveau de risque avalanche global de la zone (1-5) */
  massifRisk: AvalancheRisk | null;
}

// ---------------------------------------------------------------------------
// 4. ENVIRONNEMENT (neige, glaciers, eau, végétation)
// ---------------------------------------------------------------------------

export interface SnowpackStation extends TimestampedRecord {
  stationId: string;
  name: string;
  position: GeoPoint;
  snowDepth: number;     // cm
  snowDensity: number;   // kg/m³
  wetness: "dry" | "moist" | "wet";
  newSnow24h: number;    // cm des dernières 24h
  newSnow72h: number;    // cm des dernières 72h
}

export interface GlacierSensor extends TimestampedRecord {
  sensorId: string;
  glacierName: string;
  position: GeoPoint;
  icevelocity: number;   // m/day
  massBalance: number;   // mm w.e. (water equivalent) / year
  surfaceAlbedo: number; // 0-1
}

export interface HydrologicalStation extends TimestampedRecord {
  stationId: string;
  name: string;
  position: GeoPoint;
  waterLevel: number;    // cm
  flowRate: number;      // m³/s
  temperature: number;   // °C
  turbidity: number;     // NTU
}

export interface VegetationIndex extends TimestampedRecord {
  tileCoord: string;     // ex. "0696_6278"
  ndvi: number;          // -1 à 1
  treeLine: number;      // altitude de la limite des arbres en m
}

export interface EnvironmentData {
  snowpack: SnowpackStation[];
  glaciers: GlacierSensor[];
  hydrology: HydrologicalStation[];
  vegetation: VegetationIndex[];
}

// ---------------------------------------------------------------------------
// 5. MÉDIAS (photos, webcams, rapports, actualités)
// ---------------------------------------------------------------------------

export type MediaType = "photo" | "video" | "webcam" | "report" | "news";

export interface MediaItem extends TimestampedRecord {
  mediaId: string;
  type: MediaType;
  title: string;
  url: string;
  thumbnailUrl?: string;
  position?: GeoPoint;
  author?: string;
  source?: string;      // ex. "CampToCamp", "Météo-France", "PGHM"
  tags: string[];
  tileCoords: string[]; // dalles concernées
  likes?: number;
}

export interface WebcamFeed extends TimestampedRecord {
  webcamId: string;
  name: string;
  position: GeoPoint;
  streamUrl: string;
  snapshotUrl: string;
  /** URL d'un player Windy ou équivalent, embarquable en iframe */
  embedUrl?: string;
  direction: WindDirection;
  operator: string;
  online: boolean;
}

export interface MediaData {
  items: MediaItem[];
  webcams: WebcamFeed[];
  /** Total non paginé */
  total: number;
}

// ---------------------------------------------------------------------------
// État global des couches temps réel
// ---------------------------------------------------------------------------

export interface RealTimeLayersState {
  weather: { data: WeatherData | null; status: DataStatus; error: string | null };
  humanActivity: { data: HumanActivityData | null; status: DataStatus; error: string | null };
  geological: { data: GeologicalData | null; status: DataStatus; error: string | null };
  environment: { data: EnvironmentData | null; status: DataStatus; error: string | null };
  media: { data: MediaData | null; status: DataStatus; error: string | null };
}

// ---------------------------------------------------------------------------
// Messages WebSocket
// ---------------------------------------------------------------------------

export type WSEventType =
  | "weather:update"
  | "weather:alert"
  | "alpinist:position"
  | "alpinist:emergency"
  | "refuge:occupancy"
  | "rescue:new"
  | "avalanche:zone"
  | "avalanche:event"
  | "seismic:event"
  | "snowpack:update"
  | "media:new"
  | "webcam:status";

export interface WSMessage<T = unknown> {
  event: WSEventType;
  payload: T;
  timestamp: string;
}
