import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useIsFocused } from "expo-router";
import { useEffect, useState } from "react";
import {
  BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CharacterLineup } from "../../components/character-select/CharacterLineup";
import { Colors } from "../../constants/colors";
import { PANGKAT_OPTIONS, type PangkatOption } from "../../data/pangkat";
import { DEFAULT_PLAYER_CHARACTER, type PlayerCharacterId } from "../../data/player-characters";
import { useUserStore } from "../../store/useUserStore";
import { hubStartRoute } from "../../components/story-world/hub-navigation";

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
    <LinearGradient colors={["#A9D8C4", "#DDEBD2", "#EAF4EC"]} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.brandRow}>
              <MaterialCommunityIcons name="book-open-page-variant" color={Colors.secondary} size={23} />
              <Text style={styles.brand}>WIKALINO</Text>
            </View>
            <View style={styles.hero}>
              <View style={styles.emblem}>
                <MaterialCommunityIcons name="compass-outline" size={52} color={Colors.accent} />
              </View>
              <Text style={styles.eyebrow}>BAGONG PAGLALAKBAY</Text>
              <Text style={styles.title}>Ano ang pangalan{`\n`}ng ating bida?</Text>
              <Text style={styles.subtitle}>Ihanda ang iyong pangalan at piliin ang baitang.</Text>
            </View>
            <View style={styles.form}>
              <Text style={styles.label}>PANGALAN</Text>
              <TextInput
                accessibilityLabel="Pangalan ng manlalaro"
                value={fullName} onChangeText={setFullName}
                placeholder="Ilagay ang iyong pangalan"
                placeholderTextColor={Colors.textMuted}
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
                    {selected && <MaterialCommunityIcons name="check-circle" size={15} color={Colors.accent} />}
                  </Pressable>;
                })}
              </View>
              <Pressable onPress={chooseCharacter} disabled={!canContinue}
                accessibilityRole="button" accessibilityState={{ disabled: !canContinue }}
                style={({ pressed }) => [styles.continue, !canContinue && styles.disabled, pressed && styles.pressed]}>
                <Text style={styles.continueText}>Piliin ang iyong tauhan</Text>
                <MaterialCommunityIcons name="arrow-right" size={22} color={Colors.accentSoft} />
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
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 30 },
  brand: { fontSize: 16, fontWeight: "900", letterSpacing: 5, color: Colors.secondary },
  hero: { alignItems: "center", marginBottom: 28 },
  emblem: { backgroundColor: Colors.secondary, padding: 18, borderRadius: 30, marginBottom: 24, borderWidth: 2, borderColor: "#93B693" },
  eyebrow: { color: Colors.secondary, fontSize: 11, letterSpacing: 2, fontWeight: "900", marginBottom: 12 },
  title: { fontSize: 32, lineHeight: 39, fontWeight: "900", textAlign: "center", color: Colors.primaryDark },
  subtitle: { marginTop: 12, color: Colors.secondary, textAlign: "center", fontSize: 14, lineHeight: 21 },
  form: { gap: 10 },
  label: { color: Colors.primary, fontWeight: "900", letterSpacing: 1.8, fontSize: 12 },
  input: { borderWidth: 1.5, borderColor: "#9BBBA7", backgroundColor: Colors.surface, borderRadius: 16, padding: 18, fontSize: 17, color: Colors.text, minHeight: 58 },
  gradeLabel: { marginTop: 14 },
  grades: { flexDirection: "row", gap: 10 },
  grade: { flex: 1, minHeight: 65, borderWidth: 1.5, borderColor: "#9BBBA7", borderRadius: 16, backgroundColor: "#F2F6E9", justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 },
  gradeSelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondary },
  gradeNumber: { fontWeight: "900", fontSize: 23, color: Colors.secondary },
  gradeNumberSelected: { color: Colors.surface },
  continue: { minHeight: 60, borderRadius: 18, backgroundColor: Colors.secondary, marginTop: 24, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, padding: 14 },
  continueText: { color: Colors.accentSoft, fontWeight: "900", fontSize: 16 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
});
