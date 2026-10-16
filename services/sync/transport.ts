import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";
import { SyncError, type DeviceSave, type RemoteSave, type SyncTransport } from "./sync-engine";
import { syncConfig } from "./config";
export type ClassRankings = {
  class: { id: string; code: string; name: string } | null; updatedAt: string;
  entries: { name: string; isYou: boolean; rank: number | null; correct: number; answered: number; total: number }[];
};

export function createSyncTransport(config: NonNullable<ReturnType<typeof syncConfig>>): SyncTransport & { rankings(account: string): Promise<ClassRankings> } {
  const clients = new Map<string, SupabaseClient>();
  const localKey = (account: string) => `wikalino-local-session:${config.apiUrl}:${account}`;
  const authKey = (account: string) => `wikalino-auth:${config.apiUrl}:${account}`;
  const createdKey = (account: string) => `${authKey(account)}:created`;
  function client(account: string) {
    let instance = clients.get(account);
    if (!instance) {
      instance = createClient(config.supabaseUrl!, config.publishableKey!, {
        auth: { storage: AsyncStorage, storageKey: authKey(account), persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, lock: processLock },
        global: { fetch: (url, options) => timedFetch(String(url), options) },
      });
      clients.set(account, instance);
    }
    return instance;
  }
  async function token(account: string, create: boolean): Promise<string | null> {
    if (config.local) {
      const existing = await AsyncStorage.getItem(localKey(account));
      if (existing || !create) return existing;
      const response = await timedFetch(`${config.apiUrl}/local/session`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || typeof result.data?.token !== "string") throw new SyncError("AUTH_UNAVAILABLE");
      await AsyncStorage.setItem(localKey(account), result.data.token);
      return result.data.token;
    }
    const auth = client(account).auth;
    const current = await auth.getSession();
    if (current.error) throw new SyncError("AUTH_UNAVAILABLE");
    if (current.data.session) return current.data.session.access_token;
    // If a saved session became invalid, don't replace the student's identity.
    if (await AsyncStorage.getItem(createdKey(account))) throw new SyncError("AUTH_REQUIRED", 401);
    if (!create) return null;
    const { data, error } = await auth.signInAnonymously();
    if (error?.code === "anonymous_provider_disabled") throw new SyncError("ANONYMOUS_SIGN_IN_DISABLED");
    if (error?.message?.includes("Invalid API key")) throw new SyncError("AUTH_KEY_INVALID");
    if (error || !data.session) throw new SyncError("AUTH_UNAVAILABLE");
    await AsyncStorage.setItem(createdKey(account), "true");
    return data.session.access_token;
  }
  async function request(account: string, method: string, path: string, body?: unknown, retry = true): Promise<RemoteSave | null> {
    const accessToken = await token(account, method !== "DELETE");
    if (!accessToken && method === "DELETE") return null;
    const response = await timedFetch(`${config.apiUrl}${path}`, { method, headers: {
      Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json",
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    if (response.status === 204) return null;
    if (response.status === 404 && method === "GET") return null;
    if (response.status === 401 && method === "DELETE" && config.local) return null; // Local server restart clears every test identity/save.
    if (response.status === 401 && config.local && retry) {
      await AsyncStorage.removeItem(localKey(account));
      return request(account, method, path, body, false);
    }
    const result = await response.json();
    if (!response.ok) throw new SyncError(result.error?.code ?? "SERVER_ERROR", response.status);
    const data = result.data;
    if (!data || !Number.isSafeInteger(data.revision) || !data.state || !data.version || typeof data.savedAt !== "string") throw new SyncError("INVALID_SERVER_RESPONSE");
    return data;
  }
  return {
    async rankings(account) {
      const accessToken = await token(account, false);
      if (!accessToken) throw new SyncError("AUTH_REQUIRED");
      const response = await timedFetch(`${config.apiUrl}/v1/me/rankings`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const result = await response.json();
      if (!response.ok) throw new SyncError(result.error?.code ?? "SERVER_ERROR", response.status);
      const data = result.data;
      if (!data || !Array.isArray(data.entries) || typeof data.updatedAt !== "string" || data.entries.some((row: ClassRankings["entries"][number]) => typeof row.name !== "string" || !Number.isSafeInteger(row.correct) || !Number.isSafeInteger(row.total) || !Number.isSafeInteger(row.answered) || typeof row.isYou !== "boolean" || !(row.rank === null || Number.isSafeInteger(row.rank)))) throw new SyncError("INVALID_SERVER_RESPONSE");
      return data;
    },
    get: account => request(account, "GET", "/v1/me/save"),
    async put(account: string, save: DeviceSave, revision: number) {
      const result = await request(account, "PUT", "/v1/me/save", { ...save, expectedRevision: revision });
      if (!result) throw new SyncError("INVALID_SERVER_RESPONSE");
      return result;
    },
    async delete(account) {
      await request(account, "DELETE", "/v1/me");
      await AsyncStorage.removeItem(localKey(account));
      await clientCleanup(account);
    },
  };
  async function clientCleanup(account: string) {
    clients.delete(account);
    const prefix = `wikalino-rankings:${config.apiUrl}:${account}:`;
    const cacheKeys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(prefix));
    if (cacheKeys.length) await AsyncStorage.multiRemove(cacheKeys);
    await AsyncStorage.removeItem(authKey(account));
    await AsyncStorage.removeItem(createdKey(account));
  }
}

async function timedFetch(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}
