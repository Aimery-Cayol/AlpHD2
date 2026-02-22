"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import DropZone from "@/components/three/DropZone";
import { createFileInfo, extractTileCoord } from "@/utils/fileUtils";
import { detectAndLogCapabilities } from "@/utils/deviceCapabilities";
import { useAppContext } from "@/contexts/AppContext";
import type { TileModel, TileData } from "@/types/models";
import type { TileCoord } from "@/utils/fileUtils";

// // Import dynamique du composant 3D pour éviter les problèmes SSR
const ThreeScene = dynamic(() => import("@/components/three/ThreeScene"));

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedTiles,
    setSelectedTiles,
    selectedLevel,
    setSelectedLevel,
    tilesData,
    setTilesData,
    availableLevels,
  } = useAppContext();

  const [localFiles, setLocalFiles] = useState<{ coord: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showDropZone, setShowDropZone] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  // Charger les données des tuiles depuis le GeoJSON
  const loadTilesData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tiles");
      if (!response.ok) throw new Error("Erreur lors du chargement des tuiles");

      const geojson = await response.json();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des modèles depuis l'API
  useEffect(() => {
    loadTilesData();
  }, []);

  // Détecter les capacités du client au chargement
  useEffect(() => {
    detectAndLogCapabilities();
  }, []);

  // Construire les modèles à afficher à partir des tuiles sélectionnées + niveau choisi
  const models: TileModel[] = useMemo(() => {
    return selectedTiles
      .map((coord) => {
        const tileData = tilesData.get(coord);
        if (!tileData) return null;

        // Trouver le fichier au niveau sélectionné, ou le plus proche
        let file = tileData.files.find((f) => f.level === selectedLevel);
        if (!file) {
          // Fallback : niveau le plus proche disponible
          const sortedFiles = [...tileData.files].sort(
            (a, b) =>
              Math.abs(parseInt(a.level) - parseInt(selectedLevel)) -
              Math.abs(parseInt(b.level) - parseInt(selectedLevel))
          );
          file = sortedFiles[0];
        }
        if (!file) return null;

        return {
          coord,
          level: file.level,
          coordinates: { x: tileData.x, y: tileData.y },
          availableLevels: tileData.levels,
        };
      })
      .filter(Boolean) as TileModel[];
  }, [selectedTiles, selectedLevel, tilesData]);

  // Upload de fichiers locaux
  const handleFileUpload = (file: File) => {
    try {
      const fileInfo = createFileInfo(file);
      const coord = extractTileCoord(file.name) || `local_${Date.now()}`;

      setLocalFiles((prev) => [...prev, { coord, url: fileInfo.url }]);
      setSelectedTiles((prev) => [...prev, coord]);
      console.log(`✅ Fichier uploadé: ${file.name}`);
    } catch (err) {
      console.error("Erreur lors de l'upload du fichier:", err);
      setError("Erreur lors du traitement du fichier");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur: {error}</p>
          <button onClick={loadTilesData} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div
        className={`grid gap-4 lg:gap-6 ${isPanelVisible ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1"}`}
      >
        {/* Panneau de contrôle */}
        <div
          className={`lg:col-span-1 order-2 lg:order-1 ${isPanelVisible ? "block" : "hidden lg:hidden"}`}
        >
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Zones sélectionnées
            </h2>

            {/* Sélecteur de niveau de détail */}
            {availableLevels.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de détail
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  {availableLevels.map((level) => (
                    <option key={level} value={level}>
                      Niveau {level}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-4">
              {selectedTiles.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <span className="text-sm font-medium">
                      {selectedTiles.length} zone
                      {selectedTiles.length > 1 ? "s" : ""} sélectionnée
                      {selectedTiles.length > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => setSelectedTiles([])}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors self-start sm:self-auto"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {selectedTiles.map((coord) => {
                  const tileData = tilesData.get(coord);
                  return (
                    <div
                      key={coord}
                      className="flex items-center justify-between p-2 rounded bg-gray-50"
                    >
                      <div className="font-mono text-sm">{coord}</div>
                      <div className="flex items-center space-x-2">
                        {tileData && (
                          <span className="text-xs text-gray-500">
                            {tileData.levels.join(", ")}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            setSelectedTiles((prev) =>
                              prev.filter((c) => c !== coord)
                            )
                          }
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Zone de visualisation 3D */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <div className="card h-100 sm:h-125 lg:h-175">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                Visualiseur 3D
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsPanelVisible(!isPanelVisible)}
                  className={`btn-secondary text-sm px-3 py-2 touch-manipulation ${
                    isPanelVisible ? "" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isPanelVisible ? "Masquer" : "Afficher"} Panneau
                </button>
                <button
                  onClick={() => setShowDropZone(!showDropZone)}
                  className={`btn-secondary text-sm px-3 py-2 touch-manipulation ${
                    showDropZone ? "bg-blue-100 text-blue-700" : ""
                  }`}
                >
                  {showDropZone ? "Masquer" : "Ajouter"} Fichier
                </button>
              </div>
            </div>

            <div
              id="threejs-container"
              className="w-full h-[40vh] sm:h-[50vh] lg:h-[70vh] min-h-87.5 bg-gray-50 rounded-lg overflow-hidden"
            >
              {showDropZone ? (
                <DropZone
                  onFileSelect={handleFileUpload}
                  acceptedFormats={["drc"]}
                />
              ) : models.length > 0 ? (
                <ThreeScene models={models} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-4">
                    <div className="animate-pulse text-gray-400 mb-4">
                      <svg
                        className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base text-gray-400">
                      Sélectionnez des zones dans l&apos;onglet &quot;Zones disponibles&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant principal avec Suspense
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
