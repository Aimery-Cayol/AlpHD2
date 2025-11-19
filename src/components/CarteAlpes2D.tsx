'use client';

import React, { useEffect, useRef } from 'react';

// Déclarations de types pour Leaflet et Géoportail
declare global {
  interface Window {
    L: any;
    Gp: any;
  }
}

const CarteAlpes2D: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadCSS = (href: string): Promise<void> => {
      return new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve();
        document.head.appendChild(link);
      });
    };

    const initMap = (): void => {
      if (mapInstanceRef.current || !mapRef.current) return;

      window.Gp.Services.getConfig({
        apiKey: "essentiels, altimetrie",
        onSuccess: () => {
          const map = window.L.map(mapRef.current).setView([48.845, 2.424], 5);
          
          const lyrOSM = window.L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png');
          
          const lyrOrtho = window.L.geoportalLayer.WMTS({
            layer: "ORTHOIMAGERY.ORTHOPHOTOS", 
          });

          const lyrSlopes = window.L.geoportalLayer.WMTS({
            layer: "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.MNS",
          }, {
            opacity: 0.7
          });
          
          const lyrMaps = window.L.geoportalLayer.WMTS({
            layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGN2",
          }, {
            opacity: 0.7
          });
          
          map.addLayer(lyrOrtho);
          map.addLayer(lyrOSM);
          map.addLayer(lyrMaps);
          map.addLayer(lyrSlopes);
          
          const layerSwitcher = window.L.geoportalControl.LayerSwitcher({
            layers: [{
              layer: lyrOSM,
              config: {
                title: "OSM",
                description: "Couche Open Street Maps"
              }
            }]
          });
          
          map.addControl(layerSwitcher);
          mapInstanceRef.current = map;
        }
      });
    };

    const loadScripts = async (): Promise<void> => {
      if (!window.L) {
        await loadScript('https://unpkg.com/leaflet@1.0.1/dist/leaflet.js');
        await loadCSS('https://unpkg.com/leaflet@1.0.1/dist/leaflet.css');
      }
      
      if (!window.Gp) {
        await loadScript('https://ignf.github.io/geoportal-extensions/leaflet-latest/dist/GpPluginLeaflet.js');
        await loadCSS('https://ignf.github.io/geoportal-extensions/leaflet-latest/dist/GpPluginLeaflet.css');
      }
      
      initMap();
    };

    loadScripts();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default CarteAlpes2D;