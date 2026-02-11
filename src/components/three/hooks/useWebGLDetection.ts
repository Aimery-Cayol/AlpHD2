import { useState, useEffect } from "react";

/**
 * Hook pour détecter le support WebGL du navigateur
 * @returns {boolean | null} true si WebGL est supporté, false sinon, null pendant la détection
 */
export function useWebGLDetection(): boolean | null {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const detectWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl");
        setWebglSupported(!!gl);
      } catch (error) {
        console.warn("Erreur lors de la détection WebGL:", error);
        setWebglSupported(false);
      }
    };

    detectWebGL();
  }, []);

  return webglSupported;
}
