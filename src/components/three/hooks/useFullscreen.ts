import { useState, useEffect, useCallback, RefObject } from "react";

/**
 * Hook pour gérer le mode plein écran sur un élément HTML
 * @param containerRef - Référence vers l'élément à mettre en plein écran
 * @returns {Object} Objet contenant l'état plein écran et la fonction de toggle
 */
export function useFullscreen(containerRef: RefObject<HTMLDivElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fonction pour basculer en plein écran
  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        // Entrer en plein écran sur le conteneur
        containerRef.current.requestFullscreen().catch((err) => {
          console.error("Erreur lors du passage en plein écran:", err);
        });
      } else {
        // Quitter le plein écran
        document.exitFullscreen();
      }
    }
  }, [containerRef]);

  // Écouteur d'événement pour détecter les changements de mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return { isFullscreen, toggleFullscreen };
}
