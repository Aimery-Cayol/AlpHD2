"use client";

import { useEffect, useRef, useState } from "react";

import { extractCoordinates } from "@/utils/fileUtils";

// Fonction pour charger et afficher la couche des tuiles
const loadTilesLayer = async (map: any, L: any) => {
  try {
    const response = await fetch('/tiles.geojson');
    if (!response.ok) {
      console.error('Erreur chargement GeoJSON:', response.status);
      return;
    }

    const geojson = await response.json();
    console.log('GeoJSON tuiles chargé:', geojson.features?.length, 'tuiles');

    // Créer la couche GeoJSON avec style et interactions
    const tilesLayer = L.geoJSON(geojson, {
      style: {
        color: '#00ff00',
        weight: 2,
        opacity: 0.8,
        fillColor: '#00ff00',
        fillOpacity: 0.3,
      },
      onEachFeature: (feature: any, layer: any) => {
        // Ajouter popup avec informations de la tuile
        const props = feature.properties;
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold text-lg mb-2">${props.name}</h3>
            <p class="text-sm mb-1"><strong>ID:</strong> ${props.id}</p>
            <p class="text-sm mb-1"><strong>Format:</strong> ${props.format.toUpperCase()}</p>
            <p class="text-sm mb-1"><strong>Coordonnées Lambert 93:</strong></p>
            <p class="text-sm ml-2">X: ${props.x}, Y: ${props.y}</p>
            <p class="text-sm mb-2"><strong>URL:</strong> <a href="${props.url}" target="_blank" class="text-blue-600 underline">Voir le fichier</a></p>
            <button class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    onclick="window.dispatchEvent(new CustomEvent('loadTile', { detail: '${props.url}' }))">
              Charger dans 3D
            </button>
          </div>
        `;

        layer.bindPopup(popupContent);

        // Survol pour highlight
        layer.on('mouseover', () => {
          (layer as L.Path).setStyle({
            fillOpacity: 0.6,
            weight: 3,
          });
        });

        layer.on('mouseout', () => {
          (layer as L.Path).setStyle({
            fillOpacity: 0.3,
            weight: 2,
          });
        });
      }
    });

    // Ajouter au contrôle des couches
    const baseLayers = {
      "Carte IGN": L.tileLayer(
        "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        { maxZoom: 18, attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>' }
      )
    };

    const overlays = {
      "Tuiles disponibles": tilesLayer
    };

    L.control.layers(baseLayers, overlays).addTo(map);

    // Ajouter la couche par défaut
    tilesLayer.addTo(map);
    return tilesLayer;

  } catch (error) {
    console.error('Erreur chargement couche tuiles:', error);
  }
};

export default function MapPage() {
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const tilesLayerRef = useRef<L.GeoJSON | null>(null);
  const [tilesVisible, setTilesVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

      // Charger et afficher les tuiles disponibles
      loadTilesLayer(map, L).then(layer => {
        if (layer) {
          tilesLayerRef.current = layer;
        }
      });

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

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen">
        <p className="p-4 bg-gray-100">
          Chargement de la carte...
        </p>
        <div className="flex-1 bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <p className="p-4 bg-gray-100">
        Carte interactive : Les tuiles disponibles sont affichées en bleu. Cliquez sur une tuile pour voir ses détails ou cliquez ailleurs pour rechercher des données IGN.
      </p>
      <div id="map" className="flex-1" />
    </div>
  );
}
