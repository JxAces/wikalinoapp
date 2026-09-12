# Explorer walking animations

`wikalino-indigenous-explorer.glb`, `wikalino-muslim-explorer.glb`, and
`wikalino-batang-pinoy-explorer.glb` contain
embedded `Idle` and `Walk` clips with a seven-bone leg rig. Their original mesh,
vertex colors, and materials are preserved. The Muslim character uses a shorter
stride to limit stretching in the long garment.

The world plays `Walk` while moving and restores the original standing pose
when movement stops. Browsers blend clip weights; native switches prepared poses. Character
selection remains a stationary, rotatable preview. The student retains its
existing Quaternius standing/walking poses.

Native Expo GL uses the CPU compatibility path in `compatible-skinning.ts`
during pose preparation and for static character previews. It renders an
ordinary mesh, avoiding Three r162's WebGL 2-only bone-texture shader
(`textureSize` / `texelFetch`). The native world caches the result for 12 walk
phases and idle; it does not run live CPU deformation during gameplay.

The matrix-uniform GPU path remains enabled for WebGL 1 browsers with enough
vertex uniforms, and WebGL 2 browsers keep Three's standard GPU skinning.
Although the custom uniform shader passed browser testing, a subsequent report
of a native process exit after intro prompted disabling it on native until a
current iOS crash report/device run can establish the cause. The old September
11 report is not evidence for that newer crash. No claim of confirmed native
crash resolution is made from bundle tests alone.

The original skinned mesh stays on an empty render layer for animation bindings.
Switching characters or leaving a world releases compatibility resources.
World models load in stages with a frame opportunity between loads. Models
arriving after a world is disposed are also released. Development logs show
`[Wikalino world] loading …` and `submitted … frame`; submission does not prove
that asynchronous native GPU processing completed successfully.

Native world rendering is paced at 30 FPS. The meadow terrain uses 2,400
triangles on native and 9,600 on web instead of the original 27,200. Character selection disables MSAA and only redraws
when loaded, resized, rotated, or resumed. These changes reduce work without
changing saved progress or the original GLB colors/animations.

Local Node benchmark (not device FPS): the previous CPU path used roughly
2.8–8.1 ms per animated frame across the three characters, uploading
442,008–1,109,232 bytes of positions/normals. The browser matrix-uniform path used about
0.016–0.029 ms per update and supplies 448 bytes of bone matrices, with no
animated vertex uploads. All three models rendered together in a WebGL 1
browser check without shader errors. Actual iPhone frame rate still needs a
physical-device check.

The `EXT_blend_minmax` and `OES_vertex_array_object` warnings are emitted by
Three's renderer initialization. Three has a non-VAO attribute-binding fallback;
the map does not use min/max blending. Expo's `pixelStorei` message occurs for
unsupported texture unpack parameters; those logs alone are not a frame-rate
measurement. No extension support is faked and warnings are not globally muted.

Check this compatibility path against all three bundled animated models:

```sh
node scripts/check-compatible-skinning.mjs
```

The check compares walk and idle vertices and normals against Three's skinning
math, including parent rotation/translation/scale, retained colors, render
layers, repeated updates, and disposal. Physical-device rendering still needs
an Expo Go check after reloading the JavaScript bundle.

After regenerating either colored model, restore the animation and check it:

```sh
node scripts/add-explorer-walk.mjs
node scripts/check-explorer-walk.mjs
```

The generator skips an already rigged model. To change the rig parameters,
regenerate its colored mesh first, then rerun the generator. The check verifies
normalized skin weights, alternating feet over the full cycle, floor clearance,
an unchanged upper body, and restoration of the standing pose.

For Batang Pinoy, run `node scripts/color-batang-pinoy-glb.mjs` before the rig
generator. The color script saves the original scan in the ignored local folder
`assets/models/.source-models/` on its first run. It corrects the pale hat, white
shirt, red neckerchief and trousers, hair, skin and bare feet. The rig generator
also updates the user-facing `assets/models/batangPinoy.glb` to match the colored,
animated runtime asset. Its skin weights keep the child's lower-hanging hands
and shirt from following the legs.

Rebuild the PWA with `npm run build:pwa` to include the updated models in its
offline cache. A GLB viewer can preview the embedded clips directly by selecting
`Walk` in its animation controls.

## Mobile rendering budget

`RenderSurface.tsx` now measures its container and lays out a smaller Expo
GLView, scaling that drawable layer to fill the container. This is necessary
because native Expo GL allocates at device screen scale, independently of
Three's `setPixelRatio`. The target is at most 1.25 pixels per layout point and
1280 pixels on the longest side. HUD text and controls remain separate native
views. The web surface uses the same pixel budget. On a 390×844, 3× phone this
requests about 488×1055 pixels instead of 1170×2532; verify the actual drawable
size in the device log. The tradeoff is a softer 3D image.

Native scenery uses fewer canopy/mushroom segments and 130 instead of 220 small
foliage clusters. Static scenery matrices are frozen. Native world rendering
still targets 30 FPS. Rigged characters in the native world now use prepared
poses (see below); the compatibility fallback remains available for previews
and models without a prepared clip. The simulation delta
cap is 100 ms, so brief frames slower than 20 FPS do not unnecessarily slow the
player. Large pauses remain bounded.

After 120 post-loading frames, development builds print one
`[Wikalino performance]` snapshot (resets on resume). `submittedFps` measures JS
frame submission, not GPU presentation; `averageJsFrameMs` measures JS work,
not native GPU duration. The snapshot includes actual framebuffer dimensions,
draw calls, triangle count and animation mode. These numbers help distinguish
remaining CPU/scene cost from device-side GL presentation problems.

Run `node scripts/check-render-budget.cjs` for portrait/landscape phone/tablet
coverage, pixel limits and preservation of aspect ratio and container edges.


## Native prepared walking poses

A physical-device report still showed 9 submitted FPS / 92.5 ms JS work with a
488×1055 framebuffer and CPU skinning. Reducing resolution alone was therefore
insufficient. `baked-explorer-walk.ts` now prepares 12 samples of the embedded
Walk clip plus the original idle pose **before attaching the native character**.
Preparation yields between samples and cancels if the world is disposed.
During play, a pose change only assigns a cached geometry; it does not deform
vertices, update an AnimationMixer, or mark position/normal buffers dirty.
The existing compatible-skinning math is used during preparation, so this does
not enable the native matrix-uniform shader that previously coincided with an
iPhone crash. Web keeps its existing skeletal path.

The cache is owned by one loaded character, not global. Each pose shares color,
UV and index attributes; only position and normal arrays are distinct. For the
largest current character those arrays use about 13.8 MiB across 13 poses, plus
existing model buffers. GPU uploads happen on the first use of each pose and
buffers are reused thereafter. Leaving the world disposes every pose. The
tradeoff is extra preparation time and memory for no live CPU deformation;
12 discrete samples can look less fluid than continuous GPU skinning.

Native static meadow colors are baked into vertex colors and merged: 14 mesh
draws become 3 (textured terrain, colored scenery, translucent shadows). The
terrain uses a 30×40 grid on native; the native meadow totals 33,946 triangles.
Each portal's three stone shades share one vertex-colored mesh, taking it from
6 to 4 draws without changing the swirling surface or floating debris. The GL
adapter also checks its cached functions before reading the native HostObject.

Validation: `node scripts/check-mobile-world.mjs` compares all 12 poses against
Three's skeletal vertex results for indigenous, muslim and Batang Pinoy, checks
shared colors/indices, idle restoration, no attribute changes over 3,000 walk
updates, cancellation, one-time disposal, batched color fidelity and draw counts.
These are local correctness checks, **not an iPhone FPS measurement**.

The next device snapshot should say `animation: "baked-poses"`. New fields
`sceneUpdateMs` and `renderSubmitMs` separate scene-update JS time from Three/Expo
submission time (the latter may include native waits, not GPU presentation).
Compare both idle and walking after a full reload; actual device performance
still needs confirmation.
