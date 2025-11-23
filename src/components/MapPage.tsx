"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

import { extractCoordinates } from "@/utils/fileUtils";

export default function MapPage() {
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const popupRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    // Import dynamique de Leaflet
    import("leaflet").then((L) => {
      if (mapRef.current) return;

      const map = L.map("map").setView([47.23, 6.02], 14);
      mapRef.current = map;

      L.tileLayer(
        "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>',
        }
      ).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      popupRef.current = L.popup();

      map.on("click", async (e) => {
        console.log("Clic détecté:", e.latlng);
        layerGroupRef.current?.clearLayers();

        const baseUrl = "https://data.geopf.fr/wfs/ows";
        const params = [
          "SERVICE=WFS",
          "VERSION=2.0.0",
          "REQUEST=GetFeature",
          "TYPENAME=IGNF_NUAGES-DE-POINTS-LIDAR-HD:dalle",
          "OUTPUTFORMAT=application/json",
          "SRSNAME=EPSG:4326",
          `CQL_FILTER=INTERSECTS(geom,POINT(${e.latlng.lat} ${e.latlng.lng}))`,
        ];
        const url = `${baseUrl}?${params.join("&")}`;

        console.log("URL WFS:", url);

        try {
          const response = await fetch(url.toString());
          console.log("Statut réponse:", response.status);

          const geojson = await response.json();
          console.log("GeoJSON reçu:", geojson);

          // const message =
          //   geojson.features?.length === 0
          //     ? "Dalle non trouvée"
          //     : // : `Dalle ${geojson.features[0].properties.name}`;
          //       (() => {
          //         const coords = extractCoordinates(
          //           geojson.features[0].properties.name
          //         );
          //         return coords
          //           ? `Coords : X=${coords.x}, Y=${coords.y}`
          //           : "Coords : Non disponibles";
          //       })();

          const coords = extractCoordinates(
            geojson.features[0].properties.name
          );
          const message = coords
            ? `Coordonnées de la dalle : <br>X_Y=${coords.x.toString().padStart(4, '0')}_${coords.y.toString().padStart(4, '0')}`
            : "Dalle non trouvée";

          popupRef.current?.setLatLng(e.latlng).setContent(message).openOn(map);

          if (geojson.features?.length > 0) {
            const geojsonLayer = L.geoJSON(geojson);
            geojsonLayer.addTo(layerGroupRef.current!);
            map.fitBounds(geojsonLayer.getBounds());
          }
        } catch (err) {
          console.error("Erreur complète:", err);
          popupRef.current
            ?.setLatLng(e.latlng)
            .setContent("Erreur (voir console)")
            .openOn(map);
        }
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <p className="p-4 bg-gray-100">
        Cliquez sur la carte pour voir le numéro du modèle correspondant.
      </p>
      <div id="map" className="flex-1" />
    </div>
  );
}
