"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ExternalLink, MapPin, Search, Shuffle, X } from "lucide-react";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  RELATIONSHIP_LABEL,
  RELATIONSHIP_SHORT,
} from "@/lib/copy";
import {
  getCountries,
  getPlaces,
  getStats,
  getWordsByPlace,
  randomWord,
  sourcesFor,
  words as allWords,
} from "@/lib/data";
import type { Confidence, RelationshipType, Word } from "@/lib/types";

const AtlasMap = dynamic(
  () => import("./AtlasMap").then((mod) => mod.AtlasMap),
  {
    ssr: false,
    loading: () => <div className="atlas-stage-skeleton" />,
  },
);

const CONFIDENCES: Confidence[] = ["well-attested", "probable", "disputed"];

export function AtlasWorkspace() {
  const stats = useMemo(() => getStats(), []);
  const countries = useMemo(() => getCountries(), []);
  const allPlaces = useMemo(() => getPlaces(), []);

  const [query, setQuery] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [relationship, setRelationship] = useState<RelationshipType | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const relationships = useMemo(() => {
    const seen = new Map<RelationshipType, number>();
    for (const word of allWords) {
      seen.set(word.relationship, (seen.get(word.relationship) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allWords.filter((word) => {
      if (confidence && word.confidence !== confidence) return false;
      if (relationship && word.relationship !== relationship) return false;
      if (!q) return true;
      return (
        word.lemma.toLowerCase().includes(q) ||
        word.place.name.toLowerCase().includes(q) ||
        word.place.country.toLowerCase().includes(q) ||
        word.hook.toLowerCase().includes(q)
      );
    });
  }, [confidence, query, relationship]);

  // Pins mirror the filters, so the map and the list never disagree.
  const places = useMemo(() => {
    const slugs = new Set(shown.map((word) => word.place.slug));
    return allPlaces.filter((place) => slugs.has(place.slug));
  }, [allPlaces, shown]);

  const selected = selectedSlug
    ? (allWords.find((word) => word.slug === selectedSlug) ?? null)
    : null;

  const flyTarget = selected
    ? {
        lng: selected.place.lng,
        lat: selected.place.lat,
        zoom: selected.place.zoom ?? 6,
      }
    : null;

  function pickPlace(placeSlug: string) {
    const here = getWordsByPlace(placeSlug);
    if (here.length > 0) setSelectedSlug(here[0].slug);
  }

  const filtersOn = Boolean(query.trim() || confidence || relationship);

  return (
    <div className="atlas-workspace">
      {/* ============================================= LEFT: browse ==== */}
      <aside className="atlas-rail atlas-rail-left" aria-label="Browse the atlas">
        <div className="atlas-rail-head">
          <h1 className="atlas-title">Geography Words</h1>
          <p className="atlas-sub">
            {stats.words} everyday English words that carry a place inside them.
            Pick a pin, or search.
          </p>

          <div className="atlas-search">
            <Search size={14} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="denim, Nîmes, France…"
              aria-label="Search words and places"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={13} />
              </button>
            ) : null}
          </div>

          <div className="atlas-filter">
            <span className="atlas-filter-label">Confidence</span>
            <div className="atlas-chips">
              {CONFIDENCES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={confidence === value ? "atlas-tag is-on" : "atlas-tag"}
                  aria-pressed={confidence === value}
                  onClick={() => setConfidence(confidence === value ? null : value)}
                >
                  {CONFIDENCE_LABEL[value]}
                </button>
              ))}
            </div>
          </div>

          <div className="atlas-filter">
            <span className="atlas-filter-label">Kind of link</span>
            <div className="atlas-chips">
              {relationships.map(([type, count]) => (
                <button
                  key={type}
                  type="button"
                  className={relationship === type ? "atlas-tag is-on" : "atlas-tag"}
                  aria-pressed={relationship === type}
                  title={RELATIONSHIP_LABEL[type]}
                  onClick={() =>
                    setRelationship(relationship === type ? null : type)
                  }
                >
                  {RELATIONSHIP_SHORT[type]}
                  <span className="atlas-tag-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="atlas-count">
            <span className="mono num">{shown.length}</span>
            <span>{shown.length === 1 ? "word" : "words"} shown</span>
            {filtersOn ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setConfidence(null);
                  setRelationship(null);
                }}
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>

        <ul className="atlas-list" aria-label="Words in the atlas">
          {shown.map((word) => (
            <li key={word.slug}>
              <button
                type="button"
                className={
                  word.slug === selectedSlug ? "atlas-item is-on" : "atlas-item"
                }
                onClick={() => setSelectedSlug(word.slug)}
              >
                <span className="atlas-item-lemma">{word.lemma}</span>
                <span className="atlas-item-place">{word.place.name}</span>
                <span
                  className="atlas-item-dot"
                  style={{ background: `var(--${toneVar(word.confidence)})` }}
                  aria-hidden
                />
              </button>
            </li>
          ))}
          {shown.length === 0 ? (
            <li className="atlas-empty">
              Nothing matches. Try <em>bikini</em>, or reset the filters.
            </li>
          ) : null}
        </ul>

        <div className="atlas-rail-foot">
          <button
            type="button"
            className="btn"
            style={{ width: "100%" }}
            onClick={() => setSelectedSlug(randomWord(selectedSlug ?? undefined).slug)}
          >
            <Shuffle size={14} /> Surprise me
          </button>
        </div>
      </aside>

      {/* ================================================ CENTER: map ==== */}
      <div className="atlas-stage">
        <AtlasMap
          places={places}
          selectedPlaceSlug={selected?.place.slug}
          flyTarget={flyTarget}
          onSelectPlace={pickPlace}
        />
      </div>

      {/* ========================================= RIGHT: inspector ==== */}
      <aside className="atlas-rail atlas-rail-right" aria-label="Entry details">
        {selected ? (
          <Inspector word={selected} onClose={() => setSelectedSlug(null)} />
        ) : (
          <Overview
            stats={stats}
            countries={countries}
            onPick={(slug) => setSelectedSlug(slug)}
          />
        )}
      </aside>
    </div>
  );
}

function toneVar(confidence: Confidence) {
  if (confidence === "well-attested") return "attested";
  if (confidence === "probable") return "probable";
  return "disputed";
}

/* ------------------------------------------------------------------ */

function Inspector({ word, onClose }: { word: Word; onClose: () => void }) {
  const sources = sourcesFor(word);
  const alsoHere = getWordsByPlace(word.place.slug).filter(
    (item) => item.slug !== word.slug,
  );
  const chain = [...word.chain].reverse();

  return (
    <>
      <div className="atlas-rail-head atlas-inspector-head">
        <div className="atlas-inspector-top">
          <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
            <span className="dot" aria-hidden />
            {CONFIDENCE_LABEL[word.confidence]}
          </span>
          <button type="button" aria-label="Close details" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <p className="atlas-inspector-lemma lemma">{word.lemma}</p>
        <p className="atlas-inspector-meta mono">
          {word.pos} · {word.attestation}
        </p>
      </div>

      <div className="atlas-scroll">
        <p className="atlas-hook">{word.hook}</p>
        <p className="atlas-def">{word.definition}</p>

        {chain.length > 0 ? (
          <div className="atlas-block">
            <span className="atlas-filter-label">How it traveled</span>
            <ol className="atlas-chain">
              {chain.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
              <li className="is-now">{word.lemma}</li>
            </ol>
          </div>
        ) : null}

        <div className="atlas-block">
          <span className="atlas-filter-label">The entry</span>
          <p className="atlas-story">{word.story}</p>
        </div>

        <div className="atlas-block">
          <span className="atlas-filter-label">Record</span>
          <dl className="atlas-record">
            <dt>Place</dt>
            <dd>
              <Link href={`/place/${word.place.slug}`}>
                <MapPin size={12} aria-hidden /> {word.place.name}
              </Link>
              {", "}
              <Link href={`/country/${word.place.countryCode.toLowerCase()}`}>
                {word.place.country}
              </Link>
            </dd>
            <dt>Coordinates</dt>
            <dd className="mono">
              {word.place.lat.toFixed(4)}°{word.place.lat >= 0 ? "N" : "S"}{" "}
              {word.place.lng.toFixed(4)}°{word.place.lng >= 0 ? "E" : "W"}
            </dd>
            <dt>Link</dt>
            <dd>{RELATIONSHIP_LABEL[word.relationship]}</dd>
            <dt>Sources</dt>
            <dd>
              {sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.publisher} <ExternalLink size={10} aria-hidden />
                </a>
              ))}
            </dd>
          </dl>
        </div>

        {alsoHere.length > 0 ? (
          <div className="atlas-block">
            <span className="atlas-filter-label">Also from {word.place.name}</span>
            <p className="atlas-also">
              {alsoHere.map((item, index) => (
                <span key={item.slug}>
                  {index > 0 ? ", " : ""}
                  <Link href={`/word/${item.slug}`}>{item.lemma}</Link>
                </span>
              ))}
            </p>
          </div>
        ) : null}
      </div>

      <div className="atlas-rail-foot">
        <Link href={`/word/${word.slug}`} className="btn btn-primary" style={{ width: "100%" }}>
          Read the full entry <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Overview({
  stats,
  countries,
  onPick,
}: {
  stats: ReturnType<typeof getStats>;
  countries: ReturnType<typeof getCountries>;
  onPick: (slug: string) => void;
}) {
  const top = countries.slice(0, 8);
  const most = top[0]?.words.length ?? 1;
  const starters = allWords.filter((word) =>
    ["denim", "bikini", "bedlam", "dollar"].includes(word.slug),
  );

  return (
    <>
      <div className="atlas-rail-head">
        <span className="atlas-filter-label">The atlas at a glance</span>
        <div className="atlas-stats">
          <div>
            <span className="atlas-stat-value num">{stats.words}</span>
            <span className="atlas-stat-label">Words</span>
          </div>
          <div>
            <span className="atlas-stat-value num">{stats.places}</span>
            <span className="atlas-stat-label">Places</span>
          </div>
          <div>
            <span className="atlas-stat-value num">{stats.countries}</span>
            <span className="atlas-stat-label">Countries</span>
          </div>
          <div>
            <span className="atlas-stat-value num">{stats.disputed}</span>
            <span className="atlas-stat-label">Unsettled</span>
          </div>
        </div>
      </div>

      <div className="atlas-scroll">
        <div className="atlas-block">
          <span className="atlas-filter-label">Start here</span>
          <ul className="atlas-starters">
            {starters.map((word) => (
              <li key={word.slug}>
                <button type="button" onClick={() => onPick(word.slug)}>
                  <span className="lemma">{word.lemma}</span>
                  <span>{word.hook}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="atlas-block">
          <span className="atlas-filter-label">Which country lent the most</span>
          <ul className="atlas-league">
            {top.map((country) => (
              <li key={country.code}>
                <Link href={`/country/${country.code.toLowerCase()}`}>
                  <span>{country.name}</span>
                  <span className="bar-bg">
                    <span
                      className="bar-fill"
                      style={{ width: `${(country.words.length / most) * 100}%` }}
                    />
                  </span>
                  <span className="mono num">{country.words.length}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/countries" className="atlas-more">
            All {stats.countries} countries <ArrowRight size={12} />
          </Link>
        </div>

        <div className="atlas-block">
          <span className="atlas-filter-label">A pin is not a claim</span>
          <p className="atlas-note">
            A pin marks the place a name is associated with. It does not mean the
            thing originated there. Every entry records how settled its etymology
            is, and links its sources.
          </p>
          <Link href="/about" className="atlas-more">
            How this atlas works <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="atlas-rail-foot">
        <Link href="/guess" className="btn btn-primary" style={{ width: "100%" }}>
          Play guess mode <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}
