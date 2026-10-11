export const AppTheme = {
  backgroundGradient: ["#E2CFA8", "#E8D8B5", "#FFF4D8"] as const,
  background: "#E8D8B5",
  surface: "#FFFAEB",
  surfaceSoft: "#F5E8C8",
  panel: "#EFDEB8",
  panelStrong: "#E2CFA8",
  text: "#35291F",
  muted: "#66513B",
  primary: "#805D29",
  border: "#BDA16A",
  selected: "#EFDAA5",
  buttonText: "#FFF4D8",
  success: "#526B3F",
  successSurface: "#E8E9CE",
  error: "#B64942",
  errorSurface: "#FAE2D8",
  overlay: "rgba(53,41,31,0.6)",
  dark: "#4C3825",
  darkText: "#FFF4D8",
};

export const Colors = {
  primary: AppTheme.primary,
  primaryDark: AppTheme.text,
  primarySoft: "#F1E5CE",

  secondary: "#765528",
  secondarySoft: "#EFE0BE",

  accent: "#F7D77A",
  accentSoft: "#FFF3C8",

  teal: "#A37A36",
  tealSoft: "#F4E8CE",

  background: AppTheme.background,
  surface: AppTheme.surface,

  text: AppTheme.text,
  textMuted: AppTheme.muted,

  border: AppTheme.border,

  success: AppTheme.success,
  error: AppTheme.error,

  locked: "#978668",
  lockedSoft: "#E5D9C1",
};
