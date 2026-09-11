#!/usr/bin/env node
/**
 * Record the atlas tour used in the README and on social media.
 *
 * Playwright drives the real page and records it, so the map flights in the
 * video are the ones a reader gets. Frame by frame screenshots cannot capture
 * a MapLibre animation at all.
 *
 * The tour stays on the atlas for as long as it can and moves by clicking,
 * not by navigating: a full page load drops the map, flashes white and
 * rebuilds the globe, which reads as a stutter in the middle of the video.
 *
 * Usage:
 *   npm run build && npx next start -p 3131 &
 *   node scripts/record-tour.mjs http://127.0.0.1:3131
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] ?? "http://127.0.0.1:3131";
const outDir = "documentation";
const raw = join(outDir, ".tour-raw");
const webm = join(outDir, ".tour.webm");
const mp4 = join(outDir, "tour.mp4");
const gif = join(outDir, "tour.gif");

/** Words a reader already knows, so the etymology lands without explanation. */
const FLIGHTS = [
  "sandwich", "jeans", "jersey", "marathon", "nokia",
  "tuxedo", "spa", "peach", "bikini",
];
/** Guess mode shuffles its deck, so keep reseeding until it offers one of these. */
const GUESSABLE = [
  "jersey", "champagne", "cologne", "tuxedo", "denim", "bedlam", "marathon",
  "badminton", "cashmere", "bungalow", "limousine", "mayonnaise", "hamburger",
  "tangerine", "paisley", "sardine", "spa", "suede", "rugby", "bourbon",
];

/** Where each word's pin sits, read from the dataset rather than hardcoded. */
function pinCoordinates(slugs) {
  const source = readFileSync("src/data/words.ts", "utf8");
  const found = new Map();
  for (const slug of slugs) {
    const block = new RegExp(
      `slug: "${slug}",[\\s\\S]*?place: \\{[\\s\\S]*?lat: (-?[\\d.]+),\\s*\\n\\s*lng: (-?[\\d.]+),`,
    ).exec(source);
    if (!block) throw new Error(`record-tour: no coordinates for "${slug}"`);
    const lemma = new RegExp(`slug: "${slug}",\\n\\s*lemma: "([^"]*)"`).exec(source);
    found.set(slug, {
      lat: Number(block[1]),
      lng: Number(block[2]),
      lemma: lemma ? lemma[1] : slug,
    });
  }
  return found;
}

const pins = pinCoordinates(FLIGHTS);

mkdirSync(outDir, { recursive: true });
rmSync(raw, { recursive: true, force: true });
mkdirSync(raw, { recursive: true });

const browser = await chromium.launch({ args: ["--force-device-scale-factor=1"] });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: raw, size: { width: 1280, height: 720 } },
  colorScheme: "light",
});
const page = await context.newPage();

const startedAt = Date.now();
const marks = {};
const mark = (name) => {
  marks[name] = (Date.now() - startedAt) / 1000;
};
const beat = (ms) => page.waitForTimeout(ms);

/**
 * The canvas appears long before the basemap paints. Wait for tile requests to
 * settle instead, or the video opens on a pale disc.
 */
async function mapReady() {
  await page.locator("canvas.maplibregl-canvas").first().waitFor({ state: "visible" });
  await page
    .waitForFunction(
      () => {
        const tiles = performance
          .getEntriesByType("resource")
          .filter((entry) => /tiles\.openfreemap\.org|\.pbf/.test(entry.name));
        const done = tiles.filter((entry) => entry.responseEnd > 0).length;
        const previous = Number(window.__tourTiles ?? -1);
        window.__tourTiles = done;
        return done >= 4 && done === previous;
      },
      { timeout: 12_000, polling: 600 },
    )
    .catch(() => {});
  await beat(700);
}

const search = () => page.locator('[aria-label="Filter the words shown"]');

/**
 * react-map-gl keeps the MapLibre instance in a ref rather than on the window,
 * so reach it through the React fiber on the map container. Nothing is added
 * to the app for the recorder's benefit.
 */
const MAP_HANDLE = `(() => {
  const root = document.querySelector(".maplibregl-map");
  if (!root) return null;
  const key = Object.keys(root).find((k) => k.startsWith("__reactFiber$"));
  if (!key) return null;
  const seen = new Set();
  const isMap = (v) => v && typeof v === "object"
    && typeof v.project === "function"
    && typeof v.flyTo === "function"
    && typeof v.getZoom === "function";
  const stack = [root[key]];
  let steps = 0;
  while (stack.length && steps < 20000) {
    steps += 1;
    const node = stack.pop();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    for (const field of ["stateNode", "memoizedState", "memoizedProps", "current",
                         "child", "sibling", "return", "next"]) {
      const value = node[field];
      if (isMap(value)) return value;
      if (value && typeof value === "object") stack.push(value);
    }
  }
  return null;
})()`;

/** Turn the globe so a pin is in view, without zooming in on it yet. */
async function bringIntoView(lng, lat, zoom) {
  await page.evaluate(
    ({ lng, lat, zoom, handle }) => {
      const map = eval(handle);
      if (map) map.easeTo({ center: [lng, lat], zoom, duration: 1100 });
    },
    { lng, lat, zoom, handle: MAP_HANDLE },
  );
  await beat(1000);
}

/**
 * Where a pin sits in the viewport, so the mouse can be put on it.
 *
 * map.project returns coordinates relative to the map canvas, and the map
 * sits behind the header and the browse rail. Without the container offset
 * every click lands a few hundred pixels off and nothing opens.
 */
async function screenPoint(lng, lat) {
  return page.evaluate(
    ({ lng, lat, handle }) => {
      const map = eval(handle);
      if (!map) return null;
      const point = map.project([lng, lat]);
      const box = map.getContainer().getBoundingClientRect();
      return { x: box.left + point.x, y: box.top + point.y };
    },
    { lng, lat, handle: MAP_HANDLE },
  );
}

/**
 * Bring a pin into view, hover it so its tooltip shows, then click to open
 * the entry and let the map fly in. Driving the map rather than the search
 * box is what the atlas actually feels like to use.
 */
async function flyTo(slug) {
  const { lng, lat, lemma } = pins.get(slug);
  await bringIntoView(lng, lat, 2.8);
  const point = await screenPoint(lng, lat);
  if (!point) throw new Error(`record-tour: could not project "${slug}"`);
  await page.mouse.move(point.x, point.y, { steps: 12 });
  await beat(430);
  await page.mouse.click(point.x, point.y);

  // A pin holding several words opens a picker rather than an entry: Genoa
  // carries jeans and genoise, Marathon carries marathon and -athon. Show the
  // picker, then choose the word the tour came for.
  const choice = page
    .locator(`.atlas-starters li button:has(.lemma:text-is("${lemma}"))`)
    .first();
  if (await choice.isVisible().catch(() => false)) {
    await beat(950);
    await choice.click();
  }
  await beat(1550);
}

// ------------------------------------------------------------ Warm the caches
// Recorded too, and trimmed off afterwards from mark("open").
await page.goto(`${base}/`);
await mapReady();
await page.goto(`${base}/word/dollar`);
await page.mouse.wheel(0, 560);
await mapReady();
await page.goto(`${base}/guess`);
await mapReady();

// ---------------------------------------------------------------- 1. The globe
await page.goto(`${base}/`);
await mapReady();
mark("open");
await beat(1700);

// ------------------------------- 2 to 4. Words a reader already knows, in place
mark("gifStart");
for (const [index, word] of FLIGHTS.entries()) {
  await flyTo(word);
  if (index === 1) mark("gifEnd");
}

// --------------------------------------------------------- 5. Filter by evidence
await beat(500);
// Two chip groups carry a "Disputed" control; the confidence one comes first.
await page
  .locator(".atlas-rail-left")
  .getByRole("button", { name: "Disputed", exact: true })
  .first()
  .click();
await beat(2300);

// ------------------------------------------ 6. The entry page, and its chain
await page.goto(`${base}/word/dollar`);
await page.mouse.wheel(0, 560);
await mapReady();
await beat(2600);

// ---------------------------------------------------------------- 7. Guess mode
// The deck is shuffled with Math.random, so seed it and reload until the word
// on offer is one a reader will recognize.
let offered = "";
for (let attempt = 0; attempt < 14 && !GUESSABLE.includes(offered); attempt += 1) {
  await page.addInitScript((seed) => {
    let state = seed;
    Math.random = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }, attempt * 7919 + 13);
  await page.goto(`${base}/guess`);
  await page.locator(".lemma").first().waitFor({ state: "visible" });
  offered = (await page.locator(".lemma").first().innerText()).trim().toLowerCase();
}
console.log(`record-tour: guess mode offering "${offered}"`);
await mapReady();
await beat(1800);
await page.mouse.click(520, 380);
await beat(3400);

// --------------------------------------------------------- 8. Land on the globe
await page.goto(`${base}/`);
await mapReady();
await beat(1600);
mark("end");

await context.close();
await browser.close();

const recorded = readdirSync(raw).find((f) => f.endsWith(".webm"));
if (!recorded) {
  console.error("record-tour: playwright wrote no video");
  process.exit(1);
}
renameSync(join(raw, recorded), webm);
rmSync(raw, { recursive: true, force: true });

const trim = Math.max(0, marks.open - 0.3);
console.log(
  `record-tour: trimming ${trim.toFixed(1)}s of warm-up, tour runs ` +
    `${(marks.end - marks.open).toFixed(1)}s`,
);

// No fps filter. Playwright's screencast is variable rate, and resampling it
// to a fixed 30 duplicates frames unevenly, which is visible as judder on the
// map flights. Let the encoder keep the source timing instead.
execFileSync("ffmpeg", [
  "-y", "-ss", trim.toFixed(2), "-i", webm,
  "-vf", "scale=1280:720:flags=lanczos,format=yuv420p",
  "-fps_mode", "passthrough",
  "-c:v", "libx264", "-preset", "slow", "-crf", "24",
  "-movflags", "+faststart", "-an", mp4,
], { stdio: ["ignore", "ignore", "inherit"] });

// The gif shows the three flights only: a whole tour at gif frame rates runs
// to tens of megabytes and GitHub will not play it smoothly.
const gifFrom = Math.max(0, marks.gifStart - marks.open);
const gifLen = Math.min(11, marks.gifEnd - marks.gifStart);
const palette = join(outDir, ".palette.png");
const gifFilter = "fps=10,scale=640:-1:flags=lanczos";
execFileSync("ffmpeg", [
  "-y", "-ss", gifFrom.toFixed(2), "-t", gifLen.toFixed(2), "-i", mp4,
  "-vf", `${gifFilter},palettegen=stats_mode=diff:max_colors=128`, palette,
], { stdio: ["ignore", "ignore", "inherit"] });
execFileSync("ffmpeg", [
  "-y", "-ss", gifFrom.toFixed(2), "-t", gifLen.toFixed(2), "-i", mp4, "-i", palette,
  "-lavfi", `${gifFilter}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4`, gif,
], { stdio: ["ignore", "ignore", "inherit"] });
rmSync(palette, { force: true });

const mb = (p) => (statSync(p).size / 1e6).toFixed(1);
console.log(`record-tour: tour.mp4 ${mb(mp4)} MB, tour.gif ${mb(gif)} MB (${gifLen.toFixed(1)}s)`);
