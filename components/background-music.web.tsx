import { Asset } from "expo-asset";
import { useEffect } from "react";

const MUSIC = require("../assets/audio/wikalino-maikling-kwento-background.mp3");

export function BackgroundMusic() {
  useEffect(() => {
    const audio = new Audio(Asset.fromModule(MUSIC).uri);
    audio.loop = true;
    audio.volume = 0.22;
    let unlocked = false;
    const play = () => { void audio.play().catch(() => undefined); };
    // Mobile browsers require a user gesture before playing audio.
    const unlock = () => { unlocked = true; if (!document.hidden) play(); };
    const visibility = () => {
      if (document.hidden) audio.pause();
      else if (unlocked) play();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", visibility);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);
  return null;
}
