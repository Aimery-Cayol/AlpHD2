"use client";

import GeoportailHD from "@/components/GeoportailHD";
// import "leaflet/dist/leaflet.css";

export default function Carte() {
  return (
    <div className="w-full h-screen">
      <GeoportailHD />
    </div>
  );
}
