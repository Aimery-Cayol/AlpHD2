'use client';

import CarteAlpes2D from "@/components/CarteAlpes2D";
import IGNMap from "@/components/IGNMap";
import 'leaflet/dist/leaflet.css'
import MapPage from "@/components/MapPage";
// import MapView from "@/components/MapView";

export default function Carte() {
  return (
    <div className="w-full h-screen">
      {/* <CarteAlpes2D /> */}
      {/* <IGNMap /> */}
      {/* <MapView /> */}
      <MapPage />
    </div>
  );
}
