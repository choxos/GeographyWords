"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search, Shuffle, X } from "lucide-react";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  RELATIONSHIP_SHORT,
} from "@/lib/copy";
import { getPlaces, randomWord, words as allWords } from "@/lib/data";
import type { Confidence, Word } from "@/lib/types";

const AtlasMap = dynamic(
  () => import("./AtlasMap").then((mod) => mod.AtlasMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100%", height: "100%", background: "var(--surface-2)" }} />
    ),
  },
);

const CONFIDENCES: Confidence[] = ["well-attested", "probable", "disputed"];

export function MapExplorer() {
  const [query, setQuery] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(true);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allWords.filter((word) => {
      if (confidence && word.confidence !== confidence) return false;
      if (!q) return true;
      return (
        word.lemma.toLowerCase().includes(q) ||
        word.place.name.toLowerCase().includes(q) ||
        word.place.country.toLowerCase().includes(q)
      );
    });
  }, [confidence, query]);

  // Pins follow the filters, so the map and the rail always agree.
  const places = useMemo(() => {
    const slugs = new Set(shown.map((word) => word.place.slug));
    return getPlaces().filter((place) => slugs.has(place.slug));
  }, [shown]);

  const selectedWords = selected
    ? shown.filter((word) => word.place.slug === selected)
    : [];

  const flyTarget = useMemo(() => {
    const place = selected
      ? places.find((item) => item.slug === selected)
      : undefined;
    if (!place) return null;
    return { lng: place.lng, lat: place.lat, zoom: place.zoom ?? 6 };
  }, [places, selected]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <AtlasMap
        places={places}
        selectedPlaceSlug={selected ?? undefined}
        flyTarget={flyTarget}
        onSelectPlace={(slug) => {
          setSelected(slug);
          setRailOpen(true);
        }}
      />

      {/* ------------------------------------------------- Filter panel */}
      <div className="card map-panel">
        <div className="flex items-center gap-2 px-3" style={{ height: 44 }}>
          <Search size={15} aria-hidden style={{ color: "var(--ink-4)" }} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the atlas…"
            aria-label="Search the atlas"
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              background: "transparent",
              outline: "none",
              fontSize: 13.5,
            }}
          />
          <span className="mono num" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            {shown.length}
          </span>
        </div>

        <div
          className="flex flex-wrap gap-1.5 px-3 py-2.5"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            type="button"
            className={confidence ? "btn" : "btn btn-primary"}
            style={{ padding: "4px 9px", fontSize: 12 }}
            onClick={() => setConfidence(null)}
          >
            All
          </button>
          {CONFIDENCES.map((value) => (
            <button
              key={value}
              type="button"
              className={confidence === value ? "btn btn-primary" : "btn"}
              style={{ padding: "4px 9px", fontSize: 12 }}
              aria-pressed={confidence === value}
              onClick={() => setConfidence(confidence === value ? null : value)}
            >
              {CONFIDENCE_LABEL[value]}
            </button>
          ))}
        </div>

        {query.trim() && shown.length > 0 ? (
          <div
            style={{ borderTop: "1px solid var(--border)", maxHeight: 260, overflowY: "auto" }}
          >
            {shown.slice(0, 30).map((word) => (
              <button
                key={word.slug}
                type="button"
                className="w-full text-left flex items-baseline justify-between gap-3 px-3 py-2"
                style={{ borderBottom: "1px solid var(--border)" }}
                onClick={() => {
                  setSelected(word.place.slug);
                  setRailOpen(true);
                }}
              >
                <span className="serif" style={{ fontSize: 17 }}>
                  {word.lemma}
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
                  {word.place.name}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* --------------------------------------------------- Detail rail */}
      {selected && railOpen && selectedWords.length > 0 ? (
        <aside className="card map-rail">
          <div className="card-head" style={{ alignItems: "flex-start" }}>
            <div>
              <span className="h-eyebrow">
                {selectedWords[0].place.country} ·{" "}
                {selectedWords.length === 1 ? "1 word" : `${selectedWords.length} words`}
              </span>
              <h2
                className="serif font-normal m-0 mt-1"
                style={{ fontSize: 28, letterSpacing: "-0.02em" }}
              >
                {selectedWords[0].place.name}
              </h2>
              <p className="mono m-0 mt-1.5" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
                {selectedWords[0].place.lat.toFixed(3)}°{" "}
                {selectedWords[0].place.lng.toFixed(3)}°
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: 6 }}
              aria-label="Close place details"
              onClick={() => setRailOpen(false)}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {selectedWords.map((word) => (
              <WordRow key={word.slug} word={word} />
            ))}
          </div>

          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Link href={`/place/${selectedWords[0].place.slug}`} className="btn">
              Place page <ArrowRight size={13} />
            </Link>
            <Link
              href={`/country/${selectedWords[0].place.countryCode.toLowerCase()}`}
              className="btn btn-ghost"
            >
              {selectedWords[0].place.country}
            </Link>
          </div>
        </aside>
      ) : null}

      {/* ------------------------------------------------------ Shuffle */}
      <div className="hidden md:block" style={{ position: "absolute", left: 16, bottom: 16, zIndex: 2 }}>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const word = randomWord();
            setQuery("");
            setConfidence(null);
            setSelected(word.place.slug);
            setRailOpen(true);
          }}
        >
          <Shuffle size={14} /> Surprise me
        </button>
      </div>
    </div>
  );
}

function WordRow({ word }: { word: Word }) {
  return (
    <Link href={`/word/${word.slug}`} className="entry-row" style={{ padding: 16 }}>
      <div className="flex items-start justify-between gap-3">
        <span className="lemma" style={{ fontSize: 26, lineHeight: 1.1 }}>
          {word.lemma}
        </span>
        <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
          <span className="dot" aria-hidden />
          {CONFIDENCE_LABEL[word.confidence]}
        </span>
      </div>
      <p className="m-0 mt-2" style={{ fontSize: 13.5, color: "var(--ink-2)" }}>
        {word.hook}
      </p>
      <p
        className="mono m-0 mt-2"
        style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-4)" }}
      >
        {word.pos} · {word.attestation} · {RELATIONSHIP_SHORT[word.relationship]}
      </p>
    </Link>
  );
}
