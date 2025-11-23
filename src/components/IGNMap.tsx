import { useEffect, useRef } from 'react';

const IGNMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Charger les scripts et CSS du SDK IGN
    const loadSDK = () => {
      // Charger le CSS
      if (!document.getElementById('ign-sdk-css')) {
        const link = document.createElement('link');
        link.id = 'ign-sdk-css';
        link.rel = 'stylesheet';
        link.href = 'http://ignf.github.io/geoportal-sdk/latest/dist/2d/GpSDK2D.css';
        document.head.appendChild(link);
      }

      // Charger le client WFS
      if (!document.getElementById('wfs-client-js')) {
        const wfsScript = document.createElement('script');
        wfsScript.id = 'wfs-client-js';
        wfsScript.src = 'https://ignf.github.io/geoportal-wfs-client/dist/geoportal-wfs-client.js';
        wfsScript.async = true;
        document.body.appendChild(wfsScript);
      }

      // Charger le JS
      if (!document.getElementById('ign-sdk-js')) {
        const script = document.createElement('script');
        script.id = 'ign-sdk-js';
        script.src = 'http://ignf.github.io/geoportal-sdk/latest/dist/2d/GpSDK2D.js';
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else if (window.Gp) {
        initMap();
      }
    };

    const initMap = () => {
      if (!window.Gp || !mapRef.current || mapInstanceRef.current) return;

      mapInstanceRef.current = window.Gp.Map.load(
        mapRef.current,
        {
          // Thèmes d'accès (cartes et essentiels)
          apiKey: "cartes,essentiels,altimetrie",
          
          // Centrage de la carte
          center: {
            location: "Paris, France"
          },
          
          // Niveau de zoom (1 à 21)
          zoom: 12,
          
          // Couches à afficher
          layersOptions: {
            "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2": {},
            // "ELEVATIONGRIDCOVERAGE.HIGHRES.QUALITY": {},
            "IGNF_NUAGES-DE-POINTS-LIDAR-HD:dalle": {
              title: "Dalles LiDAR HD",
              description: "Tableau d'assemblage des dalles de nuages de points LiDAR HD",
              format: "WFS",
              url: "https://data.geopf.fr/wfs",
              version: "2.0.0",
              typeNames: ["IGNF_NUAGES-DE-POINTS-LIDAR-HD:dalle"],
              outputFormat: "application/json",
              maxFeatures: 100,
              minZoom: 8,
              visibility: true,
              opacity: 0.7,
              stylesOptions: {
                strokeColor: "#0000ff",
                strokeWidth: 2,
                fillColor: "#0000ff",
                fillOpacity: 0.1
              }
            }
          },
          
          // Outils additionnels
          controlsOptions: {
            search: {
              maximised: false
            },
            layerswitcher: {},
            zoom: {},
            mouseposition: {},
            graphicscale: {}
          },
          
          // Événements
          mapEventsOptions: {
            mapLoaded: function(evt: any) {
              console.log("Carte IGN chargée !", evt);
            }
          }
        }
      );
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
      <div 
        ref={mapRef} 
        id="ign-map" 
        className="w-full h-full"
      />
    </div>
  );
};

export default IGNMap;