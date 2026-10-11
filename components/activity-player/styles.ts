import { StyleSheet } from "react-native";

import { AppTheme, Colors } from "../../constants/colors";

const styles = StyleSheet.create({
  /*
   * SCREEN
   */

  safeArea: {
    flex: 1,

    backgroundColor: "transparent",
  },

  screen: {
    flex: 1,

    backgroundColor: "transparent",
  },

  content: {
    paddingHorizontal: 16,

    paddingTop: 15,

    paddingBottom: 70,
  },

  /*
   * HEADER
   */

  header: {
    position: "relative",

    overflow: "hidden",

    paddingHorizontal: 16,

    paddingTop: 12,

    paddingBottom: 13,
  },

  headerOrb: {
    position: "absolute",

    width: 160,

    height: 160,

    borderRadius: 80,

    top: -95,

    right: -60,

    backgroundColor: "rgba(244,201,93,0.08)",
  },

  headerTop: {
    flexDirection: "row",

    alignItems: "center",
  },

  backButton: {
    width: 42,

    height: 42,

    borderRadius: 14,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.10)",
  },

  headerStory: {
    flex: 1,

    marginHorizontal: 11,
  },

  headerEyebrow: {
    color: Colors.accent,

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 1.2,
  },

  headerTitle: {
    marginTop: 2,

    color: Colors.surface,

    fontSize: 15,

    fontWeight: "900",
  },

  ugatHeaderTitle: {
    lineHeight: 20,
  },

  activityCounter: {
    minWidth: 46,

    height: 36,

    borderRadius: 12,

    flexDirection: "row",

    alignItems: "baseline",

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.10)",
  },

  activityCounterText: {
    color: Colors.accent,

    fontSize: 15,

    fontWeight: "900",
  },

  activityCounterTotal: {
    color: "rgba(255,255,255,0.45)",

    fontSize: 8,

    fontWeight: "800",
  },

  headerProgressRow: {
    marginTop: 12,

    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  headerProgressTrack: {
    flex: 1,

    height: 6,

    overflow: "hidden",

    borderRadius: 999,

    backgroundColor: "rgba(255,255,255,0.12)",
  },

  headerProgressFill: {
    height: "100%",

    borderRadius: 999,

    backgroundColor: Colors.accent,
  },

  headerProgressText: {
    color: "rgba(255,255,255,0.55)",

    fontSize: 7,

    fontWeight: "900",
  },

  /*
   * STORY STRIP
   */

  storyStrip: {
    height: 135,

    borderRadius: 24,

    overflow: "hidden",

    position: "relative",

    marginBottom: 12,

    backgroundColor: Colors.primarySoft,
  },

  storyStripImage: {
    width: "100%",

    height: "100%",
  },

  storyStripContent: {
    position: "absolute",

    left: 15,

    right: 15,

    bottom: 14,
  },

  challengeTypeBadge: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    paddingHorizontal: 8,

    paddingVertical: 5,

    borderRadius: 999,

    backgroundColor: AppTheme.overlay,
  },

  challengeTypeText: {
    color: Colors.accent,

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 0.8,
  },

  activityTitle: {
    marginTop: 7,

    color: Colors.surface,

    fontSize: 20,

    fontWeight: "900",
  },

  /*
   * INSTRUCTION
   */

  instructionCard: {
    flexDirection: "row",

    padding: 13,

    borderRadius: 18,

    marginBottom: 12,

    gap: 10,

    backgroundColor: Colors.secondarySoft,

    borderWidth: 1,

    borderColor: AppTheme.error,
  },

  instructionIcon: {
    width: 36,

    height: 36,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.surface,
  },

  instructionLabel: {
    color: Colors.secondary,

    fontSize: 6.5,

    fontWeight: "900",

    letterSpacing: 1,
  },

  instruction: {
    marginTop: 3,

    color: Colors.text,

    fontSize: 10,

    lineHeight: 15,

    fontWeight: "600",
  },

  /*
   * QUESTION
   */

  questionCard: {
    padding: 17,

    borderRadius: 21,

    marginBottom: 16,

    backgroundColor: Colors.surface,

    borderWidth: 1,

    borderColor: Colors.border,
  },

  questionLabel: {
    color: Colors.primary,

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1.3,
  },

  question: {
    marginTop: 7,

    color: Colors.text,

    fontSize: 17,

    lineHeight: 24,

    fontWeight: "900",
  },

  /*
   * COMMON GAME
   */

  gameSectionTitle: {
    flexDirection: "row",

    alignItems: "center",

    gap: 9,

    marginBottom: 12,
  },

  gameSectionEyebrow: {
    color: Colors.secondary,

    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 1.2,
  },

  gameSectionSubtitle: {
    marginTop: 2,

    color: Colors.textMuted,

    fontSize: 8,
  },

  primaryGameButton: {
    minHeight: 50,

    borderRadius: 17,

    marginTop: 14,

    paddingHorizontal: 17,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    backgroundColor: Colors.primary,
  },

  primaryGameButtonText: {
    color: Colors.surface,

    fontSize: 10,

    fontWeight: "900",

    letterSpacing: 0.8,
  },

  disabledButton: {
    opacity: 0.38,
  },

  /*
   * =====================================================
   * ARCHERY
   * =====================================================
   */

  archeryGame: {
    marginBottom: 18,
  },

  archeryControls: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 11,

    paddingHorizontal: 3,
  },

  archeryControl: {
    alignItems: "center",

    gap: 3,
  },

  archeryControlIcon: {
    position: "relative",

    width: 32,

    height: 32,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.primarySoft,
  },

  archeryControlNumber: {
    position: "absolute",

    top: -5,

    right: -5,

    width: 15,

    height: 15,

    borderRadius: 8,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.secondary,
  },

  archeryControlNumberText: {
    color: Colors.surface,

    fontSize: 6,

    fontWeight: "900",
  },

  archeryControlText: {
    color: Colors.textMuted,

    fontSize: 6,

    fontWeight: "800",
  },

  /*
   * FIELD
   */

  archeryField: {
    position: "relative",

    overflow: "hidden",

    borderRadius: 28,

    borderWidth: 1,

    borderColor: "#D8C18D",
  },

  archerySun: {
    position: "absolute",

    top: -65,

    left: "50%",

    marginLeft: -90,

    width: 180,

    height: 180,

    borderRadius: 90,

    backgroundColor: "rgba(255,255,255,0.34)",
  },

  archeryTreeOne: {
    position: "absolute",

    bottom: 118,

    left: 10,

    opacity: 0.64,
  },

  archeryTreeTwo: {
    position: "absolute",

    bottom: 128,

    right: 12,

    opacity: 0.62,
  },

  archeryGrass: {
    position: "absolute",

    bottom: 112,

    left: "50%",

    marginLeft: -15,

    opacity: 0.35,
  },

  targetsHeader: {
    position: "absolute",

    top: 14,

    left: 0,

    right: 0,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 5,
  },

  targetsHeaderText: {
    color: "#826C3F",

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1.3,
  },

  /*
   * TARGET
   */

  archeryTarget: {
    position: "absolute",

    padding: 8,

    borderRadius: 17,

    backgroundColor: AppTheme.surface,

    borderWidth: 2,

    borderColor: "rgba(157,132,76,0.24)",

    alignItems: "center",

    shadowColor: "#725F39",

    shadowOpacity: 0.07,

    shadowRadius: 4,

    shadowOffset: {
      width: 0,

      height: 2,
    },
  },

  archeryTargetWrong: {
    borderColor: Colors.secondary,

    backgroundColor: AppTheme.errorSurface,
  },

  archeryTargetCorrect: {
    borderColor: Colors.teal,

    backgroundColor: Colors.tealSoft,
  },

  archeryTargetTop: {
    width: "100%",

    minHeight: 42,

    alignItems: "center",

    justifyContent: "center",

    position: "relative",
  },

  bullseyeOuter: {
    width: 42,

    height: 42,

    borderRadius: 21,

    borderWidth: 5,

    borderColor: Colors.secondary,

    backgroundColor: AppTheme.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  bullseyeWrong: {
    borderColor: Colors.error,
  },

  bullseyeCorrect: {
    borderColor: Colors.teal,
  },

  bullseyeMiddle: {
    width: 25,

    height: 25,

    borderRadius: 13,

    borderWidth: 4,

    borderColor: Colors.accent,

    alignItems: "center",

    justifyContent: "center",
  },

  bullseyeCenter: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: Colors.secondary,
  },

  bullseyeCenterCorrect: {
    backgroundColor: AppTheme.primary,
  },

  archeryTargetNumber: {
    position: "absolute",

    top: -3,

    right: -1,

    width: 21,

    height: 21,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.primary,
  },

  archeryTargetNumberText: {
    color: Colors.surface,

    fontSize: 7,

    fontWeight: "900",
  },

  archeryTargetText: {
    marginTop: 4,

    color: Colors.text,

    textAlign: "center",

    fontSize: 7.8,

    lineHeight: 10.5,

    fontWeight: "700",
  },

  impactWrongBadge: {
    position: "absolute",

    bottom: -7,

    paddingHorizontal: 7,

    paddingVertical: 3,

    borderRadius: 999,

    flexDirection: "row",

    alignItems: "center",

    gap: 3,

    backgroundColor: Colors.error,
  },

  impactCorrectBadge: {
    position: "absolute",

    bottom: -7,

    paddingHorizontal: 7,

    paddingVertical: 3,

    borderRadius: 999,

    flexDirection: "row",

    alignItems: "center",

    gap: 3,

    backgroundColor: AppTheme.primary,
  },

  impactBadgeText: {
    color: Colors.surface,

    fontSize: 5,

    fontWeight: "900",
  },

  /*
   * TRAJECTORY
   */

  trajectoryDot: {
    position: "absolute",

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: AppTheme.primary,

    zIndex: 12,
  },

  trajectoryCrosshair: {
    position: "absolute",

    width: 28,

    height: 28,

    zIndex: 13,

    alignItems: "center",

    justifyContent: "center",
  },

  /*
   * FLIGHT
   */

  flightArrow: {
    position: "absolute",

    width: 36,

    height: 48,

    zIndex: 30,

    alignItems: "center",

    justifyContent: "center",
  },

  /*
   * BOW
   */

  bowStation: {
    position: "absolute",

    width: 124,

    minHeight: 95,

    alignItems: "center",

    zIndex: 20,
  },

  powerTrack: {
    width: 98,

    height: 5,

    borderRadius: 999,

    overflow: "hidden",

    backgroundColor: "rgba(97,75,41,0.18)",
  },

  powerFill: {
    height: "100%",

    borderRadius: 999,

    backgroundColor: Colors.secondary,
  },

  powerText: {
    marginTop: 3,

    color: "#725D38",

    fontSize: 5.5,

    fontWeight: "900",

    letterSpacing: 0.6,
  },

  bowGestureArea: {
    position: "relative",

    marginTop: 5,

    width: 90,

    height: 76,

    alignItems: "center",

    justifyContent: "center",
  },

  bowBase: {
    width: 63,

    height: 63,

    borderRadius: 32,

    backgroundColor: AppTheme.surface,

    borderWidth: 3,

    borderColor: "#B99857",

    alignItems: "center",

    justifyContent: "center",

    shadowColor: "#6E542D",

    shadowOpacity: 0.13,

    shadowRadius: 5,

    elevation: 3,
  },

  readyArrow: {
    position: "absolute",

    top: 4,

    left: "50%",

    marginLeft: -18,

    width: 36,

    height: 40,

    alignItems: "center",

    justifyContent: "center",
  },

  bowInstruction: {
    marginTop: 2,

    color: "#715E3E",

    fontSize: 6.5,

    fontWeight: "800",

    textAlign: "center",
  },

  /*
   * MISS
   */

  missMessage: {
    position: "absolute",

    left: 18,

    right: 18,

    bottom: 12,

    minHeight: 42,

    paddingHorizontal: 11,

    borderRadius: 14,

    backgroundColor: AppTheme.surface,

    borderWidth: 1,

    borderColor: "#D5B982",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

    zIndex: 40,
  },

  missMessageText: {
    flex: 1,

    color: "#725C39",

    fontSize: 8,

    lineHeight: 12,

    fontWeight: "800",
  },

  /*
   * HINT
   */

  archeryHint: {
    marginTop: 11,

    padding: 13,

    borderRadius: 18,

    flexDirection: "row",

    gap: 10,

    backgroundColor: Colors.secondarySoft,

    borderWidth: 1,

    borderColor: AppTheme.error,
  },

  archeryHintIcon: {
    width: 37,

    height: 37,

    borderRadius: 13,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.surface,
  },

  archeryHintLabel: {
    color: Colors.secondary,

    fontSize: 6,

    fontWeight: "900",

    letterSpacing: 1,
  },

  archeryHintText: {
    marginTop: 3,

    color: Colors.text,

    fontSize: 9,

    lineHeight: 14,

    fontWeight: "700",
  },

  archeryHintRetry: {
    marginTop: 6,

    color: AppTheme.primary,

    fontSize: 7,

    fontWeight: "900",
  },

  archeryAttemptRow: {
    marginTop: 8,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 5,
  },

  archeryAttemptText: {
    color: Colors.textMuted,

    fontSize: 6.5,

    fontWeight: "700",
  },

  /*
   * =====================================================
   * PLOT
   * =====================================================
   */

  plotGame: {
    marginBottom: 18,
  },

  plotMap: {
    position: "relative",

    padding: 14,

    borderRadius: 25,

    overflow: "hidden",

    borderWidth: 1,

    borderColor: "#DCCB9D",
  },

  plotRoad: {
    position: "absolute",

    top: 56,

    bottom: 53,

    left: 31,

    width: 7,

    borderRadius: 999,

    backgroundColor: "#C8B384",
  },

  plotStart: {
    alignSelf: "flex-start",

    minHeight: 34,

    marginBottom: 11,

    paddingHorizontal: 10,

    borderRadius: 999,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    backgroundColor: Colors.primary,

    zIndex: 2,
  },

  plotStartText: {
    color: Colors.surface,

    fontSize: 6.5,

    fontWeight: "900",
  },

  plotCheckpoint: {
    minHeight: 78,

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 9,

    zIndex: 2,
  },

  plotCheckpointNumber: {
    width: 36,

    height: 36,

    borderRadius: 18,

    marginRight: 10,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#F8F0DA",

    borderWidth: 3,

    borderColor: "#B7A477",
  },

  plotCheckpointFilled: {
    backgroundColor: AppTheme.primary,

    borderColor: Colors.surface,
  },

  plotCheckpointNumberText: {
    color: "#89784F",

    fontSize: 10,

    fontWeight: "900",
  },

  plotCheckpointNumberTextFilled: {
    color: Colors.surface,
  },

  plotSlot: {
    flex: 1,

    minHeight: 66,

    padding: 10,

    borderRadius: 15,

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.45)",

    borderWidth: 1,

    borderColor: "rgba(164,145,100,0.30)",
  },

  plotSlotFilled: {
    backgroundColor: Colors.surface,

    borderColor: Colors.teal,
  },

  plotSlotText: {
    color: Colors.text,

    fontSize: 9,

    lineHeight: 13,

    fontWeight: "800",
  },

  plotRemoveText: {
    marginTop: 4,

    color: Colors.textMuted,

    fontSize: 6.5,
  },

  plotEmpty: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  plotEmptyText: {
    color: "#9C906F",

    fontSize: 8,

    fontWeight: "800",
  },

  plotFinish: {
    alignSelf: "flex-start",

    marginTop: 2,

    minHeight: 34,

    paddingHorizontal: 10,

    borderRadius: 999,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    backgroundColor: Colors.primary,
  },

  plotFinishText: {
    color: Colors.surface,

    fontSize: 6.5,

    fontWeight: "900",
  },

  eventHeader: {
    marginTop: 14,

    marginBottom: 8,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",
  },

  eventHeaderTitle: {
    color: Colors.textMuted,

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1,
  },

  resetText: {
    color: Colors.secondary,

    fontSize: 8,

    fontWeight: "900",
  },

  eventChoices: {
    gap: 8,
  },

  eventStone: {
    minHeight: 52,

    padding: 11,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    gap: 9,

    backgroundColor: Colors.surface,

    borderWidth: 1,

    borderColor: Colors.border,
  },

  eventStoneText: {
    flex: 1,

    color: Colors.text,

    fontSize: 9,

    lineHeight: 13,

    fontWeight: "700",
  },

  /*
   * =====================================================
   * LANTERN
   * =====================================================
   */

  lanternGame: {
    marginBottom: 18,
  },

  darkManuscript: {
    position: "relative",

    padding: 18,

    borderRadius: 25,

    overflow: "hidden",

    minHeight: 235,
  },

  manuscriptLabel: {
    color: Colors.accent,

    fontSize: 7,

    fontWeight: "900",

    letterSpacing: 1.3,
  },

  manuscriptQuestion: {
    marginTop: 7,

    color: "rgba(255,255,255,0.78)",

    fontSize: 13,

    lineHeight: 19,

    fontWeight: "700",
  },

  lanternArea: {
    marginTop: 17,

    alignItems: "center",

    justifyContent: "center",
  },

  lanternGlow: {
    position: "absolute",

    width: 110,

    height: 110,

    borderRadius: 55,

    backgroundColor: "rgba(244,201,93,0.28)",
  },

  lanternCircle: {
    width: 76,

    height: 76,

    borderRadius: 38,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.07)",

    borderWidth: 2,

    borderColor: "rgba(255,255,255,0.12)",
  },

  lanternCircleActive: {
    backgroundColor: "rgba(244,201,93,0.13)",

    borderColor: Colors.accent,
  },

  lanternInstruction: {
    marginTop: 8,

    color: "rgba(255,255,255,0.53)",

    fontSize: 8,

    fontWeight: "800",
  },

  lanternChoices: {
    marginTop: 12,

    gap: 8,
  },

  lanternChoice: {
    minHeight: 56,

    padding: 10,

    borderRadius: 17,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    backgroundColor: Colors.surface,

    borderWidth: 1,

    borderColor: Colors.border,
  },

  lanternChoiceSelected: {
    borderColor: Colors.accent,

    backgroundColor: Colors.accentSoft,
  },

  lanternChoiceLetter: {
    width: 34,

    height: 34,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.primarySoft,
  },

  lanternChoiceLetterSelected: {
    backgroundColor: Colors.accent,
  },

  lanternChoiceLetterText: {
    color: Colors.primary,

    fontSize: 11,

    fontWeight: "900",
  },

  lanternChoiceLetterTextSelected: {
    color: Colors.text,
  },

  lanternChoiceText: {
    flex: 1,

    color: Colors.text,

    fontSize: 10,

    lineHeight: 14,

    fontWeight: "700",
  },

  /*
   * =====================================================
   * COMPASS
   * =====================================================
   */

  compassGame: {
    marginBottom: 18,
  },

  compassBoard: {
    borderRadius: 25,

    padding: 17,

    alignItems: "center",

    borderWidth: 1,

    borderColor: "#DCCB9D",
  },

  compassCircle: {
    width: 190,

    height: 190,

    borderRadius: 95,

    position: "relative",

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: AppTheme.surface,

    borderWidth: 7,

    borderColor: "#B6A16D",
  },

  compassInner: {
    width: 118,

    height: 118,

    borderRadius: 59,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 2,

    borderColor: "#D6C697",

    backgroundColor: AppTheme.surfaceSoft,
  },

  compassDirection: {
    position: "absolute",

    color: "#79683E",

    fontSize: 11,

    fontWeight: "900",
  },

  compassNorth: {
    top: 10,

    left: "50%",

    marginLeft: -4,
  },

  compassEast: {
    right: 13,

    top: "50%",

    marginTop: -7,
  },

  compassSouth: {
    bottom: 10,

    left: "50%",

    marginLeft: -4,
  },

  compassWest: {
    left: 13,

    top: "50%",

    marginTop: -7,
  },

  compassNeedle: {
    width: 12,

    height: 100,

    alignItems: "center",
  },

  needleTop: {
    width: 0,

    height: 0,

    borderLeftWidth: 6,

    borderRightWidth: 6,

    borderBottomWidth: 48,

    borderLeftColor: "transparent",

    borderRightColor: "transparent",

    borderBottomColor: Colors.secondary,
  },

  needleBottom: {
    width: 0,

    height: 0,

    borderLeftWidth: 5,

    borderRightWidth: 5,

    borderTopWidth: 42,

    borderLeftColor: "transparent",

    borderRightColor: "transparent",

    borderTopColor: Colors.primary,
  },

  compassCenter: {
    position: "absolute",

    width: 18,

    height: 18,

    borderRadius: 9,

    backgroundColor: Colors.accent,

    borderWidth: 3,

    borderColor: Colors.surface,
  },

  compassHint: {
    marginTop: 12,

    color: "#84754F",

    fontSize: 8,

    fontWeight: "800",
  },

  themeChoices: {
    marginTop: 12,

    gap: 8,
  },

  themeChoice: {
    minHeight: 58,

    padding: 10,

    borderRadius: 17,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    backgroundColor: Colors.surface,

    borderWidth: 1,

    borderColor: Colors.border,
  },

  themeChoiceSelected: {
    borderColor: Colors.primary,

    backgroundColor: Colors.primarySoft,
  },

  directionBadge: {
    width: 36,

    height: 36,

    borderRadius: 18,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.primarySoft,
  },

  directionBadgeSelected: {
    backgroundColor: Colors.primary,
  },

  themeChoiceText: {
    flex: 1,

    color: Colors.text,

    fontSize: 9.5,

    lineHeight: 14,

    fontWeight: "700",
  },

  themeChoiceTextSelected: {
    color: Colors.primary,

    fontWeight: "900",
  },

  /*
   * =====================================================
   * UGAT · FIRST SCROLL
   * =====================================================
   */

  ugatRunnerGame: {
    marginBottom: 18,
  },

  ugatRunnerHeader: {
    marginBottom: 10,
    padding: 13,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },

  ugatRunnerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ugatRunnerTitleCopy: {
    flex: 1,
  },

  ugatRunnerEyebrow: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  ugatRunnerSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.76)",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
  },

  ugatRunnerLives: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  ugatRunnerHud: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  ugatRunnerHudItem: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(247,215,122,0.27)",
  },

  ugatRunnerHudText: {
    color: Colors.surface,
    fontSize: 6.4,
    fontWeight: "900",
    letterSpacing: 0.35,
  },

  ugatRunnerMap: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 7,
    borderRadius: 17,
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  ugatRunnerMapStepWrap: {
    position: "relative",
    flex: 1,
    alignItems: "center",
  },

  ugatRunnerMapLine: {
    position: "absolute",
    top: 13,
    right: "50%",
    width: "100%",
    height: 3,
    backgroundColor: Colors.border,
  },

  ugatRunnerMapLineComplete: {
    backgroundColor: AppTheme.primary,
  },

  ugatRunnerMapNode: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    zIndex: 2,
  },

  ugatRunnerMapNodeComplete: {
    backgroundColor: AppTheme.primary,
    borderColor: Colors.teal,
  },

  ugatRunnerMapNodeCurrent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.primary,
  },

  ugatRunnerMapText: {
    marginTop: 3,
    color: Colors.textMuted,
    fontSize: 6,
    fontWeight: "900",
  },

  ugatRunnerMapTextCurrent: {
    color: Colors.primary,
  },

  ugatRunnerScene: {
    position: "relative",
    height: 390,
    marginBottom: 10,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#DCE5D1",
    borderWidth: 2,
    borderColor: AppTheme.border,
  },

  ugatRunnerBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.78,
  },

  ugatRunnerBackdropShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(33,70,55,0.2)",
  },

  ugatRunnerTrailSvg: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  ugatRunnerCoin: {
    position: "absolute",
    left: "56%",
    bottom: 62,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: "#FFF5C8",
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },

  ugatRunnerGate: {
    position: "absolute",
    right: 14,
    bottom: 31,
    width: 54,
    alignItems: "center",
  },

  ugatRunnerGateTop: {
    width: 45,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.accent,
  },

  ugatRunnerGateText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: "900",
  },

  ugatRunnerGatePosts: {
    width: 48,
    height: 41,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  ugatRunnerGatePost: {
    width: 6,
    height: 41,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: Colors.primaryDark,
    borderWidth: 1,
    borderColor: Colors.accent,
  },

  ugatRunnerChild: {
    position: "absolute",
    left: "50%",
    bottom: 14,
    marginLeft: -31,
    width: 62,
    height: 78,
    zIndex: 9,
  },

  ugatRunnerSceneLabel: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: AppTheme.overlay,
    borderWidth: 1,
    borderColor: "rgba(247,215,122,0.55)",
    zIndex: 10,
  },

  ugatRunnerSceneLabelText: {
    color: Colors.surface,
    fontSize: 7.2,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  ugatRunnerInstruction: {
    minHeight: 42,
    marginBottom: 9,
    paddingHorizontal: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.secondarySoft,
    borderWidth: 1,
    borderColor: AppTheme.error,
  },

  ugatRunnerInstructionText: {
    flex: 1,
    color: Colors.text,
    fontSize: 8.2,
    lineHeight: 12,
    fontWeight: "800",
  },

  ugatRootChoiceWrap: {
    position: "absolute",
    width: "44%",
    height: 84,
    zIndex: 8,
  },

  ugatRootChoiceTopLeft: {
    top: 55,
    left: 10,
  },

  ugatRootChoiceTopRight: {
    top: 55,
    right: 10,
  },

  ugatRootChoiceBottomLeft: {
    top: 151,
    left: 10,
  },

  ugatRootChoiceBottomRight: {
    top: 151,
    right: 10,
  },

  ugatRootChoice: {
    flex: 1,
    padding: 8,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: AppTheme.surface,
    borderWidth: 2,
    borderColor: AppTheme.border,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  ugatRootChoiceSelected: {
    backgroundColor: AppTheme.selected,
    borderColor: Colors.primary,
  },

  ugatRootChoiceWrong: {
    backgroundColor: AppTheme.errorSurface,
    borderColor: Colors.error,
  },

  ugatRootChoiceSign: {
    width: 31,
    height: 31,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 2,
    borderColor: AppTheme.border,
    transform: [{ rotate: "-2deg" }],
  },

  ugatRootChoiceSignSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.accent,
  },

  ugatRootChoiceSignWrong: {
    backgroundColor: Colors.error,
    borderColor: Colors.surface,
  },

  ugatRootChoiceLetter: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
  },

  ugatRootChoiceLetterSelected: {
    color: Colors.accent,
  },

  ugatRootChoiceText: {
    flex: 1,
    color: Colors.text,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "800",
  },

  ugatRootChoiceTextSelected: {
    color: Colors.primary,
    fontWeight: "900",
  },

  ugatRunnerChoices: {
    gap: 8,
  },

  ugatRunnerChoice: {
    minHeight: 61,
    padding: 9,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 5,
    borderLeftColor: AppTheme.border,
  },

  ugatRunnerChoiceSelected: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.primary,
    borderLeftColor: Colors.secondary,
  },

  ugatRunnerChoiceSign: {
    width: 39,
    height: 39,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 2,
    borderColor: AppTheme.border,
    transform: [{ rotate: "-2deg" }],
  },

  ugatRunnerChoiceSignSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.accent,
  },

  ugatRunnerChoiceLetter: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  ugatRunnerChoiceLetterSelected: {
    color: Colors.accent,
  },

  ugatRunnerChoiceText: {
    flex: 1,
    color: Colors.text,
    fontSize: 9.5,
    lineHeight: 14,
    fontWeight: "700",
  },

  ugatRunnerChoiceTextSelected: {
    color: Colors.primary,
    fontWeight: "900",
  },

  ugatFirstScrollGame: {
    marginBottom: 18,
  },

  ugatDropTarget: {
    position: "relative",
    minHeight: 106,
    marginBottom: 9,
    padding: 12,
    paddingRight: 74,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    overflow: "hidden",
  },

  ugatDropTargetIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  ugatDropTargetCopy: {
    flex: 1,
  },

  ugatDropTargetEyebrow: {
    marginBottom: 2,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  ugatDropTargetLabel: {
    color: Colors.primary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },

  ugatDropTargetLabelDark: {
    color: Colors.surface,
  },

  ugatDropTargetInstruction: {
    marginTop: 3,
    color: Colors.textMuted,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: "700",
  },

  ugatDropTargetInstructionDark: {
    color: "rgba(255,255,255,0.72)",
  },

  ugatDropArrow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 67,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.28)",
  },

  ugatDropArrowText: {
    maxWidth: 48,
    fontSize: 6.5,
    lineHeight: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    textAlign: "center",
  },

  ugatDragInstructionRow: {
    minHeight: 36,
    marginBottom: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  ugatDragInstructionText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "800",
  },

  ugatDragChoiceActive: {
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  ugatDragHandle: {
    width: 48,
    minHeight: 40,
    marginLeft: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  ugatDragHandleText: {
    marginTop: 1,
    color: Colors.textMuted,
    fontSize: 5.8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  ugatDragHandleTextActive: {
    color: Colors.primary,
  },

  ugatGameHeader: {
    marginBottom: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },

  ugatGameHeading: {
    flex: 1,
  },

  memoryCoinHeader: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },

  routeHeader: {
    backgroundColor: AppTheme.surfaceSoft,
    borderColor: AppTheme.border,
  },

  familyTreeHeader: {
    backgroundColor: Colors.tealSoft,
    borderColor: Colors.teal,
  },

  checkpointHeader: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },

  checkpointTitleText: {
    color: Colors.accent,
  },

  checkpointSubtitleText: {
    color: "rgba(255,255,255,0.72)",
  },

  memoryCoinTrack: {
    flexDirection: "row",
    gap: 8,
  },

  memoryCoinSlot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  memoryCoinSlotCollected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.primary,
  },

  memoryChoice: {
    minHeight: 58,
    padding: 10,
    borderRadius: 17,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  memoryChoiceSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.tealSoft,
  },

  memoryChoiceLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  memoryChoiceLetterSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },

  memoryChoiceLetterText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  memoryChoiceLetterTextSelected: {
    color: Colors.surface,
  },

  memoryChoiceText: {
    flex: 1,
    color: Colors.text,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },

  memoryChoiceTextSelected: {
    color: Colors.primary,
    fontWeight: "900",
  },

  ugatChoiceContent: {
    flex: 1,
  },

  ugatChoiceLabel: {
    marginBottom: 3,
    color: Colors.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  routeProgress: {
    flexDirection: "row",
    alignItems: "center",
  },

  routeProgressLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 7,
    backgroundColor: AppTheme.border,
  },

  routeStamp: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  routeChoice: {
    minHeight: 62,
    marginBottom: 8,
    padding: 10,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.border,
  },

  routeChoiceSelected: {
    backgroundColor: AppTheme.surfaceSoft,
    borderColor: Colors.secondary,
  },

  routePin: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppTheme.surfaceSoft,
  },

  routePinSelected: {
    backgroundColor: Colors.secondary,
  },

  familyTreeProgress: {
    position: "relative",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 3,
  },

  familyTreeTrunk: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    height: 3,
    backgroundColor: AppTheme.primary,
  },

  familyTreeNode: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.teal,
  },

  familyTreeNodeComplete: {
    backgroundColor: AppTheme.primary,
  },

  familyChoice: {
    minHeight: 76,
    marginBottom: 8,
    padding: 10,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  familyChoiceSelected: {
    backgroundColor: Colors.tealSoft,
    borderColor: Colors.teal,
  },

  familyPortrait: {
    width: 48,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 2,
    borderColor: Colors.surface,
  },

  familyPortraitSelected: {
    backgroundColor: AppTheme.primary,
  },

  familyChoiceText: {
    flex: 1,
    color: Colors.text,
    fontSize: 11,
    fontWeight: "900",
  },

  checkpointBanner: {
    minHeight: 35,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(247,215,122,0.35)",
  },

  checkpointBannerText: {
    flex: 1,
    color: Colors.accent,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  checkpointChoice: {
    minHeight: 70,
    marginBottom: 8,
    padding: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 5,
    borderLeftColor: Colors.primary,
  },

  checkpointChoiceSelected: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.secondary,
    borderLeftColor: Colors.secondary,
  },

  checkpointSign: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  checkpointSignSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },

  ugatSharedScrollGame: {
    marginBottom: 18,
  },

  ugatSharedHeader: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },

  ugatPathHeader: {
    backgroundColor: AppTheme.surfaceSoft,
    borderColor: AppTheme.border,
  },

  treeFinaleHeader: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },

  treeFinaleTitle: {
    color: Colors.accent,
  },

  treeFinaleSubtitle: {
    color: "rgba(255,255,255,0.72)",
  },

  ugatPathProgress: {
    flexDirection: "row",
    marginTop: 2,
  },

  treeFinaleProgress: {
    flexDirection: "row",
    marginTop: 2,
    paddingVertical: 3,
  },

  ugatProgressStepWrap: {
    position: "relative",
    flex: 1,
    alignItems: "center",
  },

  ugatProgressConnector: {
    position: "absolute",
    top: 17,
    left: "-50%",
    width: "100%",
    height: 3,
    backgroundColor: Colors.border,
  },

  ugatProgressConnectorComplete: {
    backgroundColor: AppTheme.primary,
  },

  ugatProgressStep: {
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  ugatPathStep: {
    backgroundColor: Colors.surface,
    borderColor: AppTheme.border,
  },

  treeFinaleStep: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(247,215,122,0.55)",
  },

  ugatProgressStepComplete: {
    backgroundColor: AppTheme.primary,
    borderColor: Colors.teal,
  },

  ugatProgressStepCurrent: {
    borderColor: Colors.accent,
    borderWidth: 3,
  },

  ugatProgressStepText: {
    marginTop: 5,
    color: Colors.textMuted,
    fontSize: 6.5,
    fontWeight: "900",
    textAlign: "center",
  },

  treeFinaleStepText: {
    color: "rgba(255,255,255,0.68)",
  },

  ugatPathChoice: {
    minHeight: 70,
    marginBottom: 8,
    padding: 10,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.border,
    borderLeftWidth: 5,
    borderLeftColor: Colors.secondary,
  },

  ugatPathChoiceSelected: {
    backgroundColor: AppTheme.surfaceSoft,
    borderColor: Colors.secondary,
  },

  ugatPathSign: {
    width: 38,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  ugatPathSignSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },

  treeFinaleChoice: {
    minHeight: 72,
    marginBottom: 8,
    padding: 10,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  treeFinaleChoiceSelected: {
    backgroundColor: Colors.tealSoft,
    borderColor: Colors.teal,
  },

  treeFinaleLeaf: {
    width: 42,
    height: 42,
    borderTopLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.teal,
  },

  treeFinaleLeafSelected: {
    backgroundColor: AppTheme.primary,
  },

  treeFinaleChoiceLabel: {
    color: Colors.secondary,
  },

  /*
   * =====================================================
   * STANDARD
   * =====================================================
   */

  standardGame: {
    marginBottom: 18,
  },

  standardChoice: {
    minHeight: 58,

    padding: 10,

    borderRadius: 17,

    marginBottom: 8,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    backgroundColor: Colors.surface,

    borderWidth: 1,

    borderColor: Colors.border,
  },

  standardChoiceSelected: {
    borderColor: Colors.primary,

    backgroundColor: Colors.primarySoft,
  },

  standardChoiceNumber: {
    width: 36,

    height: 36,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.primarySoft,
  },

  standardChoiceNumberSelected: {
    backgroundColor: Colors.primary,
  },

  standardChoiceNumberText: {
    color: Colors.primary,

    fontSize: 11,

    fontWeight: "900",
  },

  standardChoiceNumberTextSelected: {
    color: Colors.surface,
  },

  standardChoiceText: {
    flex: 1,

    color: Colors.text,

    fontSize: 10,

    lineHeight: 14,

    fontWeight: "700",
  },

  standardChoiceTextSelected: {
    color: Colors.primary,

    fontWeight: "900",
  },

  /*
   * FEEDBACK
   */

  feedbackCard: {
    marginTop: 8,

    padding: 16,

    borderRadius: 22,

    borderWidth: 1,
  },

  feedbackCorrect: {
    backgroundColor: Colors.tealSoft,

    borderColor: AppTheme.success,
  },

  feedbackWrong: {
    backgroundColor: Colors.secondarySoft,

    borderColor: AppTheme.error,
  },

  feedbackHeader: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  feedbackIcon: {
    width: 45,

    height: 45,

    borderRadius: 15,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: Colors.surface,
  },

  feedbackTitle: {
    fontSize: 14,

    fontWeight: "900",
  },

  xpReward: {
    marginTop: 2,

    color: Colors.textMuted,

    fontSize: 8,

    fontWeight: "800",
  },

  feedbackBody: {
    marginTop: 11,

    color: Colors.text,

    fontSize: 10,

    lineHeight: 16,

    fontWeight: "600",
  },

  continueButton: {
    marginTop: 14,

    minHeight: 49,

    paddingHorizontal: 15,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    backgroundColor: AppTheme.primary,
  },

  continueButtonText: {
    color: Colors.surface,

    fontSize: 9,

    fontWeight: "900",

    letterSpacing: 0.6,
  },

  retryButton: {
    marginTop: 14,

    minHeight: 48,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

    backgroundColor: Colors.surface,

    borderWidth: 1,

    borderColor: AppTheme.error,
  },

  retryButtonText: {
    color: Colors.secondary,

    fontSize: 9,

    fontWeight: "900",
  },

  /*
   * ERROR
   */

  errorScreen: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    padding: 30,

    backgroundColor: Colors.background,
  },

  errorTitle: {
    marginTop: 12,

    color: Colors.text,

    fontSize: 18,

    fontWeight: "900",
  },

  errorButton: {
    marginTop: 18,

    paddingHorizontal: 22,

    paddingVertical: 12,

    borderRadius: 15,

    backgroundColor: Colors.primary,
  },

  errorButtonText: {
    color: Colors.surface,

    fontSize: 10,

    fontWeight: "900",
  },

  pressed: {
    opacity: 0.83,

    transform: [
      {
        scale: 0.97,
      },
    ],
  },
});

export default styles;
