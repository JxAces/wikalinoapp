import type { Story } from "@/data/stories";

export type StoryWorldPosition = {
  x: number;
  z: number;
};

export type StoryPortalState = "completed" | "current" | "locked";

export type StoryWorldPortal = {
  id?: string;
  activityIndex?: number;
  questionGroup?: { index: number; start: number; end: number; answeredCount: number };
  position: StoryWorldPosition;
  state: StoryPortalState;
  story: Story;
};

export type StoryWorldInput = {
  x: number;
  y: number;
};

export type StoryWorldStatus = {
  animation: "Idle" | "Walk";
  nearestStoryId: string | null;
};
