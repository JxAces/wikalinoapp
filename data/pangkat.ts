export const PANGKAT_OPTIONS = [
  "Pangkat 7",
  "Pangkat 8",
  "Pangkat 9",
  "Pangkat 10",
] as const;

export type PangkatOption =
  (typeof PANGKAT_OPTIONS)[number];