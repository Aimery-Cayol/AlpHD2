"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { TileCoord } from '@/utils/fileUtils';
import type { TileData } from '@/types/models';

// ---------------------------------------------------------------------------
// Interface du contexte — PR1 : tuiles + LOD + caméra (rotation boussole)
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

  // --- Rotation caméra (utilisée par la boussole) ---
  cameraRotation: { x: number; y: number; z: number };
  setCameraRotation: (rotation: { x: number; y: number; z: number }) => void;
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

  // --- Caméra (boussole) ---
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });

  // --- Hydratation localStorage ---
  useEffect(() => {
    try {
      const storedLevel = localStorage.getItem('selectedLevel');
      if (storedLevel) setSelectedLevel(storedLevel);
    } catch {}
    setIsHydrated(true);
  }, []);

  // Persister dans localStorage
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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
