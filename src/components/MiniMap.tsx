"use client";

import dynamic from "next/dynamic";

/**
 * maplibre-gl touches `window` at import time, so the map only ever loads in
 * the browser. This wrapper is the boundary; MiniMapView holds the map itself.
 */
export const MiniMap = dynamic(
  () => import("./MiniMapView").then((mod) => mod.MiniMapView),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100%", height: "100%", background: "var(--surface-2)" }} />
    ),
  },
);
