# Grizzle's Haunted Mall

A small idle clicker about a goblin shopkeeper running dodgy kiosks in a haunted mall. Plain HTML, CSS and JavaScript in one file, with no build step and no dependencies.

Status: early prototype. All numbers are placeholders.

## Run it

Open `index.html` in a browser. Progress saves to the browser's local storage.

Add `?speed=10` to the URL to run the game 10 times faster while tuning. Add `?debug` to expose the game state as `window.__game` in the console.

To host it, enable GitHub Pages on the `main` branch (root folder).

## How it plays

- Six shops unlock in order. Each episode has its own six (episode 1 runs from the pretzel kiosk of mystery to the dragon anchor-store lease).
- Buy customers (x1, x10 or Max) to raise a shop's income. Cost grows geometrically.
- Each Buy button shows what it adds: $/s for automated shops, $ per run for tapped ones. A green badge (x2) means the purchase crosses a milestone.
- Tap a shop to run it once, or pay to automate it.
- Owning 10, 25, 50, 100 and 150 customers of a shop doubles its income and gives 1 beer.
- Clear 5 of the 9 goals and sign a dragon lease to unlock the episode finale. It resets cash and shops, keeps beer, eggs, crystals and cards, and adds a permanent 50% income bonus plus 3 eggs.
- Shops keep earning while the tab is closed, up to 8 hours.

### Episodes and story

Each episode has its own district, shops, goal wording and a short story scene at the start and at the finale.

| Episode | District | Shops (first to last) |
| --- | --- | --- |
| 1 | Haunted Mall | Pretzel kiosk, phone-case cart, perfume counter, arcade, elevator toll, dragon lease |
| 2 | Swamp Market | Mushroom stall, bog-water bottler, lucky charms, fog boat tours, stilt-house timeshare, kraken ferry monopoly |
| 3 | Crypt Quarter | Grave-flower cart, coffin showroom, seance parlor, ghost tours, bone-china antiques, mausoleum condos |

After episode 3 the list repeats (shown as "Haunted Mall 2" and so on), and the permanent bonus keeps carrying over. All episodes share the same six shop slots, but costs grow each episode: customers, automation and the cash goal cost 3x in episode 2, 5x in episode 3 and so on. That keeps episodes 2 to 4 about as long as the first, with later ones slowly getting faster as cards level up.

### Cards and chests

Cards survive episode resets. Duplicates level a card up to level 5 (1, 3, 6, 11 and 19 total copies).

Each card is one multiplier that grows with its level.

| Card | Perk per level | At level 5 |
| --- | --- | --- |
| Grizzle | All income +10% | x1.5 income |
| Mort | Shops run 10% faster | x1.5 speed |
| Countess Vex | Customers and automation 4% cheaper | 20% off |
| Bramble | Finale bonus +20% | +100% instead of +50% |
| Old Bog Witch | Each milestone multiplies income by 0.05 more | x2.25 per milestone instead of x2 |

| Chest | Cost | Cards | Where the currency comes from |
| --- | --- | --- | --- |
| Egg chest | 2 eggs | 3 | 1 egg per goal, 3 per finale |
| Beer chest | 5 beer | 2 | Shop milestones |
| Crystal barrel | 12 crystals | 4 | Duplicates of maxed cards |

## Tuning

Everything lives at the top of the script in `index.html`: `SCHEMES` (costs, payouts, run times), `EPISODES` (shop names and story text), `MILESTONES`, `GOALS`, `CARDS`, `CHESTS`, `LEVEL_AT`, `PERM_PER_EPISODE`, `EPISODE_COST_STEP` (how much costs grow per episode) and `OFFLINE_CAP_S`.

Balance check: `node tools/sim.mjs` reads the numbers from `index.html`, plays a greedy player who taps every shop the moment it's idle, and prints when each shop opens and when the finale unlocks. Episode 1 currently takes about 26 minutes that way, with the fifth goal landing a few minutes before the lease. It also prints when each goal clears. Real players are less efficient, so expect 30 to 40.

It then plays several episodes in a row (carrying over the bonus, beer, eggs and cards, opening chests as soon as it can) and prints the median time per episode: currently about 31, 27, 24, 21 and 19 minutes for episodes 2 to 6. `node tools/sim.mjs 9 50` plays 9 episodes over 50 runs, and `STEP=1.5 node tools/sim.mjs` tries a different cost step without editing the game.

## Roadmap

- [x] Cards and chests (permanent, survive episode resets)
- [x] Episode-specific shops and story beats (3 episodes)
- [x] Balance pass targeting about 30 minutes for episode 1
- [x] Costs scale per episode so later episodes stay a challenge
- [ ] Art and sound
- [ ] Optional rewarded-ad boosts

## License

[MIT](LICENSE)

## Inspiration

Structure inspired by the discontinued mobile game *It's Always Sunny: The Gang Goes Mobile* (schemes, episode-style prestige, character cards). This project uses an original setting and cast and is not affiliated with that game or its owners.
