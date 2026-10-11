import { type PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AppTheme } from "@/constants/colors";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { useUserStoreHydration } from "@/hooks/useUserStoreHydration";

// Browser storage can hydrate before React mounts. Keep the server and first
// browser render identical before showing saved profiles and canvas scenes.
export function AppHydration({ children }: PropsWithChildren) {
  const ready = useUserStoreHydration();
  if (ready) return children;
  return <LinearGradient colors={AppTheme.backgroundGradient} style={styles.screen}>
    <WikalinoBrand style={styles.brand} />
    <ActivityIndicator color={AppTheme.primary} />
  </LinearGradient>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppTheme.background, alignItems: "center", justifyContent: "center", gap: 20 },
  brand: { fontSize: 25, fontWeight: "900", color: AppTheme.primary, letterSpacing: 4 },
});
