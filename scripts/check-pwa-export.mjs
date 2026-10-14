import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const buildScript = fileURLToPath(new URL("./build-pwa.mjs", import.meta.url));
const prefix = "wikalinggo-pwa-export-";
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const output = path.join(temporaryRoot, "export with spaces");
const write = (relative, contents) => {
  const file = path.join(output, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
};
const run = () => spawnSync(process.execPath, [buildScript, output], { encoding: "utf8" });
const precache = worker => JSON.parse(worker.match(/const FILES = (\[[^;]*\]);/)[1]);

try {
  const font = Buffer.from("\u0000\u0001font-binary-assets/node_modules-kept-intact");
  write("assets/node_modules/@expo/fonts/font.ttf", font);
  write("assets/node_modules/expo-router/image.png", Buffer.from([137, 80, 78, 71, 0, 1, 2]));
  write("assets/node_modules/expo-router/asset.json", '{"image":"/assets/node_modules/expo-router/image.png"}');
  write("index.html", '<script src="/bundle.js"></script><link href="/assets/node_modules/@expo/fonts/font.ttf">');
  write("bundle.js", String.raw`const paths = ["/assets/node_modules", "assets/node_modules/expo-router/image.png", "\/assets\/node_modules\/@expo/fonts/font.ttf", "/assets/node_modules-legacy/image.png", "/myassets/node_modules/image.png"];`);
  write("data.json", JSON.stringify({ directory: "assets/node_modules", font: "/assets/node_modules/@expo/fonts/font.ttf" }));
  write("style.css", 'src: url("/assets/node_modules/@expo/fonts/font.ttf")');
  write("nested/page.html", '<img src="%2Fassets%2Fnode_modules%2Fexpo-router%2Fimage.png">');
  write("_expo/.routes.json", '{"redirects":[]}');

  let result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(output, "assets/node_modules")), false);
  assert.deepEqual(fs.readFileSync(path.join(output, "assets/vendor/@expo/fonts/font.ttf")), font);
  assert.equal(JSON.parse(fs.readFileSync(path.join(output, "assets/vendor/expo-router/asset.json"), "utf8")).image, "/assets/vendor/expo-router/image.png");
  assert.match(fs.readFileSync(path.join(output, "index.html"), "utf8"), /\/assets\/vendor\/@expo\/fonts\/font\.ttf/);
  const bundle = fs.readFileSync(path.join(output, "bundle.js"), "utf8");
  assert.ok(bundle.includes('"/assets/vendor"'));
  assert.ok(bundle.includes('"assets/vendor/expo-router/image.png"'));
  assert.ok(bundle.includes(String.raw`"\/assets\/vendor\/@expo/fonts/font.ttf"`));
  assert.ok(bundle.includes('"/assets/node_modules-legacy/image.png"'));
  assert.ok(bundle.includes('"/myassets/node_modules/image.png"'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(output, "data.json"), "utf8")).directory, "assets/vendor");
  assert.match(fs.readFileSync(path.join(output, "style.css"), "utf8"), /\/assets\/vendor\//);
  assert.match(fs.readFileSync(path.join(output, "nested/page.html"), "utf8"), /%2Fassets%2Fvendor%2F/);
  assert.equal(fs.readFileSync(path.join(output, "_expo/.routes.json"), "utf8"), '{"redirects":[]}');
  const worker = fs.readFileSync(path.join(output, "sw.js"), "utf8");
  const urls = precache(worker);
  assert.ok(urls.includes("/assets/vendor/%40expo/fonts/font.ttf"));
  assert.ok(!urls.includes("/_expo/.routes.json"));
  assert.ok(!urls.some(url => url.includes("/assets/node_modules/")));
  for (const url of urls) assert.ok(fs.existsSync(path.join(output, decodeURIComponent(url))), `Missing cached file: ${url}`);

  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(output, "sw.js"), "utf8"), worker, "Repeated preparation changed the release cache");

  // Re-exporting identical files into an existing output is safe and stable.
  write("assets/node_modules/@expo/fonts/font.ttf", font);
  result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(output, "sw.js"), "utf8"), worker);

  // A conflicting destination fails before either original is changed.
  write("assets/node_modules/@expo/fonts/font.ttf", Buffer.from("different"));
  result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Exported vendor assets conflict/);
  assert.deepEqual(fs.readFileSync(path.join(output, "assets/vendor/@expo/fonts/font.ttf")), font);
  assert.equal(fs.readFileSync(path.join(output, "assets/node_modules/@expo/fonts/font.ttf"), "utf8"), "different");
  console.log("PWA export checks passed: asset paths, binary integrity, precache, idempotence, and conflict safety.");
} finally {
  const cleanupRoot = fs.realpathSync(temporaryRoot);
  if (path.dirname(cleanupRoot) !== fs.realpathSync(os.tmpdir()) || !path.basename(cleanupRoot).startsWith(prefix)) throw new Error("Unexpected fixture cleanup path.");
  fs.rmSync(cleanupRoot, { recursive: true, force: true });
}
