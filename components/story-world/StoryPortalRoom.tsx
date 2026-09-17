import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";

import type { Story } from "@/data/stories";
import { getCabinetActivities } from "@/data/cabinet-activities";
import { useUserStore } from "@/store/useUserStore";
import { canEnterStory, canOpenStoryActivities } from "./quest-progression";

/** Lightweight vector objects float without retaining another GL context. */
function FloatingObject({ cabinet = false, scroll = false, tree = false, locked = false, completed = 0 }: { cabinet?: boolean; scroll?: boolean; tree?: boolean; locked?: boolean; completed?: number }) {
  const [float] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let mounted = true;
    let reduced = true;
    let animation: Animated.CompositeAnimation | undefined;
    const update = () => {
      animation?.stop();
      float.setValue(0);
      if (!mounted || reduced || AppState.currentState === "background" || AppState.currentState === "inactive") return;
      animation = Animated.loop(Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: cabinet || tree ? 2300 : 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(float, { toValue: 0, duration: cabinet || tree ? 2300 : 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
      ]));
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) { reduced = value; update(); } }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener("reduceMotionChanged", value => { reduced = value; update(); });
    const appState = AppState.addEventListener("change", update);
    return () => { mounted = false; motion.remove(); appState.remove(); animation?.stop(); float.stopAnimation(); };
  }, [cabinet, tree, float]);

  const wood = locked ? "#70776D" : "#97613B";
  const edge = locked ? "#9CA491" : "#EACB85";
  return <View pointerEvents="none" accessible={false} style={styles.objectStage}>
    <Svg width="100%" height="100%" viewBox="0 0 220 230" style={StyleSheet.absoluteFill}>
      <Ellipse cx="110" cy="214" rx="65" ry="9" fill="#071F20" opacity="0.35" />
      <Ellipse cx="110" cy="210" rx="48" ry="4" fill={locked ? "#829087" : "#F5D788"} opacity="0.18" />
    </Svg>
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }] }]}>
      <Svg width="100%" height="100%" viewBox="0 0 220 230">
        {tree ? <G>
          <Path d="M106 160 C96 182 85 189 66 192 M106 164 C112 184 126 190 145 193 M99 166 C90 179 78 181 66 178 M112 166 C122 178 138 180 153 176" fill="none" stroke={locked ? "#6F776A" : "#B98355"} strokeWidth="8" strokeLinecap="round" />
          <Path d="M98 85 Q102 122 99 164 H116 Q112 121 118 84 Z" fill={locked ? "#737B70" : "#8D5937"} stroke={edge} strokeWidth="3" />
          <Path d="M107 59 C90 34 62 51 68 77 C43 78 42 112 70 116 C68 142 102 147 111 123 C122 146 154 140 151 115 C181 111 175 77 150 77 C154 49 126 34 107 59 Z" fill={locked ? "#69766B" : "#4F7D54"} stroke={edge} strokeWidth="3" />
          <Path d="M80 81 C87 67 99 70 104 82 M120 73 C131 64 144 72 142 85 M83 105 C91 95 102 99 105 110 M119 101 C131 92 144 101 140 114" fill="none" stroke={locked ? "#839084" : "#86AA6A"} strokeWidth="7" strokeLinecap="round" />
          {!locked && [0, 1, 2].map(index => index < completed ? <G key={index}><Circle cx={[80, 140, 109][index]} cy={[70, 92, 119][index]} r="10" fill="#E8C875" /><Path d={`M${[76, 136, 105][index]} ${[70, 92, 119][index]} l3 3 l6 -7`} fill="none" stroke="#31543E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></G> : null)}
        </G> : scroll ? <G>
          <Path d="M62 53 H160 V162 Q177 165 174 182 H62 Q44 182 46 163 V72 Q44 53 62 53Z" fill={locked ? "#A0A598" : "#F3DFAC"} stroke={edge} strokeWidth="3" />
          <Path d="M62 53 Q42 53 45 74 H155 Q146 52 162 52 Q178 52 176 72 H155" fill={locked ? "#727C70" : "#D5B47A"} stroke={edge} strokeWidth="3" />
          <Path d="M62 161 Q78 161 77 181 H174 Q181 162 163 161 Z" fill={locked ? "#727C70" : "#D5B47A"} stroke={edge} strokeWidth="3" />
          <Path d="M70 93 H145 M70 106 H133 M70 133 H144 M70 146 H129" fill="none" stroke={locked ? "#636D63" : "#A48B59"} strokeWidth="3" strokeLinecap="round" />
          {!locked && <G><Circle cx="110" cy="122" r="17" fill="#49755E" /><Path d="M101 122 L108 128 L120 116" fill="none" stroke="#F5E3AB" strokeWidth="3" strokeLinecap="round" /></G>}
        </G> : cabinet ? <G>
          <Path d="M48 42 L168 42 L184 52 L184 188 L168 197 L48 197 Z" fill={locked ? "#444E48" : "#5B3A28"} />
          <Rect x="42" y="39" width="132" height="15" rx="4" fill={edge} />
          <Rect x="48" y="53" width="120" height="134" fill={wood} stroke={edge} strokeWidth="3" />
          <Rect x="56" y="62" width="104" height="116" fill={locked ? "#3F4842" : "#392C22"} />
          {!locked && <G>
            <Path d="M59 94 H157 M59 132 H157" stroke="#CFA970" strokeWidth="5" />
            <Rect x="82" y="74" width="21" height="18" rx="2" fill="#C6D5A2" />
            <Rect x="113" y="106" width="23" height="23" rx="2" fill="#EACB85" />
            <Rect x="88" y="146" width="35" height="22" rx="2" fill="#B5CADA" />
          </G>}
          <Path d={locked ? "M56 61 H105 V179 H56 Z" : "M56 61 L29 71 V190 L56 179 Z"} fill={wood} stroke={edge} strokeWidth="2" />
          <Path d={locked ? "M111 61 H160 V179 H111 Z" : "M160 61 L188 71 V190 L160 179 Z"} fill={wood} stroke={edge} strokeWidth="2" />
          <Path d={locked ? "M63 69 H97 V169 H63 Z M119 69 H152 V169 H119 Z" : "M48 77 L37 81 V169 L48 165 Z M168 77 L180 81 V169 L168 165 Z"} fill="none" stroke={edge} opacity="0.55" strokeWidth="2" />
          <Circle cx={locked ? 97 : 38} cy="125" r="3" fill={edge} />
          <Circle cx={locked ? 119 : 179} cy="125" r="3" fill={edge} />
          <Rect x="43" y="187" width="132" height="10" rx="2" fill={edge} />
          <Path d="M53 197 V206 H64 V197 M153 197 V206 H165 V197" fill={wood} />
        </G> : <G>
          <Path d="M30 67 Q68 52 110 72 Q155 51 195 66 L188 180 Q147 169 110 191 Q71 169 28 181 Z" fill="#987243" stroke="#E4C47D" strokeWidth="3" />
          <Path d="M36 59 Q72 49 110 68 Q150 49 188 59 L182 171 Q146 161 110 181 Q75 162 34 172 Z" fill="#F9ECC5" />
          <Path d="M110 68 Q150 49 188 59 L182 171 Q146 161 110 181 Z" fill="#EADBB1" />
          <Path d="M110 69 V181" stroke="#B99B61" strokeWidth="3" />
          <Path d="M48 86 Q73 80 96 90 M47 100 Q73 94 96 104 M46 115 Q72 110 96 120 M45 131 Q72 126 96 135 M124 90 Q151 79 175 84 M124 105 Q149 94 174 99 M124 120 Q149 109 173 114 M124 136 Q149 125 172 130" fill="none" stroke="#B4A17A" strokeWidth="3" strokeLinecap="round" />
          <Path d="M137 62 L143 58 L141 112 L132 105 L125 114 L129 65" fill="#578573" />
          <Path d="M110 181 V191" stroke="#E4C47D" strokeWidth="3" />
        </G>}
        {locked && <G>
          <Path d="M99 114 V106 a11 11 0 0 1 22 0 V114" fill="none" stroke="#F1D68C" strokeWidth="5" />
          <Rect x="92" y="112" width="36" height="30" rx="5" fill="#F1D68C" />
          <Circle cx="110" cy="123" r="4" fill="#48534B" /><Path d="M110 124 V132" stroke="#48534B" strokeWidth="3" />
        </G>}
        {!locked && <G fill="#F9D986"><Path d="M30 31 L33 40 L42 43 L33 46 L30 55 L27 46 L18 43 L27 40 Z" /><Path d="M189 21 L191 27 L197 29 L191 31 L189 37 L187 31 L181 29 L187 27 Z" /><Circle cx="202" cy="151" r="2" /></G>}
      </Svg>
    </Animated.View>
  </View>;
}

export function StoryPortalRoom({ story }: { story: Story }) {
  const reading = useUserStore(state => state.readingCompletedStoryIds);
  const answers = useUserStore(state => state.activityResults);
  const cabinetResponses = useUserStore(state => state.cabinetResponses);
  const page = useUserStore(state => state.storySceneIndexes[story.id]);
  const unlocked = canOpenStoryActivities(story.id, reading, answers);
  const answered = story.activities.filter(activity => answers[activity.id]).length;
  const cabinetTasks = getCabinetActivities(story.id);
  const cabinetCompleted = cabinetTasks.filter(activity => cabinetResponses[activity.id]?.completedAt).length;
  const bookLabel = unlocked ? "Basahin muli" : page === undefined ? "Basahin" : "Ituloy ang pagbasa";
  const isUgat = story.id === "m1-story-2";

  function openBook() {
    if (canEnterStory(story.id, useUserStore.getState().activityResults)) router.replace({ pathname: "/story", params: { storyId: story.id } });
  }
  function openCabinet() {
    const state = useUserStore.getState();
    if (canOpenStoryActivities(story.id, state.readingCompletedStoryIds, state.activityResults)) router.replace({ pathname: "/story-cabinet", params: { storyId: story.id } });
  }
  function openQuiz() {
    const state = useUserStore.getState();
    if (canOpenStoryActivities(story.id, state.readingCompletedStoryIds, state.activityResults)) router.replace({ pathname: "/quest-world", params: { storyId: story.id } });
  }

  return <LinearGradient colors={["#122F31", "#254C3F", "#142E2B"]} style={styles.screen}>
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Bumalik sa mga portal" onPress={() => router.replace("/landing")} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#F5E4B7" />
        </Pressable>
        <Text style={styles.headerLabel}>MUNDO NG KUWENTO</Text>
        <MaterialCommunityIcons name="star-four-points" size={19} color="#DCC18A" />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>KUWENTO {story.order} · MARKAHAN {story.markahan}</Text>
          <Text accessibilityRole="header" style={styles.title}>{story.title}</Text>
          <Text style={styles.subtitle}>{isUgat ? "Aklat para sa kuwento. Puno para sa mga gawain. Balumbon para sa pagsusulit." : "Aklat para sa kuwento. Kabinet para sa gawain. Balumbon para sa pagsusulit."}</Text>
        </View>
        <View style={styles.choices}>
          <Pressable accessibilityRole="button" accessibilityLabel={bookLabel} onPress={openBook} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
            <FloatingObject />
            <View style={styles.choiceLabel}><MaterialCommunityIcons name="book-open-page-variant-outline" color="#F3D592" size={18} /><Text style={styles.choiceTitle}>Basahin</Text></View>
            <Text style={styles.choiceCopy}>{unlocked ? "Balikan ang kuwento anumang oras." : "Buksan ang aklat at tuklasin ang kuwento."}</Text>
            <View style={styles.badge}><MaterialCommunityIcons name={unlocked ? "check-circle-outline" : "bookmark-outline"} color="#C6E3B5" size={15} /><Text style={styles.badgeText}>{unlocked ? "Tapos nang basahin" : page === undefined ? "Magsimula rito" : `Bahagi ${page + 1} sa ${story.scenes.length}`}</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={unlocked ? isUgat ? "Buksan ang puno ng mga gawain" : "Buksan ang kabinet ng mga gawain" : "Mga gawain, nakandado. Tapusin muna ang pagbasa."} accessibilityState={{ disabled: !unlocked }} disabled={!unlocked} onPress={openCabinet} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
            <FloatingObject cabinet={!isUgat} tree={isUgat} locked={!unlocked} completed={cabinetCompleted} />
            <View style={styles.choiceLabel}><MaterialCommunityIcons name={unlocked ? isUgat ? "tree-outline" : "wardrobe-outline" : "lock-outline"} color={unlocked ? "#F3D592" : "#B7C3AF"} size={18} /><Text style={[styles.choiceTitle, !unlocked && styles.lockedTitle]}>Mga Gawain</Text></View>
            <Text style={styles.choiceCopy}>{unlocked ? "Pagsusuri, patunay, at pagninilay sa kuwento." : "Tapusin muna ang pagbasa upang mabuksan."}</Text>
            <View style={[styles.badge, !unlocked && styles.lockedBadge]}><MaterialCommunityIcons name={unlocked ? isUgat ? "tree-outline" : "wardrobe-outline" : "lock"} color={unlocked ? "#C6E3B5" : "#B7C3AF"} size={15} /><Text style={[styles.badgeText, !unlocked && styles.lockedTitle]}>{unlocked ? cabinetTasks.length ? `${cabinetCompleted}/${cabinetTasks.length} gawain` : "Wala pang gawain" : "Nakakandado"}</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={unlocked ? "Buksan ang balumbon ng pagsusulit" : "Pagsusulit, nakandado. Tapusin muna ang pagbasa."} accessibilityState={{ disabled: !unlocked }} disabled={!unlocked} onPress={openQuiz} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
            <FloatingObject scroll locked={!unlocked} />
            <View style={styles.choiceLabel}><MaterialCommunityIcons name={unlocked ? "script-text-outline" : "lock-outline"} color={unlocked ? "#F3D592" : "#B7C3AF"} size={18} /><Text style={[styles.choiceTitle, !unlocked && styles.lockedTitle]}>Pagsusulit</Text></View>
            <Text style={styles.choiceCopy}>{unlocked ? "Sundan ang landas at sagutin ang mga tanong." : "Tapusin muna ang pagbasa upang mabuksan."}</Text>
            <View style={[styles.badge, !unlocked && styles.lockedBadge]}><MaterialCommunityIcons name={unlocked ? "check-circle-outline" : "lock"} color={unlocked ? "#C6E3B5" : "#B7C3AF"} size={15} /><Text style={[styles.badgeText, !unlocked && styles.lockedTitle]}>{unlocked ? `${answered}/${story.activities.length} tanong` : "Nakakandado"}</Text></View>
          </Pressable>
        </View>
        <View style={styles.hint} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name={unlocked ? "lock-open-variant-outline" : "book-open-outline"} color="#EACD8B" size={21} />
          <Text style={styles.hintText}>{unlocked ? isUgat ? "Bukas na ang puno ng gawain at balumbon! Pumili ng gawain, pagsusulit, o magbasa muli." : "Bukas na ang kabinet at balumbon! Pumili ng gawain, pagsusulit, o magbasa muli." : isUgat ? "Unahin ang aklat. Pagkatapos ng huling pahina, magbubukas ang puno ng gawain at balumbon." : "Unahin ang aklat. Pagkatapos ng huling pahina, magbubukas ang kabinet at balumbon."}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  back: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#2E4C43", alignItems: "center", justifyContent: "center" },
  headerLabel: { color: "#C2CFB3", fontSize: 10, letterSpacing: 1.7, fontWeight: "800" },
  content: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingTop: 30, paddingBottom: 32 },
  heading: { maxWidth: 640, alignItems: "center", marginBottom: 12 },
  eyebrow: { color: "#D5BA7C", fontSize: 10, letterSpacing: 1.4, fontWeight: "800", textAlign: "center" },
  title: { color: "#FFF0C8", fontSize: 32, lineHeight: 40, fontWeight: "900", textAlign: "center", marginTop: 12 },
  subtitle: { color: "#C3D2BB", fontSize: 13, lineHeight: 21, textAlign: "center", marginTop: 9 },
  choices: { flexDirection: "row", width: "100%", maxWidth: 840, gap: 8, marginVertical: 16 },
  choice: { flex: 1, alignItems: "center", borderRadius: 18, paddingVertical: 12 },
  objectStage: { width: "100%", maxWidth: 235, aspectRatio: 220 / 230, marginBottom: 9 },
  choiceLabel: { minHeight: 46, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 6 },
  choiceTitle: { fontSize: 15, fontWeight: "800", color: "#FFE6A9", textAlign: "center" },
  choiceCopy: { fontSize: 12, lineHeight: 19, color: "#C4D0B9", textAlign: "center", maxWidth: 220, marginTop: 9, paddingHorizontal: 3 },
  badge: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#31543E", borderRadius: 20, marginTop: 14 },
  badgeText: { color: "#C6E3B5", fontSize: 10, fontWeight: "700", textAlign: "center" },
  lockedBadge: { backgroundColor: "#34453D" },
  lockedTitle: { color: "#B7C3AF" },
  hint: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#2D483C", borderWidth: 1, borderColor: "#466047", padding: 16, borderRadius: 16, maxWidth: 540, width: "100%", marginTop: 12 },
  hintText: { flex: 1, color: "#E1E4CD", fontSize: 12, lineHeight: 20 },
  pressed: { opacity: 0.75 },
});
