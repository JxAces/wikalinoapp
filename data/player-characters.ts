export const PLAYER_CHARACTER_OPTIONS = [
  {
    description: "Puting uniporme, itim na pantalon at sapatos.",
    id: "student",
    title: "1",
  },
  {
    description: "Puting blusa, asul na palda at laso, at itim na sapatos.",
    id: "student-girl",
    title: "2",
  },
  {
    description: "Katutubong manlalakbay para sa mundo ng mga kuwento.",
    id: "indigenous",
    title: "3",
  },
  {
    description: "Manlalakbay na may tradisyonal na kasuotang Muslim.",
    id: "muslim",
    title: "4",
  },
  {
    description: "Batang Pilipino na may salakot at pulang kasuotan.",
    id: "batang-pinoy",
    title: "5",
  },
] as const;

export type PlayerCharacterId = (typeof PLAYER_CHARACTER_OPTIONS)[number]["id"];

export const DEFAULT_PLAYER_CHARACTER: PlayerCharacterId = "student";

export function isPlayerCharacterId(value: unknown): value is PlayerCharacterId {
  return PLAYER_CHARACTER_OPTIONS.some((character) => character.id === value);
}
