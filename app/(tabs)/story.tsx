import { useCallback, useRef, useState } from "react";
import { Redirect, router, useIsFocused, useLocalSearchParams } from "expo-router";
import { StoryBookReader } from "@/components/story-library/StoryBookReader";
import { StoryEntryIntro } from "@/components/story-library/StoryEntryIntro";
import { canEnterStory } from "@/components/story-world/quest-progression";
import { getStoryById } from "@/data/stories";
import { useUserStore } from "@/store/useUserStore";

export default function StoryScreen() {
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const focused = useIsFocused();
  return focused ? <JourneyBook key={storyId} storyId={storyId} /> : null;
}

function JourneyBook({ storyId }: { storyId: string }) {
  const story = getStoryById(storyId);
  const sceneIndexes = useUserStore(state => state.storySceneIndexes);
  const answers = useUserStore(state => state.activityResults);
  const readingCompleted = useUserStore(state => state.readingCompletedStoryIds.includes(storyId));
  const savePage = useUserStore(state => state.setStoryScene);
  const finishReading = useUserStore(state => state.completeStoryReading);
  const [introComplete, setIntroComplete] = useState(false);
  const finishIntro = useCallback(() => setIntroComplete(true), []);
  const navigating = useRef(false);

  if (!story || !canEnterStory(story.id, answers)) return <Redirect href="/landing" />;
  if (!introComplete) return <StoryEntryIntro title={story.title} onComplete={finishIntro} />;
  function completeReading() {
    if (!story || navigating.current) return;
    navigating.current = true;
    finishReading(story.id);
    router.replace({ pathname: "/story-room", params: { storyId: story.id } });
  }

  return <StoryBookReader key={story.id} story={story}
      initialPage={readingCompleted ? -1 : sceneIndexes[story.id] ?? -1}
      onPageChange={page => savePage(story.id, page)}
      onClose={() => router.replace({ pathname: "/story-room", params: { storyId: story.id } })} onComplete={completeReading} />;
}
