import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppTheme } from "@/constants/colors";
import { WikalinoBrand } from "@/components/ui/WikalinoBrand";
import type { Story } from "@/data/stories";
import { getReadingPages } from "./reading-pages";

type Props = {
  story: Story;
  onClose: () => void;
  onComplete?: () => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
};

export function StoryBookReader({ story, onClose, onComplete, initialPage = -1, onPageChange }: Props) {
  const pages = getReadingPages(story);
  const [page, setPage] = useState(Math.max(-1, Math.min(initialPage, pages.length - 1)));
  const [furthest, setFurthest] = useState(Math.max(0, initialPage));
  const [atEnd, setAtEnd] = useState(false);
  const viewport = useRef(0);
  const contentHeight = useRef(0);
  const [turning, setTurning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [turn] = useState(() => new Animated.Value(0));
  const cover = page < 0;
  const lastPage = page === pages.length - 1;
  const current = pages[page];

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReducedMotion(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => { mounted = false; subscription.remove(); turn.stopAnimation(); };
  }, [turn]);

  function showPage(next: number) {
    setPage(next);
    setAtEnd(false);
    contentHeight.current = 0;
    setFurthest(value => Math.max(value, next));
    if (next >= 0) onPageChange?.(next);
  }

  function turnTo(next: number) {
    if (turning || next < -1 || next >= pages.length || next === page) return;
    if (onComplete && next > page && !cover && !atEnd) return;
    if (onComplete && next > Math.max(furthest, page + 1)) return;
    if (reducedMotion) { showPage(next); return; }
    setTurning(true);
    const direction = next > page ? 1 : -1;
    // Turn around the spine, swap the text at the edge, then reveal the other
    // face. Previous pages turn in reverse; this uses only a native view transform.
    Animated.timing(turn, { toValue: direction, duration: 210, easing: Easing.in(Easing.quad), useNativeDriver: Platform.OS !== "web" }).start(({ finished }) => {
      if (!finished) return;
      turn.setValue(-direction);
      showPage(next);
      Animated.timing(turn, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== "web" }).start(({ finished: opened }) => {
        if (opened) setTurning(false);
      });
    });
  }

  return <LinearGradient colors={AppTheme.backgroundGradient} style={styles.screen}><SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Isara ang aklat" style={styles.close}>
        <MaterialCommunityIcons name="close" size={24} color={AppTheme.primary} />
      </Pressable>
      <View style={styles.heading}>
        <WikalinoBrand color={AppTheme.primary} />
        <Text style={styles.headerTitle} numberOfLines={2}>{story.title} ni {story.author}</Text>
      </View>
      <MaterialCommunityIcons name="book-open-page-variant" size={24} color={AppTheme.primary} />
    </View>

    <View style={styles.book}>
      <View pointerEvents="none" style={styles.pageStack} />
      <Animated.View pointerEvents={turning ? "none" : "auto"} style={[styles.sheet, {
        opacity: turn.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.4, 1, 0.4] }),
        transform: [{ perspective: 1400 }, { rotateY: turn.interpolate({ inputRange: [-1, 0, 1], outputRange: ["90deg", "0deg", "-90deg"] }) }],
      }]}>
        {cover ? <ScrollView contentContainerStyle={styles.cover} showsVerticalScrollIndicator={false}>
          <Text style={styles.coverEyebrow}>MAIKLING KUWENTO</Text>
          <Image source={story.coverImage} style={styles.coverImage} resizeMode="cover" accessibilityLabel={`Pabalat ng ${story.title}`} />
          <Text style={styles.coverTitle}>{story.title}</Text>
          <Text style={styles.coverSubtitle}>{story.subtitle}</Text>
          <View style={styles.goldRule} />
          <Text style={styles.author}>ni {story.author}</Text>
          <Text style={styles.coverDetails}>{pages.length} bahagi · {story.estimatedMinutes} minutong pagbasa</Text>
        </ScrollView> : <ScrollView key={current.id} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator
          onLayout={event => { viewport.current = event.nativeEvent.layout.height; if (contentHeight.current > 0 && contentHeight.current <= viewport.current + 24) setAtEnd(true); }}
          onContentSizeChange={(_, height) => { contentHeight.current = height; if (viewport.current > 0 && height <= viewport.current + 24) setAtEnd(true); }}
          scrollEventThrottle={100}
          onScroll={({ nativeEvent: event }) => { if (event.contentOffset.y + event.layoutMeasurement.height >= event.contentSize.height - 24) setAtEnd(true); }}>
          <Text style={styles.chapter}>BAHAGI {page + 1}</Text>
          <Text style={styles.chapterTitle} accessibilityRole="header">{story.title}</Text>
          <Text style={styles.pageAuthor}>ni {story.author}</Text>
          <View style={styles.chapterRule} />
          {current.paragraphs.map((paragraph, i) => <Text key={`${current.id}-${i}`} selectable style={styles.paragraph}>{paragraph}</Text>)}
          {lastPage && <View style={styles.ending}>
            <MaterialCommunityIcons name="book" size={24} color={AppTheme.primary} />
            <Text style={styles.endingText}>WAKAS</Text>
          </View>}
          <Text style={styles.folio}>— {page + 1} —</Text>
        </ScrollView>}
        <View pointerEvents="none" style={styles.spine} />
      </Animated.View>
    </View>

    <View style={styles.navigation}>
      <Text style={styles.pageCount} accessibilityLiveRegion="polite">{cover ? "PABALAT" : `PAHINA ${page + 1} SA ${pages.length}`}</Text>
      {!cover && <View style={styles.pageMarkers}>
        {pages.map((item, index) => <Pressable key={item.id} disabled={turning || Boolean(onComplete && index > furthest)} onPress={() => turnTo(index)}
          accessibilityRole="button" accessibilityLabel={`Pahina ${index + 1}`} accessibilityState={{ selected: index === page, disabled: turning || Boolean(onComplete && index > furthest) }}
          style={styles.markerTarget}><View style={[styles.marker, index === page && styles.markerActive]} /></Pressable>)}
      </View>}
      {onComplete && !cover && !atEnd && <Text style={styles.pageCount}>Basahin hanggang sa ibaba upang magpatuloy.</Text>}
      <View style={styles.controls}>
        {!cover && <Pressable onPress={() => turnTo(page - 1)} disabled={turning} accessibilityRole="button" accessibilityLabel={page === 0 ? "Bumalik sa pabalat" : "Naunang pahina"}
          style={({ pressed }) => [styles.previous, (turning || pressed) && styles.dim]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={AppTheme.primary} />
        </Pressable>}
        <Pressable disabled={turning || Boolean(onComplete && !cover && !atEnd)} onPress={() => lastPage ? (onComplete ?? onClose)() : turnTo(page + 1)} accessibilityRole="button"
          accessibilityLabel={cover ? "Buksan ang aklat" : lastPage ? (onComplete ? "Tapusin ang pagbasa" : "Bumalik sa aklatan") : "Susunod na pahina"}
          style={({ pressed }) => [styles.next, (turning || pressed || Boolean(onComplete && !cover && !atEnd)) && styles.dim]}>
          <Text style={styles.nextText}>{cover ? "Buksan ang aklat" : lastPage ? (onComplete ? "Tapusin ang pagbasa" : "Sa aklatan") : "Susunod"}</Text>
          <MaterialCommunityIcons name={lastPage ? "bookshelf" : "chevron-right"} size={24} color={AppTheme.buttonText} />
        </Pressable>
      </View>
    </View>
  </SafeAreaView></LinearGradient>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  close: { width: 44, height: 44, borderRadius: 14, backgroundColor: AppTheme.surfaceSoft, alignItems: "center", justifyContent: "center" },
  heading: { flex: 1 },
  headerTitle: { color: AppTheme.text, fontSize: 14, fontWeight: "800", marginTop: 5 },
  book: { flex: 1, marginHorizontal: 18, paddingLeft: 18, marginTop: 10, marginBottom: 10, maxWidth: 680, width: "auto", alignSelf: "stretch" },
  pageStack: { ...StyleSheet.absoluteFill, top: 5, left: 0, right: -5, bottom: -6, backgroundColor: AppTheme.panelStrong, borderRadius: 8, borderRightWidth: 3, borderBottomWidth: 3, borderColor: AppTheme.border },
  sheet: { flex: 1, backgroundColor: AppTheme.surface, borderRadius: 8, overflow: "hidden", transformOrigin: "left center" },
  spine: { position: "absolute", width: 8, top: 0, bottom: 0, left: 0, backgroundColor: "rgba(87,62,25,0.09)", borderRightWidth: 1, borderRightColor: "rgba(87,62,25,0.08)" },
  cover: { flexGrow: 1, padding: 26, alignItems: "center", justifyContent: "center", backgroundColor: AppTheme.surfaceSoft },
  coverEyebrow: { fontSize: 9, letterSpacing: 2, fontWeight: "900", color: AppTheme.primary, marginBottom: 20 },
  coverImage: { width: "100%", height: 170, borderRadius: 65, borderWidth: 2, borderColor: AppTheme.border, marginBottom: 22 },
  coverTitle: { fontSize: 28, lineHeight: 35, fontWeight: "900", color: AppTheme.text, textAlign: "center" },
  coverSubtitle: { color: AppTheme.muted, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 12 },
  goldRule: { width: 64, height: 2, backgroundColor: AppTheme.border, marginVertical: 18 },
  author: { color: AppTheme.muted, textAlign: "center", fontSize: 11 },
  coverDetails: { color: AppTheme.muted, fontSize: 10, marginTop: 12, textAlign: "center" },
  pageContent: { padding: 26, paddingLeft: 30, flexGrow: 1 },
  chapter: { fontSize: 10, letterSpacing: 2, fontWeight: "900", color: AppTheme.text },
  chapterTitle: { fontSize: 26, lineHeight: 34, color: AppTheme.text, fontWeight: "800", marginTop: 16 },
  pageAuthor: { fontSize: 15, lineHeight: 22, color: AppTheme.muted, marginTop: 5 },
  chapterRule: { width: 46, height: 3, backgroundColor: AppTheme.border, marginTop: 17, marginBottom: 23 },
  paragraph: { color: AppTheme.text, fontSize: 18, lineHeight: 30, marginBottom: 20 },
  folio: { color: AppTheme.muted, fontSize: 12, textAlign: "center", marginTop: "auto", paddingTop: 24 },
  ending: { alignItems: "center", paddingTop: 8, gap: 9 },
  endingText: { color: AppTheme.primary, fontWeight: "900", fontSize: 12, letterSpacing: 3 },
  navigation: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14, gap: 8 },
  pageCount: { color: AppTheme.muted, fontSize: 10, letterSpacing: 1.4, fontWeight: "800", textAlign: "center" },
  pageMarkers: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  markerTarget: { width: 34, height: 30, alignItems: "center", justifyContent: "center" },
  marker: { width: 6, height: 6, borderRadius: 4, backgroundColor: AppTheme.border },
  markerActive: { width: 19, backgroundColor: AppTheme.primary },
  controls: { flexDirection: "row", gap: 12 },
  previous: { width: 54, minHeight: 54, borderRadius: 16, backgroundColor: AppTheme.surfaceSoft, alignItems: "center", justifyContent: "center" },
  next: { flex: 1, minHeight: 54, paddingHorizontal: 12, borderRadius: 16, backgroundColor: AppTheme.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextText: { color: AppTheme.buttonText, fontSize: 15, fontWeight: "900" },
  dim: { opacity: 0.5 },
});
