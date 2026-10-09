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
- `components/story-world/story-route-layout.ts`: shared winding route, scroll checkpoints, reward and avenue tree positions.
- `components/story-world/story-route-visual.ts`: continuous stone pavement, low kerbs, planted edges, leafy ground and framing trees.
- `components/story-world/ugat-scene-placement.ts`: shared transforms for memory scenery, furniture collisions, people and window effects.
- `dress-maze-visual.ts`, `ugat-forest.ts`, and `forgotten-village.ts`: each story's roadside displays.
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

All three question worlds use a 3.4-unit-wide, gently winding paved promenade.
The three scrolls stand on its center line at z = 8, 0, and -8; the chest is at
z = -14. Curbs and low shrubs frame the route with openings to the side scenes.
The return gate is centered on a widened entrance landing behind the initial
camera, at (0, 21.4). Trees occupy the gaps between
displays, with distant trees and rolling hills beyond. New visits begin at the
entry; returning from a quiz still resumes beside that specific scroll. The
entire pavement width is checked against every world's collision layout.

Sandaang Damit keeps its colorful pleated, printed and striped garments,
hangers, rails and folded cloth. Eight pairs of racks now form left/right
galleries instead of partitions across the road. The 80 garments share one
mesh (15,104 triangles). Ugat's four memories alternate beside the route,
with the living room on the right. The third world's houses, empty plaques,
waiting shed and school stay off the central pavement, including the desks
that recall Mimi's pupils. Story identities, answer ordering, saved progress
and chest locks remain unchanged.

Ugat uses a daylight walk through four domestic memories: Lolo's news corner
after EDSA (newspaper, radio and television), Bert's letter and the planned
departure (luggage and doorway), the required document and proposed gift
certificate, and the sofa beside the dawn window. Wooden floors, wall sections,
textured cloth, furniture and real window/door openings give each memory a
recognizable setting. The grove and tangled root beds are visual metaphors for
entrenched wrongdoing and personal responsibility. Generic ponds are removed.

The final living-room tableau includes silver-haired Lolo seated on the sofa
and smaller Tasing and Ricky beside the homework. Its optional note explicitly
identifies this as a composition of memories: Lolo is alone at the written
ending. The doorway does not imply the departure actually happened, and the
gift certificate is never a reward. `ugat-layout.ts` holds the descriptions,
short excerpts, chapter references, inspection approaches and collision data.

Approaching a scene reveals a small “Gunita” button beside the joystick. It
opens `UgatMemoryNote`, an optional scrollable note with an excerpt and the
scene's meaning. Movement stops while the note is open; closing resumes normal
controls. This does not change answers, XP, reading completion or unlocks.

18 trees frame the memories, leaves drift, curtain folds move and paper lifts in
the breeze. The memory characters turn their heads and gesture using the same
GLSL 1 human meshes as the village; Lolo's seated pose is also GPU-driven.
The three seedlings grow with completed question groups and restore from the
save. The central sightline is open, and all scrolls, inspection points, resume
spawns, chest and return portal retain walkable routes. Furniture, root beds,
walls, tree trunks and people block movement. The reward is at the end of the
pavement; Lolo and the window are in a separate roadside viewing area.

Nine mesh draws and 21,801 triangles cover Ugat scenery and all three memory
characters (budget: nine meshes and under 26,000 triangles). The shared
pavement and planted edges add two draws, with a budget below 7,000 triangles;
player/scroll/chest assets are separate. Furnishings share one 256px atlas. Animation changes
uniforms and object matrices, without shadow maps, bloom, reflection passes,
bone textures or per-frame geometry uploads. Checks cover route safety,
proximity, progress-driven growth, GPU buffer stability and disposal, with WebGL
1 visual verification. Actual phone FPS still needs an on-device run.

Entering an unlocked story portal now navigates to the story route and plays
`StoryEntryIntro` before mounting the reader. It reuses only the launch
animation's swirling portal and tunnel passage, with no book or loading card.
The roughly three-second zoom ends with the story reader; Reduce Motion uses
a short static portal instead. The map releases its GL scene on blur. The
intro cancels its animations and completion timer on unmount.
It does not mark reading complete or change the
saved page. After the reader is finished, the existing story-world transition
still runs; the return portal retains its own transition back to the hub.

Each story world has an always-available return portal centered on its entrance
pavement, facing the story road and clear of the roadside trees. It is separate
from the question nodes and never participates in chest
unlocking. Approaching it reveals BUMALIK; pressing it stops movement, plays the
portal transition and replaces the quest route with `/landing`. It does not
award rewards or clear saved answers. The existing map button and non-3D
fallback return link remain available. The gate uses the existing merged portal
visual and is disposed with its world on navigation.

Question scrolls use shared promenade positions about eight units apart,
and the quest chest sits six units beyond the last scroll. Hub portal positions
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

The hub is now a 74 × 72-unit exploration area, separate from the compact story-world bounds. Story 1 sits on the dry waterfall shelf at (-25, -23.5), story 2 in the forest clearing at (20, -24.5), and story 3 in the village square at (23, 12.5). `hub-layout.ts` supplies the portal centers, approach points and headings to both scenery and the engine. Each gate faces its approach, with clearings that exclude trees, mushrooms and wildlife. Three raised village houses use recessed windows, open shutters, woven walls and overhanging nipa roofs, sharing one mesh and one 256px material atlas. The tropical hut is removed from the world, loading sequence and minimap; its former site at (33, 7) is an open walkable lawn. The completion chest remains at (25, 23).

The river blocks movement except at two bridges. Houses, their front steps, and the cliff backdrop also block movement. The minimap shows portals and bridge routes; the village lawn is clear. Quest scroll worlds retain their existing controls and layout.

Fresh play starts at (-24, -16), on the dry path facing the waterfall portal. `hub-navigation.ts` carries the story ID in the `returnPortal` route parameter. The story-room Back button, quest return portal and story-result exit return 3.4 units in front of that story's original gate, facing it. Entering a gate also records that parameter on the hub tab for native/browser Back. Unknown IDs fall back to the waterfall; loading/onboarding explicitly clear old return parameters. The camera anchor, camera heading and joystick heading initialize at the same arrival pose. Quest entry/resume positions are unchanged.

Three human-proportioned residents, two chickens and two birds roam locally alongside the forest wildlife below. Residents have modelled facial features, hair, collars, hands and shoes; one wears a woven hat. They alternate walking and resting, pause and turn toward nearby players, and occasionally wave. The welcome guide uses the same human model while retaining its existing dialogue. `village-person.ts` uses GLSL 1 limb rotation, including knee and elbow bends, in one ordinary mesh per person. No GLBs, bone textures, skeletal rigs, per-frame geometry uploads or physics dependencies are added. Distant residents stop rendering/updating.

The hub keeps the reference's storybook meadow direction: leafy painted grass, broad mottled tree crowns, flared trunks, spotted mushrooms, grass fans, and rolling perimeter banks. Mushrooms are now 48% of their original scale to open the sightlines. Grass reuses the existing 256px procedural meadow texture (no image download or canvas dependency). Playable ground stays level and the river/bridge routes remain unchanged. The hub retains 24 meshes including all 16 ambient actors. Scenery and wildlife stay below 36,000 triangles, with less than 4,500 triangles for all three articulated residents; the total remains below 40,000, excluding existing portals and imported player models.

`hub-wildlife.ts` adds five butterflies, two reindeer and two wolves in the northern forest. Wings flap, legs walk, tails move, and reindeer pause to graze. Each animal is a single merged ordinary mesh with GLSL 1 pivot attributes, avoiding skeletal skinning, float textures and per-frame vertex-buffer uploads. Animals remain in small forest habitats, keep portal approaches clear, pause near the player, and stop rendering/updating beyond 26 units. Small clearings keep their walking loops clear of tree trunks. Existing villagers, chickens and birds remain.

`hub-water.ts` animates river ripples, waterfall streaks and pool rings with two opaque draws. Batched forest/palm foliage sways through a shader uniform; trunks and ground stay fixed. These effects were rendered in a WebGL 1 browser preview without shader errors. Physical iPhone frame rate still needs device verification. `check-mobile-world.mjs` checks portal reachability/facing, habitat limits, grazing/walking, distance culling, unchanged animation buffers, scene budgets and resource disposal.
