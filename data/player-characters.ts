export const PLAYER_CHARACTER_OPTIONS = [
  {
    description: "Puting uniporme, itim na pantalon at sapatos.",
    id: "student",
    title: "Mag-aaral",
  },
  {
    description: "Masiglang kangaroo na tumatalon sa mundo ng mga kuwento.",
    id: "kangaroo",
    title: "Kangaroo",
  },
  {
    description: "Katutubong manlalakbay para sa mundo ng mga kuwento.",
    id: "indigenous",
    title: "Katutubong Explorer",
  },
  {
    description: "Manlalakbay na may tradisyonal na kasuotang Muslim.",
    id: "muslim",
    title: "Muslim Explorer",
  },
  {
    description: "Batang Pilipino na may salakot at pulang kasuotan.",
    id: "batang-pinoy",
    title: "Batang Pinoy",
  },
] as const;

export type PlayerCharacterId = (typeof PLAYER_CHARACTER_OPTIONS)[number]["id"];

export const DEFAULT_PLAYER_CHARACTER: PlayerCharacterId = "student";

export function isPlayerCharacterId(value: unknown): value is PlayerCharacterId {
  return PLAYER_CHARACTER_OPTIONS.some((character) => character.id === value);
}
