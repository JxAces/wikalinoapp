# Story journey

The mobile and PWA routes share the same Three.js world engine.

1. `/landing` contains three widely spaced stone portals with flowing green centers and floating rocks. Every book can be opened. Gate centers are roughly 15 world units apart, inside the existing walkable area.
2. `/story?storyId=…` uses the book reader in journey mode. Pages turn one section at a time; students scroll to the end of a section before advancing. The last page awards reading XP once and transitions to the story world.
3. `/quest-world?storyId=…` contains a winding road of three scroll checkpoints, each containing five questions. Gold is available, gray is locked, and green with a check means all five answers are correct. The next checkpoint unlocks after the preceding group is complete. Saved answers are retained; reopening a partial group resumes its first unanswered question. Completed groups can be replayed.
4. A scroll opens `/activity-player`. Wrong answers stay in that question. After each correct answer, the student can continue to the next question in the same group. At the end of five questions, they return beside the completed scroll and walk to the next checkpoint. Leaving midway also returns beside the same group.
5. After all scrolls are green, the world offers the result/reward screen. Completion and reward XP are awarded once.

The library remains available for free reading with unrestricted page navigation. Reading in the journey saves the section index; returning through a portal resumes that book.

## Editing

- `components/story-world/quest-progression.ts`: answer gates, scroll positions, and world palettes.
- `components/story-world/quest-scenery.ts`: dress drawing courtyard, rooted town, and school courtyard. Static geometry is merged by color to limit draw calls.
- `components/story-world/story-portal-visual.ts`: animated hub gates. Uses merged stone meshes and a GLSL 1 procedural surface with no textures or WebGL 2 requirements. Each portal uses six draw calls; its fragment animation was checked in a WebGL 1 browser preview without shader errors.
- `components/story-library/StoryBookReader.tsx`: shared library/journey reader; `onComplete` enables sequential reading.
- `store/useUserStore.ts`: enforces reading/prerequisites before recording an activity, and all answers before awarding story completion.

Inactive world screens unmount their render surface and dispose the engine. Models are loaded sequentially with a frame opportunity between stages; late models are disposed if the screen has exited. Development logs identify each loading/submitted stage. Models are loaded afresh on return, with the character positioned beside the last question. This avoids keeping hub and question-world GL contexts alive together on iOS.

## Checks

Run `node scripts/check-story-journey.cjs` for reading gates, sequential unlocks, replay protection, green states, and final rewards for all 45 questions. The script uses in-memory storage and does not modify real player saves.

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
