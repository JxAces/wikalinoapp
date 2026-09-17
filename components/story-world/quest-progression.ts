import { getAllStories, type Story } from "@/data/stories";
import type { StoryWorldPortal } from "./story-world.types";
import { QUESTION_SCROLL_POSITIONS, UGAT_SCROLL_POSITIONS, UGAT_STORY } from "./story-world.constants";

type Answers = Record<string, unknown>;

export function isWorldChestUnlocked(portals: StoryWorldPortal[]) {
  return portals.length > 0 && portals.every(portal => portal.state === "completed");
}

/** Portal prerequisites are temporarily disabled for exploring all worlds. */
export function canEnterStory(storyId: string, answers: Answers) {
  const stories = getAllStories();
  const index = stories.findIndex(story => story.id === storyId);
  // Restore this return to require every preceding story's tasks:
  // return index >= 0 && stories.slice(0, index).every(story => isStoryAnswered(story, answers));
  void answers; // Keep the shared signature for map, route and store callers.
  return index >= 0;
}

/** The activity cabinet and quiz scroll unlock after this story's reading. */
export function canOpenStoryActivities(storyId: string, readingCompleted: readonly string[], answers: Answers) {
  return canEnterStory(storyId, answers) && readingCompleted.includes(storyId);
}

export function isStoryAnswered(story: Story, answers: Answers) {
  return story.activities.length > 0 && story.activities.every(activity => Boolean(answers[activity.id]));
}

export function canAnswerQuestion(story: Story, index: number, answers: Answers) {
  return Number.isInteger(index) && index >= 0 && index < story.activities.length &&
    story.activities.slice(0, index).every(activity => Boolean(answers[activity.id]));
}

export const QUESTIONS_PER_SCROLL = 5;

export function questionGroup(story: Story, activityIndex: number) {
  const start = Math.floor(activityIndex / QUESTIONS_PER_SCROLL) * QUESTIONS_PER_SCROLL;
  return { start, end: Math.min(start + QUESTIONS_PER_SCROLL, story.activities.length), id: story.activities[start].id };
}

export function questionScrolls(story: Story, answers: Answers): StoryWorldPortal[] {
  const positions = story.id === UGAT_STORY ? UGAT_SCROLL_POSITIONS : QUESTION_SCROLL_POSITIONS;
  return Array.from({ length: Math.ceil(story.activities.length / QUESTIONS_PER_SCROLL) }, (_, index) => {
    const { start, end, id } = questionGroup(story, index * QUESTIONS_PER_SCROLL);
    const activities = story.activities.slice(start, end);
    const answeredCount = activities.filter(activity => Boolean(answers[activity.id])).length;
    const next = activities.findIndex(activity => !answers[activity.id]);
    return {
      id,
      activityIndex: next < 0 ? start : start + next,
      questionGroup: { index, start, end, answeredCount },
      story,
      position: positions[index % positions.length],
      state: next < 0 ? "completed" : canAnswerQuestion(story, start, answers) ? "current" : "locked",
    };
  });
}

export function scrollTitle(node: StoryWorldPortal) {
  const group = node.questionGroup;
  return group ? `Balumbon ${group.index + 1} · ${group.answeredCount}/${group.end - group.start} tama` : node.story.title;
}

export function worldNodeId(node: StoryWorldPortal) {
  return node.id ?? node.story.id;
}

export const STORY_SETTINGS = {
  "m1-story-1": { name: "Labirinto ng Sandaang Damit", sky: 0xf3d8be, ground: 0xc8aa86, path: 0xf6dfb0, accent: 0xeab469 },
  "m1-story-2": { name: "Gubat ng Magkakabuhol na Ugat", sky: 0x06141f, ground: 0x142e2b, path: 0x436d61, accent: 0x83c7a0 },
  "m1-story-3": { name: "Nayon ng mga Nakalimutang Kuwento", sky: 0xa7b2ac, ground: 0x777d70, path: 0xc5b794, accent: 0xcabb91 },
} as const;

export function storySetting(storyId?: string) {
  return STORY_SETTINGS[storyId as keyof typeof STORY_SETTINGS];
}
