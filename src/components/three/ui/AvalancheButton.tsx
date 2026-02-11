import { TbMountain } from "react-icons/tb";

interface AvalancheButtonProps {
  isActive: boolean;
  onToggle: () => void;
}

/**
 * Bouton pour afficher/masquer les pentes avalancheuses
 * Change de couleur selon l'état actif/inactif
 */
export function AvalancheButton({ isActive, onToggle }: AvalancheButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`absolute bottom-4 right-4 z-50 w-10 h-10 backdrop-blur-sm rounded-full shadow-lg border flex items-center justify-center transition-all duration-200 ${
        isActive
          ? "bg-orange-500/90 hover:bg-orange-500/95 border-orange-600"
          : "bg-white/90 hover:bg-white/95 border-gray-300"
      }`}
      title={
        isActive
          ? "Masquer les pentes avalancheuses"
          : "Afficher les pentes avalancheuses"
      }
    >
      <TbMountain
        className={`w-6 h-6 ${
          isActive ? "text-white" : "text-gray-600"
        }`}
      />
    </button>
  );
}
