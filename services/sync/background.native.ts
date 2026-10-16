import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { syncNow } from "./runtime";

const TASK = "wikalino-student-sync";
if (!TaskManager.isTaskDefined(TASK)) TaskManager.defineTask(TASK, async () => {
  const status = await syncNow();
  return status?.phase === "error" || status?.phase === "conflict"
    ? BackgroundTask.BackgroundTaskResult.Failed : BackgroundTask.BackgroundTaskResult.Success;
});
export async function registerBackgroundSync() {
  if (!await TaskManager.isAvailableAsync()) return;
  if (await BackgroundTask.getStatusAsync() !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (!await TaskManager.isTaskRegisteredAsync(TASK)) await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 15 });
}
