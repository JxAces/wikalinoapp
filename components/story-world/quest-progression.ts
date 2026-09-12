import type { Story } from "@/data/stories";
import type { StoryWorldPortal } from "./story-world.types";
import { STORY_WORLD_POSITIONS } from "./story-world.constants";

type Answers = Record<string, unknown>;

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
      position: STORY_WORLD_POSITIONS[index % STORY_WORLD_POSITIONS.length],
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
  "m1-story-1": { name: "Bakuran ng mga Pangarap", sky: 0xf3d8be, ground: 0xc8aa86, path: 0xf6dfb0, accent: 0xeab469 },
  "m1-story-2": { name: "Bayan ng mga Ugat", sky: 0xb9ced8, ground: 0x8b997d, path: 0xb4bdc1, accent: 0x83c7a0 },
  "m1-story-3": { name: "Paaralan ng Kahulugan", sky: 0xc5e4e6, ground: 0xc3b895, path: 0xe9ce93, accent: 0x69cbd5 },
} as const;

export function storySetting(storyId?: string) {
  return STORY_SETTINGS[storyId as keyof typeof STORY_SETTINGS];
}
