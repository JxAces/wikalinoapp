# Wikalino PWA

Build the installable browser app from the project root:

```sh
npm run build:pwa
```

Publish the contents of `dist/` at the root of an HTTPS website. Configure the
host to serve `/progress` as `/progress.html` (and likewise for other exported
routes), with `/index.html` as the navigation fallback. Serve `sw.js` with
`Cache-Control: no-cache` so browsers can detect new releases. Do not use the
Expo development server as the installed/offline production version.

The web app shares the mobile Three.js world: five selectable characters,
walking/hopping, floating scrolls, completion circles, the tropical hut, chest,
and the interactive reward coin. Character previews support drag rotation.
Use the touch joystick on a phone or WASD/arrow keys on a keyboard. The loading
book and portal use the existing React Native animations in the browser.

On iPhone, open the HTTPS site in Safari and choose Share → Add to Home Screen.
On Android, use the browser's Install app/Add to Home screen action. An HTTPS
deployment is needed before sharing an install link; the build alone does not
publish the app.

The first online visit downloads all exported routes, bundles, images, fonts,
music, and eight runtime GLBs into a versioned service-worker cache. Keep the
app online until that download completes before using it offline. A failed
download does not activate a partially cached update. After an update is ready,
close all Wikalino tabs/windows and reopen to use the new version.

Music starts after a tap or key press to meet browser autoplay rules, pauses
when the app is hidden, and supports offline byte-range playback. Progress and
the chosen character are saved in browser storage, independently of Expo Go's
device storage. Clearing site data removes that browser's saved progress and
offline downloads.

3D requires browser WebGL support. The browser uses a real WebGL canvas; native
Expo GL keeps its existing adapter and pinned Three.js version. Test a release
on actual iPhone Safari/Home Screen and Android Chrome before distribution;
desktop browser tests cannot establish performance on every phone.
