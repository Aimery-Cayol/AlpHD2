"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/AppContext";
import type { TileCoord } from "@/utils/fileUtils";
import type { TileData } from "@/types/models";

// Composant de tooltip personnalisé
const Tooltip = ({ x, y, content }: { x: number; y: number; content: string }) => {
  if (!content) return null;

  return (
    <div
      className="fixed bg-black text-white px-3 py-2 rounded-lg shadow-lg font-mono text-xs whitespace-pre-line"
      style={{
        left: x + 15,
        top: y - 10,
        maxWidth: 250,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {content}
    </div>
  );
};

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

export default function MapPage() {
  const router = useRouter();
  const {
    selectedTiles,
    setSelectedTiles,
    setTilesData,
    availableLevels,
  } = useAppContext();
  const mapRef = useRef<L.Map | null>(null);
  const tilesLayerRef = useRef<L.GeoJSON | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: "" });
  const [tileCount, setTileCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const initMap = () => {
      import("leaflet")
        .then((LModule) => {
          const L = LModule.default;
          return import("leaflet.vectorgrid").then(() => L);
        })
        .then((L) => {
          if (mapRef.current) return;

          const mapContainer = document.getElementById("map");
          if (!mapContainer) {
            setTimeout(initMap, 100);
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

          // Charger les tuiles depuis le GeoJSON
          loadTilesLayer(map, L);
        });
    };

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const loadTilesLayer = async (map: any, L: any) => {
    try {
      const response = await fetch("/api/tiles");
      if (!response.ok) {
        console.error("Erreur chargement GeoJSON:", response.status);
        return;
      }

      const geojson = await response.json();
      console.log("GeoJSON tuiles chargé:", geojson.features?.length, "tuiles");
      setTileCount(geojson.features?.length || 0);

      // Construire tilesData pour le Context
      const newTilesData = new Map<TileCoord, TileData>();
      geojson.features?.forEach((feature: any) => {
        const props = feature.properties;
        const coord = props.name || props.id;
        if (coord) {
          newTilesData.set(coord, {
            coord,
            x: props.x,
            y: props.y,
            levels: props.levels || [],
            files: props.files || [],
          });
        }
      });
      setTilesData(newTilesData);

      // Créer la couche GeoJSON
      const tilesLayer = L.geoJSON(geojson, {
        style: baseStyle,
        onEachFeature: (feature: any, layer: any) => {
          const props = feature.properties;
          const coord: TileCoord = props.name || props.id;
          const isSelected = selectedTiles.includes(coord);

          (layer as any)._isSelected = isSelected;
          (layer as any)._coord = coord;
          layer.setStyle(isSelected ? selectedStyle : baseStyle);

          // Clic pour toggle la sélection par coordonnées
          layer.on("click", () => {
            setSelectedTiles((prev: TileCoord[]) => {
              if (prev.includes(coord)) {
                (layer as any)._isSelected = false;
                layer.setStyle(baseStyle);
                return prev.filter((c: TileCoord) => c !== coord);
              } else if (prev.length < maxSelectedTiles) {
                (layer as any)._isSelected = true;
                layer.setStyle(selectedStyle);
                return [...prev, coord];
              }
              return prev;
            });
          });

          // Survol pour highlight et tooltip
          layer.on("mouseover", (e: any) => {
            (layer as L.Path).setStyle({
              fillOpacity: 0.6,
              weight: 3,
            });

            const levels = props.levels || [];
            const precisionText = levels.length > 0
              ? `Niveaux: ${levels.join(", ")}`
              : "Aucun niveau disponible";

            const mousePos = map.mouseEventToContainerPoint(e.originalEvent);
            setTooltip({
              x: mousePos.x,
              y: mousePos.y,
              content: `Zone: ${coord}\n${precisionText}`,
            });
          });

          layer.on("mouseout", () => {
            const currentlySelected = (layer as any)._isSelected;
            (layer as L.Path).setStyle(
              currentlySelected ? selectedStyle : baseStyle
            );
            setTooltip({ x: 0, y: 0, content: "" });
          });
        },
      });

      tilesLayer.addTo(map);
      tilesLayerRef.current = tilesLayer;
    } catch (error) {
      console.error("Erreur chargement couche tuiles:", error);
    }
  };

  const handleLoadSelectedTiles = () => {
    if (selectedTiles.length === 0) return;
    // Les coordonnées sont déjà dans le Context, naviguer vers la page principale
    router.push("/");
  };

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen">
        <p className="p-4 bg-gray-100">Chargement de la carte...</p>
        <div className="flex-1 bg-gray-200 animate-pulse" />
      </div>
    );
  }

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
                if (tilesLayerRef.current) {
                  tilesLayerRef.current.eachLayer((layer: any) => {
                    if ((layer as any)._isSelected) {
                      (layer as any)._isSelected = false;
                      layer.setStyle(baseStyle);
                    }
                  });
                }
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
          {tileCount} zones disponibles
          {availableLevels.length > 0 && (
            <span> • Niveaux: {availableLevels.join(", ")}</span>
          )}
        </p>
      </div>

      <Tooltip x={tooltip.x} y={tooltip.y} content={tooltip.content} />
    </div>
  );
}
