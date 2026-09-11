export const SITE_NAME = "Geography Words";
export const SITE_TAGLINE = "Everyday English, pinned to the map";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** OpenFreeMap vector styles, one per theme. Both need OSM attribution. */
export const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/positron";
export const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

/**
 * Setting openGraph on a page replaces the root's block whole rather than
 * merging into it, so a page that names its own title silently drops
 * og:site_name and og:type. Every page spreads this in to keep them.
 */
export const openGraphBase = {
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "en_US",
};
