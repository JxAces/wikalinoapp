import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useIsFocused, useLocalSearchParams } from "expo-router";
import { StoryBookReader } from "@/components/story-library/StoryBookReader";
import { storySetting } from "@/components/story-world/quest-progression";
import { getStoryById } from "@/data/stories";
import { useUserStore } from "@/store/useUserStore";

export default function StoryScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const focused = useIsFocused();
  return focused ? <JourneyBook key={storyId} storyId={storyId} /> : null;
}

function JourneyBook({ storyId }: { storyId: string }) {
  const story = getStoryById(storyId);
  const sceneIndexes = useUserStore(state => state.storySceneIndexes);
  const savePage = useUserStore(state => state.setStoryScene);
  const finishReading = useUserStore(state => state.completeStoryReading);
  const [entering, setEntering] = useState(false);
  const [transition] = useState(() => new Animated.Value(0));
  const navigating = useRef(false);

  useEffect(() => {
    return () => { transition.stopAnimation(); };
  }, [transition]);

  if (!story) return <Redirect href="/landing" />;
  function enterWorld() {
    if (!story || navigating.current) return;
    navigating.current = true;
    finishReading(story.id);
    setEntering(true);
    Animated.timing(transition, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: Platform.OS !== "web" }).start(({ finished }) => {
      if (finished) router.replace({ pathname: "/quest-world", params: { storyId: story.id } });
    });
  }

  return <View style={styles.screen}>
    {<StoryBookReader key={story.id} story={story}
      initialPage={sceneIndexes[story.id] ?? -1}
      onPageChange={page => savePage(story.id, page)}
      onClose={() => router.replace("/landing")} onComplete={enterWorld} />}
    {entering && <View style={styles.portal} accessibilityLiveRegion="polite">
      <Animated.View style={[styles.ring, { opacity: transition.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }), transform: [{ scale: transition.interpolate({ inputRange: [0, 1], outputRange: [0.2, 7] }) }, { rotate: transition.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "150deg"] }) }] }]}>
        <View style={styles.innerRing} />
      </Animated.View>
      <Text style={styles.label}>MULA SA PAHINA, TUNGO SA PAGLALAKBAY</Text>
      <Text style={styles.title}>{storySetting(story.id)?.name}</Text>
      <Text style={styles.copy}>Sundan ang landas. Buksan at sagutin ang mga balumbon.</Text>
      <Pressable accessibilityRole="button" onPress={() => { transition.stopAnimation(); router.replace({ pathname: "/quest-world", params: { storyId: story.id } }); }}><Text style={styles.skip}>Laktawan ang paglipat</Text></Pressable>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#203F36" },
  portal: { ...StyleSheet.absoluteFill, backgroundColor: "#183c38", alignItems: "center", justifyContent: "center", padding: 30, overflow: "hidden" },
  ring: { position: "absolute", width: 220, height: 260, borderRadius: 120, borderWidth: 9, borderColor: "#ecd38c", backgroundColor: "#31776e", alignItems: "center", justifyContent: "center" },
  innerRing: { width: 180, height: 220, borderRadius: 110, borderWidth: 3, borderColor: "#9ae7d6" },
  label: { color: "#c4eadc", fontSize: 10, fontWeight: "800", textAlign: "center", letterSpacing: 1.5 },
  title: { color: "#fff1bd", fontSize: 30, fontWeight: "900", textAlign: "center", marginVertical: 18 },
  copy: { color: "#fff6db", fontSize: 15, lineHeight: 23, textAlign: "center" },
  skip: { color: "#fff1bd", padding: 20, textDecorationLine: "underline" },
});
