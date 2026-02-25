"use client";

// =============================================================================
// DataLayerErrorBoundary — isole les couches de données temps réel
// =============================================================================
// Si un composant 3D (WeatherOverlay, AlpinistMarkers, AvalancheZones) lève
// une exception, la scène principale reste fonctionnelle.
// =============================================================================

import React from "react";

interface State { hasError: boolean; message: string }

export class DataLayerErrorBoundary extends React.Component<
  React.PropsWithChildren<{ layer?: string }>,
  State
> {
  constructor(props: React.PropsWithChildren<{ layer?: string }>) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const layer = this.props.layer ?? "données";
    console.error(`[DataLayer:${layer}] Erreur capturée:`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return null; // silencieux — ne casse pas la scène 3D
    return this.props.children;
  }
}
