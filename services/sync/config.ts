import { Platform } from "react-native";

export function syncConfig() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!apiUrl) return null;
  let url: URL;
  try { url = new URL(apiUrl); } catch { return null; }
  const local = process.env.EXPO_PUBLIC_SYNC_MODE === "local";
  if (local && !["localhost", "127.0.0.1"].includes(url.hostname)) return null;
  // A local backend can use real Supabase identities as well as memory mode.
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!local && (!supabaseUrl?.startsWith("https://") || !publishableKey?.startsWith("sb_publishable_") || publishableKey.includes("replace_me"))) return null;
  // Never embed a privileged Supabase key in the app's client configuration.
  if (publishableKey?.startsWith("sb_secret_")) return null;
  return { apiUrl, local, supabaseUrl, publishableKey, platform: Platform.OS };
}
