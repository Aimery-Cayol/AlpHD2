/**
 * Composant de fallback pour les appareils sans WebGL
 * Affiche un message explicatif lorsque WebGL n'est pas supporté
 */
export function WebGLFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          WebGL non supporté
        </h3>
        <p className="text-gray-600 mb-4">
          Votre navigateur ou appareil ne supporte pas WebGL, nécessaire pour
          afficher les visualisations 3D.
        </p>
        <div className="text-sm text-gray-500">
          <p>Essayez de :</p>
          <ul className="list-disc list-inside mt-2 text-left">
            <li>Mettre à jour votre navigateur</li>
            <li>Activer l'accélération matérielle dans les paramètres</li>
            <li>Utiliser un appareil plus récent</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
