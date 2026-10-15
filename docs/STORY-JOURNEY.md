# Story journey

The mobile and PWA routes share the same Three.js world engine.

The app UI shares the onboarding cream, tan, and brown palette through `AppTheme` in `constants/colors.ts`. Story rooms, readers, activity editors, assessments, general screens, loading states, and world HUD panels use these tokens; natural scene/tree/cabinet/garment artwork retains its own colors. The PWA launch and offline backgrounds use the same palette. Hub portal prompts display each story's title and author and use “Basahin natin”; assessment prompts retain “SAGUTIN”. Cabinet submission actions read “Ipasa”, including the detective evidence/report buttons and completed Ugat actions. They keep their existing completeness checks and local saving behavior.

1. `/landing` contains three widely spaced stone portals with flowing green centers and floating rocks. Every book can be opened. Gate centers are roughly 15 world units apart, inside the existing walkable area.
2. Entering a portal opens `/story-room?storyId=…`, with Tuklas-Wika (the book), Hasa-Wika (the cabinet, tree, or crown), and Suri-Wika (the quiz scroll). Each room shows the story's ordinal label, title, and author, without the markahan label, descriptive subtitle, or upper-right sparkle. The reader advances one section at a time after scrolling to the bottom. Closing early saves the reading position and leaves both Hasa-Wika and Suri-Wika locked. Completing the last page awards reading XP once and unlocks Hasa-Wika only. Suri-Wika unlocks after every active Gawain for that story has a saved completion; drafts and archived activities do not count. Clicking the locked quiz after reading displays “Tapusin muna ang mga gawain upang mabuksan ang pagsusulit”. Direct quest/question URLs and answer writes enforce the same requirements. Editing a completed Gawain back to draft relocks the quiz, preserving existing answers and XP.
3. `/quest-world?storyId=…` contains three scroll checkpoints and ten assessment questions per story. All three stories label the groups “Pamilyar Level,” “Suri Level,” and “Dalubhasa Level” through the shared `assessmentLevelTitle` helper, including the world prompts, fallback, and question screens. The score card reads “PAGSUSULIT” and shows the score and questions answered without a scroll count. Sandaang Damit and Utos ng Hari use groups of 3, 3, and 4; Ugat retains 4, 3, and 3. Gold is available, gray is locked, and green with a check means every question in that group has been answered. Correct and incorrect answers both advance progress. Reopening a partial group resumes its first unanswered question; completed questions open for review with their saved answers locked.
4. A scroll opens `/activity-player`. Each question accepts one submitted answer: correct earns 1 assessment point and the existing question XP plus 5 bonus XP; incorrect earns 0 points and 0 question XP. Both outcomes show feedback and allow continuation. Archery target hits and Ugat answer gestures follow the same rule; an arrow that hits no target is not an answer. At the end of a group, learners return beside its scroll. Leaving midway also returns beside the same group.
5. After all scrolls are answered, the result screen shows the story title and author, correct answers out of ten, percentage, correct/incorrect counts, XP, and stars. It omits the animated coin panel and “KWENTO COMPLETE” label. All three stories label the existing value and explanation card “PAGPAPAHALAGA.” The next-story button reads “Tingnan ang susunod na Kuwento.” Stars use the recorded correctness rate: 90% earns 3, 75% earns 2, otherwise a finished assessment earns 1. Reading XP (40) and completion XP (80) are awarded once, even when an assessment includes incorrect answers. Repeat visits cannot change the score or award XP again.

Save version 6 adds correctness and the selected answer to assessment records. Existing records use their saved first-try correctness; historical answers are not invented and accumulated XP is preserved. Reducing question banks retains the original question IDs and keeps removed records in storage, excluding them from the current ten-item score. Sandaang Damit and Utos ng Hari retain their first three Pamilyar questions, first three Suri questions, and first four Dalubhasa questions. Cabinet activities remain independent of assessment scoring.

Sandaang Damit Levels 1 and 2 use a wooden sewing table. Level 1 is titled “Piliin ang tamang sagot” and starts with a three-piece shirt outline; Level 2 (“Interpretasyon at Hinuha”) starts with a partly sewn garment and three missing sections. Its existing questions 4–6 now use sewing instead of archery; question IDs, answers, XP, and saved results stay compatible. The current number and section are highlighted from 1 to 3. Drag an A–D answer onto the garment to submit, or select an answer and tap the garment (keyboard and screen-reader alternative). Only a drop inside the garment counts. Correct answers sew one fabric piece and earn 1 point; incorrect answers show “Incorrect,” highlight the correct choice, and leave that section empty. There are no retries or guided replacement pieces. Each level's score and garment are derived only from its own saved assessment results, including after reload. The garment remains visible while phone users scroll the choices. Completing Level 1 shows “Bumalik sa Pagsusulit,” which returns to the first scroll in the quiz world with the score saved and Level 2 available to enter there. Completing Level 2 also shows “Bumalik sa Pagsusulit” and returns beside the second scroll with the score saved and Level 3 available to enter from the world, even with a zero score. The back button returns to the same scroll in the world. Previously answered questions remain locked and can be reviewed sequentially.

Sandaang Damit Dalubhasa Level (“Pagbuo ng Kaalaman”) starts with four bare, numbered mannequins and four whole historical garments. The garments follow the reference illustrations with cream fabric, a dark saya, embroidery, and a straight-cut, collarless Camisa de Chino. Clothing names are omitted from the learner interface. Each correct answer earns one point and unlocks one complete garment to drag onto its matching mannequin, or select and place by tapping the mannequin. Answer choices also support drag and select/tap. All four targets stay visible above the scrollable questions and garment cards on phones; progress counts dressed mannequins out of four. Incorrect answers display “Incorrect,” highlight the correct option, unlock no garment, and still allow continuation. A drop outside the matching mannequin changes neither placement nor score or XP. New Level 3 records store `wardrobeDressed`; returning from the world resumes an unlocked garment that still needs placement before the next unanswered question. Completed outfits from the previous four-piece version remain dressed, while partial ones await a single whole garment. Earlier compass results remain completed without regrading or changing XP. The final button returns to Pagsusulit after all unlocked garments are placed, including a zero-score finish. Assessment completion, stars, and chest unlocks remain based on answered questions, independently of dressing the mannequins. Clearing game progress removes placement with its answer records.

Ugat quiz headers show “Ugat ni Genoveva Edroza-Matute” across Pamilyar, Suri, and Dalubhasa, wrapping the full credit on phones. The Pamilyar “Lakbay ng Ugat” badges, the Suri scene's “Checkpoint” badge, and its “TATLONG TARANGKAHAN. ISANG LANDAS.” heading are removed. Active Ugat instructions, progress labels, and continuation text use question or gate wording instead of checkpoint labels. Answer counts, forest scenes, interactions, and scoring remain the same.

Ugat Level 3 (“Puno ng Alaala”) uses the existing questions 8–10, preserving the 4–3–3 split and leaving Levels 1 and 2 unchanged. Its A–D choices are seed packets: select a packet and tap the highlighted soil spot or “Itanim ang binhi,” or drag its handle onto that spot. Drops outside the current spot consume no attempt. Correct answers light one root and grow one leafy branch while the same child leans to plant, in a single 620 ms animation; reduced-motion settings skip the movement. Incorrect answers earn zero, reveal the correct choice and explanation, and allow continuation without retries. The tree and score are derived from saved assessment results, so revisiting restores branches without replaying rewards or changing XP. All three answered questions finish the level even at zero points. The final button uses the existing completion flow and returns beside the third scroll. The tree is vector art with no additional image assets or continuous animation; the scene stays visible above scrollable choices on phones.

The library remains available for free reading with unrestricted page navigation. Reading in the journey saves the section index; returning through a portal resumes that book. Every reading page displays the main story title and author in place of its scene title. The page-heading sparkle is removed, and previous-page navigation uses an arrow-only button with an accessible label. Pages flip around the book's spine, reversing direction for previous pages; Reduce Motion skips the flip. The ending displays a closed-book icon and “WAKAS” without the review hint. Story prose remains unchanged pending the complete source documents.

Hasa-Wika contains three activities for Sandaang Damit, three for Ugat, and four for Utos ng Hari (`data/cabinet-activities.ts`). It saves written responses and choices locally in `cabinetResponses`, separately from quiz results and XP. Completion checks required fields, not literary correctness. Editing returns a completed response to draft. Group analysis is saved on the current device; there is no shared classroom board, online submission, or teacher grading service. Clearing progress also clears cabinet responses; existing reading and quiz saves remain compatible.

The app waits for the user store to hydrate before mounting routes, so refreshing a cabinet or quiz does not evaluate reading locks against an empty initial save.

The “SANDAANG DAMIT PATH” label sits above the enlarged instruction heading, “Suriin ang kuwento, magbigay ng patunay, at ipaliwanag ang iyong pananaw.” The three wooden cabinets are HALUNGKAT, HABI, and HINUHA. The old “Buksan ang isang gawain” heading and cabinet-opening note are removed. Cabinet headers include the story title and author. New activities and drafts have closed doors; a saved `completedAt` displays open doors, garments, and a completion check. Every cabinet can be opened to answer or review its activity. The doors return to the closed state when editing turns a completed response into a draft. The cabinets sit side by side on wider screens and form a vertical list on phones. Ugat keeps its existing menu. Activity IDs and saved responses remain compatible.

Screen headers share `components/ui/WikalinoBrand.tsx`, including onboarding, character selection, the story rooms and reader, cabinet menus/editors, the world HUD and fallback, assessment screens, library, progress, about, and legacy challenge screens. Onboarding keeps its larger wordmark. The launch cover and header both use WIKALINO.

Web development registers no offline worker. If an earlier development visit installed `/sw.js`, the app unregisters that worker and reloads once to use the current Metro bundle, without touching student storage. Production keeps its offline registration. Run `node scripts/check-pwa-registration.cjs` to check this behavior.

HABI (cabinet activity 02) uses four hanging garments to navigate Bago, Suliranin, Pagbabago, and Wakas. The extra “Character Transformation Map” heading and separate tauhang bilog reflection are removed. Its instruction reads “Panuto: Buuin ang mga pangyayari at mahahalagang detalye ng kuwento batay sa mga nakasaad sa bawat damit.” Each garment turns sage green when its answer contains text, alongside the existing check and “May sagot” status; clearing that answer restores the parchment color. It displays one question at a time and keeps the original four garment response keys and autosave. Completion requires all four answers; earlier saves with an extra reflection remain readable. An incomplete finish returns to the first missing answer. The cabinet menu still has three activities; interpretation choices and textual evidence remain in activity 03. The map wraps into two rows on narrow screens.

HINUHA (cabinet activity 03) requires an interpretation and one supporting proof. The second proof box is removed, while the original `interpretation` and `evidence-1` response keys remain. Its instruction asks for one proof, and completion no longer requires `evidence-2`. Earlier responses remain readable. LikhaKuro retains its separate two-proof requirement.

Ugat presents its three activities in this order: `ugat-explore` (PAGMAMASID), `ugat-check` (LikhaKuro), and `ugat-tree-map` (Banyuhay). Menu signs, activity headings, and accessible labels use these titles while retaining their original IDs and response keys. The tree menu reads “Suriin ang pinagmulan ng kwento” and “Pindutin ang karatula upang magsimula” and counts these three active activities. The menu and editors use the shared warm palette, with dark-brown text, parchment signs, and soft-green completed signs. The tree illustration, focus indication, and navigation remain intact. The old `ugat-board` and `ugat-symbolism` definitions are archived and excluded from the menu; their saved responses remain intact. No save migration or quiz/XP changes are needed.

Progress displays “Unang Termino,” “Ikalawang Termino,” and “Ikatlong Termino” and omits the fourth unit. Its section and meter labels use the same terminology. This presentation change preserves the underlying unit IDs, story records, completion counts, XP, and route parameters.

Exploration instructs “Pumili ng dahon para makita ang mahahalagang pangyayari sa kuwento” and shows four tappable clue leaves (Pangyayari, Tauhan, Suliranin, Desisyon), readable clue panels, and hidden roots. The locked roots use beige question marks and “UGAT NG KUWENTO” text. Viewing all four groups immediately reveals the roots and removes that locked-state overlay, before the student presses Ipasa. Revisiting a viewed leaf does not reset completion. This tracks exploration, not comprehension or a score.

LikhaKuro retains its existing response keys and tree with three selectable root interpretations, then two textual proofs and the group reflection (Piliin → Patunayan → Pagnilayan). Its existing saved answers and completion survive the rename and menu reorder.

The Banyuhay organizer supplies six paraphrased story idea cards but requires exactly one chosen idea. Its two steps are PUMILI and IPALIWANAG; the former synthesis step is removed. Students choose one card and classify it as Suliranin, Pangyayari, or Aral. Patunay is no longer a selectable category. Choosing a different card replaces the current choice. IPALIWANAG shows only that selected category and “ANG NAPILING IDEYA”, followed by the “PATUNAY MULA SA KUWENTO” answer field and final Ipasa. Completion requires a valid selected card, its supported category, and nonblank evidence for that category; the other cards, category notes, and old synthesis fields are optional historical data. These checks establish completeness, not literary correctness. Changes autosave and return completed work to draft. Changing the chosen idea clears the new category's evidence so an earlier answer cannot silently submit for a different idea. Reclassifying the same idea carries its evidence to the new category. The existing story-reading gate still applies.

Banyuhay stores the active card ID in `selected-idea`, its category in the existing `card-{id}` field, and its evidence in the existing `note-{zone}` field. Old saves without `selected-idea` resolve to the first supported card in the fixed idea-card order; retired Patunay assignments are skipped. An invalid or explicitly cleared marker does not fall back to old assignments. Existing card, note, and synthesis keys stay defined so autosaving does not erase historical work. Student records show only the effective selected idea, category, and evidence, without listing the unused legacy fields as missing requirements.

Every Gawain uses completion feedback after a successful Ipasa: the button fades and prevents repeated submissions, then a checkmark dialog confirms that progress is saved on this device. “Bumalik sa mga gawain” returns to the activity list, whose completed activity is marked complete. Revisiting completed work presents a disabled completed button. This records local completion; it does not transmit an online submission to a teacher. Incomplete responses keep their existing guidance and do not show success.

HALUNGKAT (Sandaang Damit activity 01) uses five wooden drawers and one answer/evidence pair per case file. Its repeated activity heading and introductory subtitle are removed. Each case displays the revised question about the main character, related characters, setting, problem, or important event; former hint paragraphs and the Pahiwatig button are absent. Case counters, tabs, progress, and report labels use “Gabay.” The proof label reads “Patunay na sagot mula sa kuwento”; drawers 1–2 use “Ipaliwanag ang kanilang papel gamit ang isang pangyayari.” as their proof placeholder, while drawers 3–5 retain their existing placeholder. Answer and evidence fields have plain text labels without pencil or paperclip icons. The example uses “Ang matandang lalaki” and “Siya ay nakaranas ng pagkabigo sa buhay” as writing guidance. The Sandaang Damit activity back button reads “Bumalik.” The story peek reads the existing story scenes in a modal without changing reading progress or leaving the form. Paired answers are autosaved using the original `element-0..4` and `proof-0..4` keys. The final report lists all ten fields and can be completed using “Ipasa” only when all are filled; this is not grading or online submission. Opening a drawer respects reduced-motion settings. Existing completed responses remain available for review and edits return them to draft.

## Editing

- `components/story-world/quest-progression.ts`: answer gates, scroll positions, and world palettes.
- `components/story-world/story-route-layout.ts`: shared winding route, scroll checkpoints, reward and avenue tree positions.
- `components/story-world/story-route-visual.ts`: continuous stone pavement, low kerbs, planted edges, leafy ground and framing trees.
- `components/story-world/ugat-scene-placement.ts`: shared transforms for memory scenery, furniture collisions, people and window effects.
- `dress-maze-visual.ts`, `ugat-forest.ts`, and `forgotten-village.ts`: each story's roadside displays.
- `components/story-world/story-portal-visual.ts`: animated hub gates. Uses merged stone meshes and a GLSL 1 procedural surface with no textures or WebGL 2 requirements. Each portal uses four draw calls; its fragment animation was checked in a WebGL 1 browser preview without shader errors.
- `components/story-library/StoryBookReader.tsx`: shared library/journey reader; `onComplete` enables sequential reading.
- `store/useUserStore.ts`: enforces reading and completion of all active Gawain before recording a quiz answer, and all answers before awarding story completion.

Inactive world screens unmount their render surface and dispose the engine. Models are loaded sequentially with a frame opportunity between stages; late models are disposed if the screen has exited. Development logs identify each loading/submitted stage. Models are loaded afresh on return, with the character positioned beside the last question. This avoids keeping hub and question-world GL contexts alive together on iOS.

## Checks

Run `node scripts/check-story-journey.cjs` for reading and Gawain-to-quiz gates (including drafts, partial completion, archived activities, reload and direct writes), sequential question unlocks, immutable answers after reload, scores and star thresholds, saved-result migration, and final rewards for all 30 questions. The script uses in-memory storage and does not modify real player saves.

Run `node scripts/check-cabinet-svg.cjs` to render the HABI and Ugat illustrations with the development React DOM renderer. It checks that native SVG accessibility props do not leak into HTML or trigger console errors; production builds suppress that warning.

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
