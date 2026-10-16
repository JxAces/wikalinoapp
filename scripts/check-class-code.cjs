/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const storageKey = "wikalino-user-store";

/** Exercise the real persist middleware with a device-storage stand-in. */
async function device(saved) {
  const items = new Map(saved ? [[storageKey, JSON.stringify(saved)]] : []);
  const modules = new Map();
  let failWrites = false;
  const storage = {
    getItem: async key => items.get(key) ?? null,
    setItem: async (key, value) => {
      if (failWrites) throw new Error("Device storage unavailable");
      items.set(key, value);
    },
    removeItem: async key => { items.delete(key); },
  };
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const mod = { exports: {} };
    modules.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText;
    const localRequire = name => {
      if (/\.(png|jpg|glb)$/.test(name)) return name;
      if (name === "@react-native-async-storage/async-storage") return storage;
      if (name.startsWith("@/")) return load(path.join(root, name.slice(2)) + ".ts");
      if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name) + ".ts");
      return require(name);
    };
    new Function("require", "module", "exports", code)(localRequire, mod, mod.exports);
    return mod.exports;
  }
  const { useUserStore: store } = load(path.join(root, "store/useUserStore.ts"));
  await store.persist.rehydrate();
  assert.equal(store.persist.hasHydrated(), true);
  return {
    store,
    saved: () => items.has(storageKey) ? JSON.parse(items.get(storageKey)) : null,
    fail: value => { failWrites = value; },
    normalize: load(path.join(root, "utils/class-code.ts")).normalizeClassCode,
  };
}

async function main() {
  const legacy = {
    profile: { fullName: "Ana Dela Cruz", pangkat: "Baitang 7", character: "student-girl", avatar: "reader" },
    welcomeCompleted: true,
    xp: 815,
    completedStoryIds: ["m1-story-1"],
    readingCompletedStoryIds: ["m1-story-1", "m1-story-2"],
    storySceneIndexes: { "m1-story-2": 4 },
    activityResults: {
      "m1-story-1-validated-v1-q1": { storyId: "m1-story-1", activityId: "m1-story-1-validated-v1-q1", correct: true, firstTryCorrect: true, attempts: 1, selectedAnswer: "A", xpEarned: 20, completedAt: "2026-10-15T00:00:00.000Z" },
    },
    cabinetResponses: { "damit-interpretation": { storyId: "m1-story-1", activityId: "damit-interpretation", responses: { interpretation: "dreams", "evidence-1": "Unang talata.\n\nIkalawang talata." }, groupName: "Sampaguita", completedAt: null } },
    utosQuizGames: { "1": { kind: "memory", matchedIds: ["jojo"] } },
    unlockedCollectibleIds: ["book-1"],
    lastStoryId: "m1-story-2",
    completedChallengeIds: ["legacy-challenge"],
    lastPlayed: { markahan: 1, challengeId: "legacy-challenge", challengeIndex: 0, isCompleted: true },
  };
  const existing = await device({ version: 7, state: legacy });
  assert.equal(existing.store.getState().profile.classCode, undefined, "Old profiles remain usable without a class code");
  assert.equal(existing.saved().version, 8, "Upgrade the save in place");
  for (const [field, value] of Object.entries(legacy)) {
    assert.deepEqual(existing.saved().state[field], value, `${field} survives the class-code migration`);
  }
  assert.equal(existing.normalize("  Grade7-AbC  "), "Grade7-AbC", "Trim spaces without inventing a backend code format");
  assert.equal(existing.normalize(" "), undefined);
  assert.equal(existing.normalize("x".repeat(65)), undefined);
  assert.equal(existing.normalize(123), undefined);
  await assert.rejects(existing.store.getState().saveClassCode("  "));
  assert.equal(existing.saved().state.profile.classCode, undefined);
  await existing.store.getState().saveClassCode("  Grade7-AbC  ");
  assert.equal(existing.saved().state.profile.classCode, "Grade7-AbC", "Awaited save writes to device storage");
  for (const [field, value] of Object.entries(legacy)) {
    if (field !== "profile") assert.deepEqual(existing.saved().state[field], value, `${field} is unaffected by enrollment`);
  }

  const restarted = await device(existing.saved());
  assert.equal(restarted.store.getState().profile.classCode, "Grade7-AbC", "Code survives a complete app restart");
  await restarted.store.getState().saveClassCode("SECTION-B");
  assert.equal(restarted.saved().state.profile.classCode, "SECTION-B", "Students can correct the code");
  restarted.fail(true);
  await assert.rejects(restarted.store.getState().saveClassCode("FAILED"));
  assert.equal(restarted.store.getState().profile.classCode, "SECTION-B", "Failed writes restore the previous code");
  assert.equal(restarted.saved().state.profile.classCode, "SECTION-B");
  restarted.fail(false);
  await restarted.store.getState().saveClassCode("RETRIED");
  assert.equal(restarted.saved().state.profile.classCode, "RETRIED", "A failed save can be retried");
  await restarted.store.getState().deleteAccount();
  assert.equal(restarted.saved(), null, "Account deletion removes the code with all other device data");
  assert.equal(restarted.store.getState().profile, null);
  await assert.rejects(restarted.store.getState().saveClassCode("NO-PROFILE"));

  const fresh = await device();
  fresh.store.getState().setProfile({ ...legacy.profile, classCode: "NEW-CLASS" });
  assert.equal(fresh.saved().state.profile.classCode, "NEW-CLASS", "New profiles persist their class code");
  assert.equal(fresh.saved().state.xp, 0);
  console.log("PASS: existing v7 progress preserved; class-code validation, persistence, restart, edits, storage failure/retry, new profiles and account deletion.");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
