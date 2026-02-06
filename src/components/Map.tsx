"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    maplibregl: any;
    CarteFacile: any;
  }
}

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Charger les scripts et CSS
    const loadResources = () => {
      // CSS MapLibre
      if (!document.getElementById("maplibre-css")) {
        const maplibreCss = document.createElement("link");
        maplibreCss.id = "maplibre-css";
        maplibreCss.rel = "stylesheet";
        maplibreCss.href = "https://unpkg.com/maplibre-gl@^5.5.0/dist/maplibre-gl.css";
        document.head.appendChild(maplibreCss);
      }

      // CSS Carte Facile
      if (!document.getElementById("carte-facile-css")) {
        const carteFacileCss = document.createElement("link");
        carteFacileCss.id = "carte-facile-css";
        carteFacileCss.rel = "stylesheet";
        carteFacileCss.href = "https://unpkg.com/carte-facile@^0.8.3/dist/carte-facile.css";
        document.head.appendChild(carteFacileCss);
      }

      // Script MapLibre
      if (!document.getElementById("maplibre-js")) {
        const maplibreScript = document.createElement("script");
        maplibreScript.id = "maplibre-js";
        maplibreScript.src = "https://unpkg.com/maplibre-gl@^5.5.0/dist/maplibre-gl.js";
        maplibreScript.async = true;
        document.body.appendChild(maplibreScript);
      }

      // Script Carte Facile
      if (!document.getElementById("carte-facile-js")) {
        const carteFacileScript = document.createElement("script");
        carteFacileScript.id = "carte-facile-js";
        carteFacileScript.src = "https://unpkg.com/carte-facile@^0.8.3/dist/carte-facile.js";
        carteFacileScript.async = true;
        carteFacileScript.onload = initMap;
        document.body.appendChild(carteFacileScript);
      } else if (window.maplibregl && window.CarteFacile) {
        initMap();
      }
    };

    const initMap = () => {
      if (!window.maplibregl || !window.CarteFacile || !mapContainerRef.current || mapRef.current) {
        return;
      }

      // Création de la carte
      const map = new window.maplibregl.Map({
        container: mapContainerRef.current,
        style: window.CarteFacile.mapStyles.simple,
        maxZoom: 18.9,
      });

      // Contrôles
      map.addControl(new window.maplibregl.NavigationControl());
      map.addControl(new window.maplibregl.ScaleControl());
      map.addControl(new window.maplibregl.GeolocateControl());
      map.addControl(new window.CarteFacile.MapSelectorControl());

      mapRef.current = map;
    };

    loadResources();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full" style={{ background: "#000120" }} />;
}
