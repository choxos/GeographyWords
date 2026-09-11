import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Recolor the OpenFreeMap basemap to match the Xera palette.
 *
 * Both upstream styles are wrong for this product. The dark style paints land
 * rgb(12,12,12) against water rgb(27,27,29), which is nearly the same colour;
 * on a globe the planet reads as a hole. Positron is legible but washed out.
 * This atlas is about geography, so coastlines, borders and place names have
 * to be the most visible things on the map.
 *
 * Layer ids differ between the two styles, so every write is guarded.
 */
type Palette = {
  land: string;
  water: string;
  green: string;
  ice: string;
  building: string;
  border: string;
  borderMinor: string;
  labelMajor: string;
  labelMinor: string;
  halo: string;
};

const DARK: Palette = {
  land: "#222937",
  water: "#0E1622",
  green: "#1F3330",
  ice: "#2A3344",
  building: "#2A3344",
  border: "#5A6B85",
  borderMinor: "#38425A",
  labelMajor: "#D8DEE9",
  labelMinor: "#95A0B5",
  halo: "#10151F",
};

const LIGHT: Palette = {
  land: "#EFEFE7",
  water: "#C3D3E0",
  green: "#DDE6D5",
  ice: "#F2F5F7",
  building: "#E2E2D8",
  border: "#8A97A8",
  borderMinor: "#B9C2CE",
  labelMajor: "#2C3543",
  labelMinor: "#5D6877",
  halo: "#FFFFFF",
};

const FILLS: [string, keyof Palette][] = [
  ["water", "water"],
  ["park", "green"],
  ["landuse_park", "green"],
  ["landcover_wood", "green"],
  ["landcover_glacier", "ice"],
  ["landcover_ice_shelf", "ice"],
  ["landuse_residential", "land"],
  ["building", "building"],
];

const BORDERS: [string, keyof Palette][] = [
  ["boundary_country_z0-4", "border"],
  ["boundary_country_z5-", "border"],
  ["boundary_2", "border"],
  ["boundary_3", "borderMinor"],
  ["boundary_state", "borderMinor"],
  ["boundary_disputed", "borderMinor"],
];

/** National outlines: the ones an atlas always wants. */
const COUNTRY_BORDERS = [
  "boundary_country_z0-4",
  "boundary_country_z5-",
  "boundary_2",
];

/** State and province lines: noise at world zoom. */
const SUBNATIONAL_BORDERS = ["boundary_3", "boundary_state", "boundary_disputed"];

const MAJOR_LABELS = [
  "place_country_major", "place_country_minor", "place_country_other",
  "label_country_1", "label_country_2", "label_country_3",
];

const MINOR_LABELS = [
  "place_state", "place_city_large", "place_city", "place_town", "place_village",
  "label_state", "label_city_capital", "label_city", "label_town", "label_village",
  "water_name", "water_name_point_label",
];

export function restyleBasemap(map: MapLibreMap, dark: boolean) {
  const p = dark ? DARK : LIGHT;

  // setPaintProperty is typed against a union of every paint property, which
  // a loop over layer ids cannot satisfy statically. The guarded call below is
  // the narrowing.
  const set = map.setPaintProperty.bind(map) as (
    layer: string,
    property: string,
    value: string | number,
  ) => void;

  const paintExpression = (id: string, prop: string, value: unknown) => {
    if (map.getLayer(id)) {
      try {
        (set as unknown as (l: string, p: string, v: unknown) => void)(
          id,
          prop,
          value,
        );
      } catch {
        // As above: a renamed layer upstream is not worth breaking the map.
      }
    }
  };

  const paint = (id: string, prop: string, value: string | number) => {
    if (map.getLayer(id)) {
      try {
        set(id, prop, value);
      } catch {
        // A style can drop or rename a layer upstream; a missing one is not
        // worth breaking the map over.
      }
    }
  };

  paint("background", "background-color", p.land);
  for (const [id, key] of FILLS) paint(id, "fill-color", p[key]);
  for (const [id, key] of BORDERS) {
    paint(id, "line-color", p[key]);
  }
  // Country borders are always on. Subnational ones only once the reader has
  // zoomed past the world view, and identically in both themes: the two
  // upstream styles disagree about when to draw them, so dark showed state
  // lines over the whole globe while light showed none at all.
  for (const id of COUNTRY_BORDERS) paint(id, "line-opacity", 0.9);
  for (const id of SUBNATIONAL_BORDERS) {
    paintExpression(id, "line-opacity", [
      "interpolate",
      ["linear"],
      ["zoom"],
      3.5,
      0,
      5.5,
      0.55,
    ]);
  }
  for (const id of MAJOR_LABELS) {
    paint(id, "text-color", p.labelMajor);
    paint(id, "text-halo-color", p.halo);
    paint(id, "text-halo-width", 1.4);
  }
  for (const id of MINOR_LABELS) {
    paint(id, "text-color", p.labelMinor);
    paint(id, "text-halo-color", p.halo);
    paint(id, "text-halo-width", 1.2);
  }
}
