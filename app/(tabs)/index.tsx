import { MaterialCommunityIcons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import { router } from "expo-router";

import { useEffect, useRef, useState } from "react";

import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import styles from "@/components/screens/loading.styles";


import { Colors } from "../../constants/colors";

import { useUserStore } from "../../store/useUserStore";

export default function LoadingScreen() {
  const profile = useUserStore((state) => state.profile);

  const [isHydrated, setIsHydrated] = useState(
    useUserStore.persist.hasHydrated(),
  );

  const [isTransitioning, setIsTransitioning] = useState(false);

  const startedAt = useRef(Date.now());

  /*
   * =======================================================
   * MAIN INTRO ANIMATIONS
   * =======================================================
   */

  const screenFade = useRef(new Animated.Value(0)).current;

  const portalScale = useRef(new Animated.Value(0.78)).current;

  const portalFloat = useRef(new Animated.Value(0)).current;

  const portalPulse = useRef(new Animated.Value(0)).current;

  const titleFade = useRef(new Animated.Value(0)).current;

  const titleTranslate = useRef(new Animated.Value(15)).current;

  const loadingFade = useRef(new Animated.Value(0)).current;

  const progress = useRef(new Animated.Value(0)).current;

  const sparkle = useRef(new Animated.Value(0)).current;

  const compass = useRef(new Animated.Value(0)).current;

  /*
   * =======================================================
   * EXIT / GAME TRANSITION
   * =======================================================
   */

  const exitContentOpacity = useRef(new Animated.Value(1)).current;

  const exitContentScale = useRef(new Animated.Value(1)).current;

  /*
   * Giant expanding portal.
   */

  const transitionPortalScale = useRef(new Animated.Value(0)).current;

  const transitionPortalOpacity = useRef(new Animated.Value(0)).current;

  /*
   * Inner glowing ring.
   */

  const transitionRingScale = useRef(new Animated.Value(0.5)).current;

  const transitionRingOpacity = useRef(new Animated.Value(0)).current;

  /*
   * Text:
   * "Naglalakbay sa Mundo 1"
   */

  const transitionTextOpacity = useRef(new Animated.Value(0)).current;

  const transitionTextTranslate = useRef(new Animated.Value(12)).current;

  /*
   * Final screen flash.
   */

  const transitionFlashOpacity = useRef(new Animated.Value(0)).current;

  /*
   * =======================================================
   * HYDRATION
   * =======================================================
   */

  useEffect(() => {
    const unsubscribe = useUserStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useUserStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  /*
   * =======================================================
   * INTRO
   * =======================================================
   */

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenFade, {
        toValue: 1,

        duration: 500,

        easing: Easing.out(Easing.ease),

        useNativeDriver: true,
      }),

      Animated.spring(portalScale, {
        toValue: 1,

        friction: 6,

        tension: 45,

        useNativeDriver: true,
      }),

      Animated.sequence([
        Animated.delay(180),

        Animated.parallel([
          Animated.timing(titleFade, {
            toValue: 1,

            duration: 500,

            useNativeDriver: true,
          }),

          Animated.spring(titleTranslate, {
            toValue: 0,

            friction: 7,

            tension: 50,

            useNativeDriver: true,
          }),
        ]),
      ]),

      Animated.sequence([
        Animated.delay(400),

        Animated.timing(loadingFade, {
          toValue: 1,

          duration: 450,

          useNativeDriver: true,
        }),
      ]),

      Animated.timing(progress, {
        toValue: 1,

        /*
         * Same duration as the minimum
         * splash visibility.
         */

        duration: 2200,

        easing: Easing.inOut(Easing.ease),

        useNativeDriver: false,
      }),
    ]).start();

    /*
     * Floating portal.
     */

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(portalFloat, {
          toValue: -7,

          duration: 1200,

          easing: Easing.inOut(Easing.ease),

          useNativeDriver: true,
        }),

        Animated.timing(portalFloat, {
          toValue: 0,

          duration: 1200,

          easing: Easing.inOut(Easing.ease),

          useNativeDriver: true,
        }),
      ]),
    );

    /*
     * Portal breathing.
     */

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(portalPulse, {
          toValue: 1,

          duration: 1000,

          useNativeDriver: true,
        }),

        Animated.timing(portalPulse, {
          toValue: 0,

          duration: 1000,

          useNativeDriver: true,
        }),
      ]),
    );

    /*
     * Stars.
     */

    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,

          duration: 850,

          useNativeDriver: true,
        }),

        Animated.timing(sparkle, {
          toValue: 0,

          duration: 850,

          useNativeDriver: true,
        }),
      ]),
    );

    /*
     * Slow compass rotation.
     */

    const rotateCompass = Animated.loop(
      Animated.timing(compass, {
        toValue: 1,

        duration: 14000,

        easing: Easing.linear,

        useNativeDriver: true,
      }),
    );

    floating.start();
    breathing.start();
    twinkle.start();
    rotateCompass.start();

    return () => {
      floating.stop();
      breathing.stop();
      twinkle.stop();
      rotateCompass.stop();
    };
  }, [
    compass,
    loadingFade,
    portalFloat,
    portalPulse,
    portalScale,
    progress,
    screenFade,
    sparkle,
    titleFade,
    titleTranslate,
  ]);

  /*
   * =======================================================
   * GAME TRANSITION
   * =======================================================
   */

  function startGameTransition() {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    /*
     * Reset transition values.
     */

    transitionPortalScale.setValue(0);
    transitionPortalOpacity.setValue(0);

    transitionRingScale.setValue(0.5);
    transitionRingOpacity.setValue(0);

    transitionTextOpacity.setValue(0);
    transitionTextTranslate.setValue(12);

    transitionFlashOpacity.setValue(0);

    /*
     * =====================================================
     * STAGE 1
     *
     * Existing splash begins disappearing.
     * Portal appears.
     * =====================================================
     */

    Animated.parallel([
      Animated.timing(exitContentOpacity, {
        toValue: 0.28,

        duration: 350,

        easing: Easing.out(Easing.ease),

        useNativeDriver: true,
      }),

      Animated.timing(exitContentScale, {
        toValue: 1.06,

        duration: 500,

        easing: Easing.out(Easing.ease),

        useNativeDriver: true,
      }),

      Animated.timing(transitionPortalOpacity, {
        toValue: 1,

        duration: 220,

        useNativeDriver: true,
      }),

      Animated.spring(transitionRingScale, {
        toValue: 1,

        friction: 5,

        tension: 60,

        useNativeDriver: true,
      }),

      Animated.timing(transitionRingOpacity, {
        toValue: 1,

        duration: 250,

        useNativeDriver: true,
      }),
    ]).start(() => {
      /*
       * ===================================================
       * STAGE 2
       *
       * Show game-transition message.
       * ===================================================
       */

      Animated.parallel([
        Animated.timing(transitionTextOpacity, {
          toValue: 1,

          duration: 250,

          useNativeDriver: true,
        }),

        Animated.spring(transitionTextTranslate, {
          toValue: 0,

          friction: 7,

          tension: 55,

          useNativeDriver: true,
        }),
      ]).start();

      /*
       * ===================================================
       * STAGE 3
       *
       * Portal grows until it consumes the entire screen.
       * ===================================================
       */

      Animated.sequence([
        Animated.delay(220),

        Animated.parallel([
          Animated.timing(transitionPortalScale, {
            toValue: 8,

            duration: 750,

            easing: Easing.in(Easing.cubic),

            useNativeDriver: true,
          }),

          Animated.timing(transitionRingScale, {
            toValue: 5,

            duration: 700,

            easing: Easing.in(Easing.cubic),

            useNativeDriver: true,
          }),

          Animated.sequence([
            Animated.delay(400),

            Animated.timing(transitionFlashOpacity, {
              toValue: 1,

              duration: 280,

              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        /*
         * =================================================
         * TRANSITION FINISHED
         *
         * Landing is now loaded only after the screen
         * is completely covered.
         * =================================================
         */

        if (profile) {
          router.replace("/landing");
        } else {
          router.replace("/onboarding");
        }
      });
    });
  }

  /*
   * =======================================================
   * WAIT FOR DATA + MINIMUM SPLASH TIME
   * =======================================================
   */

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const minimumSplashTime = 2200;

    const elapsed = Date.now() - startedAt.current;

    const remaining = Math.max(0, minimumSplashTime - elapsed);

    const timer = setTimeout(() => {
      startGameTransition();
    }, remaining);

    return () => clearTimeout(timer);

    /*
     * startGameTransition deliberately uses
     * the current profile value.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, profile]);

  /*
   * =======================================================
   * INTERPOLATIONS
   * =======================================================
   */

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],

    outputRange: ["4%", "100%"],
  });

  const glowScale = portalPulse.interpolate({
    inputRange: [0, 1],

    outputRange: [1, 1.17],
  });

  const glowOpacity = portalPulse.interpolate({
    inputRange: [0, 1],

    outputRange: [0.33, 0],
  });

  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 1],

    outputRange: [0.75, 1.22],
  });

  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 1],

    outputRange: [0.3, 1],
  });

  const compassRotation = compass.interpolate({
    inputRange: [0, 1],

    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#292763", Colors.primaryDark, Colors.primary, "#504CA2"]}
        locations={[0, 0.28, 0.7, 1]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.container}
      >
        {/* =====================================
            BACKGROUND
        ===================================== */}

        <View style={styles.glowOne} />

        <View style={styles.glowTwo} />

        <Animated.View
          style={[
            styles.compassBackground,

            {
              transform: [
                {
                  rotate: compassRotation,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="compass-outline"
            size={190}
            color="rgba(255,255,255,0.035)"
          />
        </Animated.View>

        {/* FLOATING PARTICLES */}

        <Animated.View
          style={[
            styles.sparkleOne,

            {
              opacity: sparkleOpacity,

              transform: [
                {
                  scale: sparkleScale,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={15}
            color={Colors.accent}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sparkleTwo,

            {
              opacity: sparkleOpacity,

              transform: [
                {
                  scale: sparkleScale,
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="star-four-points"
            size={9}
            color={Colors.surface}
          />
        </Animated.View>

        {/* =====================================
            NORMAL SPLASH CONTENT
        ===================================== */}

        <Animated.View
          style={[
            styles.normalScreen,

            {
              opacity: exitContentOpacity,

              transform: [
                {
                  scale: exitContentScale,
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.content,

              {
                opacity: screenFade,
              },
            ]}
          >
            <View style={styles.gameBadge}>
              <MaterialCommunityIcons
                name="map-marker-path"
                size={13}
                color={Colors.accent}
              />

              <Text style={styles.gameBadgeText}>
                FILIPINO • MAIKLING KWENTO
              </Text>
            </View>

            {/* PORTAL LOGO */}

            <Animated.View
              style={[
                styles.portalContainer,

                {
                  transform: [
                    {
                      translateY: portalFloat,
                    },

                    {
                      scale: portalScale,
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.portalGlow,

                  {
                    opacity: glowOpacity,

                    transform: [
                      {
                        scale: glowScale,
                      },
                    ],
                  },
                ]}
              />

              <View style={styles.portalOuter}>
                <LinearGradient
                  colors={["#FFF9EC", Colors.background, "#F7EBD7"]}
                  style={styles.portalInner}
                >
                  <MaterialCommunityIcons
                    name="book-open-page-variant"
                    size={61}
                    color={Colors.primary}
                  />
                </LinearGradient>
              </View>

              <View style={styles.starBadge}>
                <MaterialCommunityIcons
                  name="star"
                  size={18}
                  color={Colors.text}
                />
              </View>

              <View style={styles.flagBadge}>
                <MaterialCommunityIcons
                  name="flag-checkered"
                  size={14}
                  color={Colors.surface}
                />
              </View>
            </Animated.View>

            {/* TITLE */}

            <Animated.View
              style={[
                styles.titleArea,

                {
                  opacity: titleFade,

                  transform: [
                    {
                      translateY: titleTranslate,
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.entryLabel}>
                ANG IYONG PAGLALAKBAY AY NAGSISIMULA
              </Text>

              <Text style={styles.title}>WIKALINO</Text>

              <View style={styles.titleDecoration}>
                <View style={styles.titleLine} />

                <MaterialCommunityIcons
                  name="star-four-points"
                  size={10}
                  color={Colors.accent}
                />

                <View style={styles.titleLine} />
              </View>

              <Text style={styles.tagline}>Tuklasin ang Kwento</Text>

              <View style={styles.gameSteps}>
                <GameStep icon="book-open-variant" text="BASAHIN" />

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={12}
                  color="rgba(255,255,255,0.25)"
                />

                <GameStep icon="compass-outline" text="TUKLASIN" />

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={12}
                  color="rgba(255,255,255,0.25)"
                />

                <GameStep icon="lightning-bolt" text="HAMUNIN" />
              </View>

              <Text style={styles.description}>
                Bawat kwento ay isang bagong pakikipagsapalaran.
              </Text>
            </Animated.View>
          </Animated.View>

          {/* LOADING */}

          <Animated.View
            style={[
              styles.loadingSection,

              {
                opacity: loadingFade,
              },
            ]}
          >
            <View style={styles.loadingCard}>
              <View style={styles.loadingTop}>
                <View style={styles.loadingTitleArea}>
                  <MaterialCommunityIcons
                    name="map-marker-path"
                    size={15}
                    color={Colors.accent}
                  />

                  <View>
                    <Text style={styles.loadingEyebrow}>
                      {isHydrated
                        ? "PAPASOK SA MUNDO"
                        : "KINUKUHA ANG PROGRESO"}
                    </Text>

                    <Text style={styles.loadingText}>
                      {isHydrated
                        ? "Inihahanda ang iyong landas..."
                        : "Binubuksan ang iyong save data..."}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,

                    {
                      width: progressWidth,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.progressCheckpoint,

                    {
                      left: "25%",
                    },
                  ]}
                />

                <View
                  style={[
                    styles.progressCheckpoint,

                    {
                      left: "50%",
                    },
                  ]}
                />

                <View
                  style={[
                    styles.progressCheckpoint,

                    {
                      left: "75%",
                    },
                  ]}
                />
              </View>

              <View style={styles.offlineRow}>
                <MaterialCommunityIcons
                  name="wifi-off"
                  size={11}
                  color="rgba(255,255,255,0.35)"
                />

                <Text style={styles.offlineText}>
                  Offline • Naka-save sa iyong device
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* =====================================
            GAME TRANSITION OVERLAY
        ===================================== */}

        {isTransitioning && (
          <View pointerEvents="none" style={styles.transitionLayer}>
            {/* EXPANDING PORTAL */}

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
              <LinearGradient
                colors={[Colors.accent, "#FFF4C5", Colors.primary]}
                locations={[0, 0.32, 1]}
                style={styles.transitionPortalGradient}
              />
            </Animated.View>

            {/* RING */}

            <Animated.View
              style={[
                styles.transitionRing,

                {
                  opacity: transitionRingOpacity,

                  transform: [
                    {
                      scale: transitionRingScale,
                    },
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={53}
                color={Colors.primary}
              />
            </Animated.View>

            {/* TRANSITION COPY */}

            <Animated.View
              style={[
                styles.transitionTextArea,

                {
                  opacity: transitionTextOpacity,

                  transform: [
                    {
                      translateY: transitionTextTranslate,
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.transitionEyebrow}>
                NAGSISIMULA ANG PAGLALAKBAY
              </Text>

              <Text style={styles.transitionTitle}>Papasok sa Mundo 1</Text>

              <View style={styles.transitionDots}>
                <View style={styles.transitionDot} />

                <View style={styles.transitionDot} />

                <View style={styles.transitionDot} />
              </View>
            </Animated.View>

            {/* FINAL FLASH */}

            <Animated.View
              style={[
                styles.transitionFlash,

                {
                  opacity: transitionFlashOpacity,
                },
              ]}
            />
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

/*
 * =========================================================
 * GAME STEP
 * =========================================================
 */

function GameStep({
  icon,
  text,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;

  text: string;
}) {
  return (
    <View style={styles.gameStep}>
      <View style={styles.gameStepIcon}>
        <MaterialCommunityIcons name={icon} size={13} color={Colors.accent} />
      </View>

      <Text style={styles.gameStepText}>{text}</Text>
    </View>
  );
}
