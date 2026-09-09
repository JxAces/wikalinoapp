import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import styles from "@/components/screens/landing.styles";

import Svg, { Circle, Path } from "react-native-svg";

import { Colors } from "../../constants/colors";
import { getStoryUnitByNumber, storyUnits } from "../../data/stories";
import { useUserStore } from "../../store/useUserStore";
import { getLevelInfo } from "../../utils/progression";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type StoryState = "current" | "completed" | "locked" | "available";

type MapPoint = {
  x: number;
  y: number;
};

/*
 * =========================================================
 * LANDING / GAME HOME
 * =========================================================
 */

export default function LandingScreen() {
  const { width: screenWidth } = useWindowDimensions();

  const params = useLocalSearchParams<{
    markahan?: string;
  }>();

  /*
   * =======================================================
   * STORE
   * =======================================================
   */

  const profile = useUserStore((state) => state.profile);

  const xp = useUserStore((state) => state.xp);

  const completedStoryIds = useUserStore((state) => state.completedStoryIds);

  const getStoryStars = useUserStore((state) => state.getStoryStars);

  /*
   * =======================================================
   * STORY PORTAL TRANSITION
   * =======================================================
   */

  const [isStoryTransitioning, setIsStoryTransitioning] = useState(false);

  const [transitionStoryTitle, setTransitionStoryTitle] = useState("");

  const [transitionStorySubtitle, setTransitionStorySubtitle] = useState("");

  const [transitionStoryNumber, setTransitionStoryNumber] = useState(1);

  const [transitionStoryImage, setTransitionStoryImage] =
    useState<ImageSourcePropType | null>(null);

  /*
   * Keep destination outside state so we can
   * navigate reliably after the animation.
   */

  const transitionStoryId = useRef<string | null>(null);

  /*
   * Transition animation values.
   */

  const transitionBackdrop = useRef(new Animated.Value(0)).current;

  const transitionPortalScale = useRef(new Animated.Value(0.55)).current;

  const transitionPortalOpacity = useRef(new Animated.Value(0)).current;

  const transitionRingScale = useRef(new Animated.Value(0.7)).current;

  const transitionRingOpacity = useRef(new Animated.Value(0)).current;

  const transitionRingRotation = useRef(new Animated.Value(0)).current;

  const transitionTextOpacity = useRef(new Animated.Value(0)).current;

  const transitionTextY = useRef(new Animated.Value(20)).current;

  const transitionFlash = useRef(new Animated.Value(0)).current;

  /*
   * =======================================================
   * MARKAHAN
   * =======================================================
   */

  const requestedMarkahan = Number(params.markahan);

  const currentMarkahan =
    Number.isFinite(requestedMarkahan) && requestedMarkahan > 0
      ? requestedMarkahan
      : 1;

  const unit = getStoryUnitByNumber(currentMarkahan) ?? storyUnits[0];

  const stories = unit?.stories ?? [];

  /*
   * =======================================================
   * PLAYER
   * =======================================================
   */

  const firstName = useMemo(() => {
    const name = profile?.fullName?.trim();

    if (!name) {
      return "Mambabasa";
    }

    return name.split(" ")[0];
  }, [profile]);

  const level = getLevelInfo(xp);

  /*
   * =======================================================
   * WORLD PROGRESS
   * =======================================================
   */

  const completedCount = stories.filter((story) =>
    completedStoryIds.includes(story.id),
  ).length;

  const progress =
    stories.length > 0
      ? Math.round((completedCount / stories.length) * 100)
      : 0;

  const currentStoryIndex = stories.findIndex(
    (story) => !completedStoryIds.includes(story.id),
  );

  /*
   * =======================================================
   * MAP SIZE
   * =======================================================
   */

  const mapMargin = 12;

  const mapWidth = screenWidth - mapMargin * 2;

  const nodeWidth = Math.min(144, mapWidth * 0.4);

  const nodeHeight = 174;

  const sidePadding = 18;

  const leftX = sidePadding;

  const rightX = mapWidth - sidePadding - nodeWidth;

  const firstNodeY = 165;

  const nodeGap = 215;

  /*
   * =======================================================
   * NODE POSITIONS
   * =======================================================
   */

  const nodePositions = stories.map((_, index) => {
    const right = index % 2 === 0;

    return {
      left: right ? rightX : leftX,

      top: firstNodeY + index * nodeGap,
    };
  });

  /*
   * =======================================================
   * ROAD POINTS
   * =======================================================
   */

  const storyPoints: MapPoint[] = nodePositions.map((position) => ({
    x: position.left + nodeWidth / 2,

    y: position.top + nodeHeight / 2,
  }));

  const roadStart: MapPoint = {
    x: mapWidth / 2,
    y: 105,
  };

  const roadFinish: MapPoint = {
    x: mapWidth / 2,

    y:
      stories.length > 0
        ? firstNodeY + (stories.length - 1) * nodeGap + nodeHeight + 105
        : 500,
  };

  const fullRoadPoints = [roadStart, ...storyPoints, roadFinish];

  const mapHeight = roadFinish.y + 100;

  /*
   * =======================================================
   * TRAVELLED ROAD
   * =======================================================
   */

  const travelledCount =
    currentStoryIndex === -1
      ? storyPoints.length
      : Math.min(storyPoints.length, currentStoryIndex + 1);

  const travelledRoadPoints = [
    roadStart,
    ...storyPoints.slice(0, travelledCount),
  ];

  /*
   * =======================================================
   * NORMAL NAVIGATION
   * =======================================================
   */

  async function openMarkahan() {
    await Haptics.selectionAsync();

    router.push("/markahan");
  }

  async function openAbout() {
    await Haptics.selectionAsync();

    router.push("/about");
  }

  /*
   * =======================================================
   * ENTER STORY THROUGH PORTAL
   * =======================================================
   */

  async function enterStory({
    storyId,
    title,
    subtitle,
    coverImage,
    number,
  }: {
    storyId: string;
    title: string;
    subtitle: string;
    coverImage: ImageSourcePropType;
    number: number;
  }) {
    /*
     * Prevent duplicate taps while portal
     * is already active.
     */

    if (isStoryTransitioning) {
      return;
    }

    /*
     * Store destination.
     */

    transitionStoryId.current = storyId;

    setTransitionStoryTitle(title);

    setTransitionStorySubtitle(subtitle);

    setTransitionStoryNumber(number);

    setTransitionStoryImage(coverImage);

    /*
     * Reset animation.
     */

    transitionBackdrop.setValue(0);

    transitionPortalScale.setValue(0.55);

    transitionPortalOpacity.setValue(0);

    transitionRingScale.setValue(0.7);

    transitionRingOpacity.setValue(0);

    transitionRingRotation.setValue(0);

    transitionTextOpacity.setValue(0);

    transitionTextY.setValue(20);

    transitionFlash.setValue(0);

    /*
     * Stronger game feedback than a
     * normal UI tap.
     */

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsStoryTransitioning(true);

    /*
     * Allow Modal to render first.
     */

    requestAnimationFrame(() => {
      /*
       * ===============================================
       * STAGE 1
       *
       * Darken world + summon portal.
       * ===============================================
       */

      Animated.parallel([
        Animated.timing(transitionBackdrop, {
          toValue: 1,

          duration: 300,

          easing: Easing.out(Easing.ease),

          useNativeDriver: true,
        }),

        Animated.timing(transitionPortalOpacity, {
          toValue: 1,

          duration: 220,

          useNativeDriver: true,
        }),

        Animated.spring(transitionPortalScale, {
          toValue: 1,

          friction: 6,

          tension: 60,

          useNativeDriver: true,
        }),

        Animated.spring(transitionRingScale, {
          toValue: 1,

          friction: 5,

          tension: 58,

          useNativeDriver: true,
        }),

        Animated.timing(transitionRingOpacity, {
          toValue: 1,

          duration: 280,

          useNativeDriver: true,
        }),

        Animated.timing(transitionRingRotation, {
          toValue: 1,

          duration: 950,

          easing: Easing.out(Easing.cubic),

          useNativeDriver: true,
        }),
      ]).start(() => {
        /*
         * =============================================
         * STAGE 2
         *
         * Show mission title.
         * =============================================
         */

        Animated.parallel([
          Animated.timing(transitionTextOpacity, {
            toValue: 1,

            duration: 260,

            useNativeDriver: true,
          }),

          Animated.spring(transitionTextY, {
            toValue: 0,

            friction: 7,

            tension: 55,

            useNativeDriver: true,
          }),
        ]).start(() => {
          /*
           * ===========================================
           * STAGE 3
           *
           * Brief moment for player to see
           * which story they're entering.
           * ===========================================
           */

          Animated.sequence([
            Animated.delay(300),

            /*
             * Fade text away while portal
             * starts consuming the screen.
             */

            Animated.parallel([
              Animated.timing(transitionTextOpacity, {
                toValue: 0,

                duration: 250,

                useNativeDriver: true,
              }),

              Animated.timing(transitionRingScale, {
                toValue: 5,

                duration: 720,

                easing: Easing.in(Easing.cubic),

                useNativeDriver: true,
              }),

              Animated.timing(transitionPortalScale, {
                /*
                 * Large enough to cover
                 * phones and tablets.
                 */

                toValue: 14,

                duration: 760,

                easing: Easing.in(Easing.cubic),

                useNativeDriver: true,
              }),

              Animated.sequence([
                Animated.delay(470),

                Animated.timing(transitionFlash, {
                  toValue: 1,

                  duration: 250,

                  easing: Easing.out(Easing.ease),

                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]).start(() => {
            const destination = transitionStoryId.current;

            if (!destination) {
              setIsStoryTransitioning(false);

              return;
            }

            /*
             * Story screen is switched underneath
             * the full-screen flash.
             */

            router.push({
              pathname: "/story",

              params: {
                storyId: destination,
              },
            });

            /*
             * Keep the Modal very briefly while
             * /story mounts underneath.
             */

            setTimeout(() => {
              setIsStoryTransitioning(false);

              transitionStoryId.current = null;
            }, 120);
          });
        });
      });
    });
  }

  /*
   * =======================================================
   * PORTAL INTERPOLATIONS
   * =======================================================
   */

  const transitionBackdropOpacity = transitionBackdrop.interpolate({
    inputRange: [0, 1],

    outputRange: [0, 0.88],
  });

  const ringRotation = transitionRingRotation.interpolate({
    inputRange: [0, 1],

    outputRange: ["0deg", "180deg"],
  });

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ===================================
              PLAYER HUD
          =================================== */}

          <LinearGradient
            colors={["#35327C", Colors.primary, "#4B489A"]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={styles.hero}
          >
            <View style={styles.heroOrbOne} />

            <View style={styles.heroOrbTwo} />

            <View style={styles.sparkleOne}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={13}
                color="rgba(244,201,93,0.75)"
              />
            </View>

            <View style={styles.sparkleTwo}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={8}
                color="rgba(255,255,255,0.4)"
              />
            </View>

            {/* PLAYER */}

            <View style={styles.playerRow}>
              <View style={styles.playerIdentity}>
                <View style={styles.playerAvatar}>
                  <MaterialCommunityIcons
                    name="account"
                    size={29}
                    color={Colors.primary}
                  />
                </View>

                <View style={styles.playerInfo}>
                  <Text style={styles.helloLabel}>MAGANDANG ARAW,</Text>

                  <Text style={styles.playerName}>{firstName}</Text>

                  <View style={styles.playerGroupRow}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={12}
                      color={Colors.accent}
                    />

                    <Text style={styles.playerGroup}>
                      {profile?.pangkat ?? "Pangkat"}
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={openAbout}
                style={({ pressed }) => [
                  styles.infoButton,

                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={23}
                  color={Colors.surface}
                />
              </Pressable>
            </View>

            {/* LEVEL HUD */}

            <View style={styles.levelHud}>
              <View style={styles.levelBadge}>
                <MaterialCommunityIcons
                  name="shield-star"
                  size={18}
                  color={Colors.accent}
                />

                <Text style={styles.levelNumber}>{level.level}</Text>
              </View>

              <View style={styles.levelInfo}>
                <View style={styles.levelTitleRow}>
                  <Text numberOfLines={1} style={styles.levelTitle}>
                    {level.title}
                  </Text>

                  <Text style={styles.levelXp}>{xp} XP</Text>
                </View>

                <View style={styles.levelTrack}>
                  <View
                    style={[
                      styles.levelFill,

                      {
                        width: `${level.progress}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* MINI GAME STATS */}

            <View style={styles.hudStats}>
              <HudStat icon="star-four-points" value={String(xp)} label="XP" />

              <View style={styles.hudDivider} />

              <HudStat
                icon="book-check-outline"
                value={String(completedStoryIds.length)}
                label="KWENTO"
              />

              <View style={styles.hudDivider} />

              <HudStat
                icon="shield-star-outline"
                value={String(level.level)}
                label="ANTAS"
              />
            </View>
          </LinearGradient>

          {/* ===================================
              WORLD / MARKAHAN
          =================================== */}

          <View style={styles.worldSection}>
            <LinearGradient
              colors={["#FFFFFF", "#FFFBF4"]}
              style={styles.worldCard}
            >
              <View style={styles.worldTopRow}>
                <View>
                  <View style={styles.worldBadge}>
                    <MaterialCommunityIcons
                      name="map-outline"
                      size={13}
                      color={Colors.secondary}
                    />

                    <Text style={styles.worldBadgeText}>
                      MUNDO {currentMarkahan}
                    </Text>
                  </View>

                  <Text style={styles.worldTitle}>{unit.title}</Text>
                </View>

                <Pressable
                  onPress={openMarkahan}
                  style={({ pressed }) => [
                    styles.worldSelector,

                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="map-search-outline"
                    size={23}
                    color={Colors.primary}
                  />
                </Pressable>
              </View>

              <Text style={styles.worldSubtitle}>{unit.subtitle}</Text>

              <View style={styles.worldProgressTop}>
                <View style={styles.worldProgressLeft}>
                  <MaterialCommunityIcons
                    name="flag-checkered"
                    size={14}
                    color={Colors.secondary}
                  />

                  <Text style={styles.worldProgressText}>
                    {completedCount} sa {stories.length} kwento
                  </Text>
                </View>

                <Text style={styles.worldPercentage}>{progress}%</Text>
              </View>

              <View style={styles.worldTrack}>
                <View
                  style={[
                    styles.worldFill,

                    {
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>
            </LinearGradient>
          </View>

          {/* ===================================
              QUEST MAP HEADING
          =================================== */}

          <View style={styles.questHeading}>
            <View style={styles.questIcon}>
              <MaterialCommunityIcons
                name="compass-outline"
                size={26}
                color={Colors.secondary}
              />
            </View>

            <View style={styles.questHeadingText}>
              <Text style={styles.questEyebrow}>QUEST MAP</Text>

              <Text style={styles.questTitle}>Landas ng Kwento</Text>

              <Text style={styles.questSubtitle}>
                Sundan ang landas at i-unlock ang bawat pakikipagsapalaran.
              </Text>
            </View>
          </View>

          {/* ===================================
              ADVENTURE MAP
          =================================== */}

          {stories.length > 0 ? (
            <LinearGradient
              colors={["#FAF2DD", "#F4EACD", "#F8F1DE"]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={[
                styles.map,

                {
                  width: mapWidth,

                  height: mapHeight,
                },
              ]}
            >
              {/* DECORATIONS */}

              <MapDecorations mapHeight={mapHeight} />

              {/* COMPASS */}

              <View pointerEvents="none" style={styles.compassWatermark}>
                <MaterialCommunityIcons
                  name="compass-outline"
                  size={120}
                  color="rgba(159,137,83,0.055)"
                />
              </View>

              {/* ROAD */}

              <AdventureRoad
                width={mapWidth}
                height={mapHeight}
                points={fullRoadPoints}
                travelledPoints={travelledRoadPoints}
              />

              {/* START */}

              <View style={styles.startPoint}>
                <View style={styles.startFlag}>
                  <MaterialCommunityIcons
                    name="flag-checkered"
                    size={19}
                    color={Colors.surface}
                  />
                </View>

                <View style={styles.startLabel}>
                  <Text style={styles.startLabelText}>SIMULA</Text>
                </View>
              </View>

              {/* STORY NODES */}

              {stories.map((story, index) => {
                const completed = completedStoryIds.includes(story.id);

                const locked =
                  index > 0 &&
                  !completedStoryIds.includes(stories[index - 1].id);

                let state: StoryState = "available";

                if (completed) {
                  state = "completed";
                } else if (locked) {
                  state = "locked";
                } else if (index === currentStoryIndex) {
                  state = "current";
                }

                const position = nodePositions[index];

                return (
                  <StoryNode
                    key={story.id}
                    number={index + 1}
                    title={story.title}
                    subtitle={story.subtitle}
                    coverImage={story.coverImage}
                    state={state}
                    stars={getStoryStars(story.id)}
                    left={position.left}
                    top={position.top}
                    width={nodeWidth}
                    height={nodeHeight}
                    onPress={async () => {
                      /*
                       * Locked stories don't
                       * enter the portal.
                       */

                      if (locked) {
                        await Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Warning,
                        );

                        return;
                      }

                      /*
                       * ALL unlocked stories,
                       * including completed ones,
                       * now use portal transition.
                       */

                      await enterStory({
                        storyId: story.id,

                        title: story.title,

                        subtitle: story.subtitle,

                        coverImage: story.coverImage,

                        number: index + 1,
                      });
                    }}
                  />
                );
              })}

              {/* FINISH */}

              <View
                style={[
                  styles.finishPoint,

                  {
                    top: roadFinish.y - 30,
                  },
                ]}
              >
                <View style={styles.finishCircle}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={24}
                    color={Colors.accent}
                  />
                </View>

                <View style={styles.finishLabel}>
                  <Text style={styles.finishLabelText}>TAPUSIN ANG MUNDO</Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="map-clock-outline"
                size={44}
                color={Colors.primary}
              />

              <Text style={styles.emptyTitle}>Paparating</Text>

              <Text style={styles.emptyText}>
                Inihahanda pa ang susunod na mundo.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* =========================================
            FULL SCREEN STORY PORTAL

            Modal is intentional:
            it covers the bottom tab navigation too.
        ========================================= */}

        <Modal
          visible={isStoryTransitioning}
          transparent
          animationType="none"
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={() => {
            /*
             * Don't allow Android back button
             * to interrupt during portal transition.
             */
          }}
        >
          <View style={styles.transitionRoot}>
            {/* DARKEN LANDING */}

            <Animated.View
              style={[
                styles.transitionBackdrop,

                {
                  opacity: transitionBackdropOpacity,
                },
              ]}
            />

            {/* DECORATIVE PARTICLES */}

            <View pointerEvents="none" style={styles.transitionParticleOne}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={15}
                color={Colors.accent}
              />
            </View>

            <View pointerEvents="none" style={styles.transitionParticleTwo}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={10}
                color={Colors.surface}
              />
            </View>

            <View pointerEvents="none" style={styles.transitionParticleThree}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={12}
                color={Colors.teal}
              />
            </View>

            {/* =================================
                PORTAL
            ================================= */}

            <View style={styles.transitionPortalArea}>
              {/* EXTERNAL ROTATING RING */}

              <Animated.View
                style={[
                  styles.transitionOuterRing,

                  {
                    opacity: transitionRingOpacity,

                    transform: [
                      {
                        scale: transitionRingScale,
                      },

                      {
                        rotate: ringRotation,
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.transitionRingDotTop} />

                <View style={styles.transitionRingDotRight} />

                <View style={styles.transitionRingDotBottom} />

                <View style={styles.transitionRingDotLeft} />
              </Animated.View>

              {/* IMAGE PORTAL */}

              <Animated.View
                style={[
                  styles.transitionPortal,

                  {
                    opacity: transitionPortalOpacity,

                    transform: [
                      {
                        scale: transitionPortalScale,
                      },
                    ],
                  },
                ]}
              >
                {transitionStoryImage && (
                  <Image
                    source={transitionStoryImage}
                    resizeMode="cover"
                    style={styles.transitionPortalImage}
                  />
                )}

                <LinearGradient
                  colors={[
                    "rgba(63,61,143,0.10)",
                    "rgba(42,157,143,0.16)",
                    "rgba(22,20,50,0.68)",
                  ]}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.transitionPortalCenter}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant"
                    size={43}
                    color={Colors.surface}
                  />
                </View>
              </Animated.View>

              {/* PORTAL GLOW */}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.transitionPortalGlow,

                  {
                    opacity: transitionRingOpacity,

                    transform: [
                      {
                        scale: transitionRingScale,
                      },
                    ],
                  },
                ]}
              />
            </View>

            {/* =================================
                STORY TRANSITION TEXT
            ================================= */}

            <Animated.View
              style={[
                styles.transitionStoryInfo,

                {
                  opacity: transitionTextOpacity,

                  transform: [
                    {
                      translateY: transitionTextY,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.transitionMissionBadge}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={12}
                  color={Colors.accent}
                />

                <Text style={styles.transitionMissionBadgeText}>
                  PAPASOK SA KWENTO {transitionStoryNumber}
                </Text>
              </View>

              <Text style={styles.transitionStoryTitle}>
                {transitionStoryTitle}
              </Text>

              <Text style={styles.transitionStorySubtitle}>
                {transitionStorySubtitle}
              </Text>

              <View style={styles.transitionLoadingRow}>
                <View style={styles.transitionLoadingDot} />

                <View style={styles.transitionLoadingDot} />

                <View style={styles.transitionLoadingDot} />
              </View>

              <Text style={styles.transitionEnteringText}>
                Binubuksan ang kwento...
              </Text>
            </Animated.View>

            {/* =================================
                FINAL FLASH

                Story screen loads behind this.
            ================================= */}

            <Animated.View
              pointerEvents="none"
              style={[
                styles.transitionFlash,

                {
                  opacity: transitionFlash,
                },
              ]}
            >
              <LinearGradient
                colors={[
                  Colors.accentSoft,
                  Colors.background,
                  Colors.primarySoft,
                ]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/*
 * =========================================================
 * HUD STAT
 * =========================================================
 */

function HudStat({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.hudStat}>
      <MaterialCommunityIcons name={icon} size={15} color={Colors.accent} />

      <View>
        <Text style={styles.hudStatValue}>{value}</Text>

        <Text style={styles.hudStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

/*
 * =========================================================
 * SMOOTH ADVENTURE ROAD
 * =========================================================
 */

function AdventureRoad({
  width,
  height,
  points,
  travelledPoints,
}: {
  width: number;
  height: number;
  points: MapPoint[];
  travelledPoints: MapPoint[];
}) {
  const roadPath = buildSmoothPath(points);

  const travelledPath = buildSmoothPath(travelledPoints);

  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
    >
      {/* ROAD SHADOW */}

      <Path
        d={roadPath}
        fill="none"
        stroke="rgba(117,98,57,0.18)"
        strokeWidth={38}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ROAD OUTLINE */}

      <Path
        d={roadPath}
        fill="none"
        stroke="#AA9561"
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* MAIN ROAD */}

      <Path
        d={roadPath}
        fill="none"
        stroke="#D3C08C"
        strokeWidth={25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ROAD HIGHLIGHT */}

      <Path
        d={roadPath}
        fill="none"
        stroke="rgba(245,226,180,0.75)"
        strokeWidth={17}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* CENTER LINE */}

      <Path
        d={roadPath}
        fill="none"
        stroke="#FFF6DA"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeDasharray="9 13"
      />

      {/* TRAVELLED ROAD */}

      {travelledPoints.length > 1 && (
        <>
          <Path
            d={travelledPath}
            fill="none"
            stroke="rgba(42,157,143,0.20)"
            strokeWidth={15}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <Path
            d={travelledPath}
            fill="none"
            stroke={Colors.teal}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8 10"
          />
        </>
      )}

      {/* CHECKPOINTS */}

      {points.slice(1, points.length - 1).map((point, index) => (
        <Circle
          key={`checkpoint-${index}`}
          cx={point.x}
          cy={point.y}
          r={7}
          fill="#F9E8B7"
          stroke="#A99564"
          strokeWidth={3}
        />
      ))}
    </Svg>
  );
}

/*
 * =========================================================
 * SMOOTH ROAD CURVE
 * =========================================================
 */

function buildSmoothPath(points: MapPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];

    const current = points[index];

    const middleY = (previous.y + current.y) / 2;

    path +=
      ` C ` +
      `${previous.x} ${middleY}, ` +
      `${current.x} ${middleY}, ` +
      `${current.x} ${current.y}`;
  }

  return path;
}

/*
 * =========================================================
 * STORY NODE
 * =========================================================
 */

function StoryNode({
  number,
  title,
  subtitle,
  coverImage,
  state,
  stars,
  left,
  top,
  width,
  height,
  onPress,
}: {
  number: number;
  title: string;
  subtitle: string;
  coverImage: ImageSourcePropType;
  state: StoryState;
  stars: number;
  left: number;
  top: number;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const current = state === "current";

  const completed = state === "completed";

  const locked = state === "locked";

  const float = useRef(new Animated.Value(0)).current;

  const pulse = useRef(new Animated.Value(0)).current;

  /*
   * =======================================================
   * CURRENT MISSION ANIMATION
   * =======================================================
   */

  useEffect(() => {
    if (!current) {
      float.setValue(0);

      pulse.setValue(0);

      return;
    }

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -6,

          duration: 950,

          useNativeDriver: true,
        }),

        Animated.timing(float, {
          toValue: 0,

          duration: 950,

          useNativeDriver: true,
        }),
      ]),
    );

    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,

          duration: 900,

          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 0,

          duration: 900,

          useNativeDriver: true,
        }),
      ]),
    );

    floating.start();

    pulsing.start();

    return () => {
      floating.stop();

      pulsing.stop();
    };
  }, [current, float, pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],

    outputRange: [1, 1.09],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],

    outputRange: [0.26, 0],
  });

  /*
   * COLORS
   */

  const borderColor = current
    ? Colors.teal
    : completed
      ? Colors.accent
      : locked
        ? "#B6B8B2"
        : Colors.primary;

  const badgeColor = current
    ? Colors.teal
    : completed
      ? Colors.accent
      : locked
        ? "#AAB0A9"
        : Colors.primary;

  return (
    <Animated.View
      style={[
        styles.storyNodeWrapper,

        {
          left,
          top,
          width,
          height,

          transform: [
            {
              translateY: current ? float : 0,
            },
          ],
        },
      ]}
    >
      {/* GLOW */}

      {current && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.nodeGlow,

            {
              opacity: pulseOpacity,

              transform: [
                {
                  scale: pulseScale,
                },
              ],
            },
          ]}
        />
      )}

      {/* NUMBER */}

      <View
        style={[
          styles.storyNumber,

          {
            backgroundColor: badgeColor,
          },
        ]}
      >
        {locked ? (
          <MaterialCommunityIcons
            name="lock"
            size={15}
            color={Colors.surface}
          />
        ) : completed ? (
          <MaterialCommunityIcons
            name="check-bold"
            size={17}
            color={Colors.text}
          />
        ) : (
          <Text style={styles.storyNumberText}>{number}</Text>
        )}
      </View>

      <Pressable
        disabled={locked}
        onPress={onPress}
        style={({ pressed }) => [
          styles.storyCard,

          {
            borderColor,
          },

          pressed && !locked && styles.nodePressed,
        ]}
      >
        {/* COVER */}

        <View style={styles.coverArea}>
          <Image
            source={coverImage}
            resizeMode="cover"
            style={styles.coverImage}
          />

          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0)", "rgba(21,21,29,0.66)"]}
            style={styles.coverGradient}
          />

          <View style={styles.coverStoryTag}>
            <Text style={styles.coverStoryTagText}>KWENTO {number}</Text>
          </View>

          {/* CURRENT */}

          {current && (
            <View style={styles.currentPlay}>
              <MaterialCommunityIcons
                name="play"
                size={27}
                color={Colors.surface}
              />
            </View>
          )}

          {/* LOCKED */}

          {locked && (
            <View style={styles.lockOverlay}>
              <View style={styles.bigLock}>
                <MaterialCommunityIcons
                  name="lock"
                  size={25}
                  color={Colors.surface}
                />
              </View>
            </View>
          )}

          {/* COMPLETED */}

          {completed && (
            <View style={styles.completedBadge}>
              <MaterialCommunityIcons
                name="check-bold"
                size={15}
                color={Colors.surface}
              />
            </View>
          )}
        </View>

        {/* DETAILS */}

        <View style={styles.storyDetails}>
          {current && (
            <View style={styles.currentMissionRow}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={11}
                color={Colors.secondary}
              />

              <Text style={styles.currentMissionText}>KASALUKUYANG MISYON</Text>
            </View>
          )}

          {completed && <Text style={styles.completedText}>NATAPOS NA</Text>}

          {locked && <Text style={styles.lockedText}>NAKA-LOCK</Text>}

          <Text
            numberOfLines={2}
            style={[styles.storyTitle, locked && styles.storyTitleLocked]}
          >
            {title}
          </Text>

          {!locked && (
            <Text numberOfLines={1} style={styles.storySubtitle}>
              {subtitle}
            </Text>
          )}

          {/* CURRENT */}

          {current && (
            <View style={styles.playMissionRow}>
              <Text style={styles.playMissionText}>SIMULAN</Text>

              <View style={styles.playMissionIcon}>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={13}
                  color={Colors.surface}
                />
              </View>
            </View>
          )}

          {/* STARS */}

          {completed && (
            <View style={styles.stars}>
              {[0, 1, 2].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name={star < stars ? "star" : "star-outline"}
                  size={14}
                  color={Colors.secondary}
                />
              ))}
            </View>
          )}

          {/* LOCK */}

          {locked && (
            <Text numberOfLines={1} style={styles.lockHint}>
              Tapusin ang naunang kwento
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/*
 * =========================================================
 * MAP DECORATIONS
 * =========================================================
 */

function MapDecorations({ mapHeight }: { mapHeight: number }) {
  const decorations = Array.from({
    length: Math.ceil(mapHeight / 240),
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {decorations.map((_, index) => {
        const y = 150 + index * 230;

        const left = index % 2 === 0;

        return (
          <View key={`decor-${index}`}>
            <MaterialCommunityIcons
              name={index % 3 === 0 ? "tree" : "pine-tree"}
              size={24 + (index % 3) * 3}
              color={index % 2 === 0 ? "#B7C995" : "#AFC38A"}
              style={{
                position: "absolute",

                top: y,

                left: left ? 22 : undefined,

                right: !left ? 22 : undefined,

                opacity: 0.72,
              }}
            />

            <View
              style={[
                styles.mapRock,

                {
                  top: y + 70,

                  left: !left ? 46 : undefined,

                  right: left ? 48 : undefined,
                },
              ]}
            />

            {index % 2 === 0 && (
              <MaterialCommunityIcons
                name="flower"
                size={10}
                color="#D9996F"
                style={{
                  position: "absolute",

                  top: y + 115,

                  left: left ? 58 : undefined,

                  right: !left ? 58 : undefined,

                  opacity: 0.7,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */
