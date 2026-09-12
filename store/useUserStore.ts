import { canAnswerQuestion, isStoryAnswered } from "../components/story-world/quest-progression";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

import {
  getStoryById,
  getStoriesByMarkahan,
} from "../data/stories";

import {
  getChallengesByMarkahan,
} from "../data/markahan";
import {
  DEFAULT_PLAYER_CHARACTER,
  isPlayerCharacterId,
  type PlayerCharacterId,
} from "../data/player-characters";

const USER_STORE_STORAGE_KEY = "wikalino-user-store";

const emptyUserData = () => ({
  profile: null,

  xp: 0,

  completedStoryIds: [],

  readingCompletedStoryIds: [],

  storySceneIndexes: {},

  activityResults: {},

  unlockedCollectibleIds: [],

  lastStoryId: null,

  completedChallengeIds: [],

  lastPlayed: null,
});

/*
 * ---------------------------------------------------------
 * LEGACY V1
 * ---------------------------------------------------------
 */

export type LastPlayed = {
  markahan: number;
  challengeId: string;
  challengeIndex: number;
  isCompleted: boolean;
} | null;

/*
 * ---------------------------------------------------------
 * V2
 * ---------------------------------------------------------
 */

export type UserProfile = {
  fullName: string;
  pangkat: string;
  avatar?: string;
  character: PlayerCharacterId;
};

export type ActivityResult = {
  storyId: string;
  activityId: string;

  attempts: number;
  firstTryCorrect: boolean;

  xpEarned: number;

  completedAt: string;
};

type UserStore = {
  /*
   * PROFILE
   */

  profile: UserProfile | null;

  setProfile: (
    profile: UserProfile,
  ) => void;

  updateProfile: (
    payload: Partial<UserProfile>,
  ) => void;

  clearProfile: () => void;

  /*
   * V2 GAME DATA
   */

  xp: number;

  completedStoryIds: string[];

  readingCompletedStoryIds: string[];

  storySceneIndexes: Record<
    string,
    number
  >;

  activityResults: Record<
    string,
    ActivityResult
  >;

  unlockedCollectibleIds: string[];

  lastStoryId: string | null;

  setStoryScene: (
    storyId: string,
    sceneIndex: number,
  ) => void;

  completeStoryReading: (
    storyId: string,
  ) => void;

  completeActivity: (payload: {
    storyId: string;
    activityId: string;
    attempts: number;
    firstTryCorrect: boolean;
    xpReward: number;
  }) => void;

  completeStory: (
    storyId: string,
  ) => void;

  isStoryCompleted: (
    storyId: string,
  ) => boolean;

  getStoryStars: (
    storyId: string,
  ) => number;

  getCompletedStoryCountByMarkahan: (
    markahan: number,
  ) => number;

  clearGameProgress: () => void;

  /*
   * LEGACY V1
   */

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

  isChallengeCompleted: (
    challengeId: string,
  ) => boolean;

  getCompletedCountByMarkahan: (
    markahan: number,
  ) => number;

  getNextUnfinishedChallenge: (
    markahan: number,
  ) => {
    challengeId: string;
    challengeIndex: number;
  } | null;

  clearProgress: () => void;

  clearAllData: () => void;

  deleteAccount: () => Promise<void>;
};

export const useUserStore =
  create<UserStore>()(
    persist(
      (set, get) => ({
        /*
         * PROFILE
         */

        profile: null,

        setProfile: (profile) =>
          set({
            profile,
          }),

        updateProfile: (payload) =>
          set((state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  ...payload,
                }
              : null,
          })),

        clearProfile: () =>
          set({
            profile: null,
          }),

        /*
         * V2
         */

        xp: 0,

        completedStoryIds: [],

        readingCompletedStoryIds: [],

        storySceneIndexes: {},

        activityResults: {},

        unlockedCollectibleIds: [],

        lastStoryId: null,

        setStoryScene: (
          storyId,
          sceneIndex,
        ) =>
          set((state) => ({
            storySceneIndexes: {
              ...state.storySceneIndexes,
              [storyId]: sceneIndex,
            },

            lastStoryId: storyId,
          })),

        completeStoryReading: (
          storyId,
        ) =>
          set((state) => {
            if (
              state.readingCompletedStoryIds.includes(
                storyId,
              )
            ) {
              return {
                lastStoryId: storyId,
              };
            }

            const story =
              getStoryById(storyId);

            return {
              readingCompletedStoryIds: [
                ...state.readingCompletedStoryIds,
                storyId,
              ],

              xp:
                state.xp +
                (story?.readingXp ?? 0),

              lastStoryId: storyId,
            };
          }),

        completeActivity: ({
          storyId,
          activityId,
          attempts,
          firstTryCorrect,
          xpReward,
        }) =>
          set((state) => {
            const story = getStoryById(storyId);
            const index = story?.activities.findIndex(activity => activity.id === activityId) ?? -1;
            if (!story || !state.readingCompletedStoryIds.includes(storyId) || !canAnswerQuestion(story, index, state.activityResults)) return state;
            /*
             * Prevent XP farming by repeatedly
             * completing the same activity.
             */

            if (
              state.activityResults[
                activityId
              ]
            ) {
              return state;
            }

            const firstTryBonus =
              firstTryCorrect ? 5 : 0;

            const xpEarned =
              xpReward + firstTryBonus;

            return {
              activityResults: {
                ...state.activityResults,

                [activityId]: {
                  storyId,
                  activityId,
                  attempts,
                  firstTryCorrect,
                  xpEarned,
                  completedAt:
                    new Date().toISOString(),
                },
              },

              xp:
                state.xp + xpEarned,

              lastStoryId: storyId,
            };
          }),

        completeStory: (storyId) =>
          set((state) => {
            if (
              state.completedStoryIds.includes(
                storyId,
              )
            ) {
              return state;
            }

            const story =
              getStoryById(storyId);

            if (!story || !isStoryAnswered(story, state.activityResults)) {
              return state;
            }

            const collectibleId =
              story.collectible.id;

            return {
              completedStoryIds: [
                ...state.completedStoryIds,
                storyId,
              ],

              unlockedCollectibleIds:
                state.unlockedCollectibleIds.includes(
                  collectibleId,
                )
                  ? state.unlockedCollectibleIds
                  : [
                      ...state.unlockedCollectibleIds,
                      collectibleId,
                    ],

              xp:
                state.xp +
                story.completionXp,

              lastStoryId: storyId,
            };
          }),

        isStoryCompleted: (
          storyId,
        ) =>
          get().completedStoryIds.includes(
            storyId,
          ),

        getStoryStars: (
          storyId,
        ) => {
          const story =
            getStoryById(storyId);

          if (!story) {
            return 0;
          }

          const results =
            story.activities
              .map(
                (activity) =>
                  get().activityResults[
                    activity.id
                  ],
              )
              .filter(Boolean);

          if (
            results.length <
            story.activities.length
          ) {
            return 0;
          }

          const firstTryCount =
            results.filter(
              (result) =>
                result.firstTryCorrect,
            ).length;

          const rate =
            firstTryCount /
            story.activities.length;

          if (rate >= 0.9) {
            return 3;
          }

          if (rate >= 0.75) {
            return 2;
          }

          return 1;
        },

        getCompletedStoryCountByMarkahan:
          (markahan) => {
            const stories =
              getStoriesByMarkahan(
                markahan,
              );

            return stories.filter(
              (story) =>
                get().completedStoryIds.includes(
                  story.id,
                ),
            ).length;
          },

        clearGameProgress: () =>
          set({
            xp: 0,

            completedStoryIds: [],

            readingCompletedStoryIds: [],

            storySceneIndexes: {},

            activityResults: {},

            unlockedCollectibleIds: [],

            lastStoryId: null,
          }),

        /*
         * -------------------------------------------------
         * LEGACY V1
         * -------------------------------------------------
         */

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

        completeChallenge: ({
          markahan,
          challengeId,
          challengeIndex,
        }) =>
          set((state) => {
            const alreadyDone =
              state.completedChallengeIds.includes(
                challengeId,
              );

            return {
              completedChallengeIds:
                alreadyDone
                  ? state.completedChallengeIds
                  : [
                      ...state.completedChallengeIds,
                      challengeId,
                    ],

              lastPlayed: {
                markahan,
                challengeId,
                challengeIndex,
                isCompleted: true,
              },
            };
          }),

        isChallengeCompleted: (
          challengeId,
        ) =>
          get().completedChallengeIds.includes(
            challengeId,
          ),

        getCompletedCountByMarkahan:
          (markahan) => {
            const challenges =
              getChallengesByMarkahan(
                markahan,
              );

            const completedIds =
              get().completedChallengeIds;

            return challenges.filter(
              (item) =>
                completedIds.includes(
                  item.id,
                ),
            ).length;
          },

        getNextUnfinishedChallenge:
          (markahan) => {
            const challenges =
              getChallengesByMarkahan(
                markahan,
              );

            const completedIds =
              get().completedChallengeIds;

            const nextIndex =
              challenges.findIndex(
                (challenge) =>
                  !completedIds.includes(
                    challenge.id,
                  ),
              );

            if (nextIndex === -1) {
              return null;
            }

            return {
              challengeId:
                challenges[nextIndex].id,

              challengeIndex:
                nextIndex,
            };
          },

        clearProgress: () =>
          set({
            completedChallengeIds: [],
            lastPlayed: null,
          }),

        clearAllData: () =>
          set(emptyUserData()),

        deleteAccount: async () => {
          set(emptyUserData());

          await AsyncStorage.removeItem(
            USER_STORE_STORAGE_KEY,
          );
        },
      }),

      {
        name: USER_STORE_STORAGE_KEY,

        version: 3,

        storage: createJSONStorage(
          () => AsyncStorage,
        ),

        migrate: (
          persistedState: any,
        ) => {
          const state =
            persistedState ?? {};

          /*
           * Removes the old avatar requirement
           * without destroying existing profile
           * or V1 progress.
           */

          const oldProfile =
            state.profile;

          return {
            ...state,

            profile: oldProfile
              ? {
                  fullName:
                    oldProfile.fullName ??
                    "",

                  pangkat:
                    oldProfile.pangkat ??
                    "",

                  avatar:
                    oldProfile.avatar,

                  character:
                    isPlayerCharacterId(
                      oldProfile.character,
                    )
                      ? oldProfile.character
                      : DEFAULT_PLAYER_CHARACTER,
                }
              : null,

            xp: state.xp ?? 0,

            completedStoryIds:
              state.completedStoryIds ??
              [],

            readingCompletedStoryIds:
              state.readingCompletedStoryIds ??
              [],

            storySceneIndexes:
              state.storySceneIndexes ??
              {},

            activityResults:
              state.activityResults ??
              {},

            unlockedCollectibleIds:
              state.unlockedCollectibleIds ??
              [],

            lastStoryId:
              state.lastStoryId ?? null,
          };
        },
      },
    ),
  );
