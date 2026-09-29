# Grizzle's Haunted Mall

A small idle clicker about a goblin shopkeeper running dodgy kiosks in a haunted mall. Plain HTML, CSS and JavaScript in one file, with no build step and no dependencies.

Status: early prototype. All numbers are placeholders.

## Run it

Open `index.html` in a browser. Progress saves to the browser's local storage.

Add `?speed=10` to the URL to run the game 10 times faster while tuning. Add `?debug` to expose the game state as `window.__game` in the console.

To host it, enable GitHub Pages on the `main` branch (root folder).

## How it plays

- Six shops unlock in order, from the pretzel kiosk of mystery to the dragon anchor-store lease.
- Buy customers (x1, x10 or Max) to raise a shop's income. Cost grows geometrically.
- Tap a shop to run it once, or pay to automate it.
- Owning 10, 25, 50, 100 and 150 customers of a shop doubles its income and gives 1 beer.
- Clear 2 goals and sign a dragon lease to unlock the episode finale. It resets cash and shops, keeps beer, eggs, crystals and cards, and adds a permanent 50% income bonus plus 3 eggs.
- Shops keep earning while the tab is closed, up to 8 hours.

### Cards and chests

Cards survive episode resets. Duplicates level a card up to level 5 (1, 3, 6, 11 and 19 total copies).

| Card | Perk per level |
| --- | --- |
| Grizzle | Pretzel kiosk income +50% |
| Mort | Runs one more shop for free |
| Countess Vex | Offline cap +2 hours |
| Bramble | Finale bonus +20% |
| Old Bog Witch | All income +10% |

| Chest | Cost | Cards | Where the currency comes from |
| --- | --- | --- | --- |
| Egg chest | 2 eggs | 3 | 1 egg per goal, 3 per finale |
| Beer chest | 5 beer | 2 | Shop milestones |
| Crystal barrel | 12 crystals | 4 | Duplicates of maxed cards |

## Tuning

Everything lives at the top of the script in `index.html`: `SCHEMES` (costs, payouts, run times), `MILESTONES`, `GOALS`, `CARDS`, `CHESTS`, `LEVEL_AT`, `PERM_PER_EPISODE` and `OFFLINE_CAP_S`.

Balance check: `node tools/sim.mjs` reads the numbers from `index.html`, plays a greedy player who taps every shop the moment it's idle, and prints when each shop opens and when the finale unlocks. Episode 1 currently takes about 26 minutes that way. Real players are less efficient, so expect 30 to 40.

## Roadmap

- [x] Cards and chests (permanent, survive episode resets)
- [ ] Episode-specific shops and story beats
- [x] Balance pass targeting about 30 minutes for episode 1
- [ ] Art and sound
- [ ] Optional rewarded-ad boosts

## License

[MIT](LICENSE)

## Inspiration

Structure inspired by the discontinued mobile game *It's Always Sunny: The Gang Goes Mobile* (schemes, episode-style prestige, character cards). This project uses an original setting and cast and is not affiliated with that game or its owners.
