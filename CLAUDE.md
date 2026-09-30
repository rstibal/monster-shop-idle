# Grizzle's Haunted Mall (monster-shop-idle)

An idle clicker: a goblin shopkeeper runs dodgy shops in monster districts. Hobby project by Rob Stibal, inspired by the structure of the discontinued mobile game *It's Always Sunny: The Gang Goes Mobile* (schemes, episode-style prestige, character cards) but with an original setting and cast. Do not use that show's names or characters.

- Live game: https://rstibal.github.io/monster-shop-idle/ (GitHub Pages, `main` branch root)
- Repo: https://github.com/rstibal/monster-shop-idle (public, MIT)
- Design doc (Claude Doc, may be out of date on details): https://claude.ai/code/artifact/ed3d4d4e-00f2-4b59-96d1-5bb5188baf4f

## Layout

- `index.html`: the whole game (HTML, CSS, JS in one file, no build step, no dependencies)
- `tools/sim.mjs`: balance simulator, run with `node tools/sim.mjs`. It reads the numbers straight out of `index.html` (`SCHEMES`, `MILESTONES`, `EPISODES`, `GOALS`, `GOALS_NEEDED`, `CARDS`, `CHESTS`, `LEVEL_AT`, `PERM_PER_EPISODE`, `EPISODE_COST_STEP`, `EGGS_PER_GOAL`) with regexes, so keep those blocks in their current shape (`const X = [` ... `\n  ];`, and single-line number constants). It prints episode 1 in detail, then median times for several episodes in a row (`node tools/sim.mjs [episodes] [runs]`; set the `STEP` env var to try another cost step).
- `README.md`: player-facing rules, card and chest tables, tuning pointers

## How the game works (current state)

- Six shop slots, unlocked in order. Numbers per slot live in `SCHEMES` (cost, growth, payout, run time, automate cost). Names, icons, nouns and story text per episode live in `EPISODES`. Costs grow geometrically, milestones at 10/25/50/100/150 customers double a shop's income and give 1 beer.
- Prestige = episode finale. Needs `GOALS_NEEDED` (5) of the 9 goals plus one customer of the sixth shop. Resets cash and shops; keeps beer, eggs, crystals and cards; adds a permanent +50% income and 3 eggs.
- Episodes: Haunted Mall, Swamp Market, Crypt Quarter, then it repeats ("Haunted Mall 2"). All episodes share the same `SCHEMES`, but customer costs, automation costs and goals marked `scaled: true` (the cash goal, `{$}` in its text) multiply by `costMult()` = `1 + EPISODE_COST_STEP * episode` (step 2, so x3, x5, ...).
- Cards level 1 to 5 by duplicates and survive resets. Each is one multiplier, strength per level in its `per` field, applied through `cardBonus(id)` in the Math section (the simulator mirrors those formulas): Grizzle all income, Mort run speed, Countess Vex cost discount, Bramble finale bonus, Old Bog Witch milestone multiplier (2 + bonus). Rob prefers multiplier cards (speed, money, finale bonus) over rule-changing perks like free automation or offline caps. Saves from before this (no `cardsV2`) keep shops Mort used to automate. Chests: egg (2 eggs, 3 cards), beer (5 beer, 2 cards), crystal barrel (12 crystals, 4 cards). Duplicates of maxed cards give crystals.
- Story: a `<dialog>` shows an intro per episode (once, tracked by `S.storySeen`) and a finale scene when the finale button is pressed.
- Saves: localStorage key `grizzle-haunted-mall-v1` (game), `...-buymode` and `...-view` (UI prefs, kept separate so resets don't wipe them). Offline earnings are credited on load and when a background tab becomes visible.
- URL flags: `?speed=10` runs faster, `?debug` exposes `window.__game` (state and a few functions).

## Balance target

Episode 1 should take about 30 minutes; the simulator (greedy, always-tapping player) currently gives about 26 minutes, with the fifth goal clearing about 4 minutes before the dragon lease. Later episodes should stay about as long: with the cost step at 2, episodes 2 to 6 take about 31, 27, 24, 21 and 19 minutes (slowly faster as cards level up). Real players are slower. If you change costs or goals, rerun the simulator and update the README numbers.

The simulator also plays casual (10 min every 2 h) and idle (3 min, 3x a day) profiles. Finding (2026-09-29): both unlock the finale at the start of their second session, whatever the per-episode cost step, because income grows exponentially and one break's offline earnings cover the rest of an episode. Lowering the offline rate barely helps (even 1% still finishes in 2-3 sessions); only 0% slows them down. How long an episode should last for idle players is an open design question for Rob.

## Testing notes

- The in-app browser pane can't run page tools on `file://` URLs. Serve the folder instead (`python -m http.server 8770`, then open `http://localhost:8770/index.html?debug`) and stop the server afterwards. The pane caches the page, so after editing add a throwaway query (`&v=2`) when reloading, or you'll test the old code.
- Automated clicks are instant, so they miss bugs that only happen during a held press. `left_click_drag` from a point to 1px away gives a realistic held press.
- Background tabs pause `requestAnimationFrame`, so taps and income look frozen if the preview tab isn't in front. Front the tab or test functions directly through `?debug`. If the pane itself is hidden, frames stay paused even for the front tab; taking a screenshot makes it render.
- A `beforeunload` handler saves state, so injecting a save then navigating gets overwritten. Override `Storage.prototype.setItem` first if you need to test loading a crafted save.

## Working preferences

- Commit locally as work is done, but ask before pushing. Pushing publishes to the public repo and the live Pages site. After a push, Pages takes about a minute; verify with the Pages build status (`gh api repos/rstibal/monster-shop-idle/pages/builds/latest`).
- End commit messages with a `Co-Authored-By: Claude <model> <noreply@anthropic.com>` line naming the model actually running the session (for example `Claude Opus 5.5`).
- The repo lives at `C:\www\monster-shop-idle` on the main computer (outside OneDrive on purpose; don't put `.git` in a synced folder).
- Keep the UI distinctive, not generic (moss and plum palette, Bagel Fat One display font, gold accent, raised buttons). No all-caps labels.

## Ideas not done yet

- More episodes (the loop after episode 3 reuses episode 1)
- Art and sound
- Optional rewarded-ad boosts (the design doc has the plan; not needed for a hobby project)
- Second tuning pass for the idle player (the simulator only models an always-tapping player)
