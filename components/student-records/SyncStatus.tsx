import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppTheme } from "@/constants/colors";
import { syncNow, useSyncStatus } from "@/services/sync/runtime";

export function SyncStatus() {
  const status = useSyncStatus();
  const detail = status.message === "CLASS_CODE_INVALID" ? "Hindi pa nakarehistro ang class code. Ipaalam sa guro."
    : status.message === "AUTH_KEY_INVALID" ? "Hindi wasto ang susi ng koneksiyon sa server. Ipaalam sa guro. Ligtas sa device ang mga sagot."
    : status.message === "ANONYMOUS_SIGN_IN_DISABLED" ? "Kailangang paganahin ng admin ang student sign-in sa server. Ligtas sa device ang mga sagot."
    : status.message === "AUTH_REQUIRED" ? "Hindi makumpirma ang iyong koneksiyon sa guro. Naka-save pa rin sa device ang mga sagot."
    : status.message === "CLASS_CODE_REQUIRED" ? "Ilagay muna ang class code."
    : status.phase === "synced" ? `Huling naipadala: ${status.savedAt ? new Date(status.savedAt).toLocaleString() : "ngayon"}`
    : status.phase === "syncing" ? "Ipinapadala ang pinakabagong tala..."
    : status.phase === "disabled" ? "Naka-save sa device. Ihahanda pa ang koneksiyon sa guro."
    : status.phase === "conflict" ? "May naiibang tala sa server. Nananatiling ligtas sa device ang iyong sagot."
    : "Naka-save sa device. Awtomatikong ipapadala kapag may koneksiyon.";
  return <View style={styles.box}>
    <MaterialCommunityIcons name={status.phase === "synced" ? "cloud-check-outline" : "cloud-upload-outline"} size={21} color={AppTheme.primary} />
    <Text accessibilityLiveRegion="polite" style={styles.text}>{detail}</Text>
    {!["disabled", "syncing"].includes(status.phase) && <Pressable accessibilityRole="button" accessibilityLabel="I-sync ang mga tala" onPress={() => { void syncNow(); }} style={styles.button}><Text style={styles.label}>I-sync</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 15, backgroundColor: AppTheme.surfaceSoft, marginBottom: 20 },
  text: { flex: 1, fontSize: 11, lineHeight: 18, color: AppTheme.muted },
  button: { minHeight: 44, justifyContent: "center", paddingHorizontal: 10 },
  label: { fontSize: 12, fontWeight: "800", color: AppTheme.primary },
});
