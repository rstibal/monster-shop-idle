// Balance simulator: reads the game's numbers from index.html and plays a
// greedy, always-engaged player (taps every idle shop immediately).
// Usage: node tools/sim.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "index.html"), "utf8");
const grab = re => { const m = html.match(re); if (!m) throw new Error("not found: " + re); return m[0]; };
const SCHEMES = new Function(grab(/const SCHEMES = \[[\s\S]*?\n  \];/).replace("const SCHEMES =", "return"))();
const MILESTONES = new Function(grab(/const MILESTONES = \[[^\]]*\]/).replace("const MILESTONES =", "return"))();

const GOALS_NEEDED = Number(grab(/const GOALS_NEEDED = \d+/).match(/\d+/)[0]);
let autoFlags = [];
const GOALS = new Function("isAuto", grab(/const GOALS = \[[\s\S]*?\n  \];/).replace("const GOALS =", "return"))(i => autoFlags[i]);

const mult = n => Math.pow(2, MILESTONES.filter(m => n >= m).length);
const rate = (i, n) => n ? n * SCHEMES[i].payout * mult(n) / SCHEMES[i].time : 0;
const cost = (i, n) => SCHEMES[i].base * Math.pow(SCHEMES[i].growth, n);

function play({ tick = 0.25, limit = 4 * 3600 } = {}) {
  let t = 0, cash = 0;
  const n = SCHEMES.map((_, i) => (i === 0 ? 1 : 0));
  const auto = SCHEMES.map(() => false);
  const log = [];
  const goals = Object.fromEntries(GOALS.map(g => [g.id, null]));
  const at = (k) => { if (goals[k] === null) goals[k] = t; };
  autoFlags = auto;
  const mark = s => log.push([t, s]);
  const opened = new Set([0]);
  let beer = 0;

  while (t < limit) {
    // income this tick (engaged player: every shop is always running)
    let ips = 0;
    for (let i = 0; i < n.length; i++) ips += rate(i, n[i]);
    cash += ips * tick;
    t += tick;

    // cash goals are checked before spending: the player is saving up at that moment
    const peak = { cash, schemes: n.map(x => ({ n: x })) };
    for (const g of GOALS) if (g.cur(peak) >= g.target) at(g.id);

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
        if (!auto[i] && n[i] >= 1 && cash >= SCHEMES[i].auto) {
          // automation matters for goals and offline only; buy when cheap relative to cash
          if (!best || SCHEMES[i].auto < cash * 0.25) best = { i, c: SCHEMES[i].auto, score: -1e18, kind: "auto" };
        }
      }
      if (!best) break;
      cash -= best.c;
      if (best.kind === "auto") { auto[best.i] = true; continue; }
      const before = n[best.i];
      n[best.i]++;
      if (before === 0) mark("opened " + SCHEMES[best.i].name);
      const crossed = MILESTONES.filter(m => before < m && n[best.i] >= m);
      if (crossed.length) { beer += crossed.length; mark(`${SCHEMES[best.i].name} hit ${crossed[0]}`); }
    }

    const state = { cash, schemes: n.map(x => ({ n: x })) };
    for (const g of GOALS) if (g.cur(state) >= g.target) at(g.id);
    const done = Object.values(goals).filter(v => v !== null).length;
    if (done >= GOALS_NEEDED && n[5] >= 1) { mark("FINALE READY"); return { t, log, goals, beer, n }; }
  }
  return { t, log, goals, beer, n, timedOut: true };
}

const fmtT = s => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s`;
const r = play();
for (const [t, s] of r.log) if (!/hit (25|50|100|150)$/.test(s)) console.log(fmtT(t).padStart(7), s);
console.log("\nGoals (need " + GOALS_NEEDED + " plus the dragon lease):");
for (const g of GOALS) console.log("  " + (r.goals[g.id] == null ? "      -" : fmtT(r.goals[g.id]).padStart(7)), g.text);
console.log("Beer earned:", r.beer, "| customers:", r.n.join(", "));
console.log(r.timedOut ? "DID NOT FINISH" : "Finale ready at " + fmtT(r.t));
