import { setWorkerUrl } from "maplibre-gl";

/**
 * Point MapLibre at the worker copied into public/ by
 * scripts/copy-maplibre-worker.mjs.
 *
 * MapLibre 6 spawns a module worker to decode tiles. Bundled through Turbopack
 * it cannot resolve its own URL, and the failure is silent: the map mounts, the
 * style's background layer paints, markers project correctly, and not one
 * vector tile ever arrives.
 *
 * Every map on the page shares one worker pool, so this runs once at module
 * scope and both map components import it for the side effect.
 */
export const MAPLIBRE_WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

let configured = false;
export function configureMaplibreWorker() {
  if (configured || typeof window === "undefined") return;
  configured = true;
  setWorkerUrl(MAPLIBRE_WORKER_URL);
}

configureMaplibreWorker();
