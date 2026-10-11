import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import {
  BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { AppTheme, Colors } from "@/constants/colors";

import { CharacterLineup } from "../../components/character-select/CharacterLineup";
import { PANGKAT_OPTIONS, type PangkatOption } from "../../data/pangkat";
import { DEFAULT_PLAYER_CHARACTER, type PlayerCharacterId } from "../../data/player-characters";
import { useUserStore } from "../../store/useUserStore";
import { hubStartRoute } from "../../components/story-world/hub-navigation";

// Share the onboarding parchment palette with the rest of the app.
const OnboardingColors = {
  background: AppTheme.backgroundGradient,
  brown: AppTheme.primary,
  text: AppTheme.text,
  cream: AppTheme.surface,
  label: Colors.secondary,
  textMuted: AppTheme.muted,
  border: AppTheme.border,
  selected: AppTheme.selected,
  buttonText: AppTheme.buttonText,
};

export default function OnboardingScreen() {
  const setProfile = useUserStore(state => state.setProfile);
  const focused = useIsFocused();
  const [choosingCharacter, setChoosingCharacter] = useState(false);
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState<PangkatOption | null>(null);
  const [character, setCharacter] = useState<PlayerCharacterId>(DEFAULT_PLAYER_CHARACTER);
  const canContinue = fullName.trim().length >= 2 && grade !== null;

  useEffect(() => {
    if (!focused || !choosingCharacter) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setChoosingCharacter(false);
      return true;
    });
    return () => subscription.remove();
  }, [focused, choosingCharacter]);

  function chooseCharacter() {
    if (!canContinue) return;
    Keyboard.dismiss();
    setChoosingCharacter(true);
  }

  function startPlaying() {
    if (!canContinue || !grade) return;
    setProfile({
      fullName: fullName.trim(),
      // Keep the existing saved-profile field compatible with older players.
      pangkat: grade.replace("Pangkat", "Baitang"),
      avatar: "reader",
      character,
    });
    router.replace(hubStartRoute());
  }

  if (choosingCharacter) {
    return <CharacterLineup
      characterId={character}
      onCharacterChange={setCharacter}
      onBack={() => setChoosingCharacter(false)}
      onConfirm={startPlaying}
      active={focused}
    />;
  }

  return (
    <LinearGradient colors={OnboardingColors.background} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.brandRow}>
              <MaterialCommunityIcons name="book-open-page-variant" color={OnboardingColors.brown} size={36} />
              <WikalinoBrand style={styles.brand} />
            </View>
            <View style={styles.form}>
              <Text style={styles.label}>PANGALAN</Text>
              <TextInput
                accessibilityLabel="Pangalan ng manlalaro"
                value={fullName} onChangeText={setFullName}
                placeholder="Ilagay ang iyong pangalan"
                placeholderTextColor={OnboardingColors.textMuted}
                selectionColor={OnboardingColors.brown}
                autoCapitalize="words" autoCorrect={false} maxLength={60}
                returnKeyType="done" onSubmitEditing={chooseCharacter}
                style={styles.input}
              />
              <Text style={[styles.label, styles.gradeLabel]}>BAITANG</Text>
              <View style={styles.grades} accessibilityRole="radiogroup">
                {PANGKAT_OPTIONS.map(option => {
                  const selected = grade === option;
                  const number = option.replace("Pangkat ", "");
                  return <Pressable key={option} onPress={() => setGrade(option)}
                    accessibilityRole="radio" accessibilityState={{ checked: selected }}
                    aria-checked={selected}
                    accessibilityLabel={`Baitang ${number}`}
                    style={({ pressed }) => [styles.grade, selected && styles.gradeSelected, pressed && styles.pressed]}>
                    <Text style={[styles.gradeNumber, selected && styles.gradeNumberSelected]}>{number}</Text>
                    {selected && <MaterialCommunityIcons name="check-circle" size={15} color={OnboardingColors.text} />}
                  </Pressable>;
                })}
              </View>
              <Pressable onPress={chooseCharacter} disabled={!canContinue}
                accessibilityRole="button" accessibilityState={{ disabled: !canContinue }}
                style={({ pressed }) => [styles.continue, !canContinue && styles.disabled, pressed && styles.pressed]}>
                <Text style={styles.continueText}>Piliin ang iyong karakter</Text>
                <MaterialCommunityIcons name="arrow-right" size={22} color={OnboardingColors.buttonText} />
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 26, paddingBottom: 36, maxWidth: 540, width: "100%", alignSelf: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 36 },
  brand: { fontSize: 32, lineHeight: 40, fontWeight: "900", letterSpacing: 4, color: OnboardingColors.brown },
  form: { gap: 10 },
  label: { color: OnboardingColors.label, fontWeight: "900", letterSpacing: 1.8, fontSize: 12 },
  input: { borderWidth: 1.5, borderColor: OnboardingColors.border, backgroundColor: OnboardingColors.cream, borderRadius: 16, padding: 18, fontSize: 17, color: OnboardingColors.text, minHeight: 58 },
  gradeLabel: { marginTop: 14 },
  grades: { flexDirection: "row", gap: 10 },
  grade: { flex: 1, minHeight: 65, borderWidth: 1.5, borderColor: OnboardingColors.border, borderRadius: 16, backgroundColor: OnboardingColors.cream, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 },
  gradeSelected: { borderColor: OnboardingColors.brown, backgroundColor: OnboardingColors.selected },
  gradeNumber: { fontWeight: "900", fontSize: 23, color: OnboardingColors.brown },
  gradeNumberSelected: { color: OnboardingColors.text },
  continue: { minHeight: 60, borderRadius: 18, backgroundColor: OnboardingColors.brown, marginTop: 24, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, padding: 14 },
  continueText: { color: OnboardingColors.buttonText, fontWeight: "900", fontSize: 16 },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.75 },
});
