import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StudentStoryCard } from "@/components/student-records/StudentStoryCard";
import { ClassRankings } from "@/components/student-records/ClassRankings";
import { SyncStatus } from "@/components/student-records/SyncStatus";
import { useClassCodeDialog } from "@/components/class-code/ClassCodeProvider";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import { AppTheme } from "@/constants/colors";
import { getAllStories } from "@/data/stories";
import { useUserStore } from "@/store/useUserStore";
import { getStudentStoryRecord } from "@/utils/student-records";
import { normalizeClassCode } from "@/utils/class-code";

const stories = getAllStories();

export default function StudentRecordsScreen() {
  const profile = useUserStore(state => state.profile);
  const openClassCode = useClassCodeDialog();
  const classCode = normalizeClassCode(profile?.classCode);
  const activityResults = useUserStore(state => state.activityResults);
  const cabinetResponses = useUserStore(state => state.cabinetResponses);
  const records = useMemo(() => stories.map(story => getStudentStoryRecord(story, activityResults, cabinetResponses)), [activityResults, cabinetResponses]);
  const name = profile?.fullName.trim() || "Manlalakbay";
  const initials = name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toLocaleUpperCase();
  const grade = profile?.pangkat.trim().replace("Pangkat", "Baitang");

  return <LinearGradient colors={AppTheme.backgroundGradient} style={styles.screen}>
    <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Bumalik sa Progreso" onPress={() => router.replace("/progress")}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="arrow-left" size={23} color={AppTheme.primary} />
          </Pressable>
          <View style={styles.flex}>
            <WikalinoBrand />
            <Text accessibilityRole="header" style={styles.title}>Aking mga Tala</Text>
          </View>
          <View style={styles.localBadge} accessibilityLabel="Mga talang naka-save sa device">
            <MaterialCommunityIcons name="content-save-outline" size={16} color={AppTheme.muted} />
            <Text style={styles.localText}>Sa device</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Mga iskor at sagot, bawat kuwento.</Text>

        <View style={styles.identity}>
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
          <View style={styles.flex}>
            <Text style={styles.studentName}>{name}</Text>
            {Boolean(grade) && <Text style={styles.grade}>{grade}</Text>}
          </View>
        </View>

        {profile && <View style={styles.classCard}>
          <MaterialCommunityIcons name="school-outline" size={24} color={AppTheme.primary} />
          <View style={styles.flex}>
            <Text style={styles.classLabel}>CLASS CODE</Text>
            <Text selectable style={styles.classCode}>{classCode ?? "Wala pang code"}</Text>
            <Text style={styles.classHint}>{classCode ? "Naka-save sa device na ito" : "Idagdag ang code mula sa iyong guro"}</Text>
          </View>
          <Pressable onPress={openClassCode} accessibilityRole="button" accessibilityLabel={classCode ? "Palitan ang class code" : "Ilagay ang class code"}
            style={({ pressed }) => [styles.classButton, pressed && styles.pressed]}>
            <Text style={styles.classButtonText}>{classCode ? "Palitan" : "Ilagay"}</Text>
          </Pressable>
        </View>}

        <Text accessibilityRole="header" style={styles.sectionLabel}>IYONG MGA KUWENTO · {stories.length} KUWENTO</Text>
        <SyncStatus />
        <ClassRankings />
        <View style={styles.cards}>
          {stories.map((story, index) => <StudentStoryCard key={story.id} story={story} index={index} record={records[index]} initiallyExpanded={index === 0} />)}
        </View>

        <View style={styles.note}>
          <MaterialCommunityIcons name="notebook-check-outline" size={18} color={AppTheme.muted} />
          <Text style={styles.noteText}>Ang “kumpleto” sa Gawain ay hindi katumbas ng marka. Ang guro ang susuri sa nilalaman. Naka-save sa device na ito ang mga sagot.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", padding: 18, paddingBottom: 30 },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  back: { width: 42, height: 46, alignItems: "center", justifyContent: "center", backgroundColor: AppTheme.surfaceSoft, borderRadius: 14 },
  title: { fontSize: 25, lineHeight: 32, fontWeight: "900", color: AppTheme.text, marginTop: 4 },
  subtitle: { color: AppTheme.muted, fontSize: 13, lineHeight: 21, marginTop: 14 },
  localBadge: { alignSelf: "flex-start", alignItems: "center", gap: 4, paddingTop: 3 },
  localText: { fontSize: 10, lineHeight: 15, color: AppTheme.muted },
  identity: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 23 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: AppTheme.primary },
  initials: { color: AppTheme.buttonText, fontSize: 16, fontWeight: "800" },
  studentName: { color: AppTheme.text, fontSize: 16, lineHeight: 23, fontWeight: "800" },
  grade: { color: AppTheme.muted, fontSize: 12, lineHeight: 19, marginTop: 3 },
  classCard: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 18, backgroundColor: AppTheme.surfaceSoft, borderWidth: 1, borderColor: AppTheme.border, padding: 15, marginBottom: 23 },
  classLabel: { color: AppTheme.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  classCode: { color: AppTheme.text, fontWeight: "800", fontSize: 16, lineHeight: 23, marginTop: 4 },
  classHint: { color: AppTheme.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  classButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12, backgroundColor: AppTheme.selected },
  classButtonText: { color: AppTheme.text, fontSize: 12, fontWeight: "800" },
  sectionLabel: { color: AppTheme.muted, fontSize: 11, lineHeight: 18, fontWeight: "800", letterSpacing: 1, marginBottom: 13 },
  cards: { gap: 13 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 22 },
  noteText: { flex: 1, color: AppTheme.muted, fontSize: 12, lineHeight: 20 },
  pressed: { opacity: .75 },
});
