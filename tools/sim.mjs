// Balance simulator: reads the game's numbers from index.html and plays a
// greedy player (taps every idle shop immediately, spends on the best payback: customers or upgrades).
// Episode 1 is printed in detail for an always-engaged player, then several
// episodes are played in a row for each profile in PROFILES (engaged, casual,
// idle), carrying over the permanent bonus, beer, eggs, crystals and cards
// (chests are opened as soon as affordable, with a seeded RNG, over several runs).
// Usage: node tools/sim.mjs [episodes] [runs]   (GROWTH=2.5 node tools/sim.mjs tries another per-episode cost growth)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "index.html"), "utf8");
const grab = re => { const m = html.match(re); if (!m) throw new Error("not found: " + re); return m[0]; };
const block = name => new Function(grab(new RegExp(`const ${name} = \\[[\\s\\S]*?\\n  \\];`)).replace(`const ${name} =`, "return"));
const num = name => Number(grab(new RegExp(`const ${name} = [\\d.e]+`)).split("= ")[1]);
const SCHEMES = block("SCHEMES")();
const MILESTONES = new Function(grab(/const MILESTONES = \[[^\]]*\]/).replace("const MILESTONES =", "return"))();
// shop names and goal wording come from the first skin (the numbers are the same in every skin)
const SKIN = block("SKINS")()[0];
const EPISODES = SKIN.episodes;
const CARDS = block("CARDS")();
// UPCOST=2 doubles every upgrade price, UPGRADES=0 plays without them
const UPGRADES = process.env.UPGRADES === "0" ? [] : (process.env.UPSPEC ? JSON.parse(process.env.UPSPEC) : block("UPGRADES")()).map(u => ({ ...u, cost: u.cost * Number(process.env.UPCOST || 1) }));
const CHESTS = block("CHESTS")();
const LEVEL_AT = new Function(grab(/const LEVEL_AT = \[[^\]]*\]/).replace("const LEVEL_AT =", "return"))();
const GOALS_NEEDED = num("GOALS_NEEDED");
const PERM_PER_EPISODE = num("PERM_PER_EPISODE");
const FREE_AUTO_SHOPS = process.env.FREEAUTO ? Number(process.env.FREEAUTO) : num("FREE_AUTO_SHOPS");
const EPISODE_COST_GROWTH = process.env.GROWTH ? Number(process.env.GROWTH) : num("EPISODE_COST_GROWTH");
const OFFLINE_CAP_S = process.env.OFFCAP ? Number(process.env.OFFCAP) * 3600 : new Function("return " + grab(/const OFFLINE_CAP_S = [^;]+/).split("= ")[1])();
// what-ifs: OFFCAP=4 tries a 4-hour offline cap, OFFRATE=0.25 pays 25% while away (the game pays 100%),
// FREEAUTO=0 starts later episodes with no automated shops
const OFFLINE_RATE = process.env.OFFRATE ? Number(process.env.OFFRATE) : 1;
// session players come back to the welcome-back popup and bank their earnings (a 5-minute rush hour doesn't pay for
// 3- or 10-minute visits after hours away); BANK=0 tries it without the bonus
const BANK_BONUS = process.env.BANK ? Number(process.env.BANK) : num("BANK_BONUS");
const [EGGS_PER_GOAL, EGGS_PER_FINALE] = grab(/const EGGS_PER_GOAL = \d+, EGGS_PER_FINALE = \d+/).match(/\d+/g).map(Number);
// one chest a day is free; DAILY=0 turns it off
const DAILY = process.env.DAILY === "0" ? null : CHESTS.find(c => c.id === grab(/const DAILY_CHEST = "\w+"/).split('"')[1]);
// GOALS reference isAuto, so they're built with the simulator's automation flags
let autoFlags = [];
const GOALS_SIM = new Function("isAuto", grab(/const GOALS = \[[\s\S]*?\n  \];/).replace("const GOALS =", "return"))(i => autoFlags[i]);
// one story goal per episode joins them, picked by episode number like the game does (STORY=0 leaves them out)
const STORY_GOALS = process.env.STORY === "0" ? [] : new Function("MILESTONES", grab(/const STORY_GOALS = \[[\s\S]*?\n  \];/).replace("const STORY_GOALS =", "return"))(MILESTONES);
const goalsFor = ep => STORY_GOALS.length ? [STORY_GOALS[ep % STORY_GOALS.length], ...GOALS_SIM] : GOALS_SIM;

const EP = ep => EPISODES[ep % EPISODES.length];
const shopName = (ep, i) => EP(ep).shops[i].name;
const costMult = ep => Math.pow(EPISODE_COST_GROWTH, ep);
const goalTarget = (g, ep) => g.target * (g.scaled ? costMult(ep) : 1);
const fmtMoney = v => v >= 1e6 ? "$" + +(v / 1e6).toFixed(1) + "M" : "$" + v;
const goalText = (g, ep) => g.text.replace(/\{(\d)\}/g, (m, i) => EP(ep).shops[i].noun).replace("{c}", SKIN.words.customers).replace("{$}", fmtMoney(goalTarget(g, ep)));

const level = (meta, id) => LEVEL_AT.filter(c => (meta.cards[id] || 0) >= c).length;
const LATE_LEVEL_STRENGTH = process.env.LATELEVEL ? Number(process.env.LATELEVEL) : num("LATE_LEVEL_STRENGTH");   // LATELEVEL=1 tries levels 6-10 at full strength
const bonus = (meta, id) => { const l = level(meta, id); return CARDS.find(c => c.id === id).per * (Math.min(l, 5) + LATE_LEVEL_STRENGTH * Math.max(0, l - 5)); };

function rng(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
}
function openChests(meta, rand) {
  const total = CARDS.reduce((a, c) => a + c.weight, 0);
  for (let opened = true; opened;) {
    opened = false;
    for (const ch of CHESTS) {
      if (meta[ch.cur] < ch.cost) continue;
      meta[ch.cur] -= ch.cost;
      opened = true;
      for (let k = 0; k < ch.pulls; k++) {
        let roll = rand() * total, c = CARDS[0];
        for (const x of CARDS) { roll -= x.weight; if (roll < 0) { c = x; break; } }
        if ((meta.cards[c.id] || 0) >= LEVEL_AT[LEVEL_AT.length - 1]) meta.crystals++;
        else meta.cards[c.id] = (meta.cards[c.id] || 0) + 1;
      }
    }
  }
}

// How a player spends their time. While in a session they tap every idle shop and spend greedily;
// between sessions the tab is closed and only automated shops earn (up to the offline cap).
// autoFirst: buys automation as soon as it can afford it, since that's what earns while away.
// tapWait: seconds a finished shop sits before the player taps it again (engaged players tap at once;
// session players glance at the game every few seconds between buying things).
const PROFILES = {
  engaged: { label: "Engaged (plays nonstop)" },
  casual:  { label: "Casual (10 min every 2 hours)", session: 600, gap: 7200 - 600, autoFirst: true, tapWait: 3 },
  idle:    { label: "Idle (3 min, 3 times a day)", session: 180, gap: 8 * 3600 - 180, autoFirst: true, tapWait: 5 },
};

// sessionLeft carries the rest of the session the previous finale happened in (a player who returns,
// runs the finale and starts the next episode is still in that same visit).
function play(ep, meta, { tick = 0.25, limit = 30 * 86400, session = Infinity, gap = 0, autoFirst = false, tapWait = 0 } = {}, sessionLeft = session) {
  const cm = costMult(ep);
  // same formulas as the Math section of index.html
  const global = meta.perm * (1 + bonus(meta, "money"));
  const speed = 1 + bonus(meta, "speed");
  const disc = 1 - bonus(meta, "discount");
  const mult = n => Math.pow(2 + bonus(meta, "milestone"), MILESTONES.filter(m => n >= m).length);
  const up = SCHEMES.map(() => 0);
  const upMult = (i, u = up[i]) => UPGRADES.slice(0, u).reduce((a, x) => a * x.mult, 1);
  const rate = (i, n, u) => n ? n * SCHEMES[i].payout * mult(n) * upMult(i, u) * global * speed / SCHEMES[i].time : 0;
  const cost = (i, n) => SCHEMES[i].base * cm * disc * Math.pow(SCHEMES[i].growth, n);
  const autoCost = i => SCHEMES[i].auto * cm * disc;
  const upCost = i => SCHEMES[i].auto * cm * disc * UPGRADES[up[i]].cost;
  let t = 0, cash = 0, active = 0, sessions = 1;
  const n = SCHEMES.map((_, i) => (i === 0 ? 1 : 0));
  const auto = SCHEMES.map((_, i) => ep > 0 && i < FREE_AUTO_SHOPS);
  const log = [];
  const GOALS_EP = goalsFor(ep);
  const goals = Object.fromEntries(GOALS_EP.map(g => [g.id, null]));
  autoFlags = auto;
  const mark = s => log.push([t, s]);
  const check = state => {
    for (const g of GOALS_EP) if (goals[g.id] === null && g.cur(state) >= goalTarget(g, ep)) { goals[g.id] = t; meta.eggs += EGGS_PER_GOAL; }
  };

  while (t < limit) {
    if (sessionLeft <= 0) {
      // away: only automated shops earn, and only up to the offline cap
      let autoIps = 0;
      for (let i = 0; i < n.length; i++) if (auto[i]) autoIps += rate(i, n[i]);
      cash += autoIps * Math.min(gap, OFFLINE_CAP_S) * OFFLINE_RATE * (1 + BANK_BONUS);
      t += gap;
      sessionLeft = session;
      sessions++;
    }
    sessionLeft -= tick;
    active += tick;
    // income this tick: automated shops run nonstop, the rest lose tapWait seconds per run
    let ips = 0;
    for (let i = 0; i < n.length; i++) ips += rate(i, n[i]) * (auto[i] ? 1 : SCHEMES[i].time / speed / (SCHEMES[i].time / speed + tapWait));
    cash += ips * tick;
    t += tick;

    // cash goals are checked before spending: the player is saving up at that moment
    check({ cash, schemes: n.map((x, i) => ({ n: x, up: up[i] })) });

    // spend: unlock next shop asap, then best payback among the rest
    for (let guard = 0; guard < 50; guard++) {
      let best = null;
      for (let i = 0; i < n.length; i++) {
        const unlocked = i === 0 || n[i - 1] >= 1;
        if (!unlocked) continue;
        const c = cost(i, n[i]);
        const gain = rate(i, n[i] + 1) - rate(i, n[i]);
        const isUnlock = n[i] === 0;
        const score = isUnlock ? -Infinity : c / gain; // lower is better
        if (cash >= c && (!best || score < best.score)) best = { i, c, score, kind: "buy" };
        if (n[i] >= 1 && up[i] < UPGRADES.length) {
          const uc = upCost(i), us = uc / (rate(i, n[i], up[i] + 1) - rate(i, n[i]));
          if (cash >= uc && (!best || us < best.score)) best = { i, c: uc, score: us, kind: "up" };
        }
        if (!auto[i] && n[i] >= 1 && cash >= autoCost(i)) {
          // automation matters for goals and offline only; buy when cheap relative to cash
          if (!best || autoFirst || autoCost(i) < cash * 0.25) best = { i, c: autoCost(i), score: -1e18, kind: "auto" };
        }
      }
      if (!best) break;
      cash -= best.c;
      if (best.kind === "auto") { auto[best.i] = true; continue; }
      if (best.kind === "up") { up[best.i]++; mark(`${shopName(ep, best.i)} upgrade ${up[best.i]}`); continue; }
      const before = n[best.i];
      n[best.i]++;
      if (before === 0) mark("opened " + shopName(ep, best.i));
      const crossed = MILESTONES.filter(m => before < m && n[best.i] >= m);
      if (crossed.length) { meta.beer += crossed.length * (1 + bonus(meta, "beer")); mark(`${shopName(ep, best.i)} hit ${crossed[0]}`); }
    }

    check({ cash, schemes: n.map((x, i) => ({ n: x, up: up[i] })) });
    const done = Object.values(goals).filter(v => v !== null).length;
    if (done >= GOALS_NEEDED && n[n.length - 1] >= 1) { mark("FINALE READY"); return { t, active, sessions, sessionLeft, log, goals, n }; }
  }
  return { t, active, sessions, log, goals, n, timedOut: true };
}

const fmtT = s => { s = Math.round(s); return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`; };
const newMeta = () => ({ perm: 1, beer: 0, eggs: 0, crystals: 0, cards: {} });
const finale = meta => { meta.perm *= 1 + PERM_PER_EPISODE * (1 + bonus(meta, "finale")); meta.eggs += EGGS_PER_FINALE; };   // the bonus multiplies, like the game

// Episode 1 in detail
const r = play(0, newMeta());
for (const [t, s] of r.log) if (!/hit (25|50|100|150)$/.test(s)) console.log(fmtT(t).padStart(7), s);
console.log("\nGoals (need " + GOALS_NEEDED + " plus the " + EP(0).lease + "):");
for (const g of goalsFor(0)) console.log("  " + (r.goals[g.id] == null ? "      -" : fmtT(r.goals[g.id]).padStart(7)), goalText(g, 0));
console.log("Customers:", r.n.join(", "));
console.log(r.timedOut ? "DID NOT FINISH" : "Finale ready at " + fmtT(r.t));

// Several episodes in a row, per player profile
const EPS = Number(process.argv[2]) || 6, RUNS = Number(process.argv[3]) || 20;
const fmtH = s => s < 3600 ? fmtT(s) : s < 86400 ? (s / 3600).toFixed(1) + " hours" : (s / 86400).toFixed(1) + " days";
const median = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(`
Episodes in a row (costs x${EPISODE_COST_GROWTH} per episode, ${RUNS} runs, medians).`);
console.log("Elapsed is real time until the finale unlocks; active is time spent playing.");
for (const [id, prof] of Object.entries(PROFILES)) {
  const res = Array.from({ length: EPS }, () => []), perms = Array(EPS).fill(0), lvls = Array(EPS).fill(0);
  for (let run = 0; run < RUNS; run++) {
    const meta = newMeta(), rand = rng(run + 1);
    let left = prof.session ?? Infinity, elapsed = 0, days = 1;
    for (let ep = 0; ep < EPS; ep++) {
      // the daily chest from day 2 on, counted in 24-hour steps of elapsed time and opened at the next episode start (paid as its cost)
      for (; DAILY && days <= elapsed / 86400; days++) meta[DAILY.cur] += DAILY.cost;
      openChests(meta, rand);
      perms[ep] += meta.perm / RUNS;
      lvls[ep] += CARDS.reduce((a, c) => a + level(meta, c.id), 0) / RUNS;
      const r = play(ep, meta, prof, left);
      res[ep].push(r);
      left = r.sessionLeft;
      elapsed += r.t;
      finale(meta);
    }
  }
  console.log(`
${prof.label}`);
  console.log("  ep  costs  bonus  card lvls  elapsed        active   sessions");
  for (let ep = 0; ep < EPS; ep++) {
    const r = res[ep], done = r.every(x => !x.timedOut);
    const cols = done ? [fmtH(median(r.map(x => x.t))).padEnd(13), fmtT(median(r.map(x => x.active))).padStart(8), String(median(r.map(x => x.sessions))).padStart(9)].join("  ") : "did not finish";
    console.log(`  ${String(ep + 1).padStart(2)}  x${String(+costMult(ep).toPrecision(3)).padEnd(5)}  x${perms[ep].toFixed(2)}  ${lvls[ep].toFixed(1).padStart(9)}  ${cols}`);
  }
}
