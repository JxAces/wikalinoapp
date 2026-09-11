const CACHE = "__CACHE_NAME__";
const FILES = "__PRECACHE_URLS__";

self.addEventListener("install", event => {
  // A failed download leaves the previous worker available. New releases wait
  // until the old app closes, avoiding a mixture of old JS and new assets.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (let i = 0; i < FILES.length; i += 8) await cache.addAll(FILES.slice(i, i + 8));
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith("wikalino-") && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Expo may request @expo font paths with a literal @ while the manifest
    // URL encodes it as %40. Cache Storage compares URL strings, not filenames.
    const pathname = url.pathname.split("/").map(part => {
      try { return encodeURIComponent(decodeURIComponent(part)); }
      catch { return part; }
    }).join("/");
    let response = await cache.match(pathname);
    if (event.request.mode === "navigate" && !response) {
      const html = pathname.replace(/\/$/, "") + ".html";
      response = await cache.match(html) || await cache.match("/index.html");
    }
    if (!response) return fetch(event.request);
    // Safari requests byte ranges for audio. Serve them from the cached file.
    const range = event.request.headers.get("range");
    if (range) {
      const bytes = await response.arrayBuffer();
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) return new Response(null, { status: 416 });
      const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
      if (start > end || start >= bytes.byteLength) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.byteLength}` } });
      const headers = new Headers(response.headers);
      headers.set("Content-Range", `bytes ${start}-${end}/${bytes.byteLength}`);
      headers.set("Content-Length", String(end - start + 1));
      headers.set("Accept-Ranges", "bytes");
      return new Response(bytes.slice(start, end + 1), { status: 206, headers });
    }
    return response;
  })());
});
