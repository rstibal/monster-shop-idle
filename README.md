# Grizzle's Haunted Mall

A small idle clicker about a goblin shopkeeper running dodgy kiosks in a haunted mall. Plain HTML, CSS and JavaScript in one file, with no build step and no dependencies.

Status: early prototype. All numbers are placeholders.

## Run it

Open `index.html` in a browser. Progress saves to the browser's local storage.

Add `?speed=10` to the URL to run the game 10 times faster while tuning.

To host it, enable GitHub Pages on the `main` branch (root folder).

## How it plays

- Six shops unlock in order, from the pretzel kiosk of mystery to the dragon anchor-store lease.
- Buy customers (x1, x10 or Max) to raise a shop's income. Cost grows geometrically.
- Tap a shop to run it once, or pay to automate it.
- Owning 10, 25, 50, 100 and 150 customers of a shop doubles its income and gives 1 beer.
- Clear 2 goals and sign a dragon lease to unlock the episode finale. It resets cash and shops, keeps beer, and adds a permanent 50% income bonus.
- Shops keep earning while the tab is closed, up to 8 hours.

## Tuning

Everything lives at the top of the script in `index.html`: `SCHEMES` (costs, payouts, run times), `MILESTONES`, `GOALS`, `PERM_PER_EPISODE` and `OFFLINE_CAP_S`.

## Roadmap

- [ ] Cards and chests (permanent, survive episode resets)
- [ ] Episode-specific shops and story beats
- [ ] Balance pass targeting about 30 minutes for episode 1
- [ ] Art and sound
- [ ] Optional rewarded-ad boosts

## Inspiration

Structure inspired by the discontinued mobile game *It's Always Sunny: The Gang Goes Mobile* (schemes, episode-style prestige, character cards). This project uses an original setting and cast and is not affiliated with that game or its owners.
