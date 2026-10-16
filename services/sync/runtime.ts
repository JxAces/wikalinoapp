import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { create } from "zustand";
import { SyncEngine, type SyncStatus } from "./sync-engine";
import { syncConfig } from "./config";
import { createSyncTransport } from "./transport";

export const useSyncStatus = create<SyncStatus>(() => ({ phase: syncConfig() ? "pending" : "disabled" }));
let engine: SyncEngine | null = null;
export function getSyncEngine() {
  const config = syncConfig();
  if (!config) return null;
  engine ??= new SyncEngine({ storage: AsyncStorage, transport: createSyncTransport(config),
    journalKey: `wikalino-sync:${config.apiUrl}`, newId: randomUUID,
    lock: async action => {
      if (typeof navigator !== "undefined" && navigator.locks) return navigator.locks.request(`wikalino-journal:${config.apiUrl}`, action);
      return action();
    },
    onStatus: status => useSyncStatus.setState(status, true),
  });
  return engine;
}
export async function syncNow() {
  // PWAs can be open in multiple tabs. Let only one tab send a revision at a
  // time; all tabs still read the same durable device save and journal.
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("wikalino-student-sync", () => getSyncEngine()?.flush());
  }
  return getSyncEngine()?.flush();
}
