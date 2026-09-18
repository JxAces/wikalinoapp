import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ExpoWebGLRenderingContext } from "expo-gl";
import { RenderSurface } from "@/components/three/RenderSurface";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useIsFocused, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getStoryById, getStoryUnitByNumber, storyUnits } from "@/data/stories";
import { DEFAULT_PLAYER_CHARACTER } from "@/data/player-characters";
import { useUserStore } from "@/store/useUserStore";
import { getLevelInfo } from "@/utils/progression";

import { StoryWorldEngine } from "./StoryWorldEngine.native";
import { RETURN_PORTAL_ID, STORY_WORLD_POSITIONS, UGAT_STORY } from "./story-world.constants";
import type {
  StoryWorldInput,
  StoryWorldPortal,
  StoryWorldStatus,
} from "./story-world.types";
import { VirtualJoystick } from "./VirtualJoystick";
import { useWorldKeyboard } from "@/hooks/useWorldKeyboard";
import { hubReturnRoute, hubSpawn } from "./hub-navigation";

import { canEnterStory, isStoryAnswered, isWorldChestUnlocked, questionScrolls, scrollTitle, worldNodeId } from "./quest-progression";

const EMPTY_STATUS: StoryWorldStatus = {
  animation: "Idle",
  nearestStoryId: null,
};

export default function StoryWorld({ questStoryId }: { questStoryId?: string } = {}) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ markahan?: string; node?: string; returnPortal?: string | string[] }>();
  const questStory = questStoryId ? getStoryById(questStoryId) : undefined;
  const profile = useUserStore((state) => state.profile);
  const xp = useUserStore((state) => state.xp);
  const activityResults = useUserStore((state) => state.activityResults);
  const requestedMarkahan = Number(params.markahan);
  const currentMarkahan =
    Number.isFinite(requestedMarkahan) && requestedMarkahan > 0
      ? requestedMarkahan
      : 1;
  const unit = getStoryUnitByNumber(currentMarkahan) ?? storyUnits[0];
  const stories = useMemo(() => unit?.stories ?? [], [unit]);
  const engineRef = useRef<StoryWorldEngine | null>(null);
  const inputRef = useRef<StoryWorldInput>({ x: 0, y: 0 });
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StoryWorldStatus>(EMPTY_STATUS);
  const [enteringStoryId, setEnteringStoryId] = useState<string | null>(null);
  const portalTransition = useSharedValue(0);

  const portals = useMemo<StoryWorldPortal[]>(
    () => questStory ? questionScrolls(questStory, activityResults) : stories.map((story, index) => ({
      position: STORY_WORLD_POSITIONS[index] ?? { x: 0, z: 8 - index * 5 },
      state: !canEnterStory(story.id, activityResults) ? "locked" : isStoryAnswered(story, activityResults) ? "completed" : "current",
      story,
    })),
    [activityResults, questStory, stories],
  );
  const spawnNode = questStory ? portals.find(node => (worldNodeId(node) === params.node || (node.questionGroup && node.story.activities.slice(node.questionGroup.start, node.questionGroup.end).some(activity => activity.id === params.node)))) ?? portals.find(node => node.state === "current") : undefined;
  const forestEntrance = questStoryId === UGAT_STORY && !params.node;
  const hubArrival = useMemo(() => hubSpawn(portals, params.returnPortal), [portals, params.returnPortal]);
  const spawnPosition = useMemo(() => questStory
    ? spawnNode && !forestEntrance ? { x: spawnNode.position.x, z: spawnNode.position.z + 1.7 } : undefined
    : hubArrival.position, [questStory, spawnNode, forestEntrance, hubArrival]);
  const spawnHeading = questStory ? undefined : hubArrival.heading;
  const answered = questStory?.activities.filter(activity => activityResults[activity.id]).length ?? 0;
  const chestUnlocked = isWorldChestUnlocked(portals);
  const chestProgress = questStory ? `${answered}/${questStory.activities.length} gawain` : `${portals.filter(node => node.state === "completed").length}/${portals.length} portal`;
  const claimChest = () => {
    const state = useUserStore.getState();
    const required = questStory ? [questStory] : stories;
    // Recheck the live save at press time, including previously locked stories.
    if (!required.length || !required.every(story => canEnterStory(story.id, state.activityResults) && isStoryAnswered(story, state.activityResults))) return;
    if (questStory) router.replace({ pathname: "/story-result", params: { storyId: questStory.id } });
    else {
      required.forEach(story => state.completeStory(story.id));
      router.push("/progress");
    }
  };
  const nodeTitle = scrollTitle;

  const level = getLevelInfo(xp);
  const firstName = profile?.fullName?.trim().split(" ")[0] || "Mambabasa";
  const characterId = profile?.character ?? DEFAULT_PLAYER_CHARACTER;
  const nearbyPortal = portals.find(
    (node) => worldNodeId(node) === status.nearestStoryId,
  );
  const returningToHub = enteringStoryId === RETURN_PORTAL_ID;

  useEffect(() => {
    if (__DEV__) console.info("[Wikalino world UI] mounted");
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      engineRef.current?.dispose();
      engineRef.current = null;
      if (__DEV__) console.info("[Wikalino world UI] unmounted");
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      portalTransition.set(0);
      setEnteringStoryId(null);
      engineRef.current?.start();
      return () => {
        if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
        inputRef.current = { x: 0, y: 0 };
        engineRef.current?.setInput(inputRef.current);
        engineRef.current?.dispose();
        engineRef.current = null;
        setReady(false);
      };
    }, [portalTransition]),
  );

  useEffect(() => {
    engineRef.current?.updatePortals(portals);
  }, [portals]);

  const handleStatusChange = useCallback((next: StoryWorldStatus) => {
    setStatus((current) =>
      current.guidance?.label === next.guidance?.label &&
      current.guidance?.degrees === next.guidance?.degrees &&
      current.guidance?.distance === next.guidance?.distance &&
      current.guidance?.viaBridge === next.guidance?.viaBridge &&
      current.animation === next.animation &&
      current.nearChest === next.nearChest &&
      current.nearReturnPortal === next.nearReturnPortal &&
      current.nearestStoryId === next.nearestStoryId
        ? current
        : next,
    );
  }, []);

  const handleContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      try {
        engineRef.current?.dispose();
        setError(null);
        setReady(false);
        engineRef.current = new StoryWorldEngine({
          characterId,
          questStoryId,
          spawnPosition,
          spawnHeading,
          gl,
          onError: (worldError) => {
            console.warn("Hindi ma-load ang 3D story world.", worldError);
            setError(worldError.message);
          },
          onReady: () => setReady(true),
          onStatusChange: handleStatusChange,
          portals,
        });
        if (!focused) engineRef.current.stop();
      } catch (cause) {
        const worldError = cause instanceof Error ? cause : new Error(String(cause));
        console.warn("Hindi masimulan ang 3D story world.", worldError);
        setError(worldError.message);
      }
    },
    [characterId, focused, handleStatusChange, portals, questStoryId, spawnPosition, spawnHeading],
  );

  const handleMove = useCallback((x: number, y: number) => {
    inputRef.current = { ...inputRef.current, x, y };
    engineRef.current?.setInput(inputRef.current);
  }, []);
  useWorldKeyboard(focused && ready && !enteringStoryId, handleMove);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active" && focused) engineRef.current?.start();
      else { engineRef.current?.setInput({ x: 0, y: 0 }); engineRef.current?.stop(); }
    });
    return () => subscription.remove();
  }, [focused]);

  const enterStory = useCallback(
    (storyId: string) => {
      const returning = storyId === RETURN_PORTAL_ID && Boolean(questStory);
      const portal = portals.find(node => worldNodeId(node) === storyId);
      if (enteringStoryId || (returning ? !ready || !status.nearReturnPortal : !portal || portal.state === "locked")) {
        return;
      }
      inputRef.current = { x: 0, y: 0 };
      engineRef.current?.setInput(inputRef.current);
      if (questStory && portal && portal.activityIndex !== undefined) {
        router.push({ pathname: "/activity-player", params: { storyId: questStory.id, activityIndex: String(portal.activityIndex) } });
        return;
      }
      setEnteringStoryId(storyId);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!returning) {
        // Keep the origin on this hub tab for native/browser Back as well as explicit exits.
        if (!questStory && portal) router.setParams(hubReturnRoute(portal.story).params);
        // Leave the GL world before showing the book, cabinet, and quiz choices.
        router.push({ pathname: "/story-room", params: { storyId } });
        return;
      }
      portalTransition.set(0);
      portalTransition.set(withTiming(1, {
        duration: 1080,
        easing: Easing.in(Easing.cubic),
      }));
      navigationTimerRef.current = setTimeout(() => {
        if (questStory) router.replace(hubReturnRoute(questStory));
      }, 1010);
    },
    [enteringStoryId, portalTransition, portals, questStory, ready, status.nearReturnPortal],
  );

  const transitionBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(portalTransition.value, [0, 0.55, 1], [0, 0.6, 1]),
  }));

  const transitionRingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(portalTransition.value, [0, 0.08, 1], [0, 1, 1]),
    transform: [
      {
        scale: interpolate(
          portalTransition.value,
          [0, 0.45, 1],
          [0.3, 1.05, 9],
        ),
      },
      { rotate: `${interpolate(portalTransition.value, [0, 1], [0, 210])}deg` },
    ],
  }));

  if (!focused) return null;

  if (error) {
    return (
      <FallbackWorld
        error={error}
        onEnterStory={enterStory}
        portals={portals}
        questStoryId={questStoryId}
        chestUnlocked={chestUnlocked}
        chestProgress={chestProgress}
        onClaimChest={claimChest}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {focused && <RenderSurface
        key={`${characterId}:${questStoryId ?? "hub"}`}
        msaaSamples={0}
        onContextCreate={handleContextCreate}
        style={StyleSheet.absoluteFill}
      />}

      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.hudLayer]}>
        <View style={[styles.topHud, { paddingTop: insets.top + 8 }]}>
          <View style={styles.identityCard}>
            <View>
              <Text numberOfLines={1} style={styles.playerName}>{firstName}</Text>
              <Text style={styles.levelText}>LV {level.level}</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <HudButton icon={questStory ? "bookshelf" : "cards-outline"} onPress={() => questStory ? router.replace({ pathname: "/story-room", params: { storyId: questStory.id } }) : router.push("/collection")} />
            <HudButton icon="chart-timeline-variant" onPress={() => router.push("/progress")} />
            <HudButton icon="information-outline" onPress={() => router.push("/about")} />
          </View>
        </View>

        {ready && questStory && <View pointerEvents="none" style={[styles.navigationCard, { top: insets.top + 58 }]}>
          <MaterialCommunityIcons color="#F7D77A" name="script-text-outline" size={20} />
          <Text style={styles.navigationTitle}>{portals.filter(node => node.state === "completed").length}/{portals.length} balumbon</Text>
        </View>}

        {ready && !questStory && status.guidance ? (
          <View pointerEvents="none" accessible style={[styles.navigationCard, { top: insets.top + 58 }]} accessibilityLabel={`${status.guidance.label}, ${status.guidance.distance} metro${status.guidance.viaBridge ? ', dumaan sa tulay' : ''}`}>
            <View style={{ transform: [{ rotate: `${status.guidance.degrees}deg` }] }}>
              <MaterialCommunityIcons name="arrow-up-bold" size={23} color="#F7D77A" />
            </View>
            <Text numberOfLines={1} style={styles.navigationTitle}>{status.guidance.label.split(" · ")[0]} · {status.guidance.distance} m</Text>
            {status.guidance.viaBridge && <MaterialCommunityIcons name="bridge" color="#D0DFC0" size={18} />}
          </View>
        ) : null}

        {!ready ? (
          <View style={styles.loadingCard}>
            <MaterialCommunityIcons color="#F7D77A" name="creation" size={22} />
            <Text style={styles.loadingTitle}>Binubuo ang mahiwagang mundo...</Text>
            <Text style={styles.loadingHint}>Inihahanda ang iyong manlalakbay</Text>
          </View>
        ) : null}

        {ready && status.nearChest ? (
          <View style={[styles.storyPrompt, { bottom: insets.bottom + 164 }]}>
            <ChestRewardPrompt unlocked={chestUnlocked} progress={chestProgress} quest={Boolean(questStory)} nearby onClaim={claimChest} />
          </View>
        ) : ready && questStory && status.nearReturnPortal ? (
          <View style={[styles.storyPrompt, { bottom: insets.bottom + 164 }]}>
            <MaterialCommunityIcons name="exit-run" color="#F7D77A" size={24} />
            <View style={styles.storyPromptCopy}>
              <Text style={styles.storyPromptEyebrow}>PORTAL PABALIK</Text>
              <Text style={styles.storyPromptTitle}>Bumalik sa mga portal ng kuwento</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Pumasok sa portal pabalik sa unang mundo" disabled={Boolean(enteringStoryId)} style={styles.enterButton} onPress={() => enterStory(RETURN_PORTAL_ID)}>
              <Text style={styles.enterButtonText}>BUMALIK</Text>
            </Pressable>
          </View>
        ) : nearbyPortal ? (
          <View style={[styles.storyPrompt, { bottom: insets.bottom + 164 }]}>
            <View
              style={[
                styles.storyNumber,
                nearbyPortal.state === "locked" && styles.storyNumberLocked,
              ]}
            >
              <MaterialCommunityIcons
                color={nearbyPortal.state === "locked" ? "#B5B6C2" : "#F7D77A"}
                name={
                  nearbyPortal.state === "locked"
                    ? "lock"
                    : nearbyPortal.state === "completed"
                      ? "check-decagram"
                      : "book-open-page-variant"
                }
                size={21}
              />
            </View>
            <View style={styles.storyPromptCopy}>
              <Text style={styles.storyPromptEyebrow}>
                {nearbyPortal.state === "locked"
                  ? (questStory ? "TAPUSIN MUNA ANG NAUNANG BALUMBON" : "TAPUSIN ANG LAHAT NG GAWAIN SA NAUNANG KUWENTO")
                  : nearbyPortal.state === "completed"
                    ? (questStory ? "TAMA NA · BALIKAN" : "BALIKAN ANG KUWENTO")
                    : questStory ? `TANONG ${(nearbyPortal.questionGroup?.start ?? 0) + 1}–${nearbyPortal.questionGroup?.end ?? 5}` : `KUWENTO ${nearbyPortal.story.order}`}
              </Text>
              <Text numberOfLines={1} style={styles.storyPromptTitle}>
                {nodeTitle(nearbyPortal)}
              </Text>
            </View>
            {nearbyPortal.state !== "locked" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Buksan ang ${nodeTitle(nearbyPortal)}`}
                onPress={() => enterStory(worldNodeId(nearbyPortal))}
                style={({ pressed }) => [styles.enterButton, pressed && styles.pressed]}
              >
                <Text style={styles.enterButtonText}>{questStory ? "SAGUTIN" : "PASOK"}</Text>
                <MaterialCommunityIcons color="#18283B" name="arrow-right" size={17} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.controls, { bottom: insets.bottom + 16 }]}>
          <VirtualJoystick disabled={!ready || Boolean(enteringStoryId)} onMove={handleMove} />
        </View>
      </View>

      {returningToHub ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.transitionBackdrop, transitionBackdropStyle]}
        >
          <Animated.View style={[styles.transitionRing, transitionRingStyle]}>
            <MaterialCommunityIcons color="#FFF2B8" name="creation" size={43} />
          </Animated.View>
          <Text style={styles.transitionEyebrow}>PABALIK SA UNANG MUNDO</Text>
          <Text style={styles.transitionTitle}>Mga Portal ng Kuwento</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function HudButton({ icon, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={icon === "bookshelf" ? "Bumalik sa aklat, kabinet, at balumbon" : icon === "map-outline" ? "Bumalik sa mga portal" : icon === "cards-outline" ? "Aklatan" : icon === "chart-timeline-variant" ? "Progreso" : "Tungkol sa Wikalino"} onPress={onPress} style={({ pressed }) => [styles.hudButton, pressed && styles.pressed]}>
      <MaterialCommunityIcons color="#FFF1BD" name={icon} size={20} />
    </Pressable>
  );
}

function ChestRewardPrompt({ unlocked, progress, quest, nearby, onClaim }: {
  unlocked: boolean; progress: string; quest: boolean; nearby: boolean; onClaim: () => void;
}) {
  return <>
    <MaterialCommunityIcons name={unlocked ? "treasure-chest" : "lock"} color={unlocked ? "#F7D77A" : "#B5B6C2"} size={24} />
    <View style={styles.storyPromptCopy}>
      <Text style={styles.storyPromptEyebrow}>{unlocked ? "BUKAS NA ANG KABAN" : `NAKAKANDADO · ${progress}`}</Text>
      <Text style={styles.storyPromptTitle}>{unlocked ? (nearby ? "Handa na ang gantimpala!" : "Lumapit sa kaban para sa gantimpala.") : quest ? "Tapusin muna ang lahat ng gawain." : "Tapusin muna ang lahat ng portal at mga gawain nito."}</Text>
    </View>
    {unlocked && nearby && <Pressable accessibilityRole="button" accessibilityLabel="Kunin ang gantimpala sa kaban" style={styles.enterButton} onPress={onClaim}><Text style={styles.enterButtonText}>GANTIMPALA</Text></Pressable>}
  </>;
}

function FallbackWorld({
  error,
  onEnterStory,
  portals,
  questStoryId,
  chestUnlocked,
  chestProgress,
  onClaimChest,
}: {
  error: string;
  onEnterStory: (storyId: string) => void;
  portals: StoryWorldPortal[];
  questStoryId?: string;
  chestUnlocked: boolean;
  chestProgress: string;
  onClaimChest: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.fallbackRoot}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.fallbackContent, { paddingTop: insets.top + 24 }]}
      >
        <MaterialCommunityIcons color="#F7D77A" name="map-outline" size={38} />
        <Text style={styles.fallbackTitle}>{questStoryId ? "Landas ng mga Tanong" : "Mapa ng mga Kuwento"}</Text>
        <Pressable accessibilityRole="button" onPress={() => questStoryId ? router.replace({ pathname: "/story-room", params: { storyId: questStoryId } }) : router.replace("/landing")}><Text style={styles.fallbackText}>{questStoryId ? "Bumalik sa aklat, kabinet, at balumbon" : "Bumalik sa mga portal"}</Text></Pressable>
        <Text style={styles.fallbackText}>
          Hindi maipakita ang 3D mundo ngayon. Maaari mo pa ring buksan ang mga kuwento.
        </Text>
        {portals.map((portal) => (
          <Pressable
            disabled={portal.state === "locked"}
            key={worldNodeId(portal)}
            onPress={() => onEnterStory(worldNodeId(portal))}
            style={[styles.fallbackStory, portal.state === "locked" && styles.fallbackStoryLocked]}
          >
            <MaterialCommunityIcons
              color={portal.state === "locked" ? "#858596" : "#F7D77A"}
              name={
                portal.state === "locked"
                  ? "lock"
                  : portal.state === "completed"
                    ? "check-decagram"
                    : "book-open-variant"
              }
              size={22}
            />
            <View style={styles.fallbackStoryCopy}>
              <Text style={styles.fallbackStoryTitle}>{scrollTitle(portal)}</Text>
              <Text style={styles.fallbackStoryMeta}>
                {portal.state === "locked" ? (questStoryId ? "Tapusin muna ang naunang balumbon" : "Tapusin ang lahat ng gawain sa naunang kuwento") : portal.state === "completed" ? "Tapos na" : portal.story.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
        <View style={styles.fallbackStory}><ChestRewardPrompt unlocked={chestUnlocked} progress={chestProgress} quest={Boolean(questStoryId)} nearby onClaim={onClaimChest} /></View>
        <Text style={styles.fallbackError} numberOfLines={2}>{error}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hudLayer: { zIndex: 1 },
  navigationCard: { position: "absolute", left: 18, maxWidth: "65%", paddingHorizontal: 10, paddingVertical: 7, gap: 7, borderRadius: 20, backgroundColor: "rgba(24,63,52,0.82)", flexDirection: "row", alignItems: "center" },
  navigationTitle: { color: "#FFF9E9", fontWeight: "800", fontSize: 11, flexShrink: 1 },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    height: 39,
    justifyContent: "center",
    marginRight: 9,
    width: 39,
  },
  controls: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  enterButton: {
    alignItems: "center",
    backgroundColor: "#F7D77A",
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  enterButtonText: { color: "#18283B", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  fallbackContent: { paddingBottom: 50, paddingHorizontal: 22 },
  fallbackError: { color: "rgba(255,255,255,0.25)", fontSize: 8, marginTop: 18 },
  fallbackRoot: { backgroundColor: "#18283B", flex: 1 },
  fallbackStory: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(247,215,122,0.24)",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 11,
    padding: 15,
  },
  fallbackStoryCopy: { flex: 1, marginLeft: 12 },
  fallbackStoryLocked: { opacity: 0.52 },
  fallbackStoryMeta: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 3 },
  fallbackStoryTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  fallbackText: { color: "rgba(255,255,255,0.58)", fontSize: 12, lineHeight: 18, marginBottom: 13, marginTop: 7 },
  fallbackTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", marginTop: 11 },
  hudButton: {
    alignItems: "center",
    backgroundColor: "rgba(10,10,39,0.62)",
    borderColor: "rgba(255,235,177,0.18)",
    borderRadius: 13,
    borderWidth: 1,
    height: 39,
    justifyContent: "center",
    width: 39,
  },
  identityCard: { alignItems: "center", flex: 1, flexDirection: "row" },
  levelBadge: { alignItems: "flex-end", marginLeft: 8 },
  levelText: { color: "#F7D77A", fontSize: 9, fontWeight: "900" },
  loadingCard: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(10,10,40,0.84)",
    borderColor: "rgba(247,215,122,0.3)",
    borderRadius: 20,
    borderWidth: 1,
    left: 32,
    padding: 20,
    position: "absolute",
    right: 32,
    top: "43%",
  },
  loadingHint: { color: "rgba(255,255,255,0.48)", fontSize: 10, marginTop: 4 },
  loadingTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginTop: 9 },
  missionCard: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(11, 11, 43, 0.78)",
    borderColor: "rgba(247,215,122,0.2)",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    left: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
    position: "absolute",
    right: 18,
  },
  missionCopy: { flex: 1, marginLeft: 9 },
  missionEyebrow: { color: "#F7D77A", fontSize: 7, fontWeight: "900", letterSpacing: 1.1 },
  missionText: { color: "rgba(255,255,255,0.76)", fontSize: 10, fontWeight: "700", marginTop: 2 },
  playerName: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", maxWidth: 110 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
  root: { backgroundColor: "#18283B", flex: 1, overflow: "hidden" },
  storyNumber: {
    alignItems: "center",
    backgroundColor: "rgba(78,159,109,0.88)",
    borderRadius: 14,
    height: 45,
    justifyContent: "center",
    width: 45,
  },
  storyNumberLocked: { backgroundColor: "rgba(60,60,78,0.8)" },
  storyPrompt: {
    alignItems: "center",
    backgroundColor: "rgba(9, 9, 35, 0.92)",
    borderColor: "rgba(247,215,122,0.32)",
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: "row",
    left: 18,
    padding: 11,
    position: "absolute",
    right: 18,
  },
  storyPromptCopy: { flex: 1, marginHorizontal: 10 },
  storyPromptEyebrow: { color: "#F7D77A", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  storyPromptTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginTop: 3 },
  topActions: { flexDirection: "row", gap: 7 },
  topHud: {
    alignItems: "center",
    flexDirection: "row",
    left: 17,
    position: "absolute",
    right: 17,
  },
  transitionBackdrop: {
    zIndex: 2,
    alignItems: "center",
    backgroundColor: "#18283B",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  transitionEyebrow: { color: "#F7D77A", fontSize: 9, fontWeight: "900", letterSpacing: 1.6, marginTop: 138 },
  transitionRing: {
    alignItems: "center",
    backgroundColor: "#4E9F6D",
    borderColor: "#F7D77A",
    borderRadius: 80,
    borderWidth: 5,
    height: 160,
    justifyContent: "center",
    position: "absolute",
    width: 160,
  },
  transitionTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", marginTop: 8, textAlign: "center" },
  welcome: { color: "rgba(255,255,255,0.48)", fontSize: 6.5, fontWeight: "900", letterSpacing: 0.9 },
  xpText: { color: "rgba(255,255,255,0.5)", fontSize: 7, fontWeight: "800", marginTop: 1 },
});
