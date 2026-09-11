import { useSyncExternalStore, type PropsWithChildren } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// Browser storage can hydrate before React mounts. Keep the server and first
// browser render identical before showing saved profiles and canvas scenes.
const subscribe = () => () => undefined;
const browserSnapshot = () => true;
const serverSnapshot = () => false;

export function AppHydration({ children }: PropsWithChildren) {
  const ready = useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
  if (ready) return children;
  return <View style={styles.screen}>
    <Text style={styles.brand}>WIKALINO</Text>
    <ActivityIndicator color="#203F36" />
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#A9D8C4", alignItems: "center", justifyContent: "center", gap: 20 },
  brand: { fontSize: 25, fontWeight: "900", color: "#203F36", letterSpacing: 4 },
});
