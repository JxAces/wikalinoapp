import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from "react";
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";

import { AppTheme } from "@/constants/colors";
import { useUserStoreHydration } from "@/hooks/useUserStoreHydration";
import { useUserStore } from "@/store/useUserStore";
import { normalizeClassCode } from "@/utils/class-code";
import { ClassCodeField } from "./ClassCodeField";

const ClassCodeContext = createContext<(() => void) | null>(null);

export function useClassCodeDialog() {
  const open = useContext(ClassCodeContext);
  if (!open) throw new Error("Class code dialog requires ClassCodeProvider.");
  return open;
}

/** One shared prompt: existing players can add a code without onboarding again. */
export function ClassCodeProvider({ children }: PropsWithChildren) {
  const hydrated = useUserStoreHydration();
  const profile = useUserStore(state => state.profile);
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const close = () => setVisible(false);

  useEffect(() => {
    if (!hydrated) return;
    // Present after navigation commits so the native modal does not race the
    // intro transition. Cancel when leaving this route or replacing a profile.
    const timer = setTimeout(() => {
      if (!profile) {
        setVisible(false);
        return;
      }
      if (pathname === "/" || pathname === "/onboarding") return;
      if (!normalizeClassCode(profile.classCode)) setVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [hydrated, pathname, profile]);

  return <ClassCodeContext.Provider value={open}>
    {children}
    {visible && profile && <ClassCodeDialog initialCode={profile.classCode ?? ""} onClose={close} />}
  </ClassCodeContext.Provider>;
}

function ClassCodeDialog({ initialCode, onClose }: { initialCode: string; onClose: () => void }) {
  const saveClassCode = useUserStore(state => state.saveClassCode);
  const [code, setCode] = useState(initialCode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const valid = Boolean(normalizeClassCode(code));

  async function save() {
    if (!valid || pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await saveClassCode(code);
      Keyboard.dismiss();
      onClose();
    } catch {
      setError("Hindi na-save ang code sa device. Subukan muli.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {
    // A required class code must be saved before dismissing, including Back/Escape.
  }}>
    <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View accessibilityViewIsModal role="dialog" aria-modal={true} accessibilityLabel="Ang iyong klase" style={styles.dialog}>
          <View style={styles.icon}><MaterialCommunityIcons name="school-outline" size={30} color={AppTheme.primary} /></View>
          <Text accessibilityRole="header" style={styles.title}>Ang iyong klase</Text>
          <Text style={styles.description}>Ilagay ang class code upang magpatuloy. Mananatili ang iyong progreso at mga sagot.</Text>
          <ClassCodeField value={code} editable={!saving} onChangeText={value => { setCode(value); setError(""); }} onSubmitEditing={save} />
          {Boolean(error) && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <View style={styles.note}>
            <MaterialCommunityIcons name="cellphone-check" size={17} color={AppTheme.muted} />
            <Text style={styles.noteText}>Ise-save ang code sa device na ito.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || saving, busy: saving }} disabled={!valid || saving} onPress={save}
            style={({ pressed }) => [styles.save, (!valid || saving) && styles.disabled, pressed && styles.pressed]}>
            {saving ? <ActivityIndicator color={AppTheme.buttonText} /> : <MaterialCommunityIcons name="content-save-check-outline" size={20} color={AppTheme.buttonText} />}
            <Text style={styles.saveText}>{saving ? "Sine-save..." : "I-save ang code"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: AppTheme.overlay },
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 22, paddingVertical: 48 },
  dialog: { width: "100%", maxWidth: 440, borderRadius: 26, backgroundColor: AppTheme.surface, borderWidth: 1, borderColor: AppTheme.border, padding: 24, gap: 15 },
  icon: { width: 58, height: 58, borderRadius: 19, backgroundColor: AppTheme.selected, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, lineHeight: 33, fontWeight: "900", color: AppTheme.text },
  description: { color: AppTheme.muted, fontSize: 14, lineHeight: 22 },
  error: { color: AppTheme.error, fontSize: 13, lineHeight: 20 },
  note: { flexDirection: "row", alignItems: "center", gap: 7 },
  noteText: { flex: 1, color: AppTheme.muted, fontSize: 12, lineHeight: 19 },
  save: { backgroundColor: AppTheme.primary, minHeight: 52, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, padding: 13 },
  saveText: { color: AppTheme.buttonText, fontWeight: "800", fontSize: 15 },
  disabled: { opacity: .5 },
  pressed: { opacity: .75 },
});
