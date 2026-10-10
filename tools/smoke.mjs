// Headless smoke test: loads index.html in headless Chrome (or Edge/Chromium), plays every setting for a few
// seconds at ?speed, opens a chest, runs a finale, checks every episode's art, and fails on any page error.
// No dependencies: a tiny static server plus the DevTools protocol over Node's built-in WebSocket (Node 22+).
//
// Usage: node tools/smoke.mjs            (CHROME=/path/to/browser to pick the browser, SKINS=mall,neon for a subset)
import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 120000;
const wait = ms => new Promise(r => setTimeout(r, ms));

function findBrowser() {
  if (process.env.CHROME) return process.env.CHROME;
  const pf = process.env.PROGRAMFILES || "C:\\Program Files", pf86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", local = process.env.LOCALAPPDATA || "";
  const candidates = [
    join(pf, "Google/Chrome/Application/chrome.exe"), join(pf86, "Google/Chrome/Application/chrome.exe"), join(local, "Google/Chrome/Application/chrome.exe"),
    join(pf86, "Microsoft/Edge/Application/msedge.exe"), join(pf, "Microsoft/Edge/Application/msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge",
  ];
  return candidates.find(p => existsSync(p));
}

// static server for the repo root (the game's service worker and fonts need http, not file://)
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    try {
      const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
      res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise(r => server.listen(0, "127.0.0.1", () => r(server)));
}

// the DevTools protocol, just enough of it
function cdp(url) {
  const ws = new WebSocket(url), pending = new Map(), handlers = [];
  let id = 0;
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
    else handlers.forEach(h => h(m));
  };
  return new Promise((res, rej) => {
    ws.onerror = () => rej(new Error("could not connect to the browser"));
    ws.onopen = () => res({
      send: (method, params = {}) => new Promise((res, rej) => { pending.set(++id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); }),
      on: h => handlers.push(h),
      close: () => ws.close(),
    });
  });
}

// runs inside the page for one setting; returns a list of failures (empty when all is well)
const PAGE_TEST = `(async () => {
  const g = window.__game, fails = [], wait = ms => new Promise(r => setTimeout(r, ms));
  const check = (ok, msg) => { if (!ok) fails.push(msg); };
  if (!g) return ["window.__game is missing (did ?debug stop working?)"];
  const dlg = document.getElementById("story");
  check(dlg.open, "episode 1's intro did not open on a new game");
  check(dlg.querySelector("svg"), "episode 1's intro has no scene art");
  dlg.querySelector("button")?.click();
  await wait(200);

  // play: tap and buy everything for a couple of seconds
  for (let t = 0; t < 40; t++) { for (let i = 0; i < 6; i++) { g.tap(i); g.buy(i); g.automate(i); } await wait(50); }
  check(g.S.schemes[0].n > 1, "never bought a second customer at the first shop");
  check(g.S.schemes[1].n >= 1, "never opened the second shop");
  check(g.S.life.earned > 0 && g.S.life.taps > 0, "the Stats totals didn't count earnings or taps");
  check(Number.isFinite(g.S.cash) && g.S.cash >= 0, "cash is not a sane number: " + g.S.cash);
  check(/^\\$[\\d.]+[A-Za-z]*$/.test(document.getElementById("cash").textContent), "cash display looks wrong: " + document.getElementById("cash").textContent);

  // every view renders
  for (const v of ["cards", "stats", "shops"]) document.querySelector('[data-view="' + v + '"]').click();
  document.querySelector('[data-view="stats"]').click(); await wait(50);
  check(document.getElementById("statAll").children.length > 10, "the Stats tab is empty");
  document.querySelector('[data-view="cards"]').click(); await wait(50);
  check(document.querySelectorAll("#cardgrid > *").length === 6, "the Cards tab doesn't show six cards");
  g.S.eggs += 2; g.openChest("egg");
  check(g.S.life.chests === 1 && Object.values(g.S.cards).reduce((a, n) => a + n, 0) >= 3, "opening an egg chest didn't draw cards");
  document.querySelector('[data-view="shops"]').click();

  // a finale: max out the shops, let the goals clear, finish the episode
  g.S.schemes.forEach(sc => { sc.n = 200; sc.auto = true; sc.up = 3; });
  g.S.cash = 1e15;
  await wait(300);
  check(g.finaleReady(), "the finale isn't ready with every shop at 200 customers");
  const perm = g.S.perm;
  g.finish();
  check(g.S.episode === 1, "the finale didn't move to episode 2");
  check(g.S.perm > perm, "the finale didn't raise the permanent bonus");
  check(g.S.life.finales >= 1, "the Stats totals didn't count the finale");
  check(dlg.open && dlg.querySelector("svg"), "episode 2's intro didn't open with its scene");
  dlg.querySelector("button")?.click();
  await wait(100);

  // every episode has its shop icons (all shops opened) and a scene
  const eps = g.SK.episodes.length;
  for (let e = 0; e < eps; e++) {
    g.S.episode = e; g.S.schemes.forEach(sc => sc.n = 1); g.build();
    await wait(60);
    const icons = document.querySelectorAll(".icon svg").length;
    check(icons === 6, "episode " + (e + 1) + " shows " + icons + " of 6 shop icons");
    check(g.SK.episodes[e].shops.length === 6 && g.SK.episodes[e].intro.length && g.SK.episodes[e].finale.text.length, "episode " + (e + 1) + " is missing shops or story");
  }
  return fails;
})()`;

async function main() {
  const browser = findBrowser();
  if (!browser) { console.error("No Chrome, Edge or Chromium found. Set CHROME=/path/to/browser."); process.exit(2); }
  const server = await serve();
  const base = "http://127.0.0.1:" + server.address().port + "/index.html";
  const profile = await mkdtemp(join(tmpdir(), "msi-smoke-"));
  const proc = spawn(browser, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profile, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
  const killTimer = setTimeout(() => { console.error("Timed out after " + TIMEOUT_MS / 1000 + "s"); cleanup(1); }, TIMEOUT_MS);
  async function cleanup(code) {
    clearTimeout(killTimer);
    proc.kill();
    server.close();
    await wait(500);
    await rm(profile, { recursive: true, force: true }).catch(() => {});
    process.exit(code);
  }

  // the browser writes its port to DevToolsActivePort once it's listening
  let port;
  for (let t = 0; t < 100 && !port; t++) {
    await wait(100);
    try { port = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; } catch {}
  }
  if (!port) { console.error("The browser didn't start: " + browser); return cleanup(2); }
  const targets = await (await fetch("http://127.0.0.1:" + port + "/json/list")).json();
  const page = await cdp(targets.find(t => t.type === "page").webSocketDebuggerUrl);

  let errors = [];
  page.on(m => {
    if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console.error: " + m.params.args.map(a => a.value ?? a.description).join(" "));
    // network failures for fonts and the like (offline machines) aren't the game's fault
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && m.params.entry.source !== "network") errors.push("log: " + m.params.entry.text);
  });
  await page.send("Runtime.enable");
  await page.send("Log.enable");
  await page.send("Page.enable");

  const { result: skinList } = await (async () => {
    await page.send("Page.navigate", { url: base + "?debug" });
    await wait(1500);
    return page.send("Runtime.evaluate", { expression: "__game.SKINS.map(k => k.id)", returnByValue: true });
  })();
  const only = process.env.SKINS ? process.env.SKINS.split(",") : null;
  const skins = skinList.value.filter(id => !only || only.includes(id));

  let failed = 0;
  for (const id of skins) {
    errors = [];
    // a new game each time: leave the page first (it saves on unload), then wipe its storage
    await page.send("Page.navigate", { url: "about:blank" });
    await wait(300);
    await page.send("Storage.clearDataForOrigin", { origin: new URL(base).origin, storageTypes: "local_storage" });
    await page.send("Page.navigate", { url: base + "?skin=" + id + "&speed=20&debug" });
    await wait(1500);
    const r = await page.send("Runtime.evaluate", { expression: PAGE_TEST, awaitPromise: true, returnByValue: true });
    const fails = r.exceptionDetails ? ["the test itself threw: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)] : r.result.value;
    const all = fails.concat(errors);
    console.log((all.length ? "FAIL " : "ok   ") + id + all.map(f => "\n       " + f).join(""));
    if (all.length) failed++;
  }
  page.close();
  console.log(failed ? `\n${failed} of ${skins.length} settings failed` : `\nAll ${skins.length} settings passed`);
  await cleanup(failed ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
