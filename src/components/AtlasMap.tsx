"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { greatCircle, type LngLat } from "@/lib/geo";
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from "@/lib/site";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { PlaceIndex } from "@/lib/data";

export type FlyTarget = { lng: number; lat: number; zoom: number };

type AtlasMapProps = {
  places: PlaceIndex[];
  /** In guess mode the pins stay hidden until the answer is revealed. */
  hidePins?: boolean;
  selectedPlaceSlug?: string;
  flyTarget?: FlyTarget | null;
  arc?: { from: LngLat; to: LngLat } | null;
  guessPin?: LngLat | null;
  onSelectPlace?: (slug: string) => void;
  onPickPoint?: (point: LngLat) => void;
};

export function AtlasMap({
  places,
  hidePins = false,
  selectedPlaceSlug,
  flyTarget,
  arc,
  guessPin,
  onSelectPlace,
  onPickPoint,
}: AtlasMapProps) {
  const mapRef = useRef<MapRef>(null);
  const lastFlyKey = useRef("");
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const arcData = useMemo<GeoJSON.Feature | null>(() => {
    if (!arc) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: greatCircle(arc.from, arc.to),
    };
  }, [arc]);

  useEffect(() => {
    if (!ready || !flyTarget) {
      if (!flyTarget) lastFlyKey.current = "";
      return;
    }
    const key = `${flyTarget.lng},${flyTarget.lat},${flyTarget.zoom}`;
    if (key === lastFlyKey.current) return;
    lastFlyKey.current = key;
    mapRef.current?.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: flyTarget.zoom,
      duration: reducedMotion ? 0 : 1600,
      curve: 1.5,
      essential: true,
    });
  }, [flyTarget, reducedMotion, ready]);

  return (
    <Map
      ref={mapRef}
      mapStyle={dark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
      projection="globe"
      reuseMaps
      attributionControl={{ compact: true }}
      cursor={onPickPoint && !guessPin ? "crosshair" : "grab"}
      initialViewState={{ longitude: 12, latitude: 24, zoom: 1.6 }}
      minZoom={1}
      maxPitch={0}
      style={{ width: "100%", height: "100%" }}
      // Without a sky block the globe projection paints the space around the
      // sphere flat, so the planet reads as a hole rather than a globe.
      sky={
        dark
          ? {
              "sky-color": "#0B0E14",
              "horizon-color": "#1E2433",
              "fog-color": "#0B0E14",
              "sky-horizon-blend": 0.5,
              "horizon-fog-blend": 0.8,
              "atmosphere-blend": 0.6,
            }
          : {
              "sky-color": "#D8E4F0",
              "horizon-color": "#EDEFE8",
              "fog-color": "#FAFAF7",
              "sky-horizon-blend": 0.6,
              "horizon-fog-blend": 0.8,
              "atmosphere-blend": 0.5,
            }
      }
      onLoad={() => setReady(true)}
      onClick={(event) => {
        if (onPickPoint && !guessPin) {
          onPickPoint({ lng: event.lngLat.lng, lat: event.lngLat.lat });
        }
      }}
    >
      {arcData ? (
        <Source id="etymology-arc" type="geojson" data={arcData}>
          <Layer
            id="etymology-arc-line"
            type="line"
            paint={{
              "line-color": dark ? "#F87171" : "#DC2626",
              "line-width": 2,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>
      ) : null}

      {hidePins
        ? null
        : places.map((place) => {
            const active = place.slug === selectedPlaceSlug;
            return (
              <Marker
                key={place.slug}
                longitude={place.lng}
                latitude={place.lat}
                anchor="center"
              >
                <button
                  type="button"
                  aria-label={
                    place.words.length === 1
                      ? `${place.words[0].lemma}, ${place.name}`
                      : `${place.name}, ${place.words.length} words`
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectPlace?.(place.slug);
                  }}
                  style={{
                    width: active ? 16 : 11,
                    height: active ? 16 : 11,
                    borderRadius: 999,
                    border: "2px solid var(--surface)",
                    background: active ? "var(--disputed)" : "var(--xera)",
                    boxShadow: active
                      ? "0 0 0 6px color-mix(in oklab, var(--disputed) 28%, transparent)"
                      : "0 1px 3px rgba(0,0,0,0.35)",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width .15s, height .15s",
                  }}
                />
              </Marker>
            );
          })}

      {guessPin ? (
        <Marker longitude={guessPin.lng} latitude={guessPin.lat} anchor="center">
          <span
            aria-hidden
            style={{
              display: "block",
              width: 14,
              height: 14,
              borderRadius: 999,
              border: "2px solid var(--ink)",
              background: "var(--surface)",
            }}
          />
        </Marker>
      ) : null}

      <NavigationControl position="bottom-right" showCompass={false} />
    </Map>
  );
}
