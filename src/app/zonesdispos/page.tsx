"use client";

import "leaflet/dist/leaflet.css";
import ZonesDispos from "@/components/ZonesDispos";

export default function Carte() {
  return (
    <div className="w-full h-screen">
      <ZonesDispos />
    </div>
  );
}
