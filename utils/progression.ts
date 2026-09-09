export type LevelInfo = {
  level: number;
  title: string;
  minXp: number;
};

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    title: "Bagong Mambabasa",
    minXp: 0,
  },
  {
    level: 2,
    title: "Mapanuring Mambabasa",
    minXp: 200,
  },
  {
    level: 3,
    title: "Tagasuri ng Kwento",
    minXp: 500,
  },
  {
    level: 4,
    title: "Dalubhasa sa Kwento",
    minXp: 900,
  },
  {
    level: 5,
    title: "Maestro ng Panitikan",
    minXp: 1400,
  },
];

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];

  for (const level of LEVELS) {
    if (xp >= level.minXp) {
      current = level;
    }
  }

  const currentIndex = LEVELS.findIndex(
    (item) => item.level === current.level,
  );

  const next = LEVELS[currentIndex + 1] ?? null;

  const progress = next
    ? Math.min(
        100,
        Math.round(
          ((xp - current.minXp) /
            (next.minXp - current.minXp)) *
            100,
        ),
      )
    : 100;

  return {
    ...current,
    next,
    progress,
  };
}