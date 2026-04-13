import { FullscreenButton } from "./FullscreenButton";

interface SceneOverlayProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function SceneOverlay({ isFullscreen, onToggleFullscreen }: SceneOverlayProps) {
  return (
    <FullscreenButton isFullscreen={isFullscreen} onToggle={onToggleFullscreen} />
  );
}
