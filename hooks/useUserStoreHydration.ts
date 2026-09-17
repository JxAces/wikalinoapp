import { useSyncExternalStore } from "react";
import { useUserStore } from "@/store/useUserStore";

function subscribe(onChange: () => void) {
  const started = useUserStore.persist.onHydrate(onChange);
  const finished = useUserStore.persist.onFinishHydration(onChange);
  return () => { started(); finished(); };
}

/** Do not evaluate route locks until AsyncStorage has restored the player's save. */
export function useUserStoreHydration() {
  return useSyncExternalStore(subscribe, useUserStore.persist.hasHydrated, () => false);
}
