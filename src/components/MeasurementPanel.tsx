"use client";

import React, { useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Ruler, TrendingUp, Mountain, X, RotateCcw } from "lucide-react";

// Composant simple pour le graphique du profil altimétrique
function ElevationProfileChart({
  profile
}: {
  profile: { distance: number; altitude: number }[]
}) {
  const chartData = useMemo(() => {
    if (profile.length < 2) return null;

    const altitudes = profile.map(p => p.altitude);
    const minAlt = Math.min(...altitudes);
    const maxAlt = Math.max(...altitudes);
    const altRange = maxAlt - minAlt || 1;

    const maxDist = profile[profile.length - 1].distance;

    // Générer les points SVG
    const points = profile.map((p, i) => {
      const x = (p.distance / maxDist) * 100;
      const y = 100 - ((p.altitude - minAlt) / altRange) * 80 - 10; // 10% marge haut/bas
      return `${x},${y}`;
    }).join(' ');

    // Générer le path pour le remplissage
    const areaPath = `M 0,100 L 0,${100 - ((profile[0].altitude - minAlt) / altRange) * 80 - 10} ` +
      profile.map((p, i) => {
        const x = (p.distance / maxDist) * 100;
        const y = 100 - ((p.altitude - minAlt) / altRange) * 80 - 10;
        return `L ${x},${y}`;
      }).join(' ') + ' L 100,100 Z';

    return {
      points,
      areaPath,
      minAlt: Math.round(minAlt),
      maxAlt: Math.round(maxAlt),
      maxDist: Math.round(maxDist)
    };
  }, [profile]);

  if (!chartData) {
    return (
      <div className="h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
        En attente des données...
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Labels Y-axis */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-[9px] text-slate-400 py-1">
        <span>{chartData.maxAlt}m</span>
        <span>{chartData.minAlt}m</span>
      </div>

      {/* Chart */}
      <div className="ml-12 h-24 bg-gradient-to-b from-blue-50 to-slate-50 rounded-lg overflow-hidden border border-slate-200">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Grille horizontale */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#e2e8f0" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e2e8f0" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e2e8f0" strokeWidth="0.5" />

          {/* Zone de remplissage */}
          <path
            d={chartData.areaPath}
            fill="url(#elevationGradient)"
            opacity="0.6"
          />

          {/* Ligne du profil */}
          <polyline
            points={chartData.points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="elevationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Labels X-axis */}
      <div className="ml-12 flex justify-between text-[9px] text-slate-400 mt-1">
        <span>0m</span>
        <span>{chartData.maxDist}m</span>
      </div>
    </div>
  );
}

export default function MeasurementPanel() {
  const {
    measurementEnabled,
    setMeasurementEnabled,
    measurementData,
    resetMeasurement
  } = useAppContext();

  if (!measurementEnabled) return null;

  const { distance, slope, elevationDiff, startPoint, endPoint, elevationProfile } = measurementData;
  const hasMeasurement = distance !== null && startPoint && endPoint;

  // Format distance
  const formatDistance = (d: number | null) => {
    if (d === null) return "—";
    return d >= 1 ? `${d.toFixed(2)} km` : `${(d * 1000).toFixed(0)} m`;
  };

  // Format altitude
  const formatAltitude = (a: number | null) => {
    if (a === null) return "—";
    return `${Math.round(a)} m`;
  };

  return (
    <div className="absolute top-6 left-6 z-50 w-80">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Ruler className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Mesure</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetMeasurement}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Recommencer la mesure"
            >
              <RotateCcw className="h-3.5 w-3.5 text-white" />
            </button>
            <button
              onClick={() => setMeasurementEnabled(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Instructions */}
          {!hasMeasurement && (
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                <Ruler className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {!startPoint
                  ? "Cliquez sur le terrain pour placer le premier point"
                  : "Cliquez pour placer le second point"
                }
              </p>
              {startPoint && (
                <p className="text-xs text-slate-400 mt-2">
                  Point de départ : {formatAltitude(startPoint.altitude)} d'altitude
                </p>
              )}
            </div>
          )}

          {/* Résultats */}
          {hasMeasurement && (
            <>
              {/* Stats principales */}
              <div className="grid grid-cols-2 gap-3">
                {/* Distance */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Ruler className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Distance</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{formatDistance(distance)}</p>
                </div>

                {/* Pente */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Pente</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">
                    {slope !== null ? `${slope.toFixed(1)}°` : "—"}
                  </p>
                </div>
              </div>

              {/* Dénivelé */}
              <div className="bg-gradient-to-r from-green-50 to-orange-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                  <Mountain className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Dénivelé</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase">Départ</p>
                    <p className="text-sm font-bold text-green-600">{formatAltitude(startPoint?.altitude ?? null)}</p>
                  </div>
                  <div className="flex-1 px-3">
                    <div className="h-0.5 bg-slate-200 relative">
                      <div
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-bold ${
                          elevationDiff !== null && elevationDiff > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {elevationDiff !== null
                          ? `${elevationDiff > 0 ? '+' : ''}${Math.round(elevationDiff)}m`
                          : '—'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase">Arrivée</p>
                    <p className="text-sm font-bold text-orange-600">{formatAltitude(endPoint?.altitude ?? null)}</p>
                  </div>
                </div>
              </div>

              {/* Profil altimétrique */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Profil altimétrique</span>
                </div>
                <ElevationProfileChart profile={elevationProfile} />
              </div>

              {/* Bouton nouvelle mesure */}
              <button
                onClick={resetMeasurement}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Nouvelle mesure
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
