"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { TileCoord } from '@/utils/fileUtils';
import type { TileData } from '@/types/models';

interface AppContextType {
  // Zones sélectionnées (coordonnées XXXX_YYYY)
  selectedTiles: TileCoord[];
  setSelectedTiles: (tiles: TileCoord[] | ((prev: TileCoord[]) => TileCoord[])) => void;

  // Niveau de détail choisi par l'utilisateur
  selectedLevel: string;
  setSelectedLevel: (level: string) => void;

  // Métadonnées des zones disponibles (depuis le GeoJSON)
  tilesData: Map<TileCoord, TileData>;
  setTilesData: (data: Map<TileCoord, TileData>) => void;

  // Niveaux disponibles globalement (union de tous les niveaux)
  availableLevels: string[];
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

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedTiles, setSelectedTiles] = useState<TileCoord[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("09"); // Niveau par défaut
  const [tilesData, setTilesData] = useState<Map<TileCoord, TileData>>(new Map());

  // Calculer les niveaux disponibles globalement
  const availableLevels = Array.from(
    new Set(Array.from(tilesData.values()).flatMap(t => t.levels))
  ).sort((a, b) => parseInt(a) - parseInt(b));

  // Sauvegarder dans localStorage
  useEffect(() => {
    localStorage.setItem('selectedTiles', JSON.stringify(selectedTiles));
  }, [selectedTiles]);

  useEffect(() => {
    localStorage.setItem('selectedLevel', selectedLevel);
  }, [selectedLevel]);

  const value: AppContextType = {
    selectedTiles,
    setSelectedTiles,
    selectedLevel,
    setSelectedLevel,
    tilesData,
    setTilesData,
    availableLevels,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
