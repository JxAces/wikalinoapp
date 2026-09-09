import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";

import { StoryActivity } from "../../data/stories";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/*
 * =========================================================
 * ACTIVITY HELPERS
 * =========================================================
 */

export function getActivityIcon(type: StoryActivity["type"]): IconName {
  switch (type) {
    case "evidence_hunt":
      return "bow-arrow";

    case "plot_sequence":
      return "map-marker-path";

    case "vocabulary":
      return "lightbulb-on-outline";

    case "theme_detective":
      return "compass-outline";

    case "character_race":
      return "run-fast";

    default:
      return "cards-outline";
  }
}

export function getGameName(type: StoryActivity["type"]) {
  switch (type) {
    case "evidence_hunt":
      return "PANA NG EBIDENSYA";

    case "plot_sequence":
      return "LANDAS NG BANGHAY";

    case "vocabulary":
      return "ILAWAN ANG PAHIWATIG";

    case "theme_detective":
      return "KOMPAS NG TEMA";

    case "character_race":
      return "KARERA NG MGA TAUHAN";

    default:
      return "HAMON NG KWENTO";
  }
}

export function getGameInstruction(activity: StoryActivity) {
  switch (activity.type) {
    case "evidence_hunt":
      return "Hawakan ang pana sa ibaba. Hilahin pababa para sa lakas, igalaw pakaliwa o pakanan upang itutok ang trajectory, at bitawan. Ang ebidensyang tatamaan ng pana ang magiging sagot mo.";

    case "plot_sequence":
      return "Ayusin ang mga pangyayari upang mabuo ang tamang landas ng banghay.";

    case "vocabulary":
      return "Sindihan ang ilawan at gamitin ang pahiwatig sa konteksto upang matuklasan ang kahulugan.";

    case "theme_detective":
      return "Ituro ang kompas sa mensaheng pinakamahusay na sinusuportahan ng kwento.";

    case "character_race":
      return "Piliin ang tauhang gumawa ng mahalagang kilos, pagkatapos ay simulan ang karera. Ang tamang tauhan ang unang makakarating sa hantungan.";

    default:
      return activity.instruction;
  }
}

export function getSuccessTitle(type: StoryActivity["type"]) {
  switch (type) {
    case "evidence_hunt":
      return "Bullseye! Ebidensya Natagpuan!";

    case "plot_sequence":
      return "Nabuo ang Landas!";

    case "vocabulary":
      return "Nagliwanag ang Kahulugan!";

    case "theme_detective":
      return "Tamang Direksiyon!";

    case "character_race":
      return "Tamang Tauhan ang Nanalo!";

    default:
      return "Tamang Sagot!";
  }
}
