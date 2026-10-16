import { useEffect } from "react";
import { AppState } from "react-native";
import * as Network from "expo-network";
import { registerAccountDeletion, subscribeLocalSaves } from "@/services/local-save-events";
import { getSyncEngine, syncNow, useSyncStatus } from "@/services/sync/runtime";
import { registerBackgroundSync } from "@/services/sync/background";

export function OfflineSync() {
  useEffect(() => {
    const engine = getSyncEngine();
    if (!engine) return;
    let stopped = false, failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function flush() {
      if (stopped) return;
      const connection = await Network.getNetworkStateAsync().catch(() => null);
      if (connection?.isConnected === false || connection?.isInternetReachable === false) {
        useSyncStatus.setState({ phase: "offline" }, true); return;
      }
      const status = await syncNow().catch(() => {
        const failed = { phase: "error" as const, message: "CONNECTION_FAILED" };
        useSyncStatus.setState(failed, true);
        return failed;
      });
      if (status?.phase === "error") {
        failures++;
        schedule(Math.min(300000, 5000 * 2 ** Math.min(failures, 6)));
      } else failures = 0;
    }
    function schedule(delay = 2000) {
      if (timer) clearTimeout(timer);
      if (!stopped) timer = setTimeout(() => { void flush(); }, delay);
    }
    const unsubscribe = subscribeLocalSaves(() => { useSyncStatus.setState({ phase: "pending" }, true); schedule(); });
    const deletion = registerAccountDeletion(
      async () => { await engine.queueDeletion(); },
      async () => { await engine.finishDeletion(); schedule(0); },
    );
    const network = Network.addNetworkStateListener(state => {
      if (state.isConnected !== false && state.isInternetReachable !== false) schedule(0);
      else useSyncStatus.setState({ phase: "offline" }, true);
    });
    const appState = AppState.addEventListener("change", state => { if (state === "active") schedule(0); else void flush(); });
    const interval = setInterval(() => { if (AppState.currentState === "active") schedule(0); }, 60000);
    void registerBackgroundSync().catch(() => { /* Foreground/reconnect sync remains available in Expo Go. */ });
    schedule(0);
    return () => { stopped = true; if (timer) clearTimeout(timer); clearInterval(interval); unsubscribe(); deletion(); network.remove(); appState.remove(); };
  }, []);
  return null;
}
