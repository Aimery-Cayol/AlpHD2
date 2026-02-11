import { memo } from "react";
import { Grid } from "@react-three/drei";

/**
 * Configuration de la grille au sol
 */
const GRID_CONFIG = {
  cellSize: 0.2,
  cellThickness: 0.5,
  cellColor: "#6f6f6f",
  sectionSize: 1,
  sectionThickness: 1,
  sectionColor: "#9d4b4b",
  fadeDistance: 30,
  fadeStrength: 2,
  followCamera: false,
  infiniteGrid: true,
} as const;

/**
 * Composant grille au sol pour la scène 3D
 * Mémorisé pour éviter les re-renders inutiles
 */
export const Ground = memo(() => {
  return <Grid position={[0, -0.01, 0]} args={[10.5, 10.5]} {...GRID_CONFIG} />;
});

Ground.displayName = "Ground";
