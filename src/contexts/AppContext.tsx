"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { TileCoord } from '@/utils/fileUtils';
import type { TileData } from '@/types/models';

// ---------------------------------------------------------------------------
// Interfaces POI & mesure (portées depuis dev-romain)
// ---------------------------------------------------------------------------

export interface Poi {
  id: string;
  name: string;
  type: "sommet" | "col" | "refuge";
  position: { x: number; y: number; z: number };
  tileIds: string[];
  lx?: number; // Lambert 93 en km (x)
  ly?: number; // Lambert 93 en km (y)
}

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

  // --- POI (Lieux) ---
  poiEnabled: boolean;
  setPoiEnabled: (enabled: boolean) => void;
  poiPlacing: boolean;
  setPoiPlacing: (placing: boolean) => void;
  pois: Poi[];
  addPoi: (poi: Omit<Poi, "id">) => void;
  updatePoi: (id: string, updates: Partial<Omit<Poi, "id">>) => void;
  removePoi: (id: string) => void;

  // --- Chargement scène 3D ---
  pendingLoads: number;
  loadingProgress: number;
  incrementPendingLoads: () => void;
  decrementPendingLoads: () => void;
  resetLoadingProgress: () => void;
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

  // --- POI ---
  const [poiEnabled, setPoiEnabled] = useState(false);
  const [poiPlacing, setPoiPlacing] = useState(false);
  const [pois, setPois] = useState<Poi[]>([]);
  const poisLoadedRef = useRef(false);

  const addPoi = useCallback((poi: Omit<Poi, "id">) => {
    setPois(prev => [...prev, { ...poi, id: crypto.randomUUID() }]);
  }, []);

  const updatePoi = useCallback((id: string, updates: Partial<Omit<Poi, "id">>) => {
    setPois(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removePoi = useCallback((id: string) => {
    setPois(prev => prev.filter(p => p.id !== id));
  }, []);

  // --- Chargement scène ---
  const [totalLoads, setTotalLoads] = useState(0);
  const [completedLoads, setCompletedLoads] = useState(0);
  const pendingLoads = totalLoads - completedLoads;
  const loadingProgress = totalLoads > 0 ? Math.min(1, completedLoads / totalLoads) : 0;
  const incrementPendingLoads = useCallback(() => setTotalLoads(n => n + 1), []);
  const decrementPendingLoads = useCallback(() => setCompletedLoads(n => n + 1), []);
  const resetLoadingProgress = useCallback(() => { setTotalLoads(0); setCompletedLoads(0); }, []);

  // --- Hydratation localStorage ---
  useEffect(() => {
    try {
      const storedLevel = localStorage.getItem('selectedLevel');
      if (storedLevel) setSelectedLevel(storedLevel);
    } catch {}
    setIsHydrated(true);
  }, []);

  // Charger POIs : S3 prioritaire, fallback localStorage
  useEffect(() => {
    fetch('/api/pois')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPois(data);
          localStorage.setItem('pois', JSON.stringify(data));
        } else {
          try {
            const local = localStorage.getItem('pois');
            if (local) { const p = JSON.parse(local); if (Array.isArray(p)) setPois(p); }
          } catch {}
        }
        poisLoadedRef.current = true;
      })
      .catch(() => {
        try {
          const local = localStorage.getItem('pois');
          if (local) { const p = JSON.parse(local); if (Array.isArray(p)) setPois(p); }
        } catch {}
        poisLoadedRef.current = true;
      });
  }, []);

  // Persister dans localStorage
  useEffect(() => {
    if (isHydrated) localStorage.setItem('selectedTiles', JSON.stringify(selectedTiles));
  }, [selectedTiles, isHydrated]);

  useEffect(() => {
    if (isHydrated) localStorage.setItem('selectedLevel', selectedLevel);
  }, [selectedLevel, isHydrated]);

  // Persister POIs : localStorage + S3
  useEffect(() => {
    if (!poisLoadedRef.current) return;
    localStorage.setItem('pois', JSON.stringify(pois));
    fetch('/api/pois', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pois),
    }).catch(() => {});
  }, [pois]);

  const value: AppContextType = {
    selectedTiles, setSelectedTiles,
    selectedLevel, setSelectedLevel,
    tilesData, setTilesData,
    availableLevels,
    cameraRotation, setCameraRotation,
    measurementEnabled, setMeasurementEnabled,
    measurementData, setMeasurementData, resetMeasurement,
    poiEnabled, setPoiEnabled,
    poiPlacing, setPoiPlacing,
    pois, addPoi, updatePoi, removePoi,
    pendingLoads, loadingProgress,
    incrementPendingLoads, decrementPendingLoads, resetLoadingProgress,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
