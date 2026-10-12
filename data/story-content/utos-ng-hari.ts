import type { Story } from "../story-types";
import { createQuestionActivities } from "./question-factory";
import { utosNgHariScenes } from "./utos-ng-hari-scenes";
import { utosNgHariAssessment } from "./validated-assessments";

const activities = createQuestionActivities("utos-ng-hari-validated-v1", utosNgHariAssessment);

export const utosNgHari: Story = {
  id: "m1-story-3",
  markahan: 1,
  order: 3,
  title: "Utos ng Hari",
  subtitle: "Kapangyarihan, Pamantayan, at Pagkatao",
  author: "Jun Cruz Reyes",
  summary: "Isinasalaysay ni Jojo ang kaniyang pagtutol sa hindi pantay na pamantayan ng paaralan at ang pagnanais na mapakinggan at igalang bilang tao.",
  coverImage: require("../../assets/images/stories/ang-huling-upuan.png"),
  estimatedMinutes: 25,
  readingXp: 40,
  completionXp: 80,
  scenes: utosNgHariScenes,
  activities,
  collectible: {
    id: "collectible-utos-ng-hari",
    title: "Tinig at Dignidad",
    category: "Aral ng Kuwento",
    description: "Mahalagang suriin ang kapangyarihan at igalang ang pagkatao at tinig ng bawat mag-aaral.",
    icon: "bullhorn-outline",
  },
};
