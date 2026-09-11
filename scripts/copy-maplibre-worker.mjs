/**
 * Copy MapLibre's worker into public/ before dev and build.
 *
 * MapLibre 6 loads its tile-decoding worker as a module worker and, in a
 * bundled app, cannot work out its own URL. Without setWorkerUrl pointing at a
 * real file the map still mounts and paints the style's background layer, but
 * no vector tile is ever decoded: a blank sphere with the markers on top.
 *
 * The worker imports ./maplibre-gl-shared.mjs relatively, so both files have
 * to land in the same directory.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const dist = path.join(
  path.dirname(require.resolve("maplibre-gl/package.json")),
  "dist",
);
const dest = path.join(process.cwd(), "public", "maplibre");

mkdirSync(dest, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(path.join(dist, file), path.join(dest, file));
  console.log(`copied ${file} -> public/maplibre/`);
}
