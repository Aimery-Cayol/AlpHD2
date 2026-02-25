"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { TileCoord } from '@/utils/fileUtils';
import type { TileData } from '@/types/models';

// ---------------------------------------------------------------------------
// Interfaces mesure — ajoutées dans feature/b-outil-mesure
// ---------------------------------------------------------------------------

interface MeasurementPoint {
  position: { x: number; y: number; z: number };
  altitude: number;
}

interface SegmentData {
  distance: number;
  slope: number;
  elevationDiff: number;
}

export interface MeasurementData {
  points: MeasurementPoint[];
  segments: SegmentData[];
  startPoint: MeasurementPoint | null;
  endPoint: MeasurementPoint | null;
  totalDistance: number | null;
  distance: number | null;
  slope: number | null;
  elevationDiff: number | null;
  elevationProfile: { distance: number; altitude: number }[];
}

// ---------------------------------------------------------------------------
// Interface du contexte
// ---------------------------------------------------------------------------

interface AppContextType {
  // --- Sélection de tuiles (système upstream) ---
  selectedTiles: TileCoord[];
  setSelectedTiles: (tiles: TileCoord[] | ((prev: TileCoord[]) => TileCoord[])) => void;

  // --- Niveau de détail LOD ---
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;

  // --- Catalogue des tuiles disponibles (depuis le GeoJSON) ---
  tilesData: Map<TileCoord, TileData>;
  setTilesData: (data: Map<TileCoord, TileData>) => void;

  // --- Niveaux disponibles (union de toutes les tuiles) ---
  availableLevels: string[];

  // --- Rotation caméra (boussole) ---
  cameraRotation: { x: number; y: number; z: number };
  setCameraRotation: (rotation: { x: number; y: number; z: number }) => void;

  // --- Outil de mesure ---
  measurementEnabled: boolean;
  setMeasurementEnabled: (enabled: boolean) => void;
  measurementData: MeasurementData;
  setMeasurementData: (data: MeasurementData | ((prev: MeasurementData) => MeasurementData)) => void;
  resetMeasurement: () => void;
}

// ---------------------------------------------------------------------------
// Contexte + hook
// ---------------------------------------------------------------------------

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

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

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // --- Sélection tuiles + LOD (upstream) ---
  const [selectedTiles, setSelectedTiles] = useState<TileCoord[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("09");
  const [tilesData, setTilesData] = useState<Map<TileCoord, TileData>>(new Map());
  const [isHydrated, setIsHydrated] = useState(false);

  const availableLevels = Array.from(
    new Set(Array.from(tilesData.values()).flatMap(t => t.levels))
  ).sort((a, b) => parseInt(a) - parseInt(b));

  // --- Caméra ---
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });

  // --- Mesure ---
  const [measurementEnabled, setMeasurementEnabled] = useState(false);
  const [measurementData, setMeasurementData] = useState<MeasurementData>(defaultMeasurementData);
  const resetMeasurement = () => setMeasurementData(defaultMeasurementData);

  // --- Hydratation localStorage ---
  useEffect(() => {
    try {
      const storedLevel = localStorage.getItem('selectedLevel');
      if (storedLevel) setSelectedLevel(storedLevel);
    } catch {}
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) localStorage.setItem('selectedTiles', JSON.stringify(selectedTiles));
  }, [selectedTiles, isHydrated]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem('selectedLevel', selectedLevel);
  }, [selectedLevel, isHydrated]);

  const value: AppContextType = {
    selectedTiles, setSelectedTiles,
    selectedLevel, setSelectedLevel,
    tilesData, setTilesData,
    availableLevels,
    cameraRotation, setCameraRotation,
    measurementEnabled, setMeasurementEnabled,
    measurementData, setMeasurementData, resetMeasurement,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
