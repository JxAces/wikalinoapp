import {
  getCabinetActivities,
  getUgatMapSelection,
  isCabinetResponseComplete,
  type CabinetActivity,
} from "../data/cabinet-activities";
import type { Story } from "../data/story-types";
import type { ActivityResult, CabinetResponse } from "../store/useUserStore";
import { getAssessmentSummary } from "./assessment";

export type StudentRecordField = {
  id: string;
  label: string;
  answer: string | null;
};

export type StudentActivityRecord = {
  activity: CabinetActivity;
  response: CabinetResponse | undefined;
  completed: boolean;
  answered: number;
  fields: StudentRecordField[];
};

export type StudentStoryRecord = {
  assessment: ReturnType<typeof getAssessmentSummary>;
  activities: StudentActivityRecord[];
  completedActivities: number;
};

/** Read saved work without changing drafts, completions, or quiz grades. */
export function getStudentStoryRecord(
  story: Story,
  activityResults: Record<string, ActivityResult | undefined>,
  cabinetResponses: Record<string, CabinetResponse | undefined>,
): StudentStoryRecord {
  const quizResults: Record<string, ActivityResult> = {};
  for (const activity of story.activities) {
    const result = activityResults[activity.id];
    if (result?.storyId === story.id && result.activityId === activity.id) {
      quizResults[activity.id] = result;
    }
  }

  const activities = getCabinetActivities(story.id).map(activity => {
    const saved = cabinetResponses[activity.id];
    const response = saved?.storyId === story.id && saved.activityId === activity.id
      ? saved
      : undefined;
    let fields = activity.fields.map(field => {
      const value = response?.responses?.[field.id];
      const trimmed = typeof value === "string" ? value.trim() : "";
      // Keep paragraphs intact and retain readable answers from older saves.
      const answer = trimmed
        ? field.options?.find(option => option.value === trimmed)?.label ?? trimmed
        : null;
      return { id: field.id, label: field.label, answer };
    });
    if (activity.id === 'ugat-tree-map') {
      const selection = getUgatMapSelection(response?.responses);
      const value = selection && response?.responses?.[`note-${selection.zone.id}`];
      fields = [
        { id: 'selected-idea', label: 'Ang napiling ideya', answer: selection?.card.text ?? null },
        { id: selection ? `card-${selection.card.id}` : 'selected-category', label: 'Kategorya', answer: selection?.zone.title ?? null },
        { id: selection ? `note-${selection.zone.id}` : 'selected-evidence', label: 'Patunay mula sa kuwento', answer: typeof value === 'string' && value.trim() ? value.trim() : null },
      ];
    }

    return {
      activity,
      response,
      completed: Boolean(response?.completedAt) &&
        isCabinetResponseComplete(activity, response?.responses),
      answered: fields.filter(field => field.answer !== null).length,
      fields,
    };
  });

  return {
    assessment: getAssessmentSummary(story, quizResults),
    activities,
    completedActivities: activities.filter(activity => activity.completed).length,
  };
}
