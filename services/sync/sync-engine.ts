export type DeviceSave = { version: number; state: Record<string, unknown> & { profile: { classCode?: string } | null } };
export type RemoteSave = { revision: number; version: number; state: DeviceSave["state"]; savedAt: string };
type ActiveAccount = { id: string; revision: number | null; lastSent: string | null; savedAt: string | null };
type Journal = { active: ActiveAccount | null; deletions: string[]; resetting?: boolean };
export type SyncStatus = { phase: "disabled" | "pending" | "syncing" | "synced" | "offline" | "error" | "conflict"; message?: string; savedAt?: string | null };
export type SyncStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
export type SyncTransport = {
  get(account: string): Promise<RemoteSave | null>;
  put(account: string, save: DeviceSave, revision: number): Promise<RemoteSave>;
  delete(account: string): Promise<void>;
};

export class SyncError extends Error {
  constructor(readonly code: string, readonly status = 0) { super(code); }
}

export const LOCAL_SAVE_KEY = "wikalino-user-store";
const emptyJournal = (): Journal => ({ active: null, deletions: [] });
// Postgres jsonb reorders object keys. Compare values canonically so a valid
// Supabase acknowledgment is not mistaken for different student work.
const encode = (save: DeviceSave) => JSON.stringify({ version: save.version, state: save.state }, (_key, value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value);

/** The device save is the durable outbox. Only acknowledged bytes are marked
 * sent, so offline changes and edits during a request survive app restarts.
 */
export class SyncEngine {
  private running: Promise<SyncStatus> | null = null;
  private writes: Promise<unknown> = Promise.resolve();
  constructor(private options: {
    storage: SyncStorage; transport: SyncTransport; journalKey: string;
    newId(): string; onStatus?(status: SyncStatus): void;
    lock?<T>(action: () => Promise<T>): Promise<T>;
  }) {}

  private emit(status: SyncStatus) { this.options.onStatus?.(status); return status; }
  private async journal(): Promise<Journal> {
    const raw = await this.options.storage.getItem(this.options.journalKey);
    if (!raw) return emptyJournal();
    // Do not discard a damaged journal and silently create a second identity.
    const journal = JSON.parse(raw) as Journal;
    if (!Array.isArray(journal.deletions) || !("active" in journal)) throw new SyncError("JOURNAL_INVALID");
    return journal;
  }
  private change<T>(update: (journal: Journal) => T): Promise<T> {
    const action = async () => {
      const journal = await this.journal();
      const result = update(journal);
      await this.options.storage.setItem(this.options.journalKey, JSON.stringify(journal));
      return result;
    };
    const write = this.writes.then(() => this.options.lock ? this.options.lock(action) : action());
    this.writes = write.catch(() => {});
    return write;
  }
  private async source(): Promise<DeviceSave | null> {
    const raw = await this.options.storage.getItem(LOCAL_SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as DeviceSave;
    return save.state?.profile ? save : null;
  }
  async queueDeletion() {
    await this.change(journal => {
      if (journal.active) journal.deletions.push(journal.active.id);
      journal.active = null;
      journal.resetting = true;
    });
    this.emit({ phase: "pending" });
  }
  async finishDeletion() {
    await this.change(journal => { journal.resetting = false; });
  }
  flush() {
    if (this.running) return this.running;
    this.running = this.run().catch(error => this.emit({
      phase: error instanceof SyncError && error.code === "SAVE_CONFLICT" ? "conflict" : "error",
      message: error instanceof SyncError ? error.code : "CONNECTION_FAILED",
    })).finally(() => { this.running = null; });
    return this.running;
  }
  private async run(): Promise<SyncStatus> {
    await this.writes;
    for (const account of (await this.journal()).deletions) {
      await this.options.transport.delete(account);
      await this.change(journal => { journal.deletions = journal.deletions.filter(id => id !== account); });
    }
    for (let round = 0; round < 3; round++) {
      const save = await this.source();
      if ((await this.journal()).resetting) {
        if (!save) await this.finishDeletion();
        else return this.emit({ phase: "pending" });
      }
      if (!save) return this.emit({ phase: "pending" });
      if (!save.state.profile?.classCode?.trim()) return this.emit({ phase: "pending", message: "CLASS_CODE_REQUIRED" });
      const serialized = encode(save);
      const active = await this.change(journal => {
        if (journal.resetting) return null;
        journal.active ??= { id: this.options.newId(), revision: null, lastSent: null, savedAt: null };
        return { ...journal.active };
      });
      if (!active) return this.emit({ phase: "pending" });
      if (serialized === active.lastSent) return this.emit({ phase: "synced", savedAt: active.savedAt });
      this.emit({ phase: "syncing", savedAt: active.savedAt });
      let revision = active.revision;
      let remote: RemoteSave | null = null;
      if (revision === null) {
        remote = await this.options.transport.get(active.id);
        if (remote && encode(remote) !== serialized) throw new SyncError("SAVE_CONFLICT", 409);
        revision = remote?.revision ?? 0;
      }
      if ((await this.journal()).active?.id !== active.id) return this.emit({ phase: "pending" });
      if (!remote) {
        try { remote = await this.options.transport.put(active.id, save, revision); }
        catch (error) {
          if (!(error instanceof SyncError) || error.status !== 409) throw error;
          const latest = await this.options.transport.get(active.id);
          if (latest && encode(latest) === serialized) remote = latest; // Lost response, already saved.
          else if (!latest || (active.lastSent && encode(latest) === active.lastSent)) {
            if ((await this.journal()).active?.id !== active.id) return this.emit({ phase: "pending" });
            remote = await this.options.transport.put(active.id, save, latest?.revision ?? 0);
          } else throw new SyncError("SAVE_CONFLICT", 409);
        }
      }
      if (encode(remote) !== serialized) throw new SyncError("INVALID_SERVER_RESPONSE");
      await this.change(journal => {
        if (journal.active?.id === active.id) journal.active = { id: active.id, revision: remote.revision, lastSent: serialized, savedAt: remote.savedAt };
      });
      if ((await this.journal()).active?.id !== active.id) return this.emit({ phase: "pending" });
      // Re-read disk: a student may have completed another activity mid-upload.
      const newest = await this.source();
      if (newest && encode(newest) === serialized) return this.emit({ phase: "synced", savedAt: remote.savedAt });
    }
    return this.emit({ phase: "pending" });
  }
}
