import { FullscreenButton } from "./FullscreenButton";
import { AvalancheButton } from "./AvalancheButton";

interface SceneOverlayProps {
  // Props pour le plein écran
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  
  // Props pour les pentes avalancheuses
  showAvalanchePentes: boolean;
  onToggleAvalanchePentes: () => void;
}

/**
 * Composant overlay global pour la scène 3D
 * Contient tous les boutons de contrôle et overlays de l'interface utilisateur
 */
export function SceneOverlay(props: SceneOverlayProps) {
  const {
    isFullscreen,
    onToggleFullscreen,
    showAvalanchePentes,
    onToggleAvalanchePentes,
  } = props;

  return (
    <>
      {/* Bouton plein écran dans le coin supérieur droit */}
      <FullscreenButton isFullscreen={isFullscreen} onToggle={onToggleFullscreen} />

      {/* Bouton pentes avalancheuses en bas à droite */}
      <AvalancheButton isActive={showAvalanchePentes} onToggle={onToggleAvalanchePentes} />

      {/* 
        Futurs overlays à ajouter ici:
        - Minimap
        - Légende des couleurs
        - Infos sur les modèles chargés
        - Contrôles de vitesse animation
        - etc.
      */}
    </>
  );
}
