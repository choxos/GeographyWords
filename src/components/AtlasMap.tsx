"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// Side effect: points MapLibre at the worker in public/.
import "@/lib/maplibreWorker";
import { restyleBasemap } from "@/lib/basemapTheme";
import { greatCircle, type LngLat } from "@/lib/geo";
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from "@/lib/site";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { PlaceIndex } from "@/lib/data";

export type FlyTarget = { lng: number; lat: number; zoom: number };

/** A box to frame, used when a filter narrows the atlas to a few places. */
export type FitTarget = { west: number; south: number; east: number; north: number };

type AtlasMapProps = {
  places: PlaceIndex[];
  /** In guess mode the pins stay hidden until the answer is revealed. */
  hidePins?: boolean;
  selectedPlaceSlug?: string;
  flyTarget?: FlyTarget | null;
  fitTarget?: FitTarget | null;
  arc?: { from: LngLat; to: LngLat } | null;
  guessPin?: LngLat | null;
  onSelectPlace?: (slug: string) => void;
  onPickPoint?: (point: LngLat) => void;
};

const SOURCE = "atlas-places";
const CLUSTERS = "atlas-clusters";
const CLUSTER_COUNT = "atlas-cluster-count";
const POINTS = "atlas-points";
const SELECTED = "atlas-selected";
const INTERACTIVE = [CLUSTERS, POINTS];

type Hover = { lng: number; lat: number; label: string; place: string } | null;

export function AtlasMap({
  places,
  hidePins = false,
  selectedPlaceSlug,
  flyTarget,
  fitTarget,
  arc,
  guessPin,
  onSelectPlace,
  onPickPoint,
}: AtlasMapProps) {
  const mapRef = useRef<MapRef>(null);
  const lastFlyKey = useRef("");
  const lastFitKey = useRef("");
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [vectorTiles, setVectorTiles] = useState(0);
  const [hover, setHover] = useState<Hover>(null);
  const reducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  /**
   * Pins are a clustered GeoJSON source rather than DOM markers. At 200-plus
   * places the markers piled into an unreadable heap over Europe, and every
   * pan had to re-lay-out that many React nodes.
   */
  const pins = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: places.map((place) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
        properties: {
          slug: place.slug,
          place: `${place.name}, ${place.country}`,
          label: place.words.map((word) => word.lemma).join(", "),
        },
      })),
    }),
    [places],
  );

  const arcData = useMemo<GeoJSON.Feature | null>(() => {
    if (!arc) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: greatCircle(arc.from, arc.to),
    };
  }, [arc]);

  // Recolour on every style load. Switching theme swaps the whole style, so
  // this has to run again each time rather than only once at mount.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const apply = () => restyleBasemap(map, dark);
    if (map.isStyleLoaded()) apply();
    map.on("styledata", apply);
    return () => {
      map.off("styledata", apply);
    };
  }, [dark, ready]);

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

  /**
   * Frame the filtered places. A search that matches three pins should not
   * leave the reader looking at the whole planet. A selected word takes
   * precedence, since flying to it is the more specific intent.
   */
  useEffect(() => {
    if (!ready || flyTarget || !fitTarget) {
      if (!fitTarget) lastFitKey.current = "";
      return;
    }
    const key = `${fitTarget.west},${fitTarget.south},${fitTarget.east},${fitTarget.north}`;
    if (key === lastFitKey.current) return;
    lastFitKey.current = key;
    mapRef.current?.fitBounds(
      [
        [fitTarget.west, fitTarget.south],
        [fitTarget.east, fitTarget.north],
      ],
      {
        padding: 96,
        maxZoom: 7,
        duration: reducedMotion ? 0 : 1200,
      },
    );
  }, [fitTarget, flyTarget, reducedMotion, ready]);

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (onPickPoint && !guessPin) {
        onPickPoint({ lng: event.lngLat.lng, lat: event.lngLat.lat });
        return;
      }
      const feature = event.features?.[0];
      if (!feature) return;

      // A cluster zooms to where it splits; a single pin opens its place.
      if (feature.properties?.cluster) {
        const map = mapRef.current?.getMap();
        const source = map?.getSource(SOURCE) as GeoJSONSource | undefined;
        const clusterId = feature.properties.cluster_id as number;
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
        void Promise.resolve(source?.getClusterExpansionZoom(clusterId))
          .then((zoom) => {
            if (!map) return;
            map.easeTo({
              center: [lng, lat],
              zoom: zoom ?? map.getZoom() + 2,
              duration: reducedMotion ? 0 : 600,
            });
          })
          .catch(() => {});
        return;
      }

      const slug = feature.properties?.slug as string | undefined;
      if (slug) onSelectPlace?.(slug);
    },
    [guessPin, onPickPoint, onSelectPlace, reducedMotion],
  );

  const handleMouseMove = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || feature.properties?.cluster) {
      setHover(null);
      return;
    }
    setHover({
      lng: event.lngLat.lng,
      lat: event.lngLat.lat,
      label: String(feature.properties?.label ?? ""),
      place: String(feature.properties?.place ?? ""),
    });
  }, []);

  const accent = dark ? "#5B7FFF" : "#0F47F7";
  const hot = dark ? "#F87171" : "#DC2626";
  const surface = dark ? "#11151E" : "#FFFFFF";

  return (
    <Map
      ref={mapRef}
      mapStyle={dark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
      projection="globe"
      attributionControl={{ compact: true }}
      cursor={onPickPoint && !guessPin ? "crosshair" : hover ? "pointer" : "grab"}
      initialViewState={{ longitude: 12, latitude: 24, zoom: 1.6 }}
      minZoom={1}
      interactiveLayerIds={hidePins ? [] : INTERACTIVE}
      style={{ width: "100%", height: "100%" }}
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
      onLoad={(event) => {
        restyleBasemap(event.target, dark);
        setReady(true);
      }}
      onError={(event) => {
        const message = event.error?.message ?? String(event.error ?? "unknown");
        console.error("[atlas-map]", message, event.error);
        setMapError(message);
      }}
      onSourceData={(event) => {
        // openmaptiles is the vector source every OpenFreeMap style draws its
        // land, water, boundaries and labels from. If it never reports a
        // loaded tile, there is no basemap however healthy the rest looks.
        if (event.sourceId === "openmaptiles" && event.isSourceLoaded) {
          setVectorTiles((count) => count + 1);
        }
      }}
      onClick={handleClick}
      onMouseMove={hidePins ? undefined : handleMouseMove}
      onMouseOut={() => setHover(null)}
    >
      {arcData ? (
        <Source id="etymology-arc" type="geojson" data={arcData}>
          <Layer
            id="etymology-arc-line"
            type="line"
            paint={{
              "line-color": hot,
              "line-width": 2,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>
      ) : null}

      {hidePins ? null : (
        <Source
          id={SOURCE}
          type="geojson"
          data={pins}
          cluster
          clusterRadius={42}
          clusterMaxZoom={6}
        >
          <Layer
            id={CLUSTERS}
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": accent,
              "circle-opacity": 0.92,
              "circle-stroke-width": 2,
              "circle-stroke-color": surface,
              "circle-radius": [
                "step",
                ["get", "point_count"],
                13,
                5,
                17,
                15,
                22,
                40,
                28,
              ],
            }}
          />
          <Layer
            id={CLUSTER_COUNT}
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Noto Sans Regular"],
              "text-size": 12,
              "text-allow-overlap": true,
            }}
            paint={{ "text-color": "#FFFFFF" }}
          />
          <Layer
            id={POINTS}
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": accent,
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": surface,
            }}
          />
          {selectedPlaceSlug ? (
            <Layer
              id={SELECTED}
              type="circle"
              filter={["==", ["get", "slug"], selectedPlaceSlug]}
              paint={{
                "circle-color": hot,
                "circle-radius": 9,
                "circle-stroke-width": 3,
                "circle-stroke-color": surface,
              }}
            />
          ) : null}
        </Source>
      )}

      {hover ? (
        <Popup
          longitude={hover.lng}
          latitude={hover.lat}
          closeButton={false}
          closeOnClick={false}
          offset={14}
          className="atlas-popup"
        >
          <span className="atlas-pin-tip-word">{hover.label}</span>
          <span className="atlas-pin-tip-place">{hover.place}</span>
        </Popup>
      ) : null}

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

      {mapError ? (
        <div className="atlas-map-error" role="status">
          <strong>Map source error</strong>
          <span>{mapError}</span>
        </div>
      ) : null}

      {ready && vectorTiles === 0 && !mapError ? (
        <div className="atlas-map-error" role="status">
          <strong>No basemap</strong>
          <span>
            The style loaded but its vector source never delivered a tile. Check
            that /maplibre/maplibre-gl-worker.mjs is being served.
          </span>
        </div>
      ) : null}
    </Map>
  );
}
