"use client";

import { useTheme } from "next-themes";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PlaceIndex } from "@/lib/data";
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from "@/lib/site";

type MiniMapProps = {
  lng: number;
  lat: number;
  zoom?: number;
  label?: string;
  /** Every pin in the atlas. Given these, the single place marker is dropped. */
  places?: PlaceIndex[];
};

/**
 * A still map centered on one place. Non-interactive on purpose: on an entry
 * page the map is an illustration, and the full atlas is one click away.
 */
export function MiniMapView({ lng, lat, zoom = 6, label, places }: MiniMapProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Map
      mapStyle={dark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
      initialViewState={{ longitude: lng, latitude: lat, zoom }}
      interactive={false}
      attributionControl={{ compact: true }}
      style={{ width: "100%", height: "100%" }}
    >
      {places
        ? places.map((place) => (
            <Marker
              key={place.slug}
              longitude={place.lng}
              latitude={place.lat}
              anchor="center"
            >
              <span
                aria-hidden
                style={{
                  display: "block",
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  border: "1.5px solid var(--surface)",
                  background: "var(--xera)",
                }}
              />
            </Marker>
          ))
        : (
            <Marker longitude={lng} latitude={lat} anchor="center">
              <span
                aria-label={label}
                style={{
                  display: "block",
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  border: "2px solid var(--surface)",
                  background: "var(--disputed)",
                  boxShadow:
                    "0 0 0 7px color-mix(in oklab, var(--disputed) 24%, transparent)",
                }}
              />
            </Marker>
          )}
    </Map>
  );
}
