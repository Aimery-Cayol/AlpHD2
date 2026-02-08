"use client";

import React, { useMemo, useState } from "react";
import { Vector3, Box3 } from "three";
import { useControls } from "leva";
import { FaChevronDown, FaChevronUp, FaInfo, FaDatabase } from "react-icons/fa";
import { geometryCache } from "./GeometryCache";

interface Model {
  name: string;
  url?: string; // Pour les meshes sans LoD
  urlHigh?: string; // Pour les meshes avec LoD (niveau 11)
  urlLow?: string; // Pour les meshes avec LoD (niveau 09)
  urlUltraLow?: string; // Pour les meshes avec LoD (niveau 01)
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
  fileSize?: number;
  lodEnabled?: boolean; // Flag pour activer le LoD
}

interface SceneUIProps {
  models: Model[];
  selectedModels: string[];
}

function MyComponent() {
  const { myValue } = useControls({ myValue: 10 });
  return myValue;
}

function AnotherComponent() {
  const { anotherValue } = useControls({ anotherValue: "alive!!" });

  return <div>Hey, I'm {anotherValue}</div>;
}

function UnmountedComponent() {
  const { barValue } = useControls({ barValue: false });

  return barValue ? <div>Hello!</div> : null;
}

export default function SceneUI({ models, selectedModels }: SceneUIProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Statistiques du cache mises à jour en temps réel
  const cacheStats = useMemo(() => {
    return geometryCache.getStats();
  }, [models, selectedModels]); // Se met à jour quand les modèles changent

  const sceneInfo = useMemo(() => {
    if (selectedModels.length === 0) {
      return {
        modelCount: 0,
        boundingBox: null,
        totalArea: 0,
      };
    }

    const boundingBox = calculateBoundingBox(models, selectedModels);

    if (!boundingBox) {
      return {
        modelCount: selectedModels.length,
        boundingBox: null,
        totalArea: 0,
      };
    }

    const size = new Vector3();
    boundingBox.getSize(size);

    const center = new Vector3();
    boundingBox.getCenter(center);

    return {
      modelCount: selectedModels.length,
      boundingBox: {
        width: Math.round(size.x * 100) / 100,
        height: Math.round(size.y * 100) / 100,
        depth: Math.round(size.z * 100) / 100,
        center: {
          x: Math.round(center.x * 100) / 100,
          y: Math.round(center.y * 100) / 100,
          z: Math.round(center.z * 100) / 100,
        },
      },
      totalArea: Math.round(size.x * size.z * 100) / 100,
    };
  }, [models, selectedModels]);

  return (
    <div className="absolute top-4 left-4 z-10">
      {/* Bouton de toggle dans le coin supérieur gauche */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute -top-2 -left-2 w-8 h-4 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border flex items-center justify-center hover:bg-white/95 transition-all duration-200 z-20"
        title={
          isVisible ? "Masquer les informations" : "Afficher les informations"
        }
      >
        {isVisible ? (
          <FaChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <FaChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Contenu de l'overlay - visible seulement si isVisible est true */}
      {isVisible && (
        <div className="space-y-2 absolute top-4">
          {/* Informations principales - plus compact */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border min-w-[240px]">
            <h3 className="text-xs font-semibold text-gray-800 mb-2 flex items-center">
              <FaInfo className="w-3 h-3 mr-1" />
              Informations scène
            </h3>

            <div className="space-y-2">
              {/* Compteur de modèles */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Modèles:</span>
                <span className="text-sm font-bold text-blue-600">
                  {sceneInfo.modelCount}
                </span>
              </div>

              {/* Bounding Box Info - plus compact */}
              {sceneInfo.boundingBox && (
                <>
                  <div className="border-t pt-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Dimensions:
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="text-center p-1 bg-gray-50 rounded text-xs">
                        <div className="text-gray-500">L</div>
                        <div className="font-mono text-xs font-medium">
                          {sceneInfo.boundingBox.width}
                        </div>
                      </div>
                      <div className="text-center p-1 bg-gray-50 rounded text-xs">
                        <div className="text-gray-500">H</div>
                        <div className="font-mono text-xs font-medium">
                          {sceneInfo.boundingBox.height}
                        </div>
                      </div>
                      <div className="text-center p-1 bg-gray-50 rounded text-xs">
                        <div className="text-gray-500">P</div>
                        <div className="font-mono text-xs font-medium">
                          {sceneInfo.boundingBox.depth}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <div className="text-xs text-gray-500 mb-1">Centre:</div>
                    <div className="font-mono text-xs bg-gray-50 p-2 rounded">
                      {sceneInfo.boundingBox.center.x},{" "}
                      {sceneInfo.boundingBox.center.y},{" "}
                      {sceneInfo.boundingBox.center.z}
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Surface:</span>
                      <span className="font-mono text-xs font-medium">
                        {sceneInfo.totalArea} u²
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panneau de contrôles rapide - plus compact */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">
              Actions
            </h4>
            <div className="space-y-1">
              <button className="w-full text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors">
                Centrer
              </button>
              <button className="w-full text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded transition-colors">
                Vue dessus
              </button>
            </div>
          </div>

          {/* Statistiques du cache - nouveau panneau */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
            <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
              <FaDatabase className="w-3 h-3 mr-1" />
              Cache géométrie
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Modèles:</span>
                <span className="text-xs font-medium">
                  {cacheStats.totalEntries}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Taille:</span>
                <span className="text-xs font-medium">
                  {cacheStats.totalSize > 1024 * 1024
                    ? `${Math.round(cacheStats.totalSize / (1024 * 1024))}MB`
                    : `${Math.round(cacheStats.totalSize / 1024)}KB`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Taux de succès:</span>
                <span
                  className={`text-xs font-medium ${cacheStats.hitRate > 0.5 ? "text-green-600" : "text-orange-600"}`}
                >
                  {Math.round(cacheStats.hitRate * 100)}%
                </span>
              </div>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => geometryCache.clear()}
                  className="flex-1 text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                  title="Vider le cache"
                >
                  Vider cache
                </button>
                <button
                  onClick={() => geometryCache.debugCache()}
                  className="flex-1 text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                  title="Déboguer le cache (console)"
                >
                  Debug
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour obtenir l'URL principale d'un modèle
const getModelUrl = (model: Model): string => {
  return model.url || model.urlHigh || model.name;
};

// Fonction pour calculer la bounding box de tous les modèles sélectionnés
function calculateBoundingBox(
  models: Model[],
  selectedModels: string[],
): Box3 | null {
  if (selectedModels.length === 0) return null;

  const box = new Box3();
  let hasValidModel = false;

  models.forEach((model) => {
    const modelUrl = getModelUrl(model);
    if (selectedModels.includes(modelUrl) && model.coordinates) {
      // Chaque modèle fait 1 unité de côté
      const modelSize = 1;
      const halfSize = modelSize / 2;

      // Créer une bounding box pour ce modèle
      const modelBox = new Box3(
        new Vector3(
          model.coordinates.x * 1 - halfSize,
          -halfSize,
          model.coordinates.y * 1 - halfSize,
        ),
        new Vector3(
          model.coordinates.x * 1 + halfSize,
          halfSize,
          model.coordinates.y * 1 + halfSize,
        ),
      );

      box.union(modelBox);
      hasValidModel = true;
    }
  });

  return hasValidModel ? box : null;
}
