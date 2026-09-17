/* global __dirname */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "components/pwa-registration.web.tsx"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

async function run({ dev = true, secure = true, available = true, controller = null, registrations = [], reject = false } = {}) {
  const calls = { registered: [], removed: [], reloads: 0, warnings: [] };
  const worker = {
    controller: controller ? { scriptURL: controller } : null,
    getRegistrations: async () => {
      if (reject) throw new Error("Worker unavailable");
      return registrations.map(({ url, state = "active", removed = true }) => ({
        active: null, waiting: null, installing: null,
        [state]: { scriptURL: url },
        unregister: async () => { calls.removed.push(url); return removed; },
      }));
    },
    register: async (...args) => { calls.registered.push(args); },
  };
  const exports = {};
  new Function("exports", "require", "__DEV__", "navigator", "window", "console", compiled)(
    exports,
    () => ({ useEffect: effect => effect() }),
    dev,
    available ? { serviceWorker: worker } : {},
    { isSecureContext: secure, location: { origin: "http://localhost:8081", reload: () => calls.reloads++ } },
    { warn: (...args) => calls.warnings.push(args) },
  );
  exports.PwaRegistration();
  await new Promise(resolve => setImmediate(resolve));
  return calls;
}

(async () => {
  const own = "http://localhost:8081/sw.js";
  const other = "http://localhost:8081/another-app/worker.js";
  let result = await run({ controller: own, registrations: [{ url: own }, { url: other }] });
  assert.deepEqual(result.removed, [own]);
  assert.equal(result.reloads, 1);
  assert.deepEqual(result.registered, []);

  result = await run();
  assert.equal(result.reloads, 0, "Fresh development pages must not reload in a loop");
  result = await run({ controller: own, registrations: [{ url: own, removed: false }] });
  assert.equal(result.reloads, 0, "Failed removal must not loop reloads");
  result = await run({ controller: other, registrations: [{ url: own, state: "waiting" }, { url: other }] });
  assert.deepEqual(result.removed, [own]);
  assert.equal(result.reloads, 0, "Unrelated controlling workers remain untouched");
  result = await run({ dev: false, controller: own, registrations: [{ url: own }] });
  assert.deepEqual(result.registered, [["/sw.js", { scope: "/", updateViaCache: "none" }]]);
  assert.deepEqual(result.removed, []);
  assert.equal(result.reloads, 0, "Production retains its offline worker");
  for (const options of [{ secure: false }, { available: false }]) {
    result = await run(options);
    assert.deepEqual(result.registered, []);
    assert.equal(result.reloads, 0);
  }
  result = await run({ reject: true });
  assert.equal(result.warnings.length, 1);
  assert.equal(result.reloads, 0);
  assert(!fs.readFileSync(path.join(root, "app/+html.tsx"), "utf8").includes("serviceWorker.register"), "HTML must not register a second worker");
  console.log("PASS: development releases only the app worker, reloads once, leaves saved-data APIs untouched; production registration, unsupported environments, and failures remain safe.");
})().catch(error => { console.error(error); process.exitCode = 1; });
