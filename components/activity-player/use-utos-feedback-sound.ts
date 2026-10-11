import { useAudioPlayer } from "expo-audio";
import { useCallback } from "react";

export function useUtosFeedbackSound() {
  const player = useAudioPlayer(require("../../assets/audio/utos-try-again.wav"));
  return useCallback(() => {
    try { void player.seekTo(0).then(() => player.play()).catch(() => undefined); }
    catch { /* Visible feedback remains available when device audio is unavailable. */ }
  }, [player]);
}
