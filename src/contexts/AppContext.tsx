"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface Model {
  name: string;
  url: string;
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
  fileSize?: number;
}

// Données de mesure
interface MeasurementPoint {
  position: { x: number; y: number; z: number };
  altitude: number; // altitude en mètres
}

interface SegmentData {
  distance: number; // en km
  slope: number; // en degrés
  elevationDiff: number; // en mètres
}

interface MeasurementData {
  points: MeasurementPoint[]; // Tous les points placés
  segments: SegmentData[]; // Données par segment
  startPoint: MeasurementPoint | null; // Premier point (compatibilité)
  endPoint: MeasurementPoint | null; // Dernier point (compatibilité)
  totalDistance: number | null; // Distance totale en km
  distance: number | null; // en km (dernier segment, compatibilité)
  slope: number | null; // en degrés (pente moyenne)
  elevationDiff: number | null; // en mètres (total)
  elevationProfile: { distance: number; altitude: number }[]; // profil altimétrique complet
}

interface AppContextType {
  // État des modèles pour Three.js
  selectedModels: string[];
  setSelectedModels: (models: string[] | ((prev: string[]) => string[])) => void;

  // État des tuiles sélectionnées dans la carte
  selectedTiles: string[];
  setSelectedTiles: (tiles: string[] | ((prev: string[]) => string[])) => void;

  // Liste complète des modèles disponibles
  availableModels: Model[];
  setAvailableModels: (models: Model[]) => void;

  // État de la rotation caméra pour la boussole
  cameraRotation: { x: number; y: number; z: number };
  setCameraRotation: (rotation: { x: number; y: number; z: number }) => void;

  // État de mesure
  measurementEnabled: boolean;
  setMeasurementEnabled: (enabled: boolean) => void;
  measurementData: MeasurementData;
  setMeasurementData: (data: MeasurementData | ((prev: MeasurementData) => MeasurementData)) => void;
  resetMeasurement: () => void;

  // Chargement de la scène 3D (progression)
  pendingLoads: number;
  loadingProgress: number; // 0 à 1
  incrementPendingLoads: () => void;
  decrementPendingLoads: () => void;
  resetLoadingProgress: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

const defaultMeasurementData: MeasurementData = {
  points: [],
  segments: [],
  startPoint: null,
  endPoint: null,
  totalDistance: null,
  distance: null,
  slope: null,
  elevationDiff: null,
  elevationProfile: [],
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // État initial de la rotation
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });

  // État de mesure
  const [measurementEnabled, setMeasurementEnabled] = useState(false);
  const [measurementData, setMeasurementData] = useState<MeasurementData>(defaultMeasurementData);

  const resetMeasurement = () => {
    setMeasurementData(defaultMeasurementData);
  };

  // Chargement scène 3D avec progression
  const [totalLoads, setTotalLoads] = useState(0);
  const [completedLoads, setCompletedLoads] = useState(0);
  const pendingLoads = totalLoads - completedLoads;
  const loadingProgress = totalLoads > 0 ? Math.min(1, completedLoads / totalLoads) : 0;
  const incrementPendingLoads = useCallback(() => setTotalLoads(n => n + 1), []);
  const decrementPendingLoads = useCallback(() => setCompletedLoads(n => n + 1), []);
  const resetLoadingProgress = useCallback(() => { setTotalLoads(0); setCompletedLoads(0); }, []);

  // Charger depuis localStorage au démarrage (côté client uniquement)
  useEffect(() => {
    try {
      const storedTiles = localStorage.getItem('selectedTiles');
      if (storedTiles) {
        const parsed = JSON.parse(storedTiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedTiles(parsed);
        }
      }
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
    }
    setIsHydrated(true);
  }, []);

  // Sauvegarder dans localStorage quand l'état change (après hydratation)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
    }
  }, [selectedModels, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('selectedTiles', JSON.stringify(selectedTiles));
    }
  }, [selectedTiles, isHydrated]);

  const value: AppContextType = {
    selectedModels,
    setSelectedModels,
    selectedTiles,
    setSelectedTiles,
    availableModels,
    setAvailableModels,
    cameraRotation,
    setCameraRotation,
    // Mesure
    measurementEnabled,
    setMeasurementEnabled,
    measurementData,
    setMeasurementData,
    resetMeasurement,
    // Chargement scène
    pendingLoads,
    loadingProgress,
    incrementPendingLoads,
    decrementPendingLoads,
    resetLoadingProgress,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
