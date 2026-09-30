# Monster Shop Idle

A small idle clicker about running dodgy shops, in five settings: a goblin in a haunted mall, an ex-smuggler on a space station, a pirate captain on a ship that sails from port to port, a street vendor in a cyberpunk night market, or a repair bot on a planet of robots. Plain HTML, CSS and JavaScript in one file, with no build step and no dependencies.

Status: early prototype. All numbers are placeholders.

## Run it

Open `index.html` in a browser. Progress saves to the browser's local storage.

Add `?speed=10` to the URL to run the game 10 times faster while tuning. Add `?debug` to expose the game state as `window.__game` in the console. Add `?skin=starport` (or `mall`, `ship`, `neon`, `robot`) to force a setting.

To host it, enable GitHub Pages on the `main` branch (root folder).

### On your phone

The game can be added to a phone's home screen, where it opens full screen like an app and works without a connection:

- Android (Chrome): open the game, then the ⋮ menu, then Add to home screen (or Install app).
- iPhone (Safari): open the game, tap Share, then Add to Home Screen.

On iPhone the home-screen app keeps its own save, separate from Safari's, so progress in one doesn't show in the other. On Android they share one save.

`manifest.webmanifest` and `sw.js` (network first, so updates show up as soon as you're online) make this work. The icons in `icons/` are drawn by `python tools/make_icons.py` (needs Pillow).

## Settings (skins)

The side panel has a Setting picker. Each setting has its own cast, shops, story, currency names and colors; the numbers are the same, so one save works in both and you can switch at any time.

| Setting | Owner | Episodes | Currencies | Look |
| --- | --- | --- | --- | --- |
| Haunted Mall | Grizzle, a goblin | Haunted Mall, Swamp Market, Crypt Quarter, Midnight Carnival, Sunken Casino | Beer, eggs, crystals | Dripping ectoplasm: slime green and lilac on green-black, Rubik Wet Paint |
| Starport Nine | Juno Vance, an ex-smuggler | Docking Ring, Hydroponics Deck, Reactor Row, Zero-G Stadium, Pirate Moon | Scrap, keycards, stardust | Deep space navy with amber and teal, Russo One |
| The Salty Gull | Captain Nell, a pirate | Barnacle Harbor, Smuggler's Cove, Skull Island, Floating Fair, Treasure Reef | Grog, doubloons, pearls | Night sea with gold and red, rope instead of chains, Pirata One |
| Neon Night Market | Kix, a street vendor | Gutter Street, Rain Bazaar, Chrome Row, Overdrive Circuit, Skyline Tower | Batteries, tokens, shards | Black-violet with magenta and cyan, Audiowide |
| Planet Cog | Rivet, a repair bot | Scrapyard Flats, Toaster Works, Server City, Spark Festival, Old Spaceport | Oil, bolts, cores | Gunmetal with lime and hazard orange, Tilt Warp |

## How it plays

The rules below use the Haunted Mall's names.

- Six shops unlock in order. Each episode has its own six (episode 1 runs from the pretzel kiosk of mystery to the dragon anchor-store lease).
- Buy customers (x1, x10 or Max) to raise a shop's income. Cost grows geometrically.
- Each Buy button shows what it adds: $/s for automated shops, $ per run for tapped ones. A green badge (x2) means the purchase crosses a milestone.
- Tap a shop to run it once, or pay to automate it.
- Owning 10, 25, 50, 100 and 150 customers of a shop doubles its income and gives 1 beer.
- Clear 5 of the 9 goals and sign a dragon lease to unlock the episode finale. It resets cash and shops, keeps beer, eggs, crystals and cards, and gives 3 eggs plus a permanent income bonus: each finale multiplies it by 1.5 (x1.5, x2.25, x3.4 and so on), so it keeps pace with the rising costs.
- Automated shops keep earning while you're away, up to 8 hours. After a break of 5 minutes or more, a welcome-back popup shows what they earned and any chests ready to open.
- Sound effects for tapping, payouts, buying, milestones, automating, goals, chests and the finale, synthesized in the browser (no audio files). Each setting has its own voice: eerie in the Haunted Mall, arcade blips on Starport Nine. The Sound button in the header mutes it.

### Episodes and story

Each episode has its own district, shops, goal wording and a short story scene at the start and at the finale.

| Episode | District | Shops (first to last) |
| --- | --- | --- |
| 1 | Haunted Mall | Pretzel kiosk, phone-case cart, perfume counter, arcade, elevator toll, dragon lease |
| 2 | Swamp Market | Mushroom stall, bog-water bottler, lucky charms, fog boat tours, stilt-house timeshare, kraken ferry monopoly |
| 3 | Crypt Quarter | Grave-flower cart, coffin showroom, seance parlor, ghost tours, bone-china antiques, mausoleum condos |
| 4 | Midnight Carnival | Cobweb candy floss, ring toss for souls, tarot booth, haunted carousel, house of mirrors, big top lease |
| 5 | Sunken Casino | Barnacle snack bar, soggy slots, mermaid card tables, shipwreck pawn shop, pearl-diving tours, drowned casino deed |

After episode 5 the list repeats (the story loops back too) (shown as "Haunted Mall 2" and so on), and the permanent bonus keeps carrying over. All episodes share the same six shop slots, but costs grow each episode: customers, automation and the cash goal cost 2.5x more each episode (x2.5 in episode 2, x6.25 in episode 3, x15.6 in episode 4 and so on). The permanent bonus grows by x1.5 per finale (up to x2 with the Finale card maxed), a little slower than costs, so each episode takes a bit longer than the last: a gentle long tail rather than a wall.

### Cards and chests

Cards survive episode resets. Duplicates level a card up to level 5 (1, 3, 6, 11 and 19 total copies).

Each card is one multiplier that grows with its level.

| Effect | Haunted Mall | Starport Nine | Perk per level | At level 5 |
| --- | --- | --- | --- | --- |
| Money | Grizzle | Juno Vance | All income +10% | x1.5 income |
| Speed | Mort | Sprocket | Shops run 10% faster | x1.5 speed |
| Discount | Countess Vex | Madame Ossa | Customers and automation 4% cheaper | 20% off |
| Finale | Bramble | Brick | Finale bonus +20% | x2 per finale instead of x1.5 |
| Milestone | Old Bog Witch | Commodore Glint | Each milestone multiplies income by 0.05 more | x2.25 per milestone instead of x2 |
| Beer | Fang | Scav | Milestones give 20% more beer (scrap on Starport Nine) | 2 per milestone instead of 1 |

| Chest (Haunted Mall / Starport Nine) | Cost | Cards | Where the currency comes from |
| --- | --- | --- | --- |
| Egg chest / Keycard locker | 2 eggs / keycards | 3 | 1 per goal, 3 per finale |
| Beer chest / Scrap crate | 5 beer / scrap | 2 | Shop milestones |
| Crystal barrel / Stardust vault | 12 crystals / stardust | 4 | Duplicates of maxed cards |

## Tuning

Everything lives at the top of the script in `index.html`. The numbers: `SCHEMES` (costs, payouts, run times), `MILESTONES`, `GOALS`, `CARDS` (weights and strength per level), `CHESTS`, `LEVEL_AT`, `PERM_PER_EPISODE`, `EPISODE_COST_GROWTH` (how much costs multiply per episode) and `OFFLINE_CAP_S`. Everything players read or see is in `SKINS`: to add a setting, copy a skin, change its words, episodes and `theme` colors, and it shows up in the Setting picker.

Balance check: `node tools/sim.mjs` reads the numbers from `index.html`, plays a greedy player who taps every shop the moment it's idle, and prints when each shop opens and when the finale unlocks. Episode 1 currently takes about 26 minutes that way, with the fifth goal landing a few minutes before the lease. It also prints when each goal clears. Real players are less efficient, so expect 30 to 40.

It then plays several episodes in a row (carrying over the bonus, beer, eggs and cards, opening chests as soon as it can) and prints the median time per episode. `node tools/sim.mjs 9 50` plays 9 episodes over 50 runs, and `GROWTH=3 node tools/sim.mjs` tries a different per-episode cost growth without editing the game.

The same table is printed for a casual player (10 minutes every 2 hours) and an idle one (3 minutes, 3 times a day), who only earn from automated shops while away. Current real time to unlock each finale:

| Episode | Engaged (nonstop) | Casual | Idle |
| --- | --- | --- | --- |
| 1-2 | 26 minutes | 2 hours | 8 hours |
| 3 | 31 minutes | 2 hours | 8 hours |
| 4 | 38 minutes | 2 hours | 8 hours |
| 5 | 47 minutes | 2 hours | 8 hours |
| 6 | 58 minutes | 2 hours | 16 hours |
| 7 | 1.2 hours | 2 hours | 16 hours |
| 8 | 1.6 hours | 2 hours | 16 hours |
| 9 | 2 hours | 2 hours | 1 day |
| 10 | 2.4 hours | 4 hours | 1 day |

Early on, one break's offline earnings cover the rest of an episode, so session players finish on their second visit. The growing costs are what slow them down later. `OFFRATE=0.25` and `OFFCAP=4` try a lower offline rate or cap (a lower rate barely changes this).

## Roadmap

- [x] Cards and chests (permanent, survive episode resets)
- [x] Episode-specific shops and story beats (5 episodes per setting)
- [x] Balance pass targeting about 30 minutes for episode 1
- [x] Costs scale per episode so later episodes stay a challenge
- [x] Sound effects (synthesized, per setting)
- [ ] Art
- [ ] Optional rewarded-ad boosts

## License

[MIT](LICENSE)

## Inspiration

Structure inspired by the discontinued mobile game *It's Always Sunny: The Gang Goes Mobile* (schemes, episode-style prestige, character cards). This project uses an original setting and cast and is not affiliated with that game or its owners.
