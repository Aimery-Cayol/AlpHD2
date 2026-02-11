import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface PostProcessingSetupProps {
  enabled: boolean;
  enableVignette: boolean;
  enableBrightnessContrast: boolean;
  enableToneMapping: boolean;
  enableBloom: boolean;
  bloomThreshold: number;
  bloomLuminanceSmoothing: number;
  bloomIntensity: number;
}

/**
 * Composant de configuration des effets de post-processing
 * Gère les effets visuels comme le bloom, la vignette, etc.
 */
export function PostProcessingSetup(props: PostProcessingSetupProps) {
  const {
    enabled,
    enableVignette,
    enableBrightnessContrast,
    enableToneMapping,
    enableBloom,
    bloomThreshold,
    bloomLuminanceSmoothing,
    bloomIntensity,
  } = props;

  return (
    <EffectComposer enabled={enabled} enableNormalPass={true}>
      <>
        {enableVignette && (
          <Vignette
            offset={0.3}
            darkness={0.4}
            eskil={false}
            blendFunction={BlendFunction.NORMAL}
          />
        )}

        {enableBrightnessContrast && (
          <BrightnessContrast brightness={0.1} contrast={0.1} />
        )}

        {enableToneMapping && (
          <ToneMapping
            blendFunction={BlendFunction.NORMAL}
            adaptive
            resolution={256}
            middleGrey={0.9}
            maxLuminance={16.0}
            averageLuminance={1.0}
            adaptationRate={1.0}
          />
        )}

        {enableBloom && (
          <Bloom
            luminanceThreshold={bloomThreshold}
            luminanceSmoothing={bloomLuminanceSmoothing}
            intensity={bloomIntensity}
          />
        )}
      </>
    </EffectComposer>
  );
}
