import { useEffect, useRef } from "react";

const GeoportailHD = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Charger les scripts et CSS du SDK IGN
    const loadSDK = () => {
      // Charger le CSS
      if (!document.getElementById("ign-sdk-css")) {
        const link = document.createElement("link");
        link.id = "ign-sdk-css";
        link.rel = "stylesheet";
        link.href =
          "https://ignf.github.io/geoportal-sdk/latest/dist/3d/GpSDK3D.css";
        document.head.appendChild(link);
      }

      // // Charger le client WFS
      // if (!document.getElementById('wfs-client-js')) {
      //   const wfsScript = document.createElement('script');
      //   wfsScript.id = 'wfs-client-js';
      //   wfsScript.src = 'https://ignf.github.io/geoportal-wfs-client/dist/geoportal-wfs-client.js';
      //   wfsScript.async = true;
      //   document.body.appendChild(wfsScript);
      // }

      // Charger le JS
      if (!document.getElementById("ign-sdk-js")) {
        const script = document.createElement("script");
        script.id = "ign-sdk-js";
        script.src =
          "https://ignf.github.io/geoportal-sdk/latest/dist/3d/GpSDK3D.js";
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else if (window.Gp) {
        initMap();
      }
    };

    const initMap = () => {
      if (!window.Gp || !mapRef.current || mapInstanceRef.current) return;

      mapInstanceRef.current = window.Gp.Map.load(mapRef.current, {
        // Thèmes d'accès (cartes et essentiels)
        apiKey: "cartes,essentiels,altimetrie",
        viewMode: "3d",

        // Centrage de la carte
        center: {
          location: "Briancon, Haues-Alpes, France",
        },

        // Niveau de zoom (1 à 21)
        zoom: 9,

        // Couches à afficher
        layersOptions: {
          "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2": {visibility: false},
          "ORTHOIMAGERY.ORTHOPHOTOS": {},
          "GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN": { visibility: false, opacity: 0.3 },
          "ELEVATION.CONTOUR.LINE":{visibility: false},
          "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.MNS": { type: "elevation" },
        },

        // Outils additionnels
        controlsOptions: {
          search: {
            maximised: true,
          },
          layerswitcher: {maximised: true,},
          zoom: {},
          mouseposition: {},
          graphicscale: {},
        },

        // Événements
        mapEventsOptions: {
          mapLoaded: function (evt: any) {
            console.log("Carte IGN chargée !", evt);
          },
        },
      });
    };

    loadSDK();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        // Nettoyage si nécessaire
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-screen">
      <div ref={mapRef} id="ign-map" className="w-full h-full" />
    </div>
  );
};

export default GeoportailHD;
