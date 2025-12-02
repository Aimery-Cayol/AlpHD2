"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DropZone from "@/components/three/DropZone";
import { createFileInfo, FileInfo, extractCoordinates } from "@/utils/fileUtils";
import { useAppContext } from "@/contexts/AppContext";

// // Import dynamique du composant 3D pour éviter les problèmes SSR
const ThreeScene = dynamic(() => import("@/components/three/ThreeScene"));

interface Model {
  name: string;
  url: string;
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
  fileSize?: number; // Taille du fichier en octets
}

// Fonction utilitaire pour encoder en base64 (compatible Node.js et navigateur)
const encodeBase64 = (str: string): string => {
  // Utilisation de Buffer.from pour la compatibilité Node.js
  return Buffer.from(str, 'utf8').toString('base64');
};

// Fonction utilitaire pour décoder en base64 (compatible Node.js et navigateur)
const decodeBase64 = (base64: string): string => {
  // Utilisation de Buffer.from pour la compatibilité Node.js
  return Buffer.from(base64, 'base64').toString('utf8');
};

// Composant interne qui utilise useSearchParams
function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { selectedModels, setSelectedModels, availableModels, setAvailableModels } = useAppContext();
  const [models, setModels] = useState<Model[]>([]);
  const [localFiles, setLocalFiles] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showDropZone, setShowDropZone] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Fonction pour récupérer la taille d'un fichier depuis S3
  const getFileSize = async (url: string): Promise<number> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return parseInt(response.headers.get("content-length") || "0");
    } catch {
      return 0;
    }
  };

  // Fonction pour recharger les modèles (utilisée par le bouton Réessayer)
  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/models");
      if (!response.ok)
        throw new Error("Erreur lors du chargement des modèles");

      const modelsData = await response.json();

      // Récupérer les tailles des fichiers en parallèle
      const modelPromises = modelsData.map(
        async (modelData: { url: string; format: string; key: string }) => {
          const fileSize = await getFileSize(modelData.url);
          const name = modelData.url.split("/").pop() || "Modèle";
          const nameWithoutExtension = name
            .replace(".final.ply", "")
            .replace(".drc", "");

          return {
            name: nameWithoutExtension,
            url: modelData.url,
            format: modelData.format as "ply" | "drc",
            coordinates: extractCoordinates(modelData.url),
            fileSize,
          };
        }
      );

      const modelList = await Promise.all(modelPromises);
      setModels(modelList);
      setAvailableModels(modelList); // Synchroniser avec le contexte global
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des modèles depuis l'API
  useEffect(() => {
    loadModels();
  }, []);

  // Fonction pour gérer l'upload de fichiers
  const handleFileUpload = (file: File) => {
    try {
      const fileInfo = createFileInfo(file);

      // Créer un nouveau modèle local
      const newModel: Model = {
        name: fileInfo.name.replace(/\.(final\.)?ply|\.(drc)/i, ""),
        url: fileInfo.url,
        format: fileInfo.format,
        fileSize: fileInfo.size,
      };

      // Ajouter le fichier local à la liste
      setLocalFiles((prev) => [...prev, newModel]);

      // Afficher un message de succès
      console.log(`✅ Fichier uploadé: ${newModel.name}`);

      // Sélectionner automatiquement le fichier uploadé
      setSelectedModels((prev) => [...prev, newModel.url]);
    } catch (err) {
      console.error("Erreur lors de l'upload du fichier:", err);
      setError("Erreur lors du traitement du fichier");
    }
  };

  // Combiner les modèles distants et locaux
  const allModels = [...models, ...localFiles];
// Fonction pour supprimer un fichier local
const removeLocalFile = (url: string) => {
  setLocalFiles((prev) => prev.filter((model) => model.url !== url));
  setSelectedModels((prev) =>
    prev.filter((selectedUrl) => selectedUrl !== url)
  );
};

// Fonction pour gérer le partage
const handleShareClick = () => {
  if (selectedModels.length === 0) {
    alert("Veuillez sélectionner au moins un modèle à partager");
    return;
  }

  // Générer l'URL de partage
  const shareUrl = new URL(window.location.href);
  const encoded = encodeBase64(JSON.stringify(selectedModels));
  shareUrl.searchParams.set("models", encoded);

  // Copier dans le presse-papiers
  navigator.clipboard.writeText(shareUrl.toString())
    .then(() => {
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
      alert("Lien de partage copié dans le presse-papiers !");
    })
    .catch(() => {
      alert("Impossible de copier dans le presse-papiers. Voici le lien :\n" + shareUrl.toString());
    });
};




  //routage avec encodage des modeles selectionnes dans l'url
  // État pour contrôler l'initialisation
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser depuis l'URL au chargement (pour compatibilité avec anciens liens)
  useEffect(() => {
    if (models.length > 0 && !isInitialized) {
      const encodedModels = searchParams.get("models");

      // Gérer les modèles existants depuis l'URL (pour compatibilité)
      if (encodedModels) {
        try {
          const decoded = JSON.parse(decodeBase64(decodeURIComponent(encodedModels)));
          const validUrls = decoded.filter((url: string) =>
            models.some((m) => m.url === url)
          );
          setSelectedModels(validUrls);
        } catch (e) {
          console.error("Erreur décodage:", e);
        }
      }

      setIsInitialized(true);
    }
  }, [searchParams, models.length, isInitialized, setSelectedModels, models]);

  // Supprimer l'URL de partage après le chargement initial
  useEffect(() => {
    if (isInitialized && models.length > 0) {
      // Vérifier si nous avons chargé des modèles depuis l'URL
      const currentUrl = new URL(window.location.href);
      const hasModelsParam = currentUrl.searchParams.has("models");

      if (hasModelsParam) {
        // Supprimer le paramètre models de l'URL après chargement
        currentUrl.searchParams.delete("models");
        window.history.replaceState({}, "", currentUrl.toString());
      }
    }
  }, [isInitialized, models.length]);

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
          <button onClick={loadModels} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className={`grid gap-4 lg:gap-6 ${isPanelVisible ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>
        {/* Panneau de contrôle */}
        <div className={`lg:col-span-1 order-2 lg:order-1 ${isPanelVisible ? 'block' : 'hidden lg:hidden'}`}>
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Modèles LiDAR
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner les modèles à afficher
                </label>
                <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                  {allModels.map((model) => (
                    <label
                      key={model.url}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model.url)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModels((prev) => [...prev, model.url]);
                          } else {
                            setSelectedModels((prev) =>
                              prev.filter((url) => url !== model.url)
                            );
                          }
                        }}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm truncate">
                            {model.name}
                            {localFiles.find((lf) => lf.url === model.url) && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                Local
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                model.format === "drc"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {model.format?.toUpperCase()}
                            </span>
                            {localFiles.find((lf) => lf.url === model.url) && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeLocalFile(model.url);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Supprimer le fichier local"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          {model.coordinates && (
                            <div className="text-xs text-gray-500 truncate">
                              ({model.coordinates.x}, {model.coordinates.y})
                            </div>
                          )}
                          {model.fileSize && (
                            <div className="text-xs text-gray-600 font-mono">
                              {model.fileSize > 1024 * 1024
                                ? `${Math.round(model.fileSize / (1024 * 1024))}MB`
                                : `${Math.round(model.fileSize / 1024)}KB`}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedModels.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <span className="text-sm font-medium">
                      {selectedModels.length} modèle
                      {selectedModels.length > 1 ? "s" : ""} sélectionné
                      {selectedModels.length > 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => setSelectedModels([])}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors self-start sm:self-auto"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Zone de visualisation 3D */}
        <div className="lg:col-span-4 order-1 lg:order-2">
          <div className="card h-[400px] sm:h-[500px] lg:h-[700px]">
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
                <button
                  onClick={handleShareClick}
                  className="btn-secondary text-sm px-3 py-2 touch-manipulation"
                >
                  Partager
                </button>
              </div>
            </div>

            <div
              id="threejs-container"
              className="w-full h-[40vh] sm:h-[50vh] lg:h-[70vh] min-h-[350px] bg-gray-50 rounded-lg overflow-hidden"
            >
              {showDropZone ? (
                <DropZone
                  onFileSelect={handleFileUpload}
                  acceptedFormats={["drc", "ply"]}
                />
              ) : selectedModels.length > 0 ? (
                <ThreeScene
                  models={allModels}
                  selectedModels={selectedModels}
                />
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
                      Sélectionnez des modèles ou ajoutez-en de nouveaux
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
