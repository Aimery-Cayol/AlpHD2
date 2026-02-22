import type { TileCoord } from "@/utils/fileUtils";

/**
 * Modèle de tuile 3D — interface unique partagée dans toute l'application
 */
export interface TileModel {
  coord: TileCoord;                    // "0696_6278"
  level: string;                       // niveau de détail sélectionné
  coordinates: { x: number; y: number }; // coordonnées brutes pour positionnement 3D
  availableLevels: string[];           // niveaux disponibles pour cette zone
}

/**
 * Données brutes d'une tuile depuis le GeoJSON
 */
export interface TileData {
  coord: TileCoord;
  x: number;                           // coordonnées géographiques (x * 1000)
  y: number;
  levels: string[];                    // niveaux disponibles
  files: { url: string; level: string }[];
}
