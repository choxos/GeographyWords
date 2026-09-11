export const SITE_NAME = "Geography Words";
export const SITE_TAGLINE = "Everyday English, pinned to the map";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** OpenFreeMap vector styles, one per theme. Both need OSM attribution. */
export const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
export const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";
