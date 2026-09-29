// Balance simulator: reads the game's numbers from index.html and plays a
// greedy, always-engaged player (taps every idle shop immediately).
// Episode 1 is printed in detail, then several episodes are played in a row,
// carrying over the permanent bonus, beer, eggs, crystals and cards (chests are
// opened as soon as affordable, with a seeded RNG, averaged over several runs).
// Usage: node tools/sim.mjs [episodes] [runs]   (STEP=1.2 node tools/sim.mjs tries another cost step)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "index.html"), "utf8");
const grab = re => { const m = html.match(re); if (!m) throw new Error("not found: " + re); return m[0]; };
const block = name => new Function(grab(new RegExp(`const ${name} = \\[[\\s\\S]*?\\n  \\];`)).replace(`const ${name} =`, "return"));
const num = name => Number(grab(new RegExp(`const ${name} = [\\d.e]+`)).split("= ")[1]);
const SCHEMES = block("SCHEMES")();
const MILESTONES = new Function(grab(/const MILESTONES = \[[^\]]*\]/).replace("const MILESTONES =", "return"))();
const EPISODES = block("EPISODES")();
const CARDS = block("CARDS")();
const CHESTS = block("CHESTS")();
const LEVEL_AT = new Function(grab(/const LEVEL_AT = \[[^\]]*\]/).replace("const LEVEL_AT =", "return"))();
const GOALS_NEEDED = num("GOALS_NEEDED");
const PERM_PER_EPISODE = num("PERM_PER_EPISODE");
const EPISODE_COST_STEP = process.env.STEP ? Number(process.env.STEP) : num("EPISODE_COST_STEP"); // STEP=1.2 to try other values
const [EGGS_PER_GOAL, EGGS_PER_FINALE] = grab(/const EGGS_PER_GOAL = \d+, EGGS_PER_FINALE = \d+/).match(/\d+/g).map(Number);
// GOALS reference isAuto, so they're built with the simulator's automation flags
let autoFlags = [];
const GOALS_SIM = new Function("isAuto", grab(/const GOALS = \[[\s\S]*?\n  \];/).replace("const GOALS =", "return"))(i => autoFlags[i]);

const EP = ep => EPISODES[ep % EPISODES.length];
const shopName = (ep, i) => EP(ep).shops[i].name;
const costMult = ep => 1 + EPISODE_COST_STEP * ep;
const goalTarget = (g, ep) => g.target * (g.scaled ? costMult(ep) : 1);
const fmtMoney = v => v >= 1e6 ? "$" + +(v / 1e6).toFixed(1) + "M" : "$" + v;
const goalText = (g, ep) => g.text.replace(/\{(\d)\}/g, (m, i) => EP(ep).shops[i].noun).replace("{$}", fmtMoney(goalTarget(g, ep)));

const mult = n => Math.pow(2, MILESTONES.filter(m => n >= m).length);
const level = (meta, id) => LEVEL_AT.filter(c => (meta.cards[id] || 0) >= c).length;

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

function play(ep, meta, { tick = 0.25, limit = 4 * 3600 } = {}) {
  const cm = costMult(ep);
  const global = meta.perm * (1 + 0.1 * level(meta, "witch"));
  const grizzle = 1 + 0.5 * level(meta, "grizzle");
  const rate = (i, n) => n ? n * SCHEMES[i].payout * mult(n) * global * (i === 0 ? grizzle : 1) / SCHEMES[i].time : 0;
  const cost = (i, n) => SCHEMES[i].base * cm * Math.pow(SCHEMES[i].growth, n);
  const autoCost = i => SCHEMES[i].auto * cm;
  let t = 0, cash = 0;
  const n = SCHEMES.map((_, i) => (i === 0 ? 1 : 0));
  const auto = SCHEMES.map((_, i) => i < level(meta, "mort"));
  const log = [];
  const goals = Object.fromEntries(GOALS_SIM.map(g => [g.id, null]));
  autoFlags = auto;
  const mark = s => log.push([t, s]);
  const check = state => {
    for (const g of GOALS_SIM) if (goals[g.id] === null && g.cur(state) >= goalTarget(g, ep)) { goals[g.id] = t; meta.eggs += EGGS_PER_GOAL; }
  };

  while (t < limit) {
    // income this tick (engaged player: every shop is always running)
    let ips = 0;
    for (let i = 0; i < n.length; i++) ips += rate(i, n[i]);
    cash += ips * tick;
    t += tick;

    // cash goals are checked before spending: the player is saving up at that moment
    check({ cash, schemes: n.map(x => ({ n: x })) });

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
        if (!auto[i] && n[i] >= 1 && cash >= autoCost(i)) {
          // automation matters for goals and offline only; buy when cheap relative to cash
          if (!best || autoCost(i) < cash * 0.25) best = { i, c: autoCost(i), score: -1e18, kind: "auto" };
        }
      }
      if (!best) break;
      cash -= best.c;
      if (best.kind === "auto") { auto[best.i] = true; continue; }
      const before = n[best.i];
      n[best.i]++;
      if (before === 0) mark("opened " + shopName(ep, best.i));
      const crossed = MILESTONES.filter(m => before < m && n[best.i] >= m);
      if (crossed.length) { meta.beer += crossed.length; mark(`${shopName(ep, best.i)} hit ${crossed[0]}`); }
    }

    check({ cash, schemes: n.map(x => ({ n: x })) });
    const done = Object.values(goals).filter(v => v !== null).length;
    if (done >= GOALS_NEEDED && n[n.length - 1] >= 1) { mark("FINALE READY"); return { t, log, goals, n }; }
  }
  return { t, log, goals, n, timedOut: true };
}

const fmtT = s => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s`;
const newMeta = () => ({ perm: 1, beer: 0, eggs: 0, crystals: 0, cards: {} });
const finale = meta => { meta.perm += PERM_PER_EPISODE * (1 + 0.2 * level(meta, "bramble")); meta.eggs += EGGS_PER_FINALE; };

// Episode 1 in detail
const r = play(0, newMeta());
for (const [t, s] of r.log) if (!/hit (25|50|100|150)$/.test(s)) console.log(fmtT(t).padStart(7), s);
console.log("\nGoals (need " + GOALS_NEEDED + " plus the " + EP(0).lease + "):");
for (const g of GOALS_SIM) console.log("  " + (r.goals[g.id] == null ? "      -" : fmtT(r.goals[g.id]).padStart(7)), goalText(g, 0));
console.log("Customers:", r.n.join(", "));
console.log(r.timedOut ? "DID NOT FINISH" : "Finale ready at " + fmtT(r.t));

// Several episodes in a row
const EPS = Number(process.argv[2]) || 6, RUNS = Number(process.argv[3]) || 20;
const times = Array.from({ length: EPS }, () => []), perms = Array(EPS).fill(0), lvls = Array(EPS).fill(0);
for (let run = 0; run < RUNS; run++) {
  const meta = newMeta(), rand = rng(run + 1);
  for (let ep = 0; ep < EPS; ep++) {
    openChests(meta, rand);
    perms[ep] += meta.perm / RUNS;
    lvls[ep] += CARDS.reduce((a, c) => a + level(meta, c.id), 0) / RUNS;
    const res = play(ep, meta);
    times[ep].push(res.timedOut ? Infinity : res.t);
    finale(meta);
  }
}
console.log(`\nEpisodes in a row (cost step ${EPISODE_COST_STEP}, ${RUNS} runs, median time):`);
console.log("  ep  costs  bonus  card lvls  time");
for (let ep = 0; ep < EPS; ep++) {
  const s = times[ep].slice().sort((a, b) => a - b), med = s[Math.floor(s.length / 2)];
  console.log(`  ${String(ep + 1).padStart(2)}  x${costMult(ep).toFixed(1).padEnd(4)}  x${perms[ep].toFixed(2)}  ${lvls[ep].toFixed(1).padStart(9)}  ${isFinite(med) ? fmtT(med) : "did not finish"}`);
}
