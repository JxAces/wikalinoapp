import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BackgroundMusic } from "../components/background-music";
import { PwaRegistration } from "../components/pwa-registration";
import { AppHydration } from "../components/app-hydration";
import { AppTheme } from "../constants/colors";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: AppTheme.background }}>
      <AppHydration>
        <BackgroundMusic />
        <PwaRegistration />

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: AppTheme.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>

        <StatusBar style="auto" />
      </AppHydration>
    </GestureHandlerRootView>
  );
}
