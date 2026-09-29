# Grizzle's Haunted Mall (monster-shop-idle)

An idle clicker: a goblin shopkeeper runs dodgy shops in monster districts. Hobby project by Rob Stibal, inspired by the structure of the discontinued mobile game *It's Always Sunny: The Gang Goes Mobile* (schemes, episode-style prestige, character cards) but with an original setting and cast. Do not use that show's names or characters.

- Live game: https://rstibal.github.io/monster-shop-idle/ (GitHub Pages, `main` branch root)
- Repo: https://github.com/rstibal/monster-shop-idle (public, MIT)
- Design doc (Claude Doc, may be out of date on details): https://claude.ai/code/artifact/ed3d4d4e-00f2-4b59-96d1-5bb5188baf4f

## Layout

- `index.html`: the whole game (HTML, CSS, JS in one file, no build step, no dependencies)
- `tools/sim.mjs`: balance simulator, run with `node tools/sim.mjs`. It reads the numbers straight out of `index.html` (`SCHEMES`, `MILESTONES`, `EPISODES`, `GOALS`, `GOALS_NEEDED`) with regexes, so keep those blocks in their current shape (`const X = [` ... `\n  ];`).
- `README.md`: player-facing rules, card and chest tables, tuning pointers

## How the game works (current state)

- Six shop slots, unlocked in order. Numbers per slot live in `SCHEMES` (cost, growth, payout, run time, automate cost). Names, icons, nouns and story text per episode live in `EPISODES`. Costs grow geometrically, milestones at 10/25/50/100/150 customers double a shop's income and give 1 beer.
- Prestige = episode finale. Needs `GOALS_NEEDED` (5) of the 9 goals plus one customer of the sixth shop. Resets cash and shops; keeps beer, eggs, crystals and cards; adds a permanent +50% income and 3 eggs.
- Episodes: Haunted Mall, Swamp Market, Crypt Quarter, then it repeats ("Haunted Mall 2"). All episodes share the same numbers, so later ones get faster as the bonus and cards build.
- Cards (Grizzle, Mort, Countess Vex, Bramble, Old Bog Witch) level 1 to 5 by duplicates and survive resets. Chests: egg (2 eggs, 3 cards), beer (5 beer, 2 cards), crystal barrel (12 crystals, 4 cards). Duplicates of maxed cards give crystals.
- Story: a `<dialog>` shows an intro per episode (once, tracked by `S.storySeen`) and a finale scene when the finale button is pressed.
- Saves: localStorage key `grizzle-haunted-mall-v1` (game), `...-buymode` and `...-view` (UI prefs, kept separate so resets don't wipe them). Offline earnings are credited on load and when a background tab becomes visible.
- URL flags: `?speed=10` runs faster, `?debug` exposes `window.__game` (state and a few functions).

## Balance target

Episode 1 should take about 30 minutes; the simulator (greedy, always-tapping player) currently gives about 26 minutes, with the fifth goal clearing about 4 minutes before the dragon lease. Real players are slower. If you change costs or goals, rerun the simulator and update the README numbers.

## Testing notes

- The in-app browser pane can't run page tools on `file://` URLs. Serve the folder instead (`python -m http.server 8770`, then open `http://localhost:8770/index.html?debug`) and stop the server afterwards.
- Background tabs pause `requestAnimationFrame`, so taps and income look frozen if the preview tab isn't in front. Front the tab or test functions directly through `?debug`.
- A `beforeunload` handler saves state, so injecting a save then navigating gets overwritten. Override `Storage.prototype.setItem` first if you need to test loading a crafted save.

## Working preferences

- Commit locally as work is done, but ask before pushing. Pushing publishes to the public repo and the live Pages site. After a push, Pages takes about a minute; verify with the Pages build status (`gh api repos/rstibal/monster-shop-idle/pages/builds/latest`).
- End commit messages with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- The repo lives at `C:\www\monster-shop-idle` on the main computer (outside OneDrive on purpose; don't put `.git` in a synced folder).
- Keep the UI distinctive, not generic (moss and plum palette, Bagel Fat One display font, gold accent, raised buttons). No all-caps labels.

## Ideas not done yet

- Scale costs per episode so later episodes feel harder
- More episodes (the loop after episode 3 reuses episode 1)
- Art and sound
- Optional rewarded-ad boosts (the design doc has the plan; not needed for a hobby project)
- Second tuning pass for the idle player (the simulator only models an always-tapping player)
