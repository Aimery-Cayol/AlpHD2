'use client'

import * as THREE from 'three'
import dynamic from 'next/dynamic';

const IGNAlpsViewer = dynamic(() => import('@/components/IGNAlpsViewer'), {
  ssr: false
});

export default function App() {
  const polyhedron = [
    new THREE.BoxGeometry(),
    new THREE.SphereGeometry(0.785398),
    new THREE.DodecahedronGeometry(0.785398),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section avec image d'arrière-plan */}
      <div className="relative h-48 sm:h-64 lg:h-80 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://raw.githubusercontent.com/Robou/LidarHD/main/images/FontSancte/332_3.jpg"
            alt="Montagne 3D reconstruite en haute définition"
            className="h-full w-full object-cover"
          />
          {/* Overlay avec gradient pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
        </div>

        {/* Titre de la section */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Modèles 3D
            </h1>
            <p className="text-sm sm:text-base text-white/90 mt-2">
              Exploration interactive des modèles de montagne
            </p>
          </div>
        </div>
      </div>

      {/* Zone du canvas Three.js */}
      <div className="container mx-auto px-6 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Visualiseur de modèles
            </h2>
            <p className="text-sm text-gray-600">
              Utilisez les contrôles tactiles ou la souris pour explorer les modèles 3D
            </p>
          </div>

          <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] bg-gray-50 rounded-lg overflow-hidden">
            <IGNAlpsViewer />
          </div>
        </div>
      </div>
    </div>
  )
}