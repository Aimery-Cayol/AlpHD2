/**
 * Indicateur de chargement affiché pendant la détection WebGL
 */
export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Vérification WebGL...</p>
      </div>
    </div>
  );
}
