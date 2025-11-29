"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Model {
  name: string;
  url: string;
  format?: "ply" | "drc";
  coordinates?: { x: number; y: number };
  fileSize?: number;
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
  // État des modèles sélectionnés pour Three.js
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // État des tuiles sélectionnées dans la carte
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);

  // Liste complète des modèles disponibles
  const [availableModels, setAvailableModels] = useState<Model[]>([]);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    const savedSelectedModels = localStorage.getItem('selectedModels');
    const savedSelectedTiles = localStorage.getItem('selectedTiles');

    if (savedSelectedModels) {
      try {
        const models = JSON.parse(savedSelectedModels);
        setSelectedModels(models);
      } catch (e) {
        console.error('Erreur chargement selectedModels:', e);
      }
    }

    if (savedSelectedTiles) {
      try {
        const tiles = JSON.parse(savedSelectedTiles);
        setSelectedTiles(tiles);
      } catch (e) {
        console.error('Erreur chargement selectedTiles:', e);
      }
    }
  }, []);

  // Sauvegarder dans localStorage quand l'état change
  useEffect(() => {
    localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
  }, [selectedModels]);

  useEffect(() => {
    localStorage.setItem('selectedTiles', JSON.stringify(selectedTiles));
  }, [selectedTiles]);

  const value: AppContextType = {
    selectedModels,
    setSelectedModels,
    selectedTiles,
    setSelectedTiles,
    availableModels,
    setAvailableModels,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};