import type { Story } from "@/data/stories";

export type StoryWorldPosition = {
  x: number;
  z: number;
};

export type StoryPortalState = "completed" | "current" | "locked";

export type StoryWorldPortal = {
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
