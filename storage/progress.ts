import type { AppProgress, ContinueProgress } from "@/types/progress";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROGRESS_KEY = "wikalino_progress";

const DEFAULT_PROGRESS: AppProgress = {
  lastPlayed: null,
  completedChallengeIds: [],
};

export async function getProgress(): Promise<AppProgress> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);

    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    return {
      ...DEFAULT_PROGRESS,
      ...JSON.parse(raw),
    };
  } catch (error) {
    console.log("Failed to get progress:", error);
    return DEFAULT_PROGRESS;
  }
}

export async function saveProgress(progress: AppProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.log("Failed to save progress:", error);
  }
}

export async function saveLastPlayed(
  lastPlayed: ContinueProgress,
): Promise<void> {
  const current = await getProgress();

  await saveProgress({
    ...current,
    lastPlayed,
  });
}

export async function markChallengeCompleted(
  challengeId: string,
): Promise<void> {
  const current = await getProgress();

  const completed = current.completedChallengeIds.includes(challengeId)
    ? current.completedChallengeIds
    : [...current.completedChallengeIds, challengeId];

  await saveProgress({
    ...current,
    completedChallengeIds: completed,
  });
}

export async function clearLastPlayed(): Promise<void> {
  const current = await getProgress();

  await saveProgress({
    ...current,
    lastPlayed: null,
  });
}
