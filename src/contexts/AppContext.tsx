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

  // 🎯 NOUVEAU : État de la rotation caméra pour la boussole
  cameraRotation: { x: number; y: number; z: number };
  setCameraRotation: (rotation: { x: number; y: number; z: number }) => void;
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
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  
  // 🎯 NOUVEAU : État initial de la rotation
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });

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
    // 🎯 AJOUT DANS LA VALEUR DU PROVIDER
    cameraRotation,
    setCameraRotation,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};