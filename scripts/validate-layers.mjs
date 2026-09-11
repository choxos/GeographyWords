#!/usr/bin/env node
/**
 * Runs every atlas layer through the MapLibre style spec.
 *
 * This exists because of a shipped bug: circle-radius multiplied a zoom
 * interpolation by a per-feature case, which nests ["zoom"] inside another
 * expression. TypeScript accepted it, next build accepted it, and MapLibre
 * rejected it at runtime, so the dots vanished while their labels stayed.
 * createExpression on its own does not catch it either; the rule is enforced
 * only when the expression is validated as a layer property.
 */
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import {
  ARC,
  MULTI_WORD_FILTER,
  POINTS,
  POINT_COUNT,
  SELECTED,
  arcPaint,
  countLayout,
  pointsPaint,
  selectedPaint,
} from "../src/lib/atlasLayers.ts";

const style = {
  version: 8,
  glyphs: "https://example.invalid/{fontstack}/{range}.pbf",
  sources: {
    "atlas-places": { type: "geojson", data: { type: "FeatureCollection", features: [] } },
    "etymology-arc": { type: "geojson", data: { type: "FeatureCollection", features: [] } },
  },
  layers: [
    { id: POINTS, type: "circle", source: "atlas-places", paint: pointsPaint("#0F47F7", "#FFFFFF") },
    {
      id: POINT_COUNT,
      type: "symbol",
      source: "atlas-places",
      filter: MULTI_WORD_FILTER,
      layout: countLayout,
      paint: { "text-color": "#FFFFFF" },
    },
    {
      id: SELECTED,
      type: "circle",
      source: "atlas-places",
      filter: ["==", ["get", "slug"], "istanbul"],
      paint: selectedPaint("#DC2626", "#FFFFFF"),
    },
    { id: ARC, type: "line", source: "etymology-arc", paint: arcPaint("#DC2626") },
  ],
};

const errors = validateStyleMin(style);
if (errors.length > 0) {
  for (const error of errors) console.error(`  ${error.message}`);
  console.error(`\nvalidate-layers: ${errors.length} style error(s)`);
  process.exit(1);
}
console.log(`validate-layers: ${style.layers.length} layers valid`);
