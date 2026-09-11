import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Run after expo export. Cache the actual hashed bundles and GLBs, including
// lazy-loaded rewards, so the installed app can open every character offline.
const output = path.resolve(process.argv[2] ?? "dist");
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
if (!fs.existsSync(path.join(output, "index.html"))) throw new Error("Export the web app before building its PWA cache.");
const files = walk(output).filter(file => !/\.(map|hbc)$/.test(file) && !["sw.js", "metadata.json"].includes(path.basename(file))).sort();
const version = createHash("sha256");
for (const file of files) version.update(path.relative(output, file)).update(fs.readFileSync(file));
const urls = files.map(file => "/" + path.relative(output, file).split(path.sep).map(encodeURIComponent).join("/"));
const source = fs.readFileSync(new URL("./pwa-worker.js", import.meta.url), "utf8")
  .replace('"__CACHE_NAME__"', JSON.stringify("wikalino-" + version.digest("hex").slice(0, 16)))
  .replace('"__PRECACHE_URLS__"', JSON.stringify(urls));
fs.writeFileSync(path.join(output, "sw.js"), source);
console.log(`PWA prepared: ${files.length} files, including ${files.filter(file => file.endsWith(".glb")).length} GLB models.`);
