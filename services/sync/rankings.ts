import AsyncStorage from "@react-native-async-storage/async-storage";
import { syncConfig } from "./config";
import { createSyncTransport, type ClassRankings } from "./transport";

export async function classRankings(classCode: string, online: boolean): Promise<ClassRankings | null> {
  const config = syncConfig();
  if (!config) return null;
  const journal = JSON.parse(await AsyncStorage.getItem(`wikalino-sync:${config.apiUrl}`) ?? "null");
  if (!journal?.active?.id || journal.resetting) return null;
  const key = `wikalino-rankings:${config.apiUrl}:${journal.active.id}:${classCode}`;
  if (!online) {
    const cached = JSON.parse(await AsyncStorage.getItem(key) ?? "null") as ClassRankings | null;
    return cached?.class?.code === classCode ? cached : null;
  }
  const result = await createSyncTransport(config).rankings(journal.active.id);
  // A code edited while offline must not display the previous class's board.
  if (result.class?.code !== classCode) return null;
  const latest = JSON.parse(await AsyncStorage.getItem(`wikalino-sync:${config.apiUrl}`) ?? "null");
  if (latest?.active?.id !== journal.active.id || latest.resetting) return null;
  await AsyncStorage.setItem(key, JSON.stringify(result));
  return result;
}
