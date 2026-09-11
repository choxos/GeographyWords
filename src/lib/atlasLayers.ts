/**
 * Layer paint and layout live here rather than inline in the component so
 * scripts/validate-layers.mjs can run them through the MapLibre style spec.
 * A bad expression is invisible to TypeScript and to next build: it fails
 * only at runtime, as a style error that leaves the layer missing from the
 * map while everything around it still renders.
 */

import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  FilterSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";

export const POINTS = "atlas-points";
export const POINT_COUNT = "atlas-point-count";
export const SELECTED = "atlas-selected";
export const ARC = "etymology-arc-line";

/** Places holding several words are drawn wider, to carry their count. */
function byWordCount(many: number, one: number): ExpressionSpecification {
  return ["case", [">", ["get", "count"], 1], many, one];
}

export const MULTI_WORD_FILTER: FilterSpecification = [">", ["get", "count"], 1];

/**
 * Small enough at world zoom that dense regions stay readable as separate
 * dots, larger once there is room. The zoom ramp has to be the top-level
 * expression, since MapLibre rejects ["zoom"] nested inside anything else,
 * so the widening happens inside each stop rather than as an outer multiply.
 */
export function pointsPaint(
  accent: string,
  surface: string,
): CircleLayerSpecification["paint"] {
  return {
    "circle-color": accent,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": surface,
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      1,
      byWordCount(6.1, 3.2),
      3,
      byWordCount(8.6, 4.5),
      6,
      byWordCount(11.4, 6),
    ],
  };
}

/** The selected ring has to stay clear of the widest dot underneath it. */
export function selectedPaint(
  hot: string,
  surface: string,
): CircleLayerSpecification["paint"] {
  return {
    "circle-color": hot,
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      1,
      byWordCount(9.5, 7),
      3,
      byWordCount(12, 8),
      6,
      byWordCount(14.8, 9.5),
    ],
    "circle-stroke-width": 3,
    "circle-stroke-color": surface,
  };
}

export const countLayout: SymbolLayerSpecification["layout"] = {
  "text-field": ["to-string", ["get", "count"]],
  "text-font": ["Noto Sans Regular"],
  "text-size": 10,
  "text-allow-overlap": true,
  "text-ignore-placement": true,
};

export function arcPaint(hot: string): LineLayerSpecification["paint"] {
  return {
    "line-color": hot,
    "line-width": 2,
    "line-dasharray": [2, 2],
  };
}
