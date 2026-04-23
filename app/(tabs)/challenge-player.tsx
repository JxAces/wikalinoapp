import { saveLastPlayed } from "@/storage/progress";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

const { markahan, challengeId, challengeIndex } = useLocalSearchParams<{
  markahan: string;
  challengeId: string;
  challengeIndex: string;
}>();

useEffect(() => {
  if (!markahan || !challengeId || !challengeIndex) return;

  saveLastPlayed({
    markahan: Number(markahan),
    challengeId,
    challengeIndex: Number(challengeIndex),
    isCompleted: false,
  });
}, [markahan, challengeId, challengeIndex]);
