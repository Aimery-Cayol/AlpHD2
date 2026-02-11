import { FaExpand, FaCompress } from "react-icons/fa";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

/**
 * Bouton pour basculer le mode plein écran
 * Affiche une icône différente selon l'état
 */
export function FullscreenButton({ isFullscreen, onToggle }: FullscreenButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="absolute top-4 right-4 z-50 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border flex items-center justify-center hover:bg-white/95 transition-all duration-200"
      title={isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"}
    >
      {isFullscreen ? (
        <FaCompress className="w-4 h-4 text-gray-600" />
      ) : (
        <FaExpand className="w-4 h-4 text-gray-600" />
      )}
    </button>
  );
}
