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
