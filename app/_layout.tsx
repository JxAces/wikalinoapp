import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BackgroundMusic } from "../components/background-music";
import { PwaRegistration } from "../components/pwa-registration";
import { AppHydration } from "../components/app-hydration";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppHydration>
        <BackgroundMusic />
        <PwaRegistration />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>

        <StatusBar style="auto" />
      </AppHydration>
    </GestureHandlerRootView>
  );
}
