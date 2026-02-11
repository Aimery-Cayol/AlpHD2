import { Ground } from "./Ground";
import { Water } from "./Water";

interface EnvironmentSetupProps {
  showGrid: boolean;
  showWater: boolean;
}

/**
 * Composant de configuration de l'environnement 3D
 * Gère l'affichage du sol et de l'eau
 */
export function EnvironmentSetup({ showGrid, showWater }: EnvironmentSetupProps) {
  return (
    <>
      {showGrid && <Ground />}
      {showWater && <Water />}
    </>
  );
}
