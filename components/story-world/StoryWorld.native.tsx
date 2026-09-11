import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ExpoWebGLRenderingContext } from "expo-gl";
import { GLView } from "expo-gl";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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

import { getStoryUnitByNumber, storyUnits } from "@/data/stories";
import { DEFAULT_PLAYER_CHARACTER } from "@/data/player-characters";
import { useUserStore } from "@/store/useUserStore";
import { getLevelInfo } from "@/utils/progression";

import { StoryWorldEngine } from "./StoryWorldEngine.native";
import { STORY_WORLD_POSITIONS } from "./story-world.constants";
import type {
  StoryWorldInput,
  StoryWorldPortal,
  StoryWorldStatus,
} from "./story-world.types";
import { VirtualJoystick } from "./VirtualJoystick";

const EMPTY_STATUS: StoryWorldStatus = {
  animation: "Idle",
  nearestStoryId: null,
};

export default function StoryWorld() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ markahan?: string }>();
  const profile = useUserStore((state) => state.profile);
  const xp = useUserStore((state) => state.xp);
  const completedStoryIds = useUserStore((state) => state.completedStoryIds);
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
  const arrival = useSharedValue(0);
  const portalTransition = useSharedValue(0);

  const portals = useMemo<StoryWorldPortal[]>(
    () =>
      stories.map((story, index) => {
        const completed =
          completedStoryIds.includes(story.id) ||
          (story.activities.length > 0 &&
            story.activities.every((activity) => activityResults[activity.id]));
        const previousStory = stories[index - 1];
        const previousCompleted =
          index === 0 ||
          (previousStory !== undefined &&
            (completedStoryIds.includes(previousStory.id) ||
              (previousStory.activities.length > 0 &&
                previousStory.activities.every(
                  (activity) => activityResults[activity.id],
                ))));
        return {
          position: STORY_WORLD_POSITIONS[index] ?? { x: 0, z: 8 - index * 5 },
          state: completed ? "completed" : previousCompleted ? "current" : "locked",
          story,
        };
      }),
    [activityResults, completedStoryIds, stories],
  );

  const level = getLevelInfo(xp);
  const firstName = profile?.fullName?.trim().split(" ")[0] || "Mambabasa";
  const characterId = profile?.character ?? DEFAULT_PLAYER_CHARACTER;
  const nearbyPortal = portals.find(
    ({ story }) => story.id === status.nearestStoryId,
  );
  const enteringPortal = portals.find(
    ({ story }) => story.id === enteringStoryId,
  );

  useEffect(() => {
    arrival.value = withTiming(1, {
      duration: 920,
      easing: Easing.out(Easing.cubic),
    });
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [arrival]);

  useFocusEffect(
    useCallback(() => {
      portalTransition.set(0);
      setEnteringStoryId(null);
      engineRef.current?.start();
      return () => {
        inputRef.current = { x: 0, y: 0 };
        engineRef.current?.setInput(inputRef.current);
        engineRef.current?.stop();
      };
    }, [portalTransition]),
  );

  useEffect(() => {
    engineRef.current?.updatePortals(portals);
  }, [portals]);

  const handleStatusChange = useCallback((next: StoryWorldStatus) => {
    setStatus((current) =>
      current.animation === next.animation &&
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
          gl,
          onError: (worldError) => {
            console.warn("Hindi ma-load ang 3D story world.", worldError);
            setError(worldError.message);
          },
          onReady: () => setReady(true),
          onStatusChange: handleStatusChange,
          portals,
        });
      } catch (cause) {
        const worldError = cause instanceof Error ? cause : new Error(String(cause));
        console.warn("Hindi masimulan ang 3D story world.", worldError);
        setError(worldError.message);
      }
    },
    [characterId, handleStatusChange, portals],
  );

  const handleMove = useCallback((x: number, y: number) => {
    inputRef.current = { ...inputRef.current, x, y };
    engineRef.current?.setInput(inputRef.current);
  }, []);

  const enterStory = useCallback(
    (storyId: string) => {
      const portal = portals.find(({ story }) => story.id === storyId);
      if (!portal || portal.state === "locked" || enteringStoryId) {
        return;
      }
      inputRef.current = { x: 0, y: 0 };
      engineRef.current?.setInput(inputRef.current);
      setEnteringStoryId(storyId);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      portalTransition.set(0);
      portalTransition.set(withTiming(1, {
        duration: 1080,
        easing: Easing.in(Easing.cubic),
      }));
      navigationTimerRef.current = setTimeout(() => {
        router.push({ pathname: "/story", params: { storyId } });
      }, 1010);
    },
    [enteringStoryId, portalTransition, portals],
  );

  const arrivalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(arrival.value, [0, 0.25, 1], [1, 0.9, 0]),
  }));

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

  if (error) {
    return (
      <FallbackWorld
        error={error}
        onEnterStory={enterStory}
        portals={portals}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <GLView
        msaaSamples={0}
        onContextCreate={handleContextCreate}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={[styles.topHud, { paddingTop: insets.top + 8 }]}>
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons color="#F7D77A" name="account" size={20} />
            </View>
            <View>
              <Text style={styles.welcome}>MALIGAYANG PAGLALAKBAY</Text>
              <Text numberOfLines={1} style={styles.playerName}>{firstName}</Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <HudButton icon="cards-outline" onPress={() => router.push("/collection")} />
            <HudButton icon="chart-timeline-variant" onPress={() => router.push("/progress")} />
            <HudButton icon="information-outline" onPress={() => router.push("/about")} />
          </View>
        </View>

        <View style={[styles.missionCard, { top: insets.top + 78 }]}>
          <MaterialCommunityIcons color="#F7D77A" name="map-marker-path" size={17} />
          <View style={styles.missionCopy}>
            <Text style={styles.missionEyebrow}>MUNDO {currentMarkahan}</Text>
            <Text numberOfLines={1} style={styles.missionText}>
              Lumapit sa isang lumulutang na balumbon
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LV {level.level}</Text>
            <Text style={styles.xpText}>{xp} XP</Text>
          </View>
        </View>

        {!ready ? (
          <View style={styles.loadingCard}>
            <MaterialCommunityIcons color="#F7D77A" name="creation" size={22} />
            <Text style={styles.loadingTitle}>Binubuo ang mahiwagang mundo...</Text>
            <Text style={styles.loadingHint}>Inihahanda ang iyong manlalakbay</Text>
          </View>
        ) : null}

        {nearbyPortal ? (
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
                  ? "NAKAKANDADO"
                  : nearbyPortal.state === "completed"
                    ? "BALIKAN ANG KUWENTO"
                    : `KUWENTO ${nearbyPortal.story.order}`}
              </Text>
              <Text numberOfLines={1} style={styles.storyPromptTitle}>
                {nearbyPortal.story.title}
              </Text>
            </View>
            {nearbyPortal.state !== "locked" ? (
              <Pressable
                accessibilityLabel={`Buksan ang ${nearbyPortal.story.title}`}
                onPress={() => enterStory(nearbyPortal.story.id)}
                style={({ pressed }) => [styles.enterButton, pressed && styles.pressed]}
              >
                <Text style={styles.enterButtonText}>PASOK</Text>
                <MaterialCommunityIcons color="#18283B" name="arrow-right" size={17} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.controls, { bottom: insets.bottom + 16 }]}>
          <VirtualJoystick disabled={!ready || Boolean(enteringStoryId)} onMove={handleMove} />
        </View>
      </View>

      <Animated.View pointerEvents="none" style={[styles.arrivalPortal, arrivalStyle]} />

      {enteringPortal ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.transitionBackdrop, transitionBackdropStyle]}
        >
          <Animated.View style={[styles.transitionRing, transitionRingStyle]}>
            <MaterialCommunityIcons color="#FFF2B8" name="creation" size={43} />
          </Animated.View>
          <Text style={styles.transitionEyebrow}>PAPASOK SA KUWENTO</Text>
          <Text style={styles.transitionTitle}>{enteringPortal.story.title}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function HudButton({ icon, onPress }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.hudButton, pressed && styles.pressed]}>
      <MaterialCommunityIcons color="#FFF1BD" name={icon} size={20} />
    </Pressable>
  );
}

function FallbackWorld({
  error,
  onEnterStory,
  portals,
}: {
  error: string;
  onEnterStory: (storyId: string) => void;
  portals: StoryWorldPortal[];
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.fallbackRoot}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.fallbackContent, { paddingTop: insets.top + 24 }]}
      >
        <MaterialCommunityIcons color="#F7D77A" name="map-outline" size={38} />
        <Text style={styles.fallbackTitle}>Mapa ng mga Kuwento</Text>
        <Text style={styles.fallbackText}>
          Hindi maipakita ang 3D mundo ngayon. Maaari mo pa ring buksan ang mga kuwento.
        </Text>
        {portals.map((portal) => (
          <Pressable
            disabled={portal.state === "locked"}
            key={portal.story.id}
            onPress={() => onEnterStory(portal.story.id)}
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
              <Text style={styles.fallbackStoryTitle}>{portal.story.title}</Text>
              <Text style={styles.fallbackStoryMeta}>
                {portal.state === "completed" ? "Tapos na" : portal.story.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
        <Text style={styles.fallbackError} numberOfLines={2}>{error}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  arrivalPortal: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#B9DFC5",
  },
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
