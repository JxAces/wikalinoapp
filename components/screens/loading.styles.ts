import { StyleSheet } from "react-native";

import { Colors } from "../../constants/colors";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: "#292763",
  },

  container: {
    flex: 1,

    overflow: "hidden",

    paddingHorizontal: 22,

    paddingTop: 12,

    paddingBottom: 18,
  },

  /*
   * BACKGROUND
   */

  glowOne: {
    position: "absolute",

    width: 310,

    height: 310,

    borderRadius: 155,

    top: -165,

    right: -125,

    backgroundColor: "rgba(244,201,93,0.10)",
  },

  glowTwo: {
    position: "absolute",

    width: 390,

    height: 390,

    borderRadius: 195,

    bottom: -235,

    left: -215,

    backgroundColor: "rgba(217,108,74,0.13)",
  },

  compassBackground: {
    position: "absolute",

    right: -74,

    top: 190,
  },

  sparkleOne: {
    position: "absolute",

    right: 58,

    top: 105,
  },

  sparkleTwo: {
    position: "absolute",

    left: 43,

    top: 265,
  },

  /*
   * NORMAL SCREEN
   */

  normalScreen: {
    flex: 1,
  },

  content: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",
  },

  gameBadge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,

    paddingHorizontal: 11,

    paddingVertical: 6,

    borderRadius: 999,

    marginBottom: 27,

    backgroundColor: "rgba(255,255,255,0.07)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.07)",
  },

  gameBadgeText: {
    color: "rgba(255,255,255,0.70)",

    fontSize: 7.5,

    fontWeight: "900",

    letterSpacing: 1.3,
  },

  /*
   * PORTAL
   */

  portalContainer: {
    position: "relative",

    width: 172,

    height: 172,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 24,
  },

  portalGlow: {
    position: "absolute",

    width: 155,

    height: 155,

    borderRadius: 78,

    backgroundColor: Colors.accent,
  },

  portalOuter: {
    width: 154,

    height: 154,

    borderRadius: 77,

    borderWidth: 3,

    borderColor: "rgba(244,201,93,0.58)",

    backgroundColor: "rgba(255,255,255,0.07)",

    alignItems: "center",

    justifyContent: "center",
  },

  portalInner: {
    width: 118,

    height: 118,

    borderRadius: 39,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 3,

    borderColor: "rgba(255,255,255,0.75)",
  },

  starBadge: {
    position: "absolute",

    top: 0,

    right: 4,

    width: 40,

    height: 40,

    borderRadius: 14,

    backgroundColor: Colors.accent,

    borderWidth: 3,

    borderColor: Colors.primary,

    alignItems: "center",

    justifyContent: "center",
  },

  flagBadge: {
    position: "absolute",

    left: 4,

    bottom: 11,

    width: 34,

    height: 34,

    borderRadius: 12,

    backgroundColor: Colors.teal,

    borderWidth: 3,

    borderColor: Colors.primary,

    alignItems: "center",

    justifyContent: "center",
  },

  /*
   * TITLE
   */

  titleArea: {
    alignItems: "center",
  },

  entryLabel: {
    color: "rgba(255,255,255,0.45)",

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 1.45,

    marginBottom: 5,
  },

  title: {
    color: Colors.surface,

    fontSize: 39,

    fontWeight: "900",

    letterSpacing: 4,

    lineHeight: 46,
  },

  titleDecoration: {
    flexDirection: "row",

    alignItems: "center",

    gap: 7,

    marginTop: 2,
  },

  titleLine: {
    width: 29,

    height: 1,

    backgroundColor: "rgba(244,201,93,0.45)",
  },

  tagline: {
    color: Colors.accent,

    fontSize: 13,

    fontWeight: "900",

    marginTop: 5,
  },

  gameSteps: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    marginTop: 20,
  },

  gameStep: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,
  },

  gameStepIcon: {
    width: 25,

    height: 25,

    borderRadius: 9,

    backgroundColor: "rgba(255,255,255,0.08)",

    alignItems: "center",

    justifyContent: "center",
  },

  gameStepText: {
    color: "rgba(255,255,255,0.80)",

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 0.6,
  },

  description: {
    marginTop: 12,

    color: "rgba(255,255,255,0.53)",

    fontSize: 10,

    textAlign: "center",
  },

  /*
   * LOADING
   */

  loadingSection: {
    paddingTop: 9,
  },

  loadingCard: {
    borderRadius: 21,

    padding: 13,

    backgroundColor: "rgba(24,22,64,0.34)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.07)",
  },

  loadingTop: {
    marginBottom: 11,
  },

  loadingTitleArea: {
    flexDirection: "row",

    alignItems: "center",

    gap: 9,
  },

  loadingEyebrow: {
    color: Colors.accent,

    fontSize: 6,

    fontWeight: "900",

    letterSpacing: 0.9,
  },

  loadingText: {
    marginTop: 2,

    color: "rgba(255,255,255,0.78)",

    fontSize: 9,

    fontWeight: "700",
  },

  progressTrack: {
    position: "relative",

    height: 11,

    padding: 2,

    borderRadius: 999,

    overflow: "hidden",

    backgroundColor: "rgba(255,255,255,0.12)",
  },

  progressFill: {
    height: "100%",

    borderRadius: 999,

    backgroundColor: Colors.accent,
  },

  progressCheckpoint: {
    position: "absolute",

    top: 3,

    width: 5,

    height: 5,

    borderRadius: 3,

    backgroundColor: "rgba(255,255,255,0.74)",
  },

  offlineRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 5,

    marginTop: 8,
  },

  offlineText: {
    color: "rgba(255,255,255,0.35)",

    fontSize: 7.5,

    fontWeight: "600",
  },

  /*
   * =====================================================
   * TRANSITION
   * =====================================================
   */

  transitionLayer: {
    position: "absolute",
    inset: 0,

    zIndex: 999,

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  /*
   * Circle starts tiny, then grows to several
   * times the viewport size.
   */

  transitionPortal: {
    position: "absolute",

    width: 220,

    height: 220,

    borderRadius: 110,

    overflow: "hidden",
  },

  transitionPortalGradient: {
    flex: 1,

    borderRadius: 110,
  },

  transitionRing: {
    position: "absolute",

    width: 150,

    height: 150,

    borderRadius: 75,

    backgroundColor: Colors.background,

    borderWidth: 5,

    borderColor: Colors.accent,

    alignItems: "center",

    justifyContent: "center",

    shadowColor: Colors.accent,

    shadowOpacity: 0.45,

    shadowRadius: 18,

    elevation: 10,
  },

  transitionTextArea: {
    position: "absolute",

    bottom: "21%",

    alignItems: "center",

    zIndex: 20,
  },

  transitionEyebrow: {
    color: "rgba(255,255,255,0.68)",

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1.5,
  },

  transitionTitle: {
    marginTop: 5,

    color: Colors.surface,

    fontSize: 17,

    fontWeight: "900",
  },

  transitionDots: {
    flexDirection: "row",

    gap: 5,

    marginTop: 10,
  },

  transitionDot: {
    width: 5,

    height: 5,

    borderRadius: 3,

    backgroundColor: Colors.accent,
  },

  /*
   * Gold/cream flash at the exact moment
   * before Expo switches to Landing.
   */

  transitionFlash: {
    position: "absolute",
    inset: 0,

    zIndex: 30,

    backgroundColor: Colors.primary,
  },
});

export default styles;
