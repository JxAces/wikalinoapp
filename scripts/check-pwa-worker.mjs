import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import http from "node:http";
import vm from "node:vm";

// Native Node HTTP/fetch produces real followed-redirect Responses. No browser
// session or external website is needed to exercise the worker's fetch handler.
const html = "<main>Wikalinggo install guide</main>";
const server = http.createServer((request, response) => {
  if (request.url.endsWith(".html")) {
    response.writeHead(302, { Location: request.url === "/index.html" ? "/" : request.url.replace(/\.html$/, "") });
    response.end();
    return;
  }
  response.writeHead(200, "OK", { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" });
  response.end(html);
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const origin = `http://127.0.0.1:${server.address().port}`;
const entries = new Map();
try {
  for (const pathname of ["/install.html", "/index.html"]) {
    const response = await fetch(origin + pathname);
    assert.equal(response.redirected, true, "Fixture must contain real redirect history");
    assert.equal(await response.clone().text(), html);
    entries.set(pathname, response);
  }
} finally {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

const audio = Uint8Array.from({ length: 10 }, (_, index) => index);
entries.set("/music.mp3", new Response(audio, { headers: { "Content-Type": "audio/mpeg", "X-Asset": "music" } }));
entries.set("/assets/vendor/%40expo/font.ttf", new Response(Uint8Array.from([0, 1, 255, 42]), { headers: { "Content-Type": "font/ttf" } }));
entries.set("/offline.html", new Response("offline page", { status: 203, statusText: "Local copy", headers: { "Content-Type": "text/html" } }));
const listeners = new Map();
let lastMatched;
let networkCalls = 0;
let offline = true;
vm.runInNewContext(fs.readFileSync(new URL("./pwa-worker.js", import.meta.url), "utf8"), {
  self: { location: { origin }, addEventListener: (name, handler) => listeners.set(name, handler) },
  URL, Response, Headers,
  caches: { open: async () => ({ match: async pathname => {
    lastMatched = entries.get(pathname)?.clone();
    return lastMatched;
  } }) },
  fetch: async () => {
    networkCalls++;
    if (offline) throw new Error("Fixture network is offline");
    return new Response("network fallback");
  },
});
const dispatch = (pathname, { mode = "navigate", redirect = "manual", method = "GET", range } = {}) => {
  let pending;
  listeners.get("fetch")({
    request: { url: new URL(pathname, origin).href, mode, redirect, method, headers: new Headers(range ? { Range: range } : {}) },
    respondWith: response => { pending = response; },
  });
  return pending;
};

for (const pathname of ["/install?source=qr", "/install.html", "/", "/unknown-route"]) {
  const response = await dispatch(pathname);
  assert.equal(response.redirected, false, `Navigation retained redirect history: ${pathname}`);
  assert.equal(response.url, "", `Navigation retained the redirect destination: ${pathname}`);
  assert.equal(response.status, 200);
  assert.equal(response.statusText, "OK");
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-cache");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await response.text(), html);
}
assert.equal(networkCalls, 0, "Cached navigation attempted to use the offline network");

let response = await dispatch("/offline.html");
assert.equal(response, lastMatched, "Unredirected navigation was unnecessarily reconstructed");
assert.equal(response.status, 203);
assert.equal(response.statusText, "Local copy");
assert.equal(await response.text(), "offline page");

// Keep asset response identity/URL metadata and binary bytes intact.
response = await dispatch("/install.html", { mode: "same-origin", redirect: "follow" });
assert.equal(response, lastMatched);
assert.equal(response.redirected, true);
assert.equal(await response.text(), html);
response = await dispatch("/assets/vendor/@expo/font.ttf", { mode: "cors", redirect: "follow" });
assert.equal(response, lastMatched);
assert.equal(response.headers.get("content-type"), "font/ttf");
assert.deepEqual(new Uint8Array(await response.arrayBuffer()), Uint8Array.from([0, 1, 255, 42]));
response = await dispatch("/music.mp3", { mode: "cors", redirect: "follow" });
assert.equal(response, lastMatched);
assert.deepEqual(new Uint8Array(await response.arrayBuffer()), audio);

for (const [range, expected, contentRange] of [
  ["bytes=2-5", [2, 3, 4, 5], "bytes 2-5/10"],
  ["bytes=-3", [7, 8, 9], "bytes 7-9/10"],
  ["bytes=8-", [8, 9], "bytes 8-9/10"],
  ["bytes=8-99", [8, 9], "bytes 8-9/10"],
]) {
  response = await dispatch("/music.mp3", { mode: "cors", redirect: "follow", range });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), contentRange);
  assert.equal(response.headers.get("content-length"), String(expected.length));
  assert.equal(response.headers.get("accept-ranges"), "bytes");
  assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.equal(response.headers.get("x-asset"), "music");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), Uint8Array.from(expected));
}
response = await dispatch("/music.mp3", { mode: "cors", redirect: "follow", range: "bytes=99-" });
assert.equal(response.status, 416);
assert.equal(response.headers.get("content-range"), "bytes */10");
response = await dispatch("/music.mp3", { mode: "cors", redirect: "follow", range: "invalid" });
assert.equal(response.status, 416);

offline = false;
assert.equal(await (await dispatch("/uncached.png", { mode: "cors", redirect: "follow" })).text(), "network fallback");
assert.equal(networkCalls, 1);
assert.equal(dispatch("/install", { method: "POST" }), undefined);
assert.equal(dispatch("https://other.example/install"), undefined);
console.log("PWA worker checks passed: redirected offline navigation, response metadata, binary assets, and audio byte ranges.");
