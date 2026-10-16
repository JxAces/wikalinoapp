/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../services/sync/sync-engine.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleExports = {};
new Function("exports", compiled)(moduleExports);
const { SyncEngine, SyncError, LOCAL_SAVE_KEY } = moduleExports;

async function main() {
  const items = new Map();
  const storage = { getItem: async key => items.get(key) ?? null, setItem: async (key, value) => { items.set(key, value); } };
  let id = 0, offline = true, calls = 0, lostResponse = false, updateDuringPut;
  const remote = new Map();
  const write = (xp, profile = { classCode: "LOCAL-CLASS" }) => items.set(LOCAL_SAVE_KEY, JSON.stringify({ version: 8, state: { profile, xp, cabinetResponses: { answer: "Unang talata.\n\nIkalawang talata." } } }));
  const transport = {
    async get(account) { if (offline) throw Error("Offline"); return structuredClone(remote.get(account) ?? null); },
    async put(account, save, revision) {
      calls++;
      if (offline) throw Error("Offline");
      if ((remote.get(account)?.revision ?? 0) !== revision) throw new SyncError("SAVE_CONFLICT", 409);
      const value = { ...structuredClone(save), revision: revision + 1, savedAt: new Date().toISOString() };
      remote.set(account, value);
      if (updateDuringPut) { const update = updateDuringPut; updateDuringPut = null; await update(); }
      if (lostResponse) { lostResponse = false; throw Error("Response lost after commit"); }
      return structuredClone(value);
    },
    async delete(account) { if (offline) throw Error("Offline"); remote.delete(account); },
  };
  const create = () => new SyncEngine({ storage, transport, journalKey: "sync", newId: () => `account-${++id}` });
  write(100);
  let engine = create();
  assert.equal((await engine.flush()).phase, "error", "Offline requests keep pending local work");
  write(200); write(300); // Several offline changes coalesce into the latest save.
  engine = create(); offline = false;
  assert.equal((await engine.flush()).phase, "synced");
  assert.equal(id, 1, "Restart reuses the persisted student identity");
  assert.equal(remote.get("account-1").state.xp, 300);
  assert.equal(remote.get("account-1").state.cabinetResponses.answer, "Unang talata.\n\nIkalawang talata.");
  const before = calls;
  await engine.flush(); assert.equal(calls, before, "Unchanged data is not uploaded repeatedly");

  write(400); updateDuringPut = async () => write(500);
  assert.equal((await engine.flush()).phase, "synced");
  assert.equal(remote.get("account-1").state.xp, 500, "Edits made during upload are sent next");
  write(600); lostResponse = true;
  assert.equal((await engine.flush()).phase, "error");
  engine = create(); assert.equal((await engine.flush()).phase, "synced", "A lost acknowledgment reconciles instead of duplicating or overwriting");
  assert.equal(remote.get("account-1").state.xp, 600);

  const foreign = structuredClone(remote.get("account-1")); foreign.state.xp = 999; foreign.revision++;
  remote.set("account-1", foreign); write(650);
  assert.equal((await engine.flush()).phase, "conflict");
  assert.equal(remote.get("account-1").state.xp, 999, "Conflicts never silently overwrite newer server work");
  assert.equal(JSON.parse(items.get(LOCAL_SAVE_KEY)).state.xp, 650, "Local work is never replaced by server work");

  // Delete offline, restart, then reconnect. Never re-upload a deleted profile.
  offline = true; await engine.queueDeletion();
  write(0, null); await engine.finishDeletion();
  assert.equal((await engine.flush()).phase, "error");
  engine = create(); offline = false; await engine.flush();
  assert.equal(remote.has("account-1"), false, "Offline account deletion survives restart");
  write(50); assert.equal((await engine.flush()).phase, "synced");
  assert.equal(id, 2, "A new profile gets a separate identity");
  assert.equal(remote.get("account-2").state.xp, 50);

  // Supabase uses jsonb: key ordering differs from AsyncStorage JSON without
  // changing any answer values. Also exercise nested written-answer objects.
  const reorder = value => Array.isArray(value) ? value.map(reorder)
    : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).reverse().map(key => [key, reorder(value[key])])) : value;
  const originalPut = transport.put;
  transport.put = async (...args) => reorder(await originalPut(...args));
  write(60);
  assert.equal((await engine.flush()).phase, "synced", "Postgres jsonb key ordering does not cause false conflicts");
  transport.put = originalPut;

  write(75); updateDuringPut = async () => { await engine.queueDeletion(); write(0, null); await engine.finishDeletion(); };
  await engine.flush(); await engine.flush();
  assert.equal(remote.has("account-2"), false, "An in-flight upload cannot resurrect a deleted account");
  write(0, { classCode: "" }); const count = calls;
  assert.equal((await engine.flush()).message, "CLASS_CODE_REQUIRED");
  assert.equal(calls, count, "Missing class codes do not create upload attempts");
  console.log("PASS: offline/restart durability, latest-only uploads, edits during sync, acknowledgment loss, conflict preservation, separate identities and offline/in-flight deletion.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
