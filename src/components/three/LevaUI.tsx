import React, { createContext, useContext, useState, useEffect } from "react";
import { Leva, useControls, folder } from "leva";

// Création du Context pour partager l'état des contrôles
export const SceneControlsContext = createContext<{
  showBoundingBoxes: boolean;
  material: string;
  fov: number;
  showAvalanchePentes: boolean;
  [key: string]: any;
}>({
  nuages: true,
  showBoundingBoxes: true,
  material: "normal",
  fov: 75,
  showAvalanchePentes: false,
});

function Params() {
  const cameraControls = useControls("Caméra", {
    fov: {
      value: 70,
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

  const aspectControls = useControls("Aspect", {
    material: {
      value: "HauteMontagne",
      options: ["Standard", "HauteMontagne", "Normales", "BasseMontagne"],
      label: "Matériau",
    },
    meshColor: {
      value: "#ffdec9",
      label: "Couleur du mesh",
      render: (get) => get("Aspect.material") == "Standard",
    },
    roughness: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Rugosité",
      render: (get) => get("Aspect.material") == "Standard",
    },
    metalness: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Métallicité",
      render: (get) => get("Aspect.material") == "Standard",
    },

    // preset HAUTE MONTAGNE :
    snowColor: {
      value: "#f1fbff",
      label: "Couleur neige",
      render: (get) => get("Aspect.material") === "HauteMontagne",
    },
    rockColor: {
      //value: "#cf9e82",
      value: "#b2a49c",
      label: "Couleur roche",
      render: (get) => get("Aspect.material") === "HauteMontagne",
    },
    slopeThreshold: {
      value: 60,
      min: 0,
      max: 90,
      step: 1,
      label: "Seuil de pente (°)",
      render: (get) => get("Aspect.material") === "HauteMontagne",
    },
    smoothness: {
      value: 0.3,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "Douceur transition",
      render: (get) => get("Aspect.material") === "HauteMontagne",
    },

    // preset BASSE MONTAGNE :
    snowColorBM: {
      value: "#bfcfa3",
      label: "Végétation",
      render: (get) => get("Aspect.material") === "BasseMontagne",
    },
    rockColorBM: {
      value: "#f3efdc",
      label: "Falaises",
      render: (get) => get("Aspect.material") === "BasseMontagne",
    },
    slopeThresholdBM: {
      value: 55,
      min: 0,
      max: 90,
      step: 1,
      label: "Seuil de pente (°)",
      render: (get) => get("Aspect.material") === "BasseMontagne",
    },
    smoothnessBM: {
      value: 0.3,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "Douceur transition",
      render: (get) => get("Aspect.material") === "BasseMontagne",
    },
  });

  const lightControls = useControls("Éclairages", {
    showAmbientLight: { value: true, label: "Lumière ambiante" },
    ambientIntensity: {
      value: 0.2,
      min: 0,
      max: 1.5,
      step: 0.01,
      label: "Intensité ambiante",
      render: (get) => get("Éclairages.showAmbientLight"),
    },
    showDirectionalLight: { value: true, label: "Lumière directionnelle" },
    directionalIntensity: {
      value: 0.9,
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
      value: 35,
      min: 0,
      max: 90,
      step: 0.5,
      label: "Élévation (°)",
      render: (get) => get("Éclairages.showDirectionalLight"),
    },
  });

  const environmentControls = useControls("Environnement", {
    water: { value: false, label: "Mer" },
  });

  const skyControls = useControls("Ciel", {
    turbidity: {
      value: 2,
      min: 0,
      max: 20,
      step: 0.05,
      label: "Turbidité",
    },
    rayleigh: {
      value: 0.3,
      min: 0,
      max: 4,
      step: 0.01,
      label: "Diffusion Rayleigh",
    },
    mieCoefficient: {
      value: 0.005,
      min: 0,
      max: 0.1,
      step: 0.001,
      label: "Coefficient Mie",
    },
    mieDirectionalG: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Directionnalité Mie",
    },
    fogColor: {
      value: "#cddeea",
      label: "Couleur brouillard",
    },
    fogDensity: {
      value: 0.04,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Densité brouillard",
    },
    fogExponent: {
      value: 6.5,
      min: 0,
      max: 10,
      step: 0.1,
      label: "Exposant brouillard",
    },
  });

  const basemapControls = useControls("Fond de carte", {
    showBasemap: { value: true, label: "Carte IGN" },
    basemapLayer: {
      value: "PLANIGNV2",
      options: ["PLANIGNV2", "ORTHOPHOTOS", "MAPS"],
      label: "Type de carte",
      render: (get) => get("Fond de carte.showBasemap"),
    },
    basemapOpacity: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Opacité",
      render: (get) => get("Fond de carte.showBasemap"),
    },
  });

  const debugControls = useControls("Debug", {
    showGrid: { value: false, label: "Grille" },
    showAxes: { value: false, label: "Axes" },
    showBoundingBoxes: { value: false, label: "Boîtes englobantes" },
    showStats: { value: false, label: "Statistiques" },
    showCameraTarget: { value: false, label: "Cible caméra" },
  });

  const postProcessControls = useControls("Expérimental", {
    enablePostProcess: { value: false, label: "Post-traitement" },
    enableVignette: {
      value: false,
      label: "Vignette",
      render: (get) => get("Expérimental.enablePostProcess"),
    },
    enableBrightnessContrast: {
      value: false,
      label: "Luminosité/Contraste",
      render: (get) => get("Expérimental.enablePostProcess"),
    },
    enableToneMapping: {
      value: false,
      label: "Correction de gamma",
      render: (get) => get("Expérimental.enablePostProcess"),
    },

    // enableSSAO: { value: false, label: "SSAO", render: (get) => get("Post-traitement.enablePostProcess"), },

    enableBloom: {
      value: false,
      label: "Bloom",
      render: (get) => get("Expérimental.enablePostProcess"),
    },
    bloomIntensity: {
      value: 0.1,
      min: 0,
      max: 3,
      step: 0.02,
      label: "Intensité du bloom",
      render: (get) => get("Expérimental.enableBloom"),
    },
    bloomThreshold: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Seuil du bloom",
      render: (get) => get("Expérimental.enableBloom"),
    },
    bloomLuminanceSmoothing: {
      value: 0.4,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Rayon du bloom",
      render: (get) => get("Expérimental.enableBloom"),
    },
  });

  return {
    ...cameraControls,
    ...basemapControls,
    ...debugControls,
    ...lightControls,
    ...aspectControls,
    ...environmentControls,
    ...skyControls,
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

const lightTheme = {
  colors: {
    elevation1: "#ffffff80",
    elevation2: "#f5f5f580",
    elevation3: "#cccccc80",
    accent1: "#0066DC",
    accent2: "#007BFF",
    accent3: "#3C93FF",
    highlight1: "#666666",
    highlight2: "#333333",
    highlight3: "#000000",
    vivid1: "#ffcc00",
  },
  radii: {
    xs: "2px",
    sm: "3px",
    lg: "10px",
  },
};

export default function MyLevaUI({
  children,
  showAvalanchePentes,
}: {
  children: React.ReactNode;
  showAvalanchePentes: boolean;
}) {
  const controlsValue = Params();

  return (
    <>
      <SceneControlsContext.Provider
        value={{ ...controlsValue, showAvalanchePentes }}
      >
        <Leva
          theme={lightTheme}
          hideCopyButton={true}
          flat={false}
          collapsed={true}
          oneLineLabels={false}
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
          // bottom: 5px !important;
          max-height: calc(60vh - 5px) !important;
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
