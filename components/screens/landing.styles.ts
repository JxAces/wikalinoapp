import { StyleSheet } from "react-native";

import { Colors } from "../../constants/colors";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: "#35327C",
  },

  screen: {
    flex: 1,

    backgroundColor: Colors.background,
  },

  scrollContent: {
    paddingBottom: 155,
  },

  /*
   * PLAYER HERO
   */

  hero: {
    position: "relative",

    overflow: "hidden",

    paddingHorizontal: 20,

    paddingTop: 18,

    paddingBottom: 17,
  },

  heroOrbOne: {
    position: "absolute",

    width: 180,

    height: 180,

    borderRadius: 90,

    backgroundColor: "rgba(244,201,93,0.07)",

    right: -65,

    top: -90,
  },

  heroOrbTwo: {
    position: "absolute",

    width: 170,

    height: 170,

    borderRadius: 85,

    backgroundColor: "rgba(217,108,74,0.08)",

    left: -85,

    bottom: -115,
  },

  sparkleOne: {
    position: "absolute",

    right: 86,

    top: 19,
  },

  sparkleTwo: {
    position: "absolute",

    left: 145,

    bottom: 43,
  },

  playerRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    zIndex: 2,
  },

  playerIdentity: {
    flexDirection: "row",

    alignItems: "center",
  },

  playerAvatar: {
    width: 57,

    height: 57,

    borderRadius: 19,

    marginRight: 12,

    backgroundColor: Colors.background,

    borderWidth: 2,

    borderColor: "rgba(255,255,255,0.16)",

    alignItems: "center",

    justifyContent: "center",
  },

  playerInfo: {
    justifyContent: "center",
  },

  helloLabel: {
    color: "rgba(255,255,255,0.55)",

    fontSize: 7.5,

    fontWeight: "900",

    letterSpacing: 1.2,
  },

  playerName: {
    marginTop: 2,

    color: Colors.surface,

    fontSize: 21,

    fontWeight: "900",
  },

  playerGroupRow: {
    marginTop: 3,

    flexDirection: "row",

    alignItems: "center",

    gap: 4,
  },

  playerGroup: {
    color: Colors.accent,

    fontSize: 10,

    fontWeight: "900",
  },

  infoButton: {
    width: 45,

    height: 45,

    borderRadius: 15,

    backgroundColor: "rgba(255,255,255,0.10)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.06)",

    alignItems: "center",

    justifyContent: "center",
  },

  /*
   * LEVEL
   */

  levelHud: {
    marginTop: 16,

    borderRadius: 17,

    padding: 10,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "rgba(255,255,255,0.09)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.06)",
  },

  levelBadge: {
    width: 40,

    height: 40,

    borderRadius: 13,

    marginRight: 10,

    backgroundColor: "rgba(255,255,255,0.10)",

    alignItems: "center",

    justifyContent: "center",
  },

  levelNumber: {
    position: "absolute",

    color: Colors.surface,

    fontSize: 9,

    fontWeight: "900",
  },

  levelInfo: {
    flex: 1,
  },

  levelTitleRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 7,
  },

  levelTitle: {
    flex: 1,

    color: Colors.surface,

    fontSize: 9,

    fontWeight: "800",
  },

  levelXp: {
    marginLeft: 8,

    color: Colors.accent,

    fontSize: 9,

    fontWeight: "900",
  },

  levelTrack: {
    height: 6,

    borderRadius: 999,

    overflow: "hidden",

    backgroundColor: "rgba(255,255,255,0.12)",
  },

  levelFill: {
    height: "100%",

    minWidth: 5,

    borderRadius: 999,

    backgroundColor: Colors.accent,
  },

  /*
   * HUD STATS
   */

  hudStats: {
    marginTop: 11,

    minHeight: 42,

    borderRadius: 15,

    backgroundColor: "rgba(18,17,52,0.16)",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-around",

    paddingHorizontal: 12,
  },

  hudStat: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
  },

  hudStatValue: {
    color: Colors.surface,

    fontSize: 10,

    fontWeight: "900",
  },

  hudStatLabel: {
    marginTop: -1,

    color: "rgba(255,255,255,0.45)",

    fontSize: 5.5,

    fontWeight: "900",

    letterSpacing: 0.6,
  },

  hudDivider: {
    width: 1,

    height: 20,

    backgroundColor: "rgba(255,255,255,0.10)",
  },

  /*
   * WORLD
   */

  worldSection: {
    paddingHorizontal: 16,

    marginTop: 14,
  },

  worldCard: {
    borderRadius: 23,

    padding: 17,

    borderWidth: 1,

    borderColor: Colors.border,

    shadowColor: "#312E54",

    shadowOpacity: 0.05,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  worldTopRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "flex-start",
  },

  worldBadge: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    borderRadius: 999,

    paddingHorizontal: 8,

    paddingVertical: 4,

    backgroundColor: Colors.secondarySoft,
  },

  worldBadgeText: {
    color: Colors.secondary,

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1,
  },

  worldTitle: {
    marginTop: 7,

    color: Colors.text,

    fontSize: 22,

    fontWeight: "900",
  },

  worldSelector: {
    width: 47,

    height: 47,

    borderRadius: 16,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.primarySoft,
  },

  worldSubtitle: {
    marginTop: 7,

    color: Colors.textMuted,

    fontSize: 10.5,

    lineHeight: 15,
  },

  worldProgressTop: {
    marginTop: 15,

    marginBottom: 7,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  worldProgressLeft: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  worldProgressText: {
    color: Colors.textMuted,

    fontSize: 9,

    fontWeight: "800",
  },

  worldPercentage: {
    color: Colors.primary,

    fontSize: 10,

    fontWeight: "900",
  },

  worldTrack: {
    height: 8,

    borderRadius: 999,

    overflow: "hidden",

    backgroundColor: Colors.primarySoft,
  },

  worldFill: {
    height: "100%",

    minWidth: 3,

    borderRadius: 999,

    backgroundColor: Colors.secondary,
  },

  /*
   * QUEST HEADER
   */

  questHeading: {
    marginHorizontal: 18,

    marginTop: 24,

    marginBottom: 13,

    flexDirection: "row",

    alignItems: "center",
  },

  questIcon: {
    width: 50,

    height: 50,

    borderRadius: 17,

    marginRight: 11,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.secondarySoft,
  },

  questHeadingText: {
    flex: 1,
  },

  questEyebrow: {
    color: Colors.secondary,

    fontSize: 7.5,

    fontWeight: "900",

    letterSpacing: 1.6,
  },

  questTitle: {
    marginTop: 2,

    color: Colors.text,

    fontSize: 19,

    fontWeight: "900",
  },

  questSubtitle: {
    marginTop: 2,

    color: Colors.textMuted,

    fontSize: 8.5,

    lineHeight: 12,
  },

  /*
   * MAP
   */

  map: {
    position: "relative",

    alignSelf: "center",

    overflow: "hidden",

    borderRadius: 30,

    borderWidth: 1,

    borderColor: "#DFD0A7",

    shadowColor: "#594F35",

    shadowOpacity: 0.08,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,
  },

  compassWatermark: {
    position: "absolute",

    top: 250,

    left: "50%",

    marginLeft: -60,

    opacity: 1,
  },

  /*
   * START
   */

  startPoint: {
    position: "absolute",

    zIndex: 25,

    top: 68,

    left: "50%",

    marginLeft: -42,

    width: 84,

    alignItems: "center",
  },

  startFlag: {
    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: Colors.primary,

    borderWidth: 4,

    borderColor: Colors.surface,

    alignItems: "center",

    justifyContent: "center",

    shadowColor: Colors.primary,

    shadowOpacity: 0.25,

    shadowRadius: 7,

    elevation: 6,
  },

  startLabel: {
    marginTop: -2,

    borderRadius: 999,

    paddingHorizontal: 10,

    paddingVertical: 4,

    backgroundColor: Colors.primary,
  },

  startLabelText: {
    color: Colors.surface,

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 0.8,
  },

  /*
   * STORY NODE
   */

  storyNodeWrapper: {
    position: "absolute",

    zIndex: 20,
  },

  nodeGlow: {
    position: "absolute",

    left: -7,

    right: -7,

    top: -7,

    bottom: -7,

    borderRadius: 27,

    backgroundColor: Colors.teal,
  },

  storyNumber: {
    position: "absolute",

    zIndex: 35,

    top: -11,

    left: -11,

    width: 42,

    height: 42,

    borderRadius: 21,

    borderWidth: 4,

    borderColor: Colors.surface,

    alignItems: "center",

    justifyContent: "center",

    shadowColor: "#322F37",

    shadowOpacity: 0.18,

    shadowRadius: 4,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 7,
  },

  storyNumberText: {
    color: Colors.surface,

    fontSize: 16,

    fontWeight: "900",
  },

  storyCard: {
    flex: 1,

    overflow: "hidden",

    borderRadius: 22,

    borderWidth: 3,

    backgroundColor: Colors.surface,

    shadowColor: "#3A3540",

    shadowOpacity: 0.16,

    shadowRadius: 9,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 7,
  },

  nodePressed: {
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  /*
   * COVER
   */

  coverArea: {
    position: "relative",

    height: 100,

    overflow: "hidden",

    backgroundColor: Colors.primarySoft,
  },

  coverImage: {
    width: "100%",

    height: "100%",
  },

  coverGradient: {
    position: "absolute",

    left: 0,

    right: 0,

    bottom: 0,

    height: 55,
  },

  coverStoryTag: {
    position: "absolute",

    left: 8,

    bottom: 7,

    borderRadius: 8,

    paddingHorizontal: 7,

    paddingVertical: 3,

    backgroundColor: "rgba(31,29,45,0.70)",
  },

  coverStoryTagText: {
    color: Colors.surface,

    fontSize: 6,

    fontWeight: "900",

    letterSpacing: 0.8,
  },

  currentPlay: {
    position: "absolute",

    top: "50%",

    left: "50%",

    marginTop: -25,

    marginLeft: -25,

    width: 50,

    height: 50,

    borderRadius: 25,

    backgroundColor: "rgba(42,157,143,0.94)",

    borderWidth: 2,

    borderColor: "rgba(255,255,255,0.92)",

    alignItems: "center",

    justifyContent: "center",

    shadowColor: Colors.teal,

    shadowOpacity: 0.4,

    shadowRadius: 9,

    elevation: 5,
  },

  lockOverlay: {
    position: "absolute",
    inset: 0,

    backgroundColor: "rgba(55,59,54,0.55)",

    alignItems: "center",

    justifyContent: "center",
  },

  bigLock: {
    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: "rgba(36,39,36,0.64)",

    borderWidth: 2,

    borderColor: "rgba(255,255,255,0.60)",

    alignItems: "center",

    justifyContent: "center",
  },

  completedBadge: {
    position: "absolute",

    top: 8,

    right: 8,

    width: 30,

    height: 30,

    borderRadius: 15,

    backgroundColor: Colors.teal,

    borderWidth: 2,

    borderColor: Colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  /*
   * DETAILS
   */

  storyDetails: {
    flex: 1,

    paddingHorizontal: 9,

    paddingTop: 6,

    paddingBottom: 7,
  },

  currentMissionRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 2,
  },

  currentMissionText: {
    color: Colors.secondary,

    fontSize: 5.7,

    fontWeight: "900",

    letterSpacing: 0.45,
  },

  completedText: {
    color: Colors.teal,

    fontSize: 5.8,

    fontWeight: "900",

    letterSpacing: 0.5,
  },

  lockedText: {
    color: "#8D908B",

    fontSize: 5.8,

    fontWeight: "900",

    letterSpacing: 0.5,
  },

  storyTitle: {
    marginTop: 2,

    color: Colors.text,

    fontSize: 10.5,

    lineHeight: 13,

    fontWeight: "900",
  },

  storyTitleLocked: {
    color: "#7C807A",
  },

  storySubtitle: {
    marginTop: 2,

    color: Colors.textMuted,

    fontSize: 6.8,

    lineHeight: 9,
  },

  playMissionRow: {
    marginTop: 4,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  playMissionText: {
    color: Colors.teal,

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 0.5,
  },

  playMissionIcon: {
    width: 22,

    height: 22,

    borderRadius: 11,

    backgroundColor: Colors.teal,

    alignItems: "center",

    justifyContent: "center",
  },

  stars: {
    flexDirection: "row",

    marginTop: 5,

    gap: 1,
  },

  lockHint: {
    marginTop: 3,

    color: "#939690",

    fontSize: 6.5,

    lineHeight: 9,
  },

  /*
   * FINISH
   */

  finishPoint: {
    position: "absolute",

    zIndex: 25,

    left: "50%",

    marginLeft: -65,

    width: 130,

    alignItems: "center",
  },

  finishCircle: {
    width: 52,

    height: 52,

    borderRadius: 26,

    backgroundColor: Colors.primary,

    borderWidth: 4,

    borderColor: Colors.surface,

    alignItems: "center",

    justifyContent: "center",

    shadowColor: Colors.primary,

    shadowOpacity: 0.24,

    shadowRadius: 7,

    elevation: 6,
  },

  finishLabel: {
    marginTop: -2,

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 999,

    backgroundColor: Colors.primary,
  },

  finishLabelText: {
    color: Colors.surface,

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 0.6,
  },

  /*
   * MAP DECOR
   */

  mapRock: {
    position: "absolute",

    width: 11,

    height: 8,

    borderRadius: 6,

    backgroundColor: "#C0AF7F",

    opacity: 0.7,
  },

  /*
   * EMPTY
   */

  emptyState: {
    marginHorizontal: 16,

    padding: 36,

    borderRadius: 25,

    borderWidth: 1,

    borderColor: Colors.border,

    backgroundColor: Colors.surface,

    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,

    color: Colors.text,

    fontSize: 17,

    fontWeight: "900",
  },

  emptyText: {
    marginTop: 5,

    color: Colors.textMuted,

    fontSize: 10,

    textAlign: "center",
  },

  pressed: {
    opacity: 0.84,

    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  /*
   * =====================================================
   * STORY PORTAL TRANSITION
   * =====================================================
   */

  transitionRoot: {
    flex: 1,

    backgroundColor: "transparent",

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  transitionBackdrop: {
    position: "absolute",
    inset: 0,

    backgroundColor: "#16142F",
  },

  /*
   * PARTICLES
   */

  transitionParticleOne: {
    position: "absolute",

    top: "22%",

    right: "17%",

    opacity: 0.9,

    zIndex: 4,
  },

  transitionParticleTwo: {
    position: "absolute",

    top: "33%",

    left: "15%",

    opacity: 0.65,

    zIndex: 4,
  },

  transitionParticleThree: {
    position: "absolute",

    bottom: "29%",

    right: "21%",

    opacity: 0.8,

    zIndex: 4,
  },

  /*
   * PORTAL
   */

  transitionPortalArea: {
    position: "absolute",

    top: "26%",

    width: 220,

    height: 220,

    alignItems: "center",

    justifyContent: "center",

    zIndex: 10,
  },

  transitionPortalGlow: {
    position: "absolute",

    width: 190,

    height: 190,

    borderRadius: 95,

    backgroundColor: "rgba(244,201,93,0.20)",

    zIndex: 1,
  },

  transitionOuterRing: {
    position: "absolute",

    width: 205,

    height: 205,

    borderRadius: 103,

    borderWidth: 4,

    borderColor: Colors.accent,

    zIndex: 3,

    shadowColor: Colors.accent,

    shadowOpacity: 0.5,

    shadowRadius: 18,

    elevation: 10,
  },

  transitionRingDotTop: {
    position: "absolute",

    top: -7,

    left: "50%",

    marginLeft: -7,

    width: 14,

    height: 14,

    borderRadius: 7,

    backgroundColor: Colors.accent,

    borderWidth: 2,

    borderColor: Colors.surface,
  },

  transitionRingDotRight: {
    position: "absolute",

    right: -7,

    top: "50%",

    marginTop: -7,

    width: 14,

    height: 14,

    borderRadius: 7,

    backgroundColor: Colors.teal,

    borderWidth: 2,

    borderColor: Colors.surface,
  },

  transitionRingDotBottom: {
    position: "absolute",

    bottom: -7,

    left: "50%",

    marginLeft: -7,

    width: 14,

    height: 14,

    borderRadius: 7,

    backgroundColor: Colors.secondary,

    borderWidth: 2,

    borderColor: Colors.surface,
  },

  transitionRingDotLeft: {
    position: "absolute",

    left: -7,

    top: "50%",

    marginTop: -7,

    width: 14,

    height: 14,

    borderRadius: 7,

    backgroundColor: Colors.accent,

    borderWidth: 2,

    borderColor: Colors.surface,
  },

  transitionPortal: {
    position: "absolute",

    width: 170,

    height: 170,

    borderRadius: 85,

    overflow: "hidden",

    backgroundColor: Colors.primary,

    borderWidth: 5,

    borderColor: Colors.surface,

    shadowColor: Colors.accent,

    shadowOpacity: 0.4,

    shadowRadius: 20,

    elevation: 12,

    zIndex: 2,
  },

  transitionPortalImage: {
    width: "100%",

    height: "100%",
  },

  transitionPortalCenter: {
    position: "absolute",
    inset: 0,

    alignItems: "center",

    justifyContent: "center",
  },

  /*
   * STORY COPY
   */

  transitionStoryInfo: {
    position: "absolute",

    top: "57%",

    left: 25,

    right: 25,

    alignItems: "center",

    zIndex: 12,
  },

  transitionMissionBadge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: "rgba(255,255,255,0.09)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.08)",
  },

  transitionMissionBadgeText: {
    color: Colors.accent,

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1.1,
  },

  transitionStoryTitle: {
    marginTop: 13,

    color: Colors.surface,

    fontSize: 27,

    lineHeight: 32,

    fontWeight: "900",

    textAlign: "center",
  },

  transitionStorySubtitle: {
    marginTop: 5,

    color: "rgba(255,255,255,0.60)",

    fontSize: 11,

    lineHeight: 16,

    textAlign: "center",
  },

  transitionLoadingRow: {
    marginTop: 18,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  transitionLoadingDot: {
    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: Colors.accent,
  },

  transitionEnteringText: {
    marginTop: 7,

    color: "rgba(255,255,255,0.44)",

    fontSize: 8,

    fontWeight: "700",
  },

  /*
   * FINAL SCREEN COVER
   */

  transitionFlash: {
    position: "absolute",
    inset: 0,

    zIndex: 100,
  },
});

export default styles;
