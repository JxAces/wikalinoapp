import { Asset } from "expo-asset";
import { useCallback, useEffect, useRef } from "react";

/** Catch the browser's playback promise, including an autoplay-policy rejection. */
export async function playUtosFeedbackAudio(audio: Pick<HTMLAudioElement, "currentTime" | "play">) {
  try {
    audio.currentTime = 0;
    await audio.play();
  } catch { /* The game's visible and announced feedback remains available. */ }
}

export function useUtosFeedbackSound() {
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => {
    audio.current?.pause();
    audio.current = null;
  }, []);
  return useCallback(() => {
    try {
      audio.current ??= new Audio(Asset.fromModule(require("../../assets/audio/utos-try-again.wav")).uri);
      void playUtosFeedbackAudio(audio.current);
    } catch { /* Audio is optional when a browser does not expose media playback. */ }
  }, []);
}
