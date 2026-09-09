import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
} from "expo-audio";
import { useEffect } from "react";
import { AppState } from "react-native";

const BACKGROUND_MUSIC = require(
  "../assets/audio/wikalino-maikling-kwento-background.mp3",
);

const BACKGROUND_VOLUME = 0.22;

export function BackgroundMusic() {
  const player = useAudioPlayer(BACKGROUND_MUSIC, {
    keepAudioSessionActive: true,
  });

  useEffect(() => {
    let isMounted = true;

    /*
     * Expo Audio exposes loop and volume as mutable native player
     * properties. Assigning them is the library's supported API.
     */
    // eslint-disable-next-line react-hooks/immutability
    player.loop = true;
    player.volume = BACKGROUND_VOLUME;

    async function startMusic() {
      await setAudioModeAsync({
        allowsRecording: false,
        interruptionMode: "mixWithOthers",
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      if (isMounted && AppState.currentState === "active") {
        player.play();
      }
    }

    function handleAppStateChange(nextState: string) {
      if (nextState === "active") {
        void setIsAudioActiveAsync(true)
          .then(() => {
            if (isMounted) {
              player.play();
            }
          })
          .catch(() => undefined);

        return;
      }

      player.pause();
      void setIsAudioActiveAsync(false).catch(() => undefined);
    }

    void startMusic().catch(() => undefined);

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      isMounted = false;
      subscription.remove();
      player.pause();
    };
  }, [player]);

  return null;
}
