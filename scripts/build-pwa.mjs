import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Run after expo export. Cache the actual hashed bundles and GLBs, including
// lazy-loaded rewards, so the installed app can open every character offline.
const output = path.resolve(process.argv[2] ?? "dist");
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    if (!entry.isFile()) throw new Error(`PWA output must contain only regular files: ${file}`);
    return [file];
  });
}
if (!fs.existsSync(path.join(output, "index.html"))) throw new Error("Export the web app before building its PWA cache.");

// Static hosts can omit any directory named node_modules, including Expo's
// exported fonts and router images. Normalize only the completed export.
walk(output);
const vendorSource = path.join(output, "assets", "node_modules");
const vendorTarget = path.join(output, "assets", "vendor");
if (fs.existsSync(vendorSource)) {
  if (!fs.statSync(vendorSource).isDirectory()) throw new Error("Expected exported assets/node_modules to be a directory.");
  if (!fs.existsSync(vendorTarget)) {
    fs.renameSync(vendorSource, vendorTarget);
  } else {
    if (!fs.statSync(vendorTarget).isDirectory()) throw new Error(`Exported asset directory conflicts with a file: ${vendorTarget}`);
    // A repeated Expo export may retain previously normalized assets. Merge
    // identical files, but never overwrite a different exported asset.
    const moves = walk(vendorSource).map(source => ({ source, target: path.join(vendorTarget, path.relative(vendorSource, source)) }));
    for (const { source, target } of moves) {
      let parent = path.dirname(target);
      while (parent !== output) {
        if (fs.existsSync(parent) && !fs.statSync(parent).isDirectory()) throw new Error(`Exported asset directory conflicts with a file: ${parent}`);
        parent = path.dirname(parent);
      }
      if (fs.existsSync(target) && (!fs.statSync(target).isFile() || !fs.readFileSync(source).equals(fs.readFileSync(target)))) {
        throw new Error(`Exported vendor assets conflict: ${target}`);
      }
    }
    for (const { source, target } of moves) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target)) fs.unlinkSync(source);
      else fs.renameSync(source, target);
    }
    // Resolve and check the exact export subtree before recursively removing
    // its now-empty directories; source dependencies are outside this tree.
    const sourceRoot = fs.realpathSync(vendorSource);
    const outputRoot = fs.realpathSync(output);
    if (path.relative(outputRoot, sourceRoot) !== path.join("assets", "node_modules")) throw new Error("Exported vendor assets escaped the output directory.");
    fs.rmSync(sourceRoot, { recursive: true });
  }
}
for (const file of walk(output)) {
  if (!/\.(js|mjs|cjs|html|json|css|webmanifest|map|txt)$/i.test(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  // Match complete directory names, including a URI that ends at the asset
  // directory. Preserve JSON-escaped slashes and percent-encoded URL slashes.
  const normalized = source.replace(/(^|%2f|[^\w.-])assets(\/|\\\/|%2f)node_modules(?![\w.-])/gi, (_, prefix, separator) => `${prefix}assets${separator}vendor`);
  if (normalized !== source) fs.writeFileSync(file, normalized);
}
const files = walk(output).filter(file => {
  const relative = path.relative(output, file).split(path.sep).join("/");
  // Expo's EAS/static-server headers and redirects metadata is not a client
  // resource. Keep it for those hosts without caching its hidden HTTP path.
  return relative !== "_expo/.routes.json" && !/\.(map|hbc)$/.test(file) && !["sw.js", "metadata.json"].includes(path.basename(file));
}).sort();
const workerTemplate = fs.readFileSync(new URL("./pwa-worker.js", import.meta.url), "utf8");
const version = createHash("sha256").update(workerTemplate);
for (const file of files) version.update(path.relative(output, file)).update(fs.readFileSync(file));
const urls = files.map(file => "/" + path.relative(output, file).split(path.sep).map(encodeURIComponent).join("/"));
const source = workerTemplate
  .replace('"__CACHE_NAME__"', JSON.stringify("wikalino-" + version.digest("hex").slice(0, 16)))
  .replace('"__PRECACHE_URLS__"', JSON.stringify(urls));
fs.writeFileSync(path.join(output, "sw.js"), source);
console.log(`PWA prepared: ${files.length} files, including ${files.filter(file => file.endsWith(".glb")).length} GLB models.`);
