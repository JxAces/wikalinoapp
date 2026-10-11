import { getAllStories, type Story } from "@/data/stories";
import { needsWardrobeDressing } from "@/data/sandaang-wardrobe";
import { getCabinetActivities } from "@/data/cabinet-activities";
import type { StoryWorldPortal } from "./story-world.types";
import { QUESTION_SCROLL_POSITIONS, UGAT_SCROLL_POSITIONS, UGAT_STORY } from "./story-world.constants";

type Answers = Record<string, unknown>;
type CabinetProgress = Record<string, { storyId: string; completedAt: string | null } | undefined>;

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

/** Hasa-Wika unlocks after this story's reading. */
export function canOpenStoryActivities(storyId: string, readingCompleted: readonly string[], answers: Answers) {
  return canEnterStory(storyId, answers) && readingCompleted.includes(storyId);
}

/** Suri-Wika requires reading and explicit completion of every active Gawain. */
export function canOpenStoryQuiz(storyId: string, readingCompleted: readonly string[], answers: Answers, cabinetResponses: CabinetProgress) {
  if (!canOpenStoryActivities(storyId, readingCompleted, answers)) return false;
  const activities = getCabinetActivities(storyId);
  return activities.length > 0 && activities.every(activity => {
    const response = cabinetResponses[activity.id];
    return response?.storyId === storyId && Boolean(response.completedAt);
  });
}

export function isStoryAnswered(story: Story, answers: Answers) {
  return story.activities.length > 0 && story.activities.every(activity => Boolean(answers[activity.id]));
}

export function canAnswerQuestion(story: Story, index: number, answers: Answers) {
  return Number.isInteger(index) && index >= 0 && index < story.activities.length &&
    story.activities.slice(0, index).every(activity => Boolean(answers[activity.id]));
}

export const QUESTIONS_PER_SCROLL = 5;

const UGAT_QUESTION_GROUP_SIZES = [4, 3, 3] as const;
const ASSESSMENT_QUESTION_GROUP_SIZES = [3, 3, 4] as const;
const ASSESSMENT_LEVEL_TITLES = ["Pamilyar Level", "Suri Level", "Dalubhasa Level"] as const;

export function assessmentLevelTitle(index: number) {
  return ASSESSMENT_LEVEL_TITLES[index] ?? `Level ${index + 1}`;
}

function questionGroupStarts(story: Story) {
  if (story.activities.length !== 10) {
    return Array.from(
      { length: Math.ceil(story.activities.length / QUESTIONS_PER_SCROLL) },
      (_, index) => index * QUESTIONS_PER_SCROLL,
    );
  }

  const starts: number[] = [];
  let cursor = 0;

  const sizes = story.id === UGAT_STORY ? UGAT_QUESTION_GROUP_SIZES : ASSESSMENT_QUESTION_GROUP_SIZES;
  for (const size of sizes) {
    if (cursor >= story.activities.length) break;
    starts.push(cursor);
    cursor += size;
  }

  return starts;
}

export function questionGroup(story: Story, activityIndex: number) {
  const starts = questionGroupStarts(story);
  let index = 0;

  starts.forEach((start, candidateIndex) => {
    if (start <= activityIndex) index = candidateIndex;
  });
  const start = starts[index] ?? 0;
  const end = starts[index + 1] ?? story.activities.length;

  return { index, start, end, id: story.activities[start].id };
}

export function questionScrolls(story: Story, answers: Answers): StoryWorldPortal[] {
  const positions = story.id === UGAT_STORY ? UGAT_SCROLL_POSITIONS : QUESTION_SCROLL_POSITIONS;
  return questionGroupStarts(story).map((groupStart, index) => {
    const { start, end, id } = questionGroup(story, groupStart);
    const activities = story.activities.slice(start, end);
    const answeredCount = activities.filter(activity => Boolean(answers[activity.id])).length;
    const next = activities.findIndex(activity => !answers[activity.id]);
    const assembling = story.id === "m1-story-1" && index === 2
      ? activities.findIndex(activity => needsWardrobeDressing(answers[activity.id] as Parameters<typeof needsWardrobeDressing>[0])) : -1;
    return {
      id,
      activityIndex: assembling >= 0 ? start + assembling : next < 0 ? start : start + next,
      questionGroup: { index, start, end, answeredCount },
      story,
      position: positions[index % positions.length],
      state: next < 0 ? "completed" : canAnswerQuestion(story, start, answers) ? "current" : "locked",
    };
  });
}

export function scrollTitle(node: StoryWorldPortal) {
  const group = node.questionGroup;
  return group ? `${assessmentLevelTitle(group.index)} · ${group.answeredCount}/${group.end - group.start} nasagutan` : node.story.title;
}

export function worldNodeId(node: StoryWorldPortal) {
  return node.id ?? node.story.id;
}

export const STORY_SETTINGS = {
  "m1-story-1": { name: "Landas ng Sandaang Damit", sky: 0xf3d8be, ground: 0xc8aa86, path: 0xf6dfb0, accent: 0xeab469 },
  "m1-story-2": { name: "Ugat · Ang Bagong Araw", sky: 0xd4e8ce, ground: 0x859c54, path: 0xc7b083, accent: 0xa6bb68 },
  "m1-story-3": { name: "Nayon ng mga Nakalimutang Kuwento", sky: 0xa7b2ac, ground: 0x777d70, path: 0xc5b794, accent: 0xcabb91 },
} as const;

export function storySetting(storyId?: string) {
  return STORY_SETTINGS[storyId as keyof typeof STORY_SETTINGS];
}
