import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useIsFocused } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import styles from "@/components/screens/loading.styles";
import { StorybookIntroVisual } from "@/components/three/integrations/StorybookIntroVisual";
import { useThreePerformance } from "@/hooks/useThreePerformance";
import { useUserStore } from "@/store/useUserStore";
import { hubStartRoute } from "@/components/story-world/hub-navigation";

type IntroPhase = "opening" | "title" | "entering";

const PHASE_PROGRESS: Record<IntroPhase, `${number}%`> = {
  opening: "34%",
  title: "72%",
  entering: "100%",
};

export default function LoadingScreen() {
  const isFocused = useIsFocused();
  const profile = useUserStore((state) => state.profile);
  const [isHydrated, setIsHydrated] = useState(
    useUserStore.persist.hasHydrated(),
  );
  const [phase, setPhase] = useState<IntroPhase>("opening");
  const hasNavigated = useRef(false);
  const { reduceMotion } = useThreePerformance();
  useEffect(() => {
    const markHydrated = () => {
      setIsHydrated(true);
    };
    const unsubscribe = useUserStore.persist.onFinishHydration(markHydrated);
    const hydrationCheck = setTimeout(() => {
      if (useUserStore.persist.hasHydrated()) {
        markHydrated();
      }
    }, 0);

    return () => {
      clearTimeout(hydrationCheck);
      unsubscribe();
    };
  }, []);

  const finishIntro = useCallback(() => {
    if (!isFocused || !isHydrated || hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;
    if (__DEV__) console.info("[Wikalino intro] opening destination");
    router.replace(profile ? hubStartRoute() : "/onboarding");
  }, [isFocused, isHydrated, profile]);

  const showTitle = useCallback(() => {
    if (__DEV__) console.info("[Wikalino intro] book opened");
    setPhase("title");
  }, []);
  const startEntering = useCallback(() => {
    if (__DEV__) console.info("[Wikalino intro] portal started");
    setPhase("entering");
  }, []);
  useEffect(() => {
    if (isFocused && __DEV__) console.info("[Wikalino intro] loading screen mounted");
  }, [isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    const titleTimer = setTimeout(() => {
      setPhase((current) => (current === "opening" ? "title" : current));
    }, reduceMotion ? 100 : 3550);

    return () => clearTimeout(titleTimer);
  }, [isFocused, reduceMotion]);

  useEffect(() => {
    if (!isFocused || !isHydrated) {
      return;
    }

    const watchdog = setTimeout(
      finishIntro,
      reduceMotion ? 1400 : 8500,
    );

    return () => clearTimeout(watchdog);
  }, [finishIntro, isFocused, isHydrated, reduceMotion]);

  const visiblePhase = reduceMotion ? "title" : phase;
  const loadingMessage = !isHydrated
    ? "Inihahanda ang iyong aklat..."
    : visiblePhase === "entering"
      ? "Papasok na sa mundo ng kuwento..."
      : visiblePhase === "title"
        ? "Handa na ang mahiwagang pahina..."
        : "Binubuksan ang mahiwagang aklat...";

  return (
    <LinearGradient
      colors={["#A9D8C4", "#8EC58A", "#559647", "#18283B"]}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.root}
    >
      <View pointerEvents="none" style={styles.moonGlow} />
      <View pointerEvents="none" style={styles.bottomGlow} />
      <View pointerEvents="none" style={styles.arch}>
        <View style={styles.archInset} />
      </View>

      <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <MaterialCommunityIcons
              color="#F7D77A"
              name="book-open-page-variant"
              size={19}
            />
          </View>
          <Text style={styles.brand}>WIKALINGGO</Text>
        </View>

        <View style={[styles.scene, phase === "entering" && { zIndex: 10 }]}>
          {isFocused ? <StorybookIntroVisual
            onComplete={finishIntro}
            onEntering={startEntering}
            onTitleVisible={showTitle}
            readyToEnter={isHydrated}
            reduceMotion={reduceMotion}
          /> : null}
        </View>

        {phase !== "entering" ? <Animated.View
          entering={FadeIn.delay(250).duration(450)}
          style={styles.loadingCard}
        >
          <View style={styles.loadingHeading}>
            <MaterialCommunityIcons
              color="#F7D77A"
              name={
                visiblePhase === "entering"
                  ? "creation"
                  : "book-open-variant"
              }
              size={18}
            />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: PHASE_PROGRESS[visiblePhase] },
              ]}
            />
          </View>
        </Animated.View> : null}
      </SafeAreaView>
    </LinearGradient>
  );
}
