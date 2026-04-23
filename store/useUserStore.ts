import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getChallengesByMarkahan } from "../data/markahan";

export type LastPlayed = {
  markahan: number;
  challengeId: string;
  challengeIndex: number;
  isCompleted: boolean;
} | null;

type UserStore = {
  completedChallengeIds: string[];
  lastPlayed: LastPlayed;

  setLastPlayed: (payload: {
    markahan: number;
    challengeId: string;
    challengeIndex: number;
    isCompleted?: boolean;
  }) => void;

  completeChallenge: (payload: {
    markahan: number;
    challengeId: string;
    challengeIndex: number;
  }) => void;

  isChallengeCompleted: (challengeId: string) => boolean;

  getCompletedCountByMarkahan: (markahan: number) => number;

  getNextUnfinishedChallenge: (markahan: number) => {
    challengeId: string;
    challengeIndex: number;
  } | null;

  clearProgress: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      completedChallengeIds: [],
      lastPlayed: null,

      setLastPlayed: ({
        markahan,
        challengeId,
        challengeIndex,
        isCompleted = false,
      }) =>
        set({
          lastPlayed: {
            markahan,
            challengeId,
            challengeIndex,
            isCompleted,
          },
        }),

      completeChallenge: ({ markahan, challengeId, challengeIndex }) =>
        set((state) => {
          const alreadyDone = state.completedChallengeIds.includes(challengeId);

          return {
            completedChallengeIds: alreadyDone
              ? state.completedChallengeIds
              : [...state.completedChallengeIds, challengeId],
            lastPlayed: {
              markahan,
              challengeId,
              challengeIndex,
              isCompleted: true,
            },
          };
        }),

      isChallengeCompleted: (challengeId) => {
        return get().completedChallengeIds.includes(challengeId);
      },

      getCompletedCountByMarkahan: (markahan) => {
        const challenges = getChallengesByMarkahan(markahan);
        const completedIds = get().completedChallengeIds;

        return challenges.filter((item) => completedIds.includes(item.id))
          .length;
      },

      getNextUnfinishedChallenge: (markahan) => {
        const challenges = getChallengesByMarkahan(markahan);
        const completedIds = get().completedChallengeIds;

        const nextIndex = challenges.findIndex(
          (challenge) => !completedIds.includes(challenge.id),
        );

        if (nextIndex === -1) {
          return null;
        }

        return {
          challengeId: challenges[nextIndex].id,
          challengeIndex: nextIndex,
        };
      },

      clearProgress: () =>
        set({
          completedChallengeIds: [],
          lastPlayed: null,
        }),
    }),
    {
      name: "wikalino-user-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
