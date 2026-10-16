// Keep storage notifications independent from React, networking and the store.
const listeners = new Set<() => void>();
let prepareDeletion: (() => Promise<void>) | undefined;
let finishDeletion: (() => Promise<void>) | undefined;

export function notifyLocalSave() { listeners.forEach(listener => listener()); }
export function subscribeLocalSaves(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function registerAccountDeletion(handler: () => Promise<void>, finished: () => Promise<void>) {
  prepareDeletion = handler;
  finishDeletion = finished;
  return () => { if (prepareDeletion === handler) { prepareDeletion = undefined; finishDeletion = undefined; } };
}
export async function prepareRemoteAccountDeletion() { await prepareDeletion?.(); }
export async function finishRemoteAccountDeletion() { await finishDeletion?.(); }
