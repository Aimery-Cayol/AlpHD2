"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractCoordinates } from "@/utils/fileUtils";
import { useAppContext } from "@/contexts/AppContext";

// Styles pour les tuiles
const baseStyle = {
  color: "#00ff00",
  weight: 2,
  opacity: 0.8,
  fillColor: "#00ff00",
  fillOpacity: 0.3,
};

const selectedStyle = {
  color: "#ff0000",
  weight: 2,
  opacity: 0.8,
  fillColor: "#ff0000",
  fillOpacity: 0.3,
};

const maxSelectedTiles = 20;

// Fonction pour charger et afficher la couche des tuiles
const loadTilesLayer = async (
  map: any,
  L: any,
  selectedTiles: string[],
  setSelectedTiles: (tiles: string[] | ((prev: string[]) => string[])) => void
) => {
  try {
    const response = await fetch("/api/tiles");
    if (!response.ok) {
      console.error("Erreur chargement GeoJSON:", response.status);
      return;
    }

    const geojson = await response.json();
    console.log("GeoJSON tuiles chargé:", geojson.features?.length, "tuiles");

    // Créer la couche GeoJSON avec style et interactions
    const tilesLayer = L.geoJSON(geojson, {
      style: {
        color: "#007bff",
        weight: 2,
        opacity: 0.8,
        fillColor: "#0099ff",
        fillOpacity: 0.3,
      },
      onEachFeature: (feature: any, layer: any) => {
        const props = feature.properties;
        const isSelected = selectedTiles.includes(props.url);

        // Stocker l'état de sélection sur le layer lui-même
        (layer as any)._isSelected = isSelected;

        // Appliquer le style initial
        layer.setStyle(isSelected ? selectedStyle : baseStyle);

        // Clic pour toggle la sélection
        layer.on("click", () => {
          setSelectedTiles((prev) => {
            if (prev.includes(props.url)) {
              // Désélectionner
              (layer as any)._isSelected = false;
              layer.setStyle(baseStyle);
              return prev.filter((url) => url !== props.url);
            } else if (prev.length < maxSelectedTiles) {
              // Sélectionner
              (layer as any)._isSelected = true;
              layer.setStyle(selectedStyle);
              return [...prev, props.url];
            }
            return prev;
          });
        });

        // Survol pour highlight
        layer.on("mouseover", () => {
          (layer as L.Path).setStyle({
            fillOpacity: 0.6,
            weight: 3,
          });
        });

        layer.on("mouseout", () => {
          // Utiliser l'état stocké sur le layer
          const currentlySelected = (layer as any)._isSelected;
          (layer as L.Path).setStyle(
            currentlySelected ? selectedStyle : baseStyle
          );
        });
      },
    });

    // Ajouter au contrôle des couches
    const baseLayers = {
      "Carte IGN": L.tileLayer(
        "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>',
        }
      ),
    };

    const overlays = {
      "Tuiles disponibles": tilesLayer,
    };

    L.control.layers(baseLayers, overlays).addTo(map);

    // Ajouter la couche par défaut
    tilesLayer.addTo(map);
    return tilesLayer;
  } catch (error) {
    console.error("Erreur chargement couche tuiles:", error);
  }
};

export default function MapPage() {
  const router = useRouter();
  const {
    selectedTiles,
    setSelectedTiles,
    selectedModels,
    setSelectedModels,
    availableModels,
  } = useAppContext();
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
    const initMap = () => {
      // Import dynamique de Leaflet et du plugin VectorGrid
      import("leaflet")
        .then((LModule) => {
          const L = LModule.default;
          return import("leaflet.vectorgrid").then(() => L);
        })
        .then((L) => {
          if (mapRef.current) return;

          // Vérifier que le conteneur DOM existe avant de créer la carte
          const mapContainer = document.getElementById("map");
          if (!mapContainer) {
            console.warn("Map container not found, will retry...");
            setTimeout(initMap, 100); // Petit timer pour réessayer
            return;
          }

          const map = L.map("map").setView([45.23, 6.5], 7);
          mapRef.current = map;

          L.tileLayer(
            "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
            {
              maxZoom: 18,
              attribution: '&copy; <a href="https://www.ign.fr/">IGN</a>',
            }
          ).addTo(map);

          // // EN préparation d'ajout du flux TMS  des dalles LHD fournies par IGN.
          // // Ajouter la couche de tuiles vectorielles PBF
          // const lidarLayer = L.vectorGrid
          //   .protobuf(
          //     "https://data.geopf.fr/tms/1.0.0/IGNF_NUAGES-DE-POINTS-LIDAR-HD-produit/{z}/{x}/{y}.pbf",
          //     {
          //       vectorTileLayerStyles: {
          //         // Style par défaut pour toutes les features
          //         default: {
          //           weight: 2,
          //           color: "#ffff00",

          //           fillColor: "#ffff00",
          //           fillOpacity: 0.5,
          //         },
          //       },
          //       interactive: true,
          //       maxNativeZoom: 18, // ajuster selon la disponibilité
          //       zIndex: 1000, // Mettre au premier plan
          //     }
          //   )
          //   .addTo(map);

          // layerGroupRef.current = L.layerGroup().addTo(map);
          // popupRef.current = L.popup();

          // Charger et afficher les tuiles disponibles
          loadTilesLayer(map, L, selectedTiles, setSelectedTiles).then(
            (layer) => {
              if (layer) {
                tilesLayerRef.current = layer;
              }
            }
          );


          // ANCIEN EXEMPLE DEMO POUR FONCTIONNALITÉS DE POPUP SUR CLIC ET EXTRACTION COORDONNÉES
          // map.on("click", async (e) => {
          //   console.log("Clic détecté:", e.latlng);
          //   layerGroupRef.current?.clearLayers();

          //   const baseUrl = "https://data.geopf.fr/wfs/ows";
          //   const params = [
          //     "SERVICE=WFS",
          //     "VERSION=2.0.0",
          //     "REQUEST=GetFeature",
          //     "TYPENAME=IGNF_NUAGES-DE-POINTS-LIDAR-HD:dalle",
          //     "OUTPUTFORMAT=application/json",
          //     "SRSNAME=EPSG:4326",
          //     `CQL_FILTER=INTERSECTS(geom,POINT(${e.latlng.lat} ${e.latlng.lng}))`,
          //   ];
          //   const url = `${baseUrl}?${params.join("&")}`;

          //   console.log("URL WFS:", url);

          //   try {
          //     const response = await fetch(url.toString());
          //     console.log("Statut réponse:", response.status);

          //     const geojson = await response.json();
          //     console.log("GeoJSON reçu:", geojson);

          //     // const message =
          //     //   geojson.features?.length === 0
          //     //     ? "Dalle non trouvée"
          //     //     : // : `Dalle ${geojson.features[0].properties.name}`;
          //     //       (() => {
          //     //         const coords = extractCoordinates(
          //     //           geojson.features[0].properties.name
          //     //         );
          //         return coords
          //           ? `Coords : X=${coords.x}, Y=${coords.y}`
          //           : "Coords : Non disponibles";
          //       })();

          //     const coords = extractCoordinates(
          //       geojson.features[0].properties.name
          //     );
          //     const message = coords
          //       ? `Coordonnées de la dalle : <br>X_Y=${coords.x.toString().padStart(4, '0')}_${coords.y.toString().padStart(4, '0')}`
          //       : "Dalle non trouvée";

          //     popupRef.current?.setLatLng(e.latlng).setContent(message).openOn(map);

          //     if (geojson.features?.length > 0) {
          //       const geojsonLayer = L.geoJSON(geojson);
          //       geojsonLayer.addTo(layerGroupRef.current!);
          //       map.fitBounds(geojsonLayer.getBounds());
          //     }
          //   } catch (err) {
          //     console.error("Erreur complète:", err);
          //     popupRef.current
          //       ?.setLatLng(e.latlng)
          //       .setContent("Erreur (voir console)")
          //       .openOn(map);
          //   }
          // });
        });
    };

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen">
        <p className="p-4 bg-gray-100">Chargement de la carte...</p>
        <div className="flex-1 bg-gray-200 animate-pulse" />
      </div>
    );
  }

  const handleLoadSelectedTiles = () => {
    if (selectedTiles.length === 0) return;

    // Les tuiles sont déjà dans selectedTiles et persistées via localStorage
    // On désélectionne les sommets pour que les dalles directes soient utilisées
    setSelectedModels([]);

    // Naviguer vers la page principale
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-2 sm:p-4 bg-white border-b flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <p className="text-sm sm:text-base mb-2 sm:mb-0">
          Carte interactive : Les tuiles disponibles sont affichées en{" "}
          <span className="text-green-600 font-semibold">vert</span>. Cliquez
          sur une tuile pour la sélectionner (elle devient{" "}
          <span className="text-red-600 font-semibold">rouge</span>). Maximum{" "}
          {maxSelectedTiles} tuiles.
          {selectedTiles.length > 0 && (
            <span className="ml-2 font-semibold text-blue-600">
              {selectedTiles.length} tuile{selectedTiles.length > 1 ? "s" : ""}{" "}
              sélectionnée{selectedTiles.length > 1 ? "s" : ""}
            </span>
          )}
        </p>
        {selectedTiles.length > 0 && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={handleLoadSelectedTiles}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Charger {selectedTiles.length} tuile
              {selectedTiles.length > 1 ? "s" : ""} en 3D
            </button>
            <button
              onClick={() => {
                // Mettre à jour uniquement les tuiles actuellement sélectionnées
                if (tilesLayerRef.current) {
                  selectedTiles.forEach((url) => {
                    tilesLayerRef.current?.eachLayer((layer: any) => {
                      if (
                        layer.feature &&
                        layer.feature.properties?.url === url
                      ) {
                        // Réinitialiser l'état de sélection et le style
                        (layer as any)._isSelected = false;
                        layer.setStyle(baseStyle);
                      }
                    });
                  });
                }
                // Réinitialiser la sélection
                setSelectedTiles([]);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Tout désélectionner
            </button>
          </div>
        )}
      </div>

      <div id="map" className="flex-1" />

      <div className="p-2 bg-white border-t">
        <h3 className="font-medium mb-1 text-sm">Statistiques</h3>
        <p className="text-xs text-gray-600">
          {availableModels.length} modèles distants • 0 modèles locaux
        </p>
        <p className="text-xs text-gray-500">
          Total: {availableModels.length} modèles
        </p>
      </div>
    </div>
  );
}
