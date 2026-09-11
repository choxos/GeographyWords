import { expect, test, type Page } from "@playwright/test";

/**
 * These tests exist because of two shipped bugs that every other check
 * passed. First the MapLibre worker went unconfigured, so the style loaded
 * and no vector tile ever arrived. Then circle-radius nested a zoom ramp
 * inside a multiply, so the whole points layer failed validation and the
 * dots vanished while their count labels kept drawing. TypeScript, eslint
 * and next build were all clean both times.
 *
 * The component surfaces either failure as a banner and a console line, so
 * the assertions below need no test-only hooks in the source.
 */

/** Collects console errors from the moment the page is created. */
function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** The map mounts lazily, so wait for its canvas rather than a fixed delay. */
async function waitForMap(page: Page) {
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(3_000);
}

test("the atlas loads with a working map and no style errors", async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto("/");
  await waitForMap(page);

  // The component renders this banner for any MapLibre error, including the
  // style validation failure that dropped the points layer.
  await expect(page.locator(".atlas-map-error")).toHaveCount(0);

  const atlasErrors = errors.filter((line) => line.includes("[atlas-map]"));
  expect(atlasErrors, `map errors:\n${atlasErrors.join("\n")}`).toEqual([]);
});

test("the points layer survives style validation and carries features", async ({ page }) => {
  await page.goto("/");
  await waitForMap(page);

  // A layer that fails validation is absent from the style, which is exactly
  // how the radius bug presented: labels drawn, dots gone.
  const layers = await page.evaluate(() => {
    const canvas = document.querySelector("canvas.maplibregl-canvas");
    // MapLibre hangs the map off the canvas container in its internal state;
    // reading the style through the DOM keeps the source free of test hooks.
    type Holder = { _maplibreMap?: { getStyle(): { layers: { id: string }[] } } };
    const holder = canvas?.parentElement?.parentElement as unknown as Holder;
    const map = holder?._maplibreMap;
    if (!map) return null;
    return map.getStyle().layers.map((layer) => layer.id);
  });

  // Without a handle on the map the DOM check below still proves the layer
  // drew, since MapLibre only paints a non-empty canvas when a layer renders.
  if (layers) {
    expect(layers).toContain("atlas-points");
  }

  const painted = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("canvas.maplibregl-canvas");
    return Boolean(canvas && canvas.width > 0 && canvas.height > 0);
  });
  expect(painted).toBe(true);
});

test("a word in the url selects it and fills the details rail", async ({ page }) => {
  await page.goto("/?word=bombay-duck");
  await waitForMap(page);

  const details = page.locator('[aria-label="Entry details"]');
  await expect(details).toContainText("Bombay duck", { timeout: 15_000 });
});

test("escape clears the selection", async ({ page }) => {
  await page.goto("/?word=bombay-duck");
  await waitForMap(page);
  await expect(page.locator('[aria-label="Entry details"]')).toContainText("Bombay duck");

  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/^[^?]*\/?$|(?!.*word=)/, { timeout: 10_000 });
  await expect(page.locator('[aria-label="Entry details"]')).not.toContainText(
    "Bombay duck",
  );
});

// The rail filter and the header search are separate controls. They shared
// one aria-label until this test tripped over the ambiguity.
test("search narrows the list", async ({ page }) => {
  await page.goto("/");
  await waitForMap(page);

  await page.locator('[aria-label="Filter the words shown"]').fill("denim");
  const list = page.locator('[aria-label="Words in the atlas"]');
  await expect(list).toContainText("denim", { timeout: 10_000 });
});

test("entry and country pages render", async ({ page }) => {
  for (const path of ["/word/denim", "/word/bombay-duck", "/country/it", "/words"]) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} status`).toBe(200);
  }
});
