export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-600 mb-8">Page non trouvée</p>
      <a href="/" className="text-blue-600 hover:text-blue-800 underline">
        Retour à l'accueil
      </a>
    </div>
  );
}