import React, { createContext, useContext, useState, useEffect } from "react";
import { Leva, useControls, folder } from "leva";

// Création du Context pour partager l'état des contrôles
export const SceneControlsContext = createContext<{
  nuages: boolean;
  showBoundingBoxes: boolean;
  material: string;
  fov: number;
  [key: string]: any;
}>({
  nuages: true,
  showBoundingBoxes: true,
  material: "normal",
  fov: 75,
});

function Params() {
  const cameraControls = useControls("Caméra", {
    fov: {
      value: 75,
      min: 10,
      max: 110,
      step: 1,
      label: "Largeur de champ",
    },
    autoRotate: {
      value: false,
      label: "Rotation auto",
    },
    // position: {
    //   value: [1,1,1],
    //   min: 0,
    //   max: 10,
    //   step: 1,
    //   label: "Position caméra",
    // },
  });

  const lightControls = useControls("Éclairages", {
    showAmbientLight: { value: true, label: "Lumière ambiante" },
    ambientIntensity: {
      value: 0.3,
      min: 0,
      max: 1.5,
      step: 0.01,
      label: "Intensité ambiante",
      render: (get) => get("Éclairages.showAmbientLight"),
    },
    showDirectionalLight: { value: true, label: "Lumière directionnelle" },
    directionalIntensity: {
      value: 1.2,
      min: 0,
      max: 1.7,
      step: 0.01,
      label: "Intensité directionnelle",
      render: (get) => get("Éclairages.showDirectionalLight"),
    },
    sunAzimuth: {
      value: 180,
      min: 0,
      max: 360,
      step: 1,
      label: "Azimuth (°)",
      render: (get) => get("Éclairages.showDirectionalLight"),
    },
    sunElevation: {
      value: 40,
      min: 0,
      max: 90,
      step: 1,
      label: "Élévation (°)",
      render: (get) => get("Éclairages.showDirectionalLight"),
    },
  });

  const postProcessControls = useControls("Post-traitement", {
    enableBloom: { value: false, label: "Bloom" },
    bloomIntensity: {
      value: 0.1,
      min: 0,
      max: 3,
      step: 0.02,
      label: "Intensité du bloom",
      render: (get) => get("Post-traitement.enableBloom"),
    },
    bloomThreshold: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Seuil du bloom",
      render: (get) => get("Post-traitement.enableBloom"),
    },
    bloomLuminanceSmoothing: {
      value: 0.4,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Rayon du bloom",
      render: (get) => get("Post-traitement.enableBloom"),
    },

  });

  const aspectControls = useControls("Aspect", {
    material: {
      value: "slope",
      options: ["standard", "slope", "normal"],
      label: "Matériau",
    },
    meshColor: {
      value: "#ffdec9",
      label: "Couleur du mesh",
      render: (get) => get("Aspect.material") == "standard",
    },
    roughness: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Rugosité",
      render: (get) => get("Aspect.material") == "standard",
    },
    metalness: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Métallicité",
      render: (get) => get("Aspect.material") == "standard",
    },
    snowColor: {
      value: "#f1fbff",
      label: "Couleur neige",
      render: (get) => get("Aspect.material") === "slope",
    },
    rockColor: {
      value: "#cf9e82",
      label: "Couleur roche",
      render: (get) => get("Aspect.material") === "slope",
    },

    // preset CALANQUES : neige #bfcfa3   rocher #f3efdc
    slopeThreshold: {
      value: 0.55,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Seuil de pente",
      render: (get) => get("Aspect.material") === "slope",
    },
    smoothness: {
      value: 0.3,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "Douceur transition",
      render: (get) => get("Aspect.material") === "slope",
    },
  });

  const environmentControls = useControls("Environnement", {
    water: { value: false, label: "Mer" },


    nuages: { value: false, label: "Nuages" },
    cloudAltitude: {
      value: 3,
      min: 0,
      max: 10,
      step: 0.05,
      label: "Altitude",
      render: (get) => get("Nuages.nuages"),
    },
    cloudHeight: {
      value: 0.1,
      min: 0,
      max: 3,
      step: 0.01,
      label: "Hauteur",
      render: (get) => get("Nuages.nuages"),
    },
    cloudEtendue: {
      value: 2,
      min: 0,
      max: 10,
      step: 0.1,
      label: "Étendue",
      render: (get) => get("Nuages.nuages"),
    },

    cloudFade: {
      value: 10,
      min: 0,
      max: 50,
      step: 1,
      label: "Fondu",
      render: (get) => get("Nuages.nuages"),
    },
    cloudVolume: {
      value: 1,
      min: 0,
      max: 5,
      step: 0.1,
      label: "Volume",
      render: (get) => get("Nuages.nuages"),
    },
    cloudOpacity: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Opacité",
      render: (get) => get("Nuages.nuages"),
    },
    cloudSpeed: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Vitesse",
      render: (get) => get("Nuages.nuages"),
    },
    cloudGrowth: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Croissance",
      render: (get) => get("Nuages.nuages"),
    },
  });

  const debugControls = useControls("Debug", {
    showGrid: { value: true, label: "Grille" },
    showAxes: { value: false, label: "Axes" },
    showBoundingBoxes: { value: false, label: "Boîtes englobantes" },
    showStats: { value: false, label: "Statistiques" },
  });

  return {
    ...cameraControls,
    ...debugControls,
    ...lightControls,
    ...aspectControls,
    ...environmentControls,
    ...postProcessControls,
  };
}

const matrixTheme = {
  colors: {
    elevation1: "rgba(0, 0, 0, 0.5)",
    elevation2: "rgba(0, 0, 0, 0.2)",
    elevation3: "rgba(0, 0, 0, 0.3)",
    accent1: "#00ff00",
    accent2: "#00dd00",
    accent3: "#00bb00",
    highlight1: "#00ff00",
    highlight2: "#00ff00",
    highlight3: "#00ff00",
    vivid1: "#00ff00",
  },
  radii: {
    xs: "2px",
    sm: "3px",
    lg: "10px",
  },
  space: {
    sm: "3px",
    md: "6px",
    rowGap: "4px",
    colGap: "7px",
  },
  fontSizes: {
    root: "11px",
  },
};

export default function MyLevaUI({ children }: { children: React.ReactNode }) {
  const controlsValue = Params();

  return (
    <>
      <SceneControlsContext.Provider value={controlsValue}>
        <Leva
          theme={matrixTheme}
          hideCopyButton={true}
          flat={true}
          collapsed={true}
          titleBar={{
            // Configure title bar options
            title: "Paramètres", // Custom title
            drag: true, // Enable dragging
            filter: false, // Enable filter/search
            position: { x: 0, y: 0 }, // Initial position (when drag is enabled)
            onDrag: (position) => {}, // Callback when dragged
          }}
        />

        <style>{`
        .leva-c-kWgxhW {
          position: absolute !important;
          top: 5px !important;
          left: 5px !important;
          right: auto !important;
          max-height: calc(60vh - 20px) !important;
          overflow-y: auto !important;
          backdrop-filter: blur(10px);
        }
          
      `}</style>
        {children}
        {/* Le contexte est maintenant disponible pour tous les composants enfants */}
      </SceneControlsContext.Provider>
    </>
  );
}

// Hook personnalisé pour utiliser les contrôles de scène
export function useSceneControls() {
  return useContext(SceneControlsContext);
}
