import {
  FaMountain,
  FaGithub,
  FaArrowRight,
  FaDatabase,
  FaCubes,
  FaEye,
  FaCompress,
} from "react-icons/fa6";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section Hero avec image d'arrière-plan */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://raw.githubusercontent.com/Robou/LidarHD/main/images/2025-11-21_19-03.jpg"
            alt="Montagne 3D reconstruite en haute définition"
            className="h-full w-full object-cover contrast-125 saturate-125"
          />
          {/* Overlay avec gradient pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
        </div>

        {/* Contenu de la section hero */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl text-shadow-lg/30 shadow-xl/30 backdrop-blur-sm p-5 rounded-[3vw]">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                À propos d'AlpHD
              </h1>
              <div className="backdrop-blur-sm">
                {/* <div className="backdrop-blur-sm bg-white/0 rounded-xl0 p-4 sm:p-6 max-w-2xl"> */}
                <p className="text-base sm:text-lg text-white leading-relaxed">
                  AlpHD est une plateforme de visualisation 3D dédiée aux
                  sommets alpins utilisant les données LiDAR haute définition de
                  l'IGN.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-8">
              AlpHD est une version alpha de projet pour une plateforme de
              visualisation 3D dédiée aux sommets alpins. J'utilise les{" "}
              <a
                href="https://geoservices.ign.fr/lidarhd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 hover:decoration-blue-800 transition-colors"
              >
                données LiDAR haute définition de l'IGN
              </a>{" "}
              pour créer des modèles 3D ultra-précis des montagnes françaises.
            </p>

            {/* Pipeline de traitement */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
                Le projet
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Étape 1 : Relevés LiDAR */}
                <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaDatabase className="text-blue-600 text-lg sm:text-xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      1. Relevés LiDAR HD de l'IGN
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Données haute définition collectées par LIDAR par
                      l'Institut national de l'information géographique et
                      forestière
                    </p>
                  </div>
                </div>

                {/* Étape 2 : Reconstruction 3D */}
                <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <FaCubes className="text-green-600 text-lg sm:text-xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      2. Reconstruction de mesh 3D*
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Algorithmes avancés de reconstruction de surfaces pour
                      créer des modèles 3D complets et précis, d'une précision
                      inédite, à partir des nuages de points.
                    </p>
                  </div>
                </div>

                {/* Étape 3 : Compression */}
                <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <FaCompress className="text-orange-600 text-lg sm:text-xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      3. Compression optimisée pour le web
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Réduction de la taille des fichiers tout en préservant la
                      qualité des détails.
                    </p>
                  </div>
                </div>

                {/* Étape 4 : Visualisation */}
                <div className="flex items-start space-x-3 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FaEye className="text-purple-600 text-lg sm:text-xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      4. Viewer web adapté
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Interface de visualisation optimisée pour l'exploration
                      interactive des modèles 3D, adaptée à la pratique des
                      sports de montagne
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lien GitHub */}
            <div className="pt-6 text-center sm:text-left">
              <a
                href="https://github.com/Robou/alphd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-gray-900 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-lg touch-manipulation"
              >
                <FaGithub
                  className="mr-2 sm:mr-3 text-lg sm:text-xl"
                  aria-hidden="true"
                />
                <span className="text-sm sm:text-base">
                  Voir le code source sur GitHub
                </span>
              </a>
            </div>
          </div>

          {/* Section Sources */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              * Sources pour la reconstruction de maillage
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FaGithub className="text-gray-600 mt-1 flex-shrink-0" />
                <div>
                  <a
                    href="https://github.com/mkazhdan/PoissonRecon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    PoissonRecon
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Reconstruction de surfaces à partir de nuages de points par Michael Kazhdan
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FaGithub className="text-gray-600 mt-1 flex-shrink-0" />
                <div>
                  <a
                    href="https://github.com/oscarpilote/LidarTerrainMesh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    LidarTerrainMesh
                  </a>
                  <p className="text-sm text-gray-600 mt-1">
                    Outil spécialisé pour la reconstruction de terrains à partir de données LiDAR, utilisant l'algorithme Poisson Recon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
