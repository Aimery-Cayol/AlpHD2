import { create } from "zustand";

export interface ParamsState {
  // Caméra
  fov: number;
  autoRotate: boolean;
  // Matériau
  material: "Standard" | "HauteMontagne" | "Normales" | "BasseMontagne";
  meshColor: string;
  roughness: number;
  metalness: number;
  // Haute montagne
  snowColor: string;
  rockColor: string;
  slopeThreshold: number;
  smoothness: number;
  // Basse montagne
  snowColorBM: string;
  rockColorBM: string;
  slopeThresholdBM: number;
  smoothnessBM: number;
  // Éclairages
  showAmbientLight: boolean;
  ambientIntensity: number;
  showDirectionalLight: boolean;
  directionalIntensity: number;
  sunAzimuth: number;
  sunElevation: number;
  // Environnement
  water: boolean;
  // Ciel
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  fogColor: string;
  fogDensity: number;
  fogExponent: number;
  // Fond de carte
  showBasemap: boolean;
  basemapLayer: string;
  basemapOpacity: number;
  // Debug
  showGrid: boolean;
  showAxes: boolean;
  showBoundingBoxes: boolean;
  showStats: boolean;
  showCameraTarget: boolean;
  // Expérimental
  enablePostProcess: boolean;
  enableVignette: boolean;
  enableBrightnessContrast: boolean;
  enableToneMapping: boolean;
  enableBloom: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomLuminanceSmoothing: number;
  // État outil
  showAvalanchePentes: boolean;
  // Action
  set: (partial: Partial<Omit<ParamsState, "set">>) => void;
}

export const useParamsStore = create<ParamsState>((setState) => ({
  fov: 70,
  autoRotate: false,
  material: "HauteMontagne",
  meshColor: "#ffdec9",
  roughness: 0.5,
  metalness: 0.5,
  snowColor: "#f1fbff",
  rockColor: "#b2a49c",
  slopeThreshold: 60,
  smoothness: 0.3,
  snowColorBM: "#bfcfa3",
  rockColorBM: "#f3efdc",
  slopeThresholdBM: 55,
  smoothnessBM: 0.3,
  showAmbientLight: true,
  ambientIntensity: 0.2,
  showDirectionalLight: true,
  directionalIntensity: 0.9,
  sunAzimuth: 180,
  sunElevation: 35,
  water: false,
  turbidity: 2,
  rayleigh: 0.3,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.9,
  fogColor: "#cddeea",
  fogDensity: 0.04,
  fogExponent: 6.5,
  showBasemap: true,
  basemapLayer: "PLANIGNV2",
  basemapOpacity: 0.9,
  showGrid: false,
  showAxes: false,
  showBoundingBoxes: false,
  showStats: false,
  showCameraTarget: false,
  enablePostProcess: false,
  enableVignette: false,
  enableBrightnessContrast: false,
  enableToneMapping: false,
  enableBloom: false,
  bloomIntensity: 0.1,
  bloomThreshold: 0.9,
  bloomLuminanceSmoothing: 0.4,
  showAvalanchePentes: false,
  set: (partial) => setState((s) => ({ ...s, ...partial })),
}));
