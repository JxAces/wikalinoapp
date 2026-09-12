import { sandaangDamit } from "./story-content/sandaang-damit";
import { simulaNgIsangKahulugan } from "./story-content/simula-ng-isang-kahulugan";
import { ugat } from "./story-content/ugat";
import type { StoryUnit } from "./story-types";

export type {
  CharacterRaceActivity,
  ChoiceActivity,
  ChoiceActivityType,
  PlotSequenceActivity,
  Story,
  StoryActivity,
  StoryCollectible,
  StoryPrediction,
  StoryScene,
  StoryUnit,
} from "./story-types";

export const storyUnits: StoryUnit[] = [
  {
    id: "story-unit-1",
    markahan: 1,
    title: "Unang Markahan",
    subtitle: "Pagbasa at Masusing Pagsusuri ng Maikling Kuwento",
    stories: [sandaangDamit, ugat, simulaNgIsangKahulugan],
  },
  {
    id: "story-unit-2",
    markahan: 2,
    title: "Ikalawang Markahan",
    subtitle: "Mas Malalim na Pagsusuri",
    stories: [],
  },
  {
    id: "story-unit-3",
    markahan: 3,
    title: "Ikatlong Markahan",
    subtitle: "Pag-unawa sa Tema at Pananaw",
    stories: [],
  },
  {
    id: "story-unit-4",
    markahan: 4,
    title: "Ikaapat na Markahan",
    subtitle: "Paglalapat at Masusing Pagsusuri",
    stories: [],
  },
];

export function getStoryUnitByNumber(markahan: number) {
  return storyUnits.find(unit => unit.markahan === markahan);
}

export function getStoriesByMarkahan(markahan: number) {
  return getStoryUnitByNumber(markahan)?.stories ?? [];
}

export function getAllStories() {
  return storyUnits.flatMap(unit => unit.stories);
}

export function getStoryById(storyId: string) {
  return getAllStories().find(story => story.id === storyId);
}

export function getNextStory(storyId: string) {
  const stories = getAllStories();
  const index = stories.findIndex(story => story.id === storyId);

  if (index === -1 || index === stories.length - 1) {
    return undefined;
  }

  return stories[index + 1];
}

export function getPreviousStory(storyId: string) {
  const stories = getAllStories();
  const index = stories.findIndex(story => story.id === storyId);

  if (index <= 0) {
    return undefined;
  }

  return stories[index - 1];
}

export function getAllCollectibles() {
  return getAllStories().map(story => story.collectible);
}

export function getTotalStoryCount() {
  return getAllStories().length;
}

export function getTotalStoryCountByMarkahan(markahan: number) {
  return getStoriesByMarkahan(markahan).length;
}

export function getActivityById(storyId: string, activityId: string) {
  return getStoryById(storyId)?.activities.find(activity => activity.id === activityId);
}

export function getActivityByIndex(storyId: string, activityIndex: number) {
  return getStoryById(storyId)?.activities[activityIndex];
}
