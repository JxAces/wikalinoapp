# Story journey

The mobile and PWA routes share the same Three.js world engine.

1. `/landing` contains three widely spaced stone portals with flowing green centers and floating rocks. Every book can be opened. Gate centers are roughly 15 world units apart, inside the existing walkable area.
2. Entering a portal opens `/story-room?storyId=…`, with three floating objects: a book for `/story`, a cabinet for `/story-cabinet`, and a scroll for the existing `/quest-world` quizzes. Both cabinet and scroll remain disabled until reading is complete. The reader advances one section at a time after scrolling to the bottom. Closing early returns to the room with both locked and the reading position saved. Completing the last page awards reading XP once and returns to the room with both unlocked. Direct cabinet and quiz URLs enforce the same reading gate.
3. `/quest-world?storyId=…` contains a winding road of three scroll checkpoints, each containing five questions. Gold is available, gray is locked, and green with a check means all five answers are correct. The next checkpoint unlocks after the preceding group is complete. Saved answers are retained; reopening a partial group resumes its first unanswered question. Completed groups can be replayed.
4. A scroll opens `/activity-player`. Wrong answers stay in that question. After each correct answer, the student can continue to the next question in the same group. At the end of five questions, they return beside the completed scroll and walk to the next checkpoint. Leaving midway also returns beside the same group.
5. After all scrolls are green, the world offers the result/reward screen. Completion and reward XP are awarded once.

The library remains available for free reading with unrestricted page navigation. Reading in the journey saves the section index; returning through a portal resumes that book.

The cabinet contains the PDF's three activities for Sandaang Damit and three for Ugat (`data/cabinet-activities.ts`). It saves written responses and choices locally in `cabinetResponses`, separately from quiz results and XP. Completion checks required fields, not literary correctness. Editing returns a completed response to draft. Group analysis is saved on the current device; there is no shared classroom board, online submission, or teacher grading service. The third story has an explicit empty cabinet because the PDF supplies no activities for it. Clearing progress also clears cabinet responses; version 4 preserves older reading and quiz saves.

The app waits for the user store to hydrate before mounting routes, so refreshing a cabinet or quiz does not evaluate reading locks against an empty initial save.

The Sandaang Damit menu presents each of its three activities as a separate wooden cabinet. New activities and drafts have closed doors; a saved `completedAt` displays open doors, garments, and a completion check. Every cabinet can be opened to answer or review its activity. The doors return to the closed state when editing turns a completed response into a draft. The cabinets sit side by side on wider screens and form a vertical list on phones. Ugat keeps its existing menu.

Web development registers no offline worker. If an earlier development visit installed `/sw.js`, the app unregisters that worker and reloads once to use the current Metro bundle, without touching student storage. Production keeps its offline registration. Run `node scripts/check-pwa-registration.cjs` to check this behavior.

Suri-Lalim (cabinet activity 02) uses four hanging garments to navigate Bago, Suliranin, Pagbabago, and Wakas, followed by the tauhang bilog explanation. It displays one question at a time and keeps the existing five response keys, autosave, and completion rules. An incomplete finish returns to the first missing answer. The cabinet menu still has three activities; interpretation choices and textual evidence remain in activity 03. The map wraps into two rows on narrow screens.

Ugat Check uses a tree with three selectable root interpretations, then the two textual proofs, then the group reflection (Piliin → Patunayan → Pagnilayan). A selected root is highlighted and the choice cards stack on mobile. Written answers remain intact when changing the interpretation. The final view displays the saved analysis for review with the teacher; it does not submit online or award a grade. Existing `ugat-check` response keys and the other two Ugat activities are unchanged.

Kuwentong Detective (Sandaang Damit activity 01) uses five wooden drawers and one answer/evidence pair per case file. Hints and the PDF example guide the group. The story peek reads the existing story scenes in a modal without changing reading progress or leaving the form. Paired answers are autosaved using the original `element-0..4` and `proof-0..4` keys. The final report lists all ten fields and can be marked “Handa nang ipasuri” only when all are filled; this is not grading or online submission. Opening a drawer respects reduced-motion settings. Existing completed responses remain available for review and edits return them to draft.

## Editing

- `components/story-world/quest-progression.ts`: answer gates, scroll positions, and world palettes.
- `components/story-world/quest-scenery.ts`: dress drawing courtyard, rooted town, and school courtyard. Static geometry is merged by color to limit draw calls.
- `components/story-world/story-portal-visual.ts`: animated hub gates. Uses merged stone meshes and a GLSL 1 procedural surface with no textures or WebGL 2 requirements. Each portal uses four draw calls; its fragment animation was checked in a WebGL 1 browser preview without shader errors.
- `components/story-library/StoryBookReader.tsx`: shared library/journey reader; `onComplete` enables sequential reading.
- `store/useUserStore.ts`: enforces reading/prerequisites before recording an activity, and all answers before awarding story completion.

Inactive world screens unmount their render surface and dispose the engine. Models are loaded sequentially with a frame opportunity between stages; late models are disposed if the screen has exited. Development logs identify each loading/submitted stage. Models are loaded afresh on return, with the character positioned beside the last question. This avoids keeping hub and question-world GL contexts alive together on iOS.

## Checks

Run `node scripts/check-story-journey.cjs` for reading gates, sequential unlocks, replay protection, green states, and final rewards for all 45 questions. The script uses in-memory storage and does not modify real player saves.

Run `node scripts/check-cabinet-svg.cjs` to render the Suri-Lalim and Ugat illustrations with the development React DOM renderer. It checks that native SVG accessibility props do not leak into HTML or trigger console errors; production builds suppress that warning.

Also run `npx tsc --noEmit`, lint changed files, `npm run build:pwa`, and an iOS Expo export. Device testing is still needed to assess frame rate and native lifecycle on the target iPhone.

Run `node scripts/check-world-startup.cjs` to check sequential loading, cancellation on exit, and error handling without creating a native GL context. A native process exit still requires a current iOS crash report; Metro warnings alone do not identify its cause.
# Sequential portal access

TEMPORARY OVERRIDE: the prerequisite return in `canEnterStory` is commented
out; any existing story can be entered without finishing earlier stories.
Restore that commented return to re-enable sequential portal access. Question
ordering, reading requirements and chest completion checks still apply.

The third world is a symbolic forgotten Filipino village: six raised homes
with woven wall details and pitched nipa roofs, a vacant sari-sari stall, a
waiting shed, faded empty plaques, and a school with two empty desks recalling
Mimi's pupils. Mist and muted colors replace the bright meadow. This visual
interpretation does not change the original story or questions. Building
footprints block walking; question clearings, resumed positions, chest and
return portal remain reachable. Static village geometry is batched by vertex
color to keep the phone workload low.

Sandaang Damit now uses a clothing-market maze inspired by densely packed racks:
five volumetric garment styles, ten colors, pleats, striped/printed fabric,
contrasting hems, belts, sleeves, visible triangular hangers and folded fabric
under the rails. Low plinths and steel rails replace the paper display boards.
Alternating openings and side paths retain the existing collision layout.
Walls have collision with sliding and small movement substeps. All scrolls,
resume positions, chest and exit remain reachable. The maze merges into one
draw call (19,316 triangles, under the 20,000-triangle maze budget). Cloth is
static geometry with baked vertex colors, not a per-frame cloth simulation.

Ugat uses a separate nighttime forest instead of the meadow and town blocks.
Moonlight, 23 magical trees, luminous tangled roots, canopy lights and three
swamp pools evoke deeply rooted problems as a visual metaphor for the story.
Players start at the forest entrance and search three clearings without a stone
trail. Trunks and water block movement; all objectives have dry routes. Glowing
materials use no extra lights, bloom or shadow maps. Forest scenery totals
11 draws / 13,664 triangles. Node checks validate both worlds' reachability,
spawn safety, collision and geometry budgets; on-device appearance/FPS needs
a phone run.

Entering an unlocked story portal now navigates to the story route and plays
`StoryEntryIntro` before mounting the reader. It reuses only the launch
animation's swirling portal and tunnel passage, with no book or loading card.
The roughly three-second zoom ends with the story reader; Reduce Motion uses
a short static portal instead. The map releases its GL scene on blur. The
intro cancels its animations and completion timer on unmount.
It does not mark reading complete or change the
saved page. After the reader is finished, the existing story-world transition
still runs; the return portal retains its own transition back to the hub.

Each story world has an always-available return portal at the back-left of its
entrance. It is separate from the question nodes and never participates in chest
unlocking. Approaching it reveals BUMALIK; pressing it stops movement, plays the
portal transition and replaces the quest route with `/landing`. It does not
award rewards or clear saved answers. The existing map button and non-3D
fallback return link remain available. The gate uses the existing merged portal
visual and is disposed with its world on navigation.

Question scrolls now use their own compact positions, about 5.94 units apart,
and the quest chest sits five units beyond the last scroll. Hub portal positions
remain unchanged. A chest unlocks only when its nonempty list of nodes is fully
completed: all question groups in a quest, or all stories in the hub. Locked
chests display a merged 3D padlock and a HUD prerequisite/progress message.
The native/PWA reward button requires chest proximity; the non-3D fallback uses
the same completion requirement without a movement requirement. Reward actions
recheck the live save. Story-result links redirect away from unfinished worlds.
The hub chest claims existing story rewards idempotently and opens progress;
it does not create an additional repeatable XP bonus.

The hub unlocks stories in their catalog order. `canEnterStory` requires every
activity in every preceding story to have a saved correct result. Reading alone
does not unlock the next portal; the final correct task does, without requiring
the player to claim the reward chest. Old out-of-order progress does not bypass
missing earlier tasks. Completed, unlocked stories remain replayable.

Locked portals appear gray and show a prerequisite message. Both native and
PWA hub interactions, story/quest/activity routes, and store activity/reward
writes enforce the rule. The collection's read-only library remains available.
`scripts/check-story-journey.cjs` checks final-task unlocking, direct store
bypass attempts, replay, legacy out-of-order answers, and clearing progress.

## Expanded main hub

The hub is now a 74 × 72-unit exploration area, separate from the compact story-world bounds. Story 1 sits on the dry waterfall shelf at (-25, -23.5), story 2 in the forest clearing at (20, -24.5), and story 3 in the village square at (23, 12.5). `hub-layout.ts` supplies the portal centers, approach points and headings to both scenery and the engine. Each gate faces its approach, with clearings that exclude trees, mushrooms and wildlife. The hut is beside the village at (33, 7), clear of the portal; the completion chest is at (25, 23).

The river blocks movement except at two bridges. Houses, the hut clearing, and the cliff backdrop also block movement. A camera-relative HUD arrow selects the first unfinished story (then the chest), names its area, reports distance, and routes across bridges. Guidance updates at four times per second; quest scroll worlds retain their existing controls and layout.

Fresh play starts at (-24, -16), on the dry path facing the waterfall portal. `hub-navigation.ts` carries the story ID in the `returnPortal` route parameter. The story-room Back button, quest return portal and story-result exit return 3.4 units in front of that story's original gate, facing it. Entering a gate also records that parameter on the hub tab for native/browser Back. Unknown IDs fall back to the waterfall; loading/onboarding explicitly clear old return parameters. The camera anchor, camera heading and joystick heading initialize at the same arrival pose. Quest entry/resume positions are unchanged.

Three villagers, two chickens and two birds roam locally alongside the forest wildlife below. They are ambient characters, not dialogue/quest NPCs. Geometry is merged per region/actor and distant actors are hidden. No additional GLBs, skeletal rigs or physics dependencies are loaded.

The hub keeps the reference's storybook meadow direction: leafy painted grass, broad mottled tree crowns, flared trunks, spotted mushrooms, grass fans, and rolling perimeter banks. Mushrooms are now 48% of their original scale to open the sightlines. Grass reuses the existing 256px procedural meadow texture (no image download or canvas dependency). Playable ground stays level and the river/bridge routes remain unchanged. A 32,000-triangle / 24-mesh ceiling covers the hub scenery plus all 16 ambient actors, excluding existing portals and imported models.

`hub-wildlife.ts` adds five butterflies, two reindeer and two wolves in the northern forest. Wings flap, legs walk, tails move, and reindeer pause to graze. Each animal is a single merged ordinary mesh with GLSL 1 pivot attributes, avoiding skeletal skinning, float textures and per-frame vertex-buffer uploads. Animals remain in small forest habitats, keep portal approaches clear, pause near the player, and stop rendering/updating beyond 26 units. Small clearings keep their walking loops clear of tree trunks. Existing villagers, chickens and birds remain.

`hub-water.ts` animates river ripples, waterfall streaks and pool rings with two opaque draws. Batched forest/palm foliage sways through a shader uniform; trunks and ground stay fixed. These effects were rendered in a WebGL 1 browser preview without shader errors. Physical iPhone frame rate still needs device verification. `check-mobile-world.mjs` checks portal reachability/facing, habitat limits, grazing/walking, distance culling, unchanged animation buffers, scene budgets and resource disposal.
