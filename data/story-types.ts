import type { ImageSourcePropType } from "react-native";

export type ChoiceActivityType =
  | "multiple_choice"
  | "evidence_hunt"
  | "vocabulary"
  | "theme_detective";

export type ChoiceActivity = {
  id: string;
  type: ChoiceActivityType;
  title: string;
  instruction: string;
  question: string;
  choices: string[];
  answer: string;
  hint: string;
  explanation: string;
  xp: number;
  isFinal?: boolean;
};

export type PlotSequenceActivity = {
  id: string;
  type: "plot_sequence";
  title: string;
  instruction: string;
  question: string;
  items: string[];
  answer: string[];
  hint: string;
  explanation: string;
  xp: number;
  isFinal?: boolean;
};

export type CharacterRaceActivity = {
  id: string;
  type: "character_race";
  title: string;
  instruction: string;
  question: string;
  choices: string[];
  answer: string;
  racers: {
    name: string;
    icon: string;
    color: string;
  }[];
  hint: string;
  explanation: string;
  xp: number;
  isFinal?: boolean;
};

export type StoryActivity =
  | ChoiceActivity
  | PlotSequenceActivity
  | CharacterRaceActivity;

export type StoryPrediction = {
  question: string;
  choices: string[];
  reveal: string;
};

export type StoryScene = {
  id: string;
  title: string;
  paragraphs: string[];
  prediction?: StoryPrediction;
};

export type StoryCollectible = {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
};

export type Story = {
  id: string;
  markahan: number;
  order: number;
  title: string;
  subtitle: string;
  author: string;
  summary: string;
  coverImage: ImageSourcePropType;
  estimatedMinutes: number;
  readingXp: number;
  completionXp: number;
  scenes: StoryScene[];
  activities: StoryActivity[];
  collectible: StoryCollectible;
};

export type StoryUnit = {
  id: string;
  markahan: number;
  title: string;
  subtitle: string;
  stories: Story[];
};
