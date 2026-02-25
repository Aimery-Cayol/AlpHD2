// =============================================================================
// Exemples d'utilisation de l'architecture données temps réel — AlpHD
// =============================================================================
// Ce fichier est DOCUMENTATION uniquement — ne pas importer en production.
// =============================================================================

"use client";

import React from "react";
import { useWeatherData } from "@/hooks/useWeatherData";
import { useAlpinistsData } from "@/hooks/useAlpinistsData";
import { useGeologicalData } from "@/hooks/useGeologicalData";
import { useEnvironmentData } from "@/hooks/useEnvironmentData";
import { useMediaData } from "@/hooks/useMediaData";
import { useRealTimeLayers } from "@/hooks/useRealTimeLayers";
import { useDataStore } from "@/store/data-store";
import { getWSClient } from "@/lib/websocket-client";

// ---------------------------------------------------------------------------
// Exemple 1 : Météo d'une zone de dalles sélectionnées
// ---------------------------------------------------------------------------
export function WeatherPanel({ tileCoords }: { tileCoords: string[] }) {
  const { weather, stations, activeAlerts, isLoading, refresh } = useWeatherData({
    tileCoords,
    polling: true,
    pollingInterval: 5 * 60 * 1000, // 5 min
    realTime: true,                  // alertes instantanées via WS
  });

  if (isLoading) return <div>Chargement météo…</div>;

  return (
    <div>
      <h3>Météo ({stations.length} stations)</h3>
      {activeAlerts.map((a) => (
        <div key={a.id} style={{ color: a.level === "critical" ? "red" : "orange" }}>
          ⚠ {a.message}
        </div>
      ))}
      {stations[0] && (
        <p>
          {stations[0].name} : {stations[0].temperature}°C —{" "}
          Vent {stations[0].windSpeed} km/h
        </p>
      )}
      <button onClick={refresh}>Rafraîchir</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exemple 2 : Badge risque avalanche
// ---------------------------------------------------------------------------
export function AvalancheBadge({ tileCoords }: { tileCoords: string[] }) {
  const { maxRisk, riskColor, massifRisk } = useGeologicalData({
    tileCoords,
    polling: true,
    realTime: true,
  });

  if (!maxRisk) return null;

  const labels: Record<number, string> = {
    1: "Faible",
    2: "Limité",
    3: "Marqué",
    4: "Fort",
    5: "Très fort",
  };

  return (
    <div style={{ background: riskColor, color: "white", padding: "4px 10px", borderRadius: 99 }}>
      Risque {massifRisk} — {labels[massifRisk ?? 1]}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exemple 3 : Positions alpinistes en scène 3D
// ---------------------------------------------------------------------------
export function AlpinistOverlay({ tileCoords }: { tileCoords: string[] }) {
  const { alpinists, hasEmergency, emergencies } = useAlpinistsData({
    tileCoords,
    realTime: true,          // positions temps réel via WS
    polling: false,          // pas de polling HTTP pour les positions
  });

  return (
    <>
      {hasEmergency && (
        <div style={{ background: "red", color: "white" }}>
          🆘 {emergencies.length} urgence(s) en cours !
        </div>
      )}
      <p>{alpinists.length} alpiniste(s) visible(s)</p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exemple 4 : Enneigement résumé
// ---------------------------------------------------------------------------
export function SnowpackSummary({ tileCoords }: { tileCoords: string[] }) {
  const { snowLeader, maxSnowDepth, snowpack } = useEnvironmentData({
    tileCoords,
    polling: true,
    realTime: false,
  });

  return (
    <div>
      <p>Hauteur max : {maxSnowDepth} cm</p>
      {snowLeader && (
        <p>Neige fraîche : {snowLeader.newSnow24h} cm à {snowLeader.name}</p>
      )}
      <p>{snowpack.length} stations</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exemple 5 : Galerie photos de la zone
// ---------------------------------------------------------------------------
export function MediaGallery({ tileCoords }: { tileCoords: string[] }) {
  const { items, onlineWebcams } = useMediaData({
    tileCoords,
    types: ["photo", "webcam"],
    limit: 10,
    polling: true,
    realTime: true,
  });

  return (
    <div>
      <h3>Webcams en ligne : {onlineWebcams.length}</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map((item) => (
          <img
            key={item.id}
            src={item.thumbnailUrl ?? item.url}
            alt={item.title}
            style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exemple 6 : Façade multi-couches (panneau de données principal)
// ---------------------------------------------------------------------------
export function DataLayersPanel({ tileCoords }: { tileCoords: string[] }) {
  const { weather, geological, wsConnected, isLoading } = useRealTimeLayers({
    tileCoords,
    realTime: true,
    polling: true,
    layers: ["weather", "geological"], // activer seulement ce dont on a besoin
  });

  return (
    <div>
      <div style={{ fontSize: 10, color: wsConnected ? "green" : "gray" }}>
        {wsConnected ? "● Temps réel" : "○ Hors ligne"}
      </div>
      {isLoading && <p>Chargement…</p>}
      {weather.activeAlerts.map((a) => (
        <div key={a.id}>⚠ {a.message}</div>
      ))}
      {geological.maxRisk !== null && (
        <div>Risque avalanche : {geological.maxRisk}/5</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exemple 7 : Accès direct au store Zustand sans hook SWR
// (pour composants qui n'ont besoin que de lire, pas de déclencher des fetches)
// ---------------------------------------------------------------------------
export function QuickWeatherBadge() {
  // Sélecteur Zustand léger : re-render uniquement si la température change
  const temp = useDataStore(
    (s) => s.weather?.stations[0]?.temperature ?? null
  );

  if (temp === null) return null;
  return <span>{temp}°C</span>;
}

// ---------------------------------------------------------------------------
// Exemple 8 : Client WebSocket bas niveau (hors React)
// ---------------------------------------------------------------------------
function initWebSocket() {
  const client = getWSClient({
    url: "wss://ws.alphd.example.com/realtime",
    reconnectBaseMs: 1_000,
    reconnectMaxMs: 30_000,
    debug: true,
  });

  // Écoute tous les événements
  client.on("*", (payload, msg) => {
    console.log("WS event:", msg.event, payload);
  });

  // Écoute un événement précis
  const unsub = client.on("weather:alert", (alert) => {
    console.warn("Alerte météo !", alert);
  });

  // Callbacks de cycle de vie
  client.onConnect(() => console.log("WS connecté"));
  client.onDisconnect((code) => console.log("WS fermé, code:", code));
  client.onMaxAttempts(() => console.error("WS : abandon de la reconnexion"));

  client.connect();

  // Désabonnement sélectif
  // unsub();

  // Fermeture propre (ex: au unmount d'une page)
  // client.disconnect();

  return client;
}

export { initWebSocket };
