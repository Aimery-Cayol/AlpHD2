// =============================================================================
// types/routes.ts — Types pour les voies d'alpinisme / escalade
// =============================================================================

export type RouteActivity = "alpinisme" | "escalade" | "ski";

export type RouteGrade =
  | "F" | "F+"
  | "PD-" | "PD" | "PD+"
  | "AD-" | "AD" | "AD+"
  | "D-" | "D" | "D+"
  | "TD-" | "TD" | "TD+"
  | "ED-" | "ED" | "ED+"
  | "EX";

export interface RoutePoint {
  lon: number;
  lat: number;
  altM: number;
}

export interface ClimbingRoute {
  id: string;
  name: string;
  activity: RouteActivity;
  grade: RouteGrade;
  gradeText?: string;
  description?: string;
  c2cUrl?: string;
  /** ID numérique CampToCamp pour récupérer le tracé GPS via /api/route-geo */
  c2cId?: string;
  track: RoutePoint[];
  color?: string;
}
