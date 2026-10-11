import { BookCoverEngraving, PageLandscape } from "./StorybookArtwork";
import { BOOK_PAGE_COUNT, StorybookTurningPage } from "./StorybookTurningPage";
import { PortalPassage, StorybookPortal } from "./StorybookPortal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export type StorybookIntroVisualProps = {
  onComplete: () => void;
  onEntering: () => void;
  onTitleVisible: () => void;
  readyToEnter: boolean;
  reduceMotion?: boolean;
};

export function StorybookIntroVisual({
  onComplete,
  onEntering,
  onTitleVisible,
  readyToEnter,
  reduceMotion = false,
}: StorybookIntroVisualProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const bookWidth = Math.min(screenWidth * 0.88, 410);
  const pageWidth = bookWidth / 2;
  const bookHeight = Math.min(pageWidth * 1.34, screenHeight * 0.34);
  const portalSize = Math.min(116, bookHeight * 0.49);
  const portalBottom = Math.max(12, bookHeight * 0.05);
  const portalOffsetX = pageWidth / 2;
  const portalOffsetY = bookHeight / 2 - portalBottom - portalSize / 2;
  const [sequenceReady, setSequenceReady] = useState(false);
  const hasEntered = useRef(false);
  const timeline = useSharedValue(0);
  const zoom = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const drift = useSharedValue(0);
  const portalReveal = useSharedValue(0);
  const portalSpin = useSharedValue(0);

  useEffect(() => {
    timeline.value = withTiming(1, {
      duration: reduceMotion ? 0 : 3600,
      easing: Easing.linear,
    });
    if (!reduceMotion) {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 850 }),
          withTiming(0, { duration: 850 }),
        ),
        -1,
      );
      drift.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1450,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 1450,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
      );

    }

    const titleTimer = setTimeout(onTitleVisible, reduceMotion ? 0 : 3550);
    const enterTimer = setTimeout(() => setSequenceReady(true), reduceMotion ? 300 : 4500);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(enterTimer);
      cancelAnimation(timeline);
      cancelAnimation(shimmer);
      cancelAnimation(drift);
    };
  }, [drift, onTitleVisible, reduceMotion, shimmer, timeline]);

  useEffect(() => {
    if (!sequenceReady || !readyToEnter) {
      return;
    }

    if (reduceMotion) {
      onEntering();
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
    if (!hasEntered.current) {
      hasEntered.current = true;
      onEntering();
      portalReveal.value = withDelay(
        100,
        withTiming(1, {
          duration: 780,
          easing: Easing.out(Easing.cubic),
        }),
      );
      portalSpin.value = withRepeat(
        withTiming(1, { duration: 4200, easing: Easing.linear }),
        -1,
        false,
      );
      zoom.value = withDelay(
        950,
        withTiming(1, {
          duration: 2350,
          easing: Easing.linear,
        }),
      );
    }
    const completionTimer = setTimeout(onComplete, 3380);
    return () => {
      clearTimeout(completionTimer);
      cancelAnimation(portalReveal);
      cancelAnimation(portalSpin);
      cancelAnimation(zoom);
    };
  }, [
    onComplete,
    onEntering,
    portalReveal,
    portalSpin,
    readyToEnter,
    reduceMotion,
    sequenceReady,
    zoom,
  ]);

  const stageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(zoom.value, [0, 0.24, 0.43, 1], [1, 1, 0, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: -portalOffsetX * interpolate(zoom.value, [0, 0.5], [0, 1], Extrapolation.CLAMP) },
      { translateY: -portalOffsetY * interpolate(zoom.value, [0, 0.5], [0, 1], Extrapolation.CLAMP) },
      { scale: interpolate(zoom.value, [0, 0.24, 0.43, 0.62, 1], [1, 1.25, 1.6, 1.6, 1.6], Extrapolation.CLAMP) },
    ],
  }));

  const coverStyle = useAnimatedStyle(() => {
    const opened = interpolate(
      timeline.value,
      [0.1, 0.38],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const eased = opened * opened * (3 - 2 * opened);
    const projection = Math.cos(eased * Math.PI);
    return {
      transform: [
        { translateX: Math.min(0, projection) * (pageWidth + 4) },
        { scaleX: Math.max(0.025, Math.abs(projection)) },
      ],
    };
  });
  const coverFrontStyle = useAnimatedStyle(() => ({ opacity: timeline.value < 0.24 ? 1 : 0 }));
  const coverBackStyle = useAnimatedStyle(() => ({ opacity: timeline.value >= 0.24 ? 1 : 0 }));

  const leftPageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0.19, 0.38],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleX: interpolate(
          timeline.value,
          [0.19, 0.38],
          [0.88, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.35, 1]),
    transform: [
      { translateY: interpolate(drift.value, [0, 1], [5, -6]) },
      { rotate: `${interpolate(shimmer.value, [0, 1], [-8, 12])}deg` },
      { scale: interpolate(shimmer.value, [0, 1], [0.82, 1.18]) },
    ],
  }));

  const finalLeftPageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0.93, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateX: interpolate(
          timeline.value,
          [0.93, 1],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const bookPoseStyle = useAnimatedStyle(() => {
    const opened = interpolate(timeline.value, [0.1, 0.4], [0, 1], Extrapolation.CLAMP);
    return { transform: [
      { translateX: -pageWidth / 2 * (1 - opened) },
      { rotateZ: `${-4 * (1 - opened)}deg` },
    ] };
  });
  const titlePageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(timeline.value, [0.91, 1], [0, 1], Extrapolation.CLAMP)
      * interpolate(portalReveal.value, [0, 0.4, 1], [1, 1, 0.1]),
  }));

  const portalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(portalReveal.value, [0, 1], [0, 0.96]),
    transform: [
      {
        scale: interpolate(
          portalReveal.value,
          [0, 0.7, 1],
          [0.12, 1.06, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View style={[styles.sparkleLeft, sparkleStyle]}>
        <MaterialCommunityIcons color="#F7D77A" name="star-four-points" size={22} />
      </Animated.View>
      <Animated.View style={[styles.sparkleRight, sparkleStyle]}>
        <MaterialCommunityIcons color="#D1E8AC" name="star-four-points" size={14} />
      </Animated.View>

      <Animated.View
        style={[
          styles.stage,
          {
            height: bookHeight + 42,
            transformOrigin: [
              (bookWidth + 20) / 2 + portalOffsetX,
              (bookHeight + 42) / 2 + portalOffsetY,
              0,
            ],
            width: bookWidth + 20,
          },
          stageStyle,
        ]}
      >
        <View
          style={[
            styles.bookShadow,
            { height: bookHeight * 0.17, width: bookWidth * 0.88 },
          ]}
        />

        <Animated.View style={[styles.book, { height: bookHeight, width: bookWidth }, bookPoseStyle]}>
          <Animated.View
            style={[
              styles.backCover,
              styles.leftBackCover,
              leftPageStyle,
              { height: bookHeight + 10, width: pageWidth + 7 },
            ]}
          />
          <View
            style={[
              styles.backCover,
              styles.rightBackCover,
              { height: bookHeight + 10, width: pageWidth + 7 },
            ]}
          />

          {[0, 1, 2].map(layer => (
            <View key={layer} style={[styles.pageEdge, {
              left: pageWidth + 2 + layer, right: -1 - layer,
              top: 7 + layer * 2, bottom: -2 - layer * 2,
            }]} />
          ))}
          <Animated.View style={[styles.leftPageEdges, leftPageStyle]}>
            {[0, 1, 2].map(layer => <View key={layer} style={[styles.pageEdge, {
              left: -2 - layer, right: 4, top: 7 + layer * 2, bottom: -2 - layer * 2,
            }]} />)}
          </Animated.View>

          <Animated.View
            style={[
              styles.basePage,
              styles.leftBasePage,
              { height: bookHeight - 8, width: pageWidth - 5 },
              leftPageStyle,
            ]}
          >
            <LinearGradient
              colors={["#F0D894", "#FFF2C7"]}
              style={styles.pageGradient}
            >
              <View style={styles.innerBorder} />
              <MaterialCommunityIcons
                color="rgba(132, 72, 32, 0.48)"
                name="weather-night"
                size={34}
              />
              <View style={[styles.storyLine, styles.leftStoryLine]} />
              <View style={[styles.storyLine, styles.leftStoryLineShort]} />
            </LinearGradient>
          </Animated.View>

          <View
            style={[
              styles.basePage,
              styles.rightBasePage,
              { height: bookHeight - 8, width: pageWidth - 5 },
            ]}
          >
            <LinearGradient
              colors={["#DCCDA9", "#FFFBEF", "#F4E8CA"]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.pageGradient}
            >
              <View style={styles.innerBorder} />
              <Animated.View style={[styles.titlePageCopy, titlePageStyle]}>
                <Text style={styles.titlePageEyebrow}>ISANG MAHIWAGANG PAGLALAKBAY</Text>
                <View style={styles.titleRule} />
                <Text adjustsFontSizeToFit numberOfLines={2} style={styles.titlePageTitle}>MAIKLING{"\n"}KWENTO</Text>
                <Text style={styles.titlePageSubtitle}>Bawat pahina, isang bagong mundo.</Text>
                <Text style={styles.titlePageNumber}>2</Text>
              </Animated.View>
            </LinearGradient>
          </View>

          {Array.from({ length: BOOK_PAGE_COUNT }, (_, index) => (
            <StorybookTurningPage height={bookHeight} width={pageWidth} index={index} key={index} timeline={timeline} />
          ))}

          <Animated.View
            style={[
              styles.finalLeftPage,
              {
                height: bookHeight - 8,
                width: pageWidth - 5,
              },
              finalLeftPageStyle,
            ]}
          >
            <LinearGradient
              colors={["#F7F0DA", "#FFFBEE", "#DACBA6"]}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={styles.pageGradient}
            >
              <View style={styles.innerBorder} />
              <View style={styles.landscapeFrame}><PageLandscape /></View>
              <Text style={styles.leftPageHeading}>SIMULA NG PAGLALAKBAY</Text>
              <View style={[styles.storyLine, styles.finalStoryLineLong]} />
              <View style={[styles.storyLine, styles.finalStoryLine]} />
              <View style={[styles.storyLine, styles.finalStoryLineShort]} />
              <View style={styles.leftPageNumberBadge}>
                <Text style={styles.pageNumber}>1</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.portal,
              {
                bottom: portalBottom,
                height: portalSize,
                left: pageWidth + (pageWidth - portalSize) / 2,
                width: portalSize,
              },
              portalStyle,
            ]}
          >
            {sequenceReady && !reduceMotion ? <StorybookPortal spin={portalSpin} travel={zoom} /> : null}
          </Animated.View>

          <Animated.View
            style={[
              styles.frontCover,
              {
                height: bookHeight + 7,
                width: pageWidth + 4,
              },
              coverStyle,
            ]}
          >
            <Animated.View style={[styles.coverFace, coverFrontStyle]}>
              <LinearGradient colors={["#356D55", "#18473C", "#092E2C"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.coverGradient}>
                <View style={StyleSheet.absoluteFill}><BookCoverEngraving /></View>
                <Text style={styles.coverEdition}>ANG AKLAT NG</Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.coverTitle}>WIKALINO</Text>
                <Text style={styles.coverSubtitle}>MGA KUWENTONG PILIPINO</Text>
                <LinearGradient colors={["rgba(255,239,189,0.16)","rgba(255,239,189,0)"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.coverSheen} />
              </LinearGradient>
            </Animated.View>
            <Animated.View style={[styles.coverFace, coverBackStyle]}>
              <LinearGradient colors={["#A4B7A0", "#D7DDC4", "#708C73"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.coverGradient}>
                <View style={styles.coverBorder} />
              </LinearGradient>
            </Animated.View>
          </Animated.View>

          <LinearGradient colors={["rgba(104,71,28,0)","rgba(91,58,23,0.3)","rgba(255,250,224,0.8)","rgba(104,71,28,0)"]} locations={[0,0.44,0.56,1]} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.spine, { height: bookHeight - 8 }]} />
          <Animated.View style={[styles.bookmark, leftPageStyle]} />
        </Animated.View>
      </Animated.View>
      {!reduceMotion && sequenceReady && readyToEnter ? (
        <PortalPassage travel={zoom} width={screenWidth} height={screenHeight} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  coverFace: { ...StyleSheet.absoluteFill, overflow: "hidden", borderTopRightRadius: 10, borderBottomRightRadius: 10 },
  coverEdition: { position:"absolute", top:"17%", fontSize:6, letterSpacing:2, color:"#D6C193", fontWeight:"700" },
  coverSheen: { position:"absolute",top:0,bottom:0,left:0,width:"24%" },
  pageEdge: { position:"absolute",backgroundColor:"#E2D3AF",borderBottomWidth:1,borderRightWidth:0.7,borderColor:"#BCA67C",borderRadius:6 },
  leftPageEdges: { position:"absolute",left:0,width:"50%",top:0,bottom:0 },
  landscapeFrame: { width:"84%",height:"43%",marginTop:-12 },
  bookmark: { position:"absolute",left:"47%",top:"89%",height:32,width:9,backgroundColor:"#476E56",borderColor:"#C7AB67",borderLeftWidth:1,borderRightWidth:1,zIndex:1,transform:[{rotate:"-8deg"}] },
  titlePageCopy: { ...StyleSheet.absoluteFill,alignItems:"center",paddingHorizontal:13,paddingTop:24 },
  titlePageEyebrow: { fontSize:5.5,letterSpacing:1.2,textAlign:"center",color:"#907345",fontWeight:"700" },
  titleRule: { width:32,height:1,backgroundColor:"#C2A76D",marginVertical:12 },
  titlePageTitle: { fontSize:20,lineHeight:24,fontWeight:"800",letterSpacing:1,textAlign:"center",color:"#284C40" },
  titlePageSubtitle: { fontSize:7,lineHeight:11,textAlign:"center",color:"#8B7956",marginTop:10,maxWidth:105 },
  titlePageNumber: { position:"absolute",bottom:10,color:"#A18B60",fontSize:7 },
  backCover: {
    backgroundColor: "#173E35",
    borderColor: "#C5A569",
    borderWidth: 2,
    bottom: -5,
    position: "absolute",
  },
  basePage: {
    overflow: "hidden",
    position: "absolute",
    top: 4,
  },
  book: {
    position: "relative",
  },
  bookShadow: {
    alignSelf: "center",
    backgroundColor: "rgba(2, 3, 17, 0.5)",
    borderRadius: 999,
    bottom: 2,
    position: "absolute",
    transform: [{ scaleX: 1.08 }],
  },
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  coverBorder: {
    borderColor: "rgba(247, 215, 122, 0.62)",
    borderRadius: 9,
    borderWidth: 1,
    bottom: 10,
    left: 10,
    position: "absolute",
    right: 10,
    top: 10,
  },
  coverGradient: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  coverSubtitle: {
    color: "rgba(255, 238, 190, 0.72)",
    fontWeight: "800",
    letterSpacing: 1.2,
    position: "absolute",
    top: "71%",
    fontSize: 5.5,
  },
  coverTitle: {
    color: "#F7D77A",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 2,
    position: "absolute",
    top: "60%",
    width: "82%",
    textAlign: "center",
  },
  frontCover: {
    zIndex: 42,
    borderBottomRightRadius: 12,
    borderColor: "#D6A743",
    borderTopRightRadius: 12,
    borderWidth: 2,
    left: "50%",
    position: "absolute",
    top: -3,
    transformOrigin: "left center",
  },
  finalLeftPage: {
    borderBottomLeftRadius: 10,
    borderColor: "rgba(139, 84, 27, 0.22)",
    borderTopLeftRadius: 10,
    borderWidth: 1,
    left: 1,
    overflow: "hidden",
    position: "absolute",
    top: 4,
    zIndex: 45,
  },
  finalStoryLine: {
    marginTop: 7,
    width: "62%",
  },
  finalStoryLineLong: {
    marginTop: 17,
    width: "72%",
  },
  finalStoryLineShort: {
    marginTop: 7,
    width: "44%",
  },
  innerBorder: {
    borderColor: "rgba(152, 94, 29, 0.24)",
    borderRadius: 8,
    borderWidth: 1,
    bottom: 9,
    left: 9,
    position: "absolute",
    right: 9,
    top: 9,
  },
  leftBackCover: {
    borderBottomLeftRadius: 14,
    borderTopLeftRadius: 14,
    left: -7,
  },
  leftBasePage: {
    alignItems: "center",
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
    left: 1,
    transformOrigin: "right center",
  },
  leftPageHeading: {
    color: "#70441C",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 13,
    textAlign: "center",
  },
  leftPageNumberBadge: {
    alignItems: "center",
    borderColor: "rgba(136, 82, 28, 0.3)",
    borderRadius: 10,
    borderWidth: 1,
    bottom: 12,
    height: 20,
    justifyContent: "center",
    left: 12,
    position: "absolute",
    width: 20,
  },
  leftStoryLine: {
    marginTop: 16,
    width: "50%",
  },
  leftStoryLineShort: {
    marginTop: 7,
    width: "36%",
  },
  pageGradient: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  pageNumber: {
    color: "rgba(115, 69, 25, 0.72)",
    fontSize: 7,
    fontWeight: "900",
  },
  portal: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    position: "absolute",
    zIndex: 44,
  },
  rightBackCover: {
    borderBottomRightRadius: 14,
    borderTopRightRadius: 14,
    right: -7,
  },
  rightBasePage: {
    borderBottomRightRadius: 10,
    borderTopRightRadius: 10,
    right: 1,
  },
  sparkleLeft: {
    left: "10%",
    position: "absolute",
    top: "26%",
  },
  sparkleRight: {
    position: "absolute",
    right: "11%",
    top: "31%",
  },
  spine: {
    borderRadius: 3,
    left: "50%",
    marginLeft: -10,
    position: "absolute",
    top: 4,
    width: 20,
    zIndex: 50,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  storyLine: {
    backgroundColor: "rgba(121, 73, 25, 0.2)",
    borderRadius: 99,
    height: 2,
    marginTop: 9,
    width: "68%",
  },
});
