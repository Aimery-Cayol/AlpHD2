import { memo } from "react";

/**
 * Composant représentant un plan d'eau
 * Affiché juste au niveau 0 avec un matériau métallique bleu
 */
export const Water = memo(() => {
  return (
    <mesh position={[0, 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="lightblue" roughness={0.6} metalness={0.8} />
    </mesh>
  );
});

Water.displayName = "Water";
