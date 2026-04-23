import { Asset } from "expo-asset";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function preloadAssets() {
      try {
        await Asset.loadAsync([
          require("../assets/images/pageBackground/HomePage.png"),
          require("../assets/images/pageBackground/LandingPage.png"),
          require("../assets/images/pageBackground/ThirdPage.png"),
        ]);
      } catch (e) {
        console.log("Preload error:", e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }

    preloadAssets();
  }, []);

  // Prevent app from rendering until images are ready
  if (!ready) return null;

  return (
    <Stack>
      <Stack.Screen name="landing" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
