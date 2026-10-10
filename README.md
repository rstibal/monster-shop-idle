# Monster Shop Idle

A small idle clicker about running dodgy shops, in six settings: a goblin in a haunted mall, an ex-smuggler on a space station, a pirate captain on a ship that sails from port to port, a street vendor in a cyberpunk night market, a repair bot on a planet of robots, or an expelled wizard who never left the academy. Plain HTML, CSS and JavaScript in one file, with no build step and no dependencies.

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

The side panel has a Setting picker. Each setting has its own cast, shops, story, currency names and colors; the numbers are the same, so one save works in all of them and you can switch at any time.

| Setting | Owner | Episodes | Currencies | Look |
| --- | --- | --- | --- | --- |
| Haunted Mall | Grizzle, a goblin | Haunted Mall, Swamp Market, Crypt Quarter, Midnight Carnival, Sunken Casino, Ghost Line | Beer, eggs, crystals | Dripping ectoplasm: slime green and lilac on green-black, Rubik Wet Paint |
| Starport Nine | Juno Vance, an ex-smuggler | Docking Ring, Hydroponics Deck, Reactor Row, Zero-G Stadium, Pirate Moon, Comet Cruise | Scrap, keycards, stardust | Deep space navy with amber and teal, Russo One |
| The Salty Gull | Captain Nell, a pirate | Barnacle Harbor, Smuggler's Cove, Skull Island, Floating Fair, Treasure Reef, Frostbite Bay | Grog, doubloons, pearls | Jolly Roger: black, bone white and blood red, New Rocker |
| Neon Night Market | Kix, a street vendor | Gutter Street, Rain Bazaar, Chrome Row, Overdrive Circuit, Skyline Tower, Undercity | Batteries, tokens, shards | Black-violet with magenta and cyan, VT323 terminal pixels |
| Planet Cog | Rivet, a repair bot | Scrapyard Flats, Toaster Works, Server City, Spark Festival, Old Spaceport, Rust Moon | Oil, bolts, cores | Scrap heap: tin grey, copper and patina green, Black Ops One |
| Hexwick Academy | Fizz, an expelled wizard | Bell Tower, Greenhouses, Library, Dueling Grounds, Potion Cellars, Observatory | Potions, scrolls, moonstones | Spellfire: plum dark, flame orange and spell cyan, MedievalSharp |

## How it plays

The rules below use the Haunted Mall's names.

- Six shops unlock in order. Each episode has its own six (episode 1 runs from the pretzel kiosk of mystery to the dragon anchor-store lease).
- Buy customers (x1, x10 or Max) to raise a shop's income. Cost grows geometrically.
- Each Buy button shows what it adds: $/s for automated shops, $ per run for tapped ones. A green badge (x2) means the purchase crosses a milestone.
- Tap a shop to run it once, or pay to automate it.
- Owning 10, 25, 50, 100 and 150 customers of a shop doubles its income and gives 1 beer.
- Each shop has 3 upgrades, bought in order, each doubling its income (x8 with all three). They cost 600, 6,000 and 60,000 times the shop's automation price, and reset with the episode.
- Each episode has a story goal (listed first, in the setting's accent color, with a line on why it matters there) and 8 shared goals. Clear any 5 and sign a dragon lease to unlock the episode finale. It resets cash and shops, keeps beer, eggs, crystals and cards, and gives 3 eggs plus a permanent income bonus: each finale multiplies it by 1.5 (x1.5, x2.25, x3.4 and so on), so it keeps pace with the rising costs. From episode 2 on, the first shop starts automated.
- The **Stats** tab (next to Shops and Cards) shows this episode (time, earnings and how much came in while away, customers, taps, top shop, milestone bonuses, automations, upgrades, chests, goals) and all-time totals: earnings (and how much came in while you were away), customers, taps, upgrades, automations, goals, finales, chests, cards drawn and time played. Saves from before it start counting the day they're loaded.
- Saves stay in your browser. To move a game to another device, press **Copy** next to Save in the side panel, then **Paste** the code on the other device (it replaces the game there).
- Automated shops keep earning while you're away, up to 8 hours. After a break of 5 minutes or more, a welcome-back popup shows what they earned and any chests ready to open, and asks what to do with it: **bank it** for 25% more, or call a **rush hour**, where every shop earns x3 for the next 5 minutes (a countdown shows next to the episode number). Banking pays more after long breaks; a rush pays off when you're back to play for a while.
- Sound effects for tapping, payouts, buying, milestones, automating, goals, chests and the finale, synthesized in the browser (no audio files). Each setting has its own voice: eerie in the Haunted Mall, arcade blips on Starport Nine. Each setting also has a quiet background loop, synthesized too: a humming, drafty mall, a station's engine drone and computer chirps, waves and creaking timbers on the ship, rain and a synth pad in the night market, clanking machines on Planet Cog, and a crackling fire, an owl and stray spells at Hexwick Academy. The side panel has Effects and Ambience volume sliders; a Sound on/off switch above them mutes everything.

### Episodes and story

Each episode has its own district, shops, goal wording and a short story scene at the start and at the finale.

| Episode | District | Shops (first to last) |
| --- | --- | --- |
| 1 | Haunted Mall | Pretzel kiosk, phone-case cart, perfume counter, arcade, elevator toll, dragon lease |
| 2 | Swamp Market | Mushroom stall, bog-water bottler, lucky charms, fog boat tours, stilt-house timeshare, kraken ferry monopoly |
| 3 | Crypt Quarter | Grave-flower cart, coffin showroom, seance parlor, ghost tours, bone-china antiques, mausoleum condos |
| 4 | Midnight Carnival | Cobweb candy floss, ring toss for souls, tarot booth, haunted carousel, house of mirrors, big top lease |
| 5 | Sunken Casino | Barnacle snack bar, soggy slots, mermaid card tables, shipwreck pawn shop, pearl-diving tours, drowned casino deed |
| 6 | Ghost Line | Soot-cake trolley, lost-ticket office, phantom dining car, sleeper-car hire, tunnel-of-screams ride, Ghost Line charter |

After episode 6 the list repeats (the story loops back too) (shown as "Haunted Mall 2" and so on), and the permanent bonus keeps carrying over. All episodes share the same six shop slots, but costs grow each episode: customers, automation and the cash goal cost 2.5x more each episode (x2.5 in episode 2, x6.25 in episode 3, x15.6 in episode 4 and so on). The permanent bonus grows by x1.5 per finale (up to x2.25 with the Finale card maxed), a little slower than costs, so each episode takes a bit longer than the last: a gentle long tail rather than a wall.

### Cards and chests

Cards survive episode resets. Duplicates level a card up to level 10 (1, 3, 6, 11, 19, 28, 38, 50, 64 and 80 total copies).

Each card is one multiplier that grows with its level. Levels 6 to 10 add half as much each as levels 1 to 5.

| Effect | Haunted Mall | Starport Nine | Perk per level (6-10: half) | At level 5 | At level 10 |
| --- | --- | --- | --- | --- | --- |
| Money | Grizzle | Juno Vance | All income +10% | x1.5 income | x1.75 income |
| Speed | Mort | Sprocket | Shops run 10% faster | x1.5 speed | x1.75 speed |
| Discount | Countess Vex | Madame Ossa | Customers and automation 4% cheaper | 20% off | 30% off |
| Finale | Bramble | Brick | Finale bonus +20% | x2 per finale instead of x1.5 | x2.25 per finale |
| Milestone | Old Bog Witch | Commodore Glint | Each milestone multiplies income by 0.05 more | x2.25 per milestone instead of x2 | x2.38 per milestone |
| Beer | Fang | Scav | Milestones give 20% more beer (scrap on Starport Nine) | 2 per milestone instead of 1 | 2.5 per milestone |

| Chest (Haunted Mall / Starport Nine) | Cost | Cards | Where the currency comes from |
| --- | --- | --- | --- |
| Egg chest / Keycard locker | 2 eggs / keycards | 3 | 1 per goal, 3 per finale |
| Beer chest / Scrap crate | 5 beer / scrap | 2 | Shop milestones |
| Crystal barrel / Stardust vault | 12 crystals / stardust | 4 | Duplicates of maxed cards |

Daily chest: once a day, from your second day on, the egg chest opens free.

## Tuning

Everything lives at the top of the script in `index.html`. The numbers: `SCHEMES` (costs, payouts, run times), `MILESTONES`, `UPGRADES` (price as a multiple of the shop's automation cost, and strength), `GOALS`, `STORY_GOALS` (one per episode; each skin's episodes have a `goal` line for it), `CARDS` (weights and strength per level), `CHESTS`, `LEVEL_AT`, `LATE_LEVEL_STRENGTH` (how much levels 6-10 count), `PERM_PER_EPISODE`, `EPISODE_COST_GROWTH` (how much costs multiply per episode), `OFFLINE_CAP_S`, `BANK_BONUS`, `RUSH_MULT` and `RUSH_S` (the welcome-back choice) and `FREE_AUTO_SHOPS` (shops that start automated from episode 2 on). Everything players read or see is in `SKINS`: to add a setting, copy a skin, change its words, episodes and `theme` colors, and it shows up in the Setting picker.

Smoke test: `node tools/smoke.mjs` loads the game in headless Chrome or Edge (no installs needed, Node 22 or newer), plays each setting for a few seconds, opens a chest, runs a finale, checks every episode's shop icons and story, and fails on any page error. It takes about half a minute; `SKINS=mall,neon` tests just those, `CHROME=/path` picks the browser.

Balance check: `node tools/sim.mjs` reads the numbers from `index.html`, plays a greedy player who taps every shop the moment it's idle, and prints when each shop opens and when the finale unlocks. Episode 1 currently takes about 25 minutes that way (it buys 3 upgrades along the way), with the fifth goal landing a few minutes before the lease. It also prints when each goal clears. Real players are less efficient, so expect 30 to 40.

It then plays several episodes in a row (carrying over the bonus, beer, eggs and cards, opening chests as soon as it can, plus the free daily chest for every 24 hours played; `DAILY=0` turns that off) and prints the median time per episode. `node tools/sim.mjs 9 50` plays 9 episodes over 50 runs, and `GROWTH=3 node tools/sim.mjs` tries a different per-episode cost growth without editing the game (`UPGRADES=0`, `UPCOST=2` or `UPSPEC='[{"cost":100,"mult":2}]'` try other upgrade setups).

The same table is printed for a casual player (10 minutes every 2 hours) and an idle one (3 minutes, 3 times a day), who only earn from automated shops while away and, while playing, leave a finished shop idle for a few seconds before tapping it again (3 seconds casual, 5 idle). Current real time to unlock each finale:

| Episode | Engaged (nonstop) | Casual | Idle |
| --- | --- | --- | --- |
| 1 | 25 minutes | 2 hours | 16 hours |
| 2 | 26 minutes | 2 hours | 8 hours |
| 3 | 30 minutes | 2 hours | 8 hours |
| 4 | 37 minutes | 2 hours | 8 hours |
| 5 | 45 minutes | 2 hours | 8 hours |
| 6 | 56 minutes | 2 hours | 16 hours |
| 7 | 1.2 hours | 2 hours | 16 hours |
| 8 | 1.4 hours | 2 hours | 16 hours |
| 9 | 1.7 hours | 4 hours | 16 hours |
| 10 | 2 hours | 4 hours | 16 hours |
| 12 | 2.8 hours | 4 hours | 16 hours |
| 15 | 4.5 hours | 6 hours | 1 day |
| 20 | 9.1 hours | 8 hours | 1.3 days |
| 25 | 16.9 hours | 12 hours | 1.7 days |

Cards reach level 10 across the board around episode 25 (57 of 60 levels in the simulator). When they topped out at level 5 they were all maxed by episode 12 and episode 20 took 22.6 hours.

Early on, one break's offline earnings cover the rest of an episode, so session players finish on their second visit. The growing costs are what slow them down later. `OFFRATE=0.25` and `OFFCAP=4` try a lower offline rate or cap (a lower rate barely changes this).

Session players live on what their automated shops earn while they're away, so the start of each episode matters most: until something is automated, a break earns nothing. That's why the first shop starts automated from episode 2 on. Without it (`FREEAUTO=0`), idle players spend more and more visits of each later episode tapping their way to the first automation, which costs as much as that episode's prices: 1.3 days for episode 5 and 6.7 days for episode 12.

## Roadmap

- [x] Cards and chests (permanent, survive episode resets)
- [x] Episode-specific shops and story beats (6 episodes per setting)
- [x] Balance pass targeting about 30 minutes for episode 1
- [x] Costs scale per episode so later episodes stay a challenge
- [x] Sound effects (synthesized, per setting)
- [x] Art (card portraits, story scenes and shop icons for every setting)
- [ ] Optional rewarded-ad boosts

## License

[MIT](LICENSE)

## Inspiration

Structure inspired by the discontinued mobile game *It's Always Sunny: The Gang Goes Mobile* (schemes, episode-style prestige, character cards). This project uses an original setting and cast and is not affiliated with that game or its owners.
