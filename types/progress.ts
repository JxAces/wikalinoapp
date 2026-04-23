export type ContinueProgress = {
  markahan: number;
  challengeId: string;
  challengeIndex: number;
  isCompleted: boolean;
};

export type AppProgress = {
  lastPlayed?: ContinueProgress | null;
  completedChallengeIds: string[];
};
