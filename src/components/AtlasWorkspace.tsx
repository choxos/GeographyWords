"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Search,
  Shuffle,
  X,
} from "lucide-react";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  REGISTER_LABEL,
  REGISTER_NOTE,
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

type MobilePanel = "browse" | "map" | "details";

const MOBILE_PANELS: { id: MobilePanel; label: string }[] = [
  { id: "browse", label: "Browse" },
  { id: "map", label: "Map" },
  { id: "details", label: "Details" },
];

export function AtlasWorkspace() {
  const stats = useMemo(() => getStats(), []);
  const countries = useMemo(() => getCountries(), []);
  const allPlaces = useMemo(() => getPlaces(), []);

  // Atlas state lives in the URL so a view can be refreshed, navigated back
  // to, and shared. Everything below reads from searchParams and writes with
  // replace(), which keeps the history stack usable.
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const query = params.get("q") ?? "";
  const confidence = (params.get("confidence") as Confidence | null) ?? null;
  const relationship = (params.get("link") as RelationshipType | null) ?? null;
  const selectedSlug = params.get("word");

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const setQuery = (value: string) => setParams({ q: value || null });
  const setConfidence = (value: Confidence | null) => setParams({ confidence: value });
  const setRelationship = (value: RelationshipType | null) => setParams({ link: value });
  const setSelectedSlug = (value: string | null) => setParams({ word: value });
  const [placeSlug, setPlaceSlug] = useState<string | null>(null);

  // Below 640px the three rails become tabs: stacking them made the reader
  // scroll past the whole word list to reach the map. Above that width the
  // tab bar is hidden and every panel shows, so this value is ignored.
  const [panel, setPanel] = useState<MobilePanel>("map");

  // Both rails start closed so the map opens at full width, which is what the
  // page is for. The details rail opens by itself when a pin is chosen, since
  // choosing a pin is a request to read about it.
  const [browseOpen, setBrowseOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // A shared link carries ?word=, so the rail has to be open on arrival.
  useEffect(() => {
    if (selectedSlug) setDetailsOpen(true);
  }, [selectedSlug]);

  const clearSelection = useCallback(() => {
    setPlaceSlug(null);
    setDetailsOpen(false);
    setParams({ word: null });
  }, [setParams]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") clearSelection();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [clearSelection]);

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

  const selected = selectedSlug
    ? (allWords.find((word) => word.slug === selectedSlug) ?? null)
    : null;

  // Pins mirror the filters, so the map and the list never disagree. The
  // selected word's pin is kept regardless: filtering it away while its entry
  // fills the inspector left the two panels contradicting each other.
  const places = useMemo(() => {
    const slugs = new Set(shown.map((word) => word.place.slug));
    if (selected) slugs.add(selected.place.slug);
    return allPlaces.filter((place) => slugs.has(place.slug));
  }, [allPlaces, shown, selected]);

  // Words at the selected pin, so a place holding several offers all of them
  // instead of the inspector arbitrarily showing the first.
  const atPlace = placeSlug ? getWordsByPlace(placeSlug) : [];

  const flyTarget = selected
    ? {
        lng: selected.place.lng,
        lat: selected.place.lat,
        zoom: selected.place.zoom ?? 6,
      }
    : null;

  const filtersOn = Boolean(query.trim() || confidence || relationship);

  // With filters narrowing the atlas, frame what is left rather than leaving
  // the reader on the whole globe. Only while nothing specific is selected.
  const fitTarget = useMemo(() => {
    if (selected || !filtersOn || places.length === 0) return null;
    const lngs = places.map((place) => place.lng);
    const lats = places.map((place) => place.lat);
    return {
      west: Math.min(...lngs),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      north: Math.max(...lats),
    };
  }, [filtersOn, places, selected]);

  function pickPlace(slug: string) {
    const here = getWordsByPlace(slug);
    if (here.length === 0) return;
    setPlaceSlug(slug);
    // One word at the pin opens straight away; several are offered first.
    setSelectedSlug(here.length === 1 ? here[0].slug : null);
    setPanel("details");
    setDetailsOpen(true);
  }

  /** Selecting a word from the list or the map moves a phone to the entry. */
  function openWord(slug: string | null) {
    setPlaceSlug(null);
    setSelectedSlug(slug);
    setPanel(slug ? "details" : "browse");
    setDetailsOpen(Boolean(slug));
  }


  return (
    <div
      className="atlas-workspace"
      data-panel={panel}
      data-browse={browseOpen ? "open" : "closed"}
      data-details={detailsOpen ? "open" : "closed"}
    >
      <nav className="atlas-tabs" aria-label="Atlas sections">
        {MOBILE_PANELS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="atlas-tab"
            aria-current={panel === item.id ? "page" : undefined}
            onClick={() => setPanel(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ============================================= LEFT: browse ==== */}
      <aside
        id="atlas-browse"
        className="atlas-rail atlas-rail-left"
        aria-label="Browse the atlas"
        aria-hidden={!browseOpen}
      >
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
              aria-label="Filter the words shown"
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
                onClick={() => {
                  openWord(word.slug);
                }}
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
            onClick={() => {
              openWord(randomWord(selectedSlug ?? undefined).slug);
            }}
          >
            <Shuffle size={14} /> Surprise me
          </button>
        </div>
      </aside>

      {/* ================================================ CENTER: map ==== */}
      <div className="atlas-stage">
        <button
          type="button"
          className="atlas-handle atlas-handle-left"
          aria-expanded={browseOpen}
          aria-controls="atlas-browse"
          onClick={() => setBrowseOpen((open) => !open)}
        >
          {browseOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          <span>Browse</span>
        </button>

        <button
          type="button"
          className="atlas-handle atlas-handle-right"
          aria-expanded={detailsOpen}
          aria-controls="atlas-details"
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <span>{selected ? selected.lemma : "Details"}</span>
          {detailsOpen ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>

        <AtlasMap
          places={places}
          selectedPlaceSlug={selected?.place.slug}
          flyTarget={flyTarget}
          fitTarget={fitTarget}
          onSelectPlace={pickPlace}
          onClearSelection={clearSelection}
        />
      </div>

      {/* ========================================= RIGHT: inspector ==== */}
      <aside
        id="atlas-details"
        className="atlas-rail atlas-rail-right"
        aria-label="Entry details"
        aria-hidden={!detailsOpen}
      >
        {selected ? (
          <Inspector
            word={selected}
            onClose={() => {
              setSelectedSlug(null);
              setPlaceSlug(null);
            }}
          />
        ) : atPlace.length > 1 ? (
          <PlacePicker
            words={atPlace}
            onPick={(slug) => openWord(slug)}
            onClose={() => setPlaceSlug(null)}
          />
        ) : (
          <Overview
            stats={stats}
            countries={countries}
            onPick={(slug) => {
              openWord(slug);
            }}
          />
        )}
      </aside>
    </div>
  );
}

/**
 * Loads the story module once, then reads each entry out of it. The import
 * resolves to the same module instance on every call, so only the first
 * selection pays for the fetch.
 */
function useStory(slug: string) {
  const [stories, setStories] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let live = true;
    import("@/data/stories").then((module) => {
      if (live) setStories(module.STORIES);
    });
    return () => {
      live = false;
    };
  }, []);

  return stories?.[slug] ?? "";
}

/** Places that span several countries link to the atlas rather than nowhere. */
function countryPath(code: string | undefined) {
  return code ? `/country/${code.toLowerCase()}` : "/countries";
}

function toneVar(confidence: Confidence) {
  if (confidence === "well-attested") return "attested";
  if (confidence === "probable") return "probable";
  return "disputed";
}

/* ------------------------------------------------------------------ */

function Inspector({ word, onClose }: { word: Word; onClose: () => void }) {
  const sources = sourcesFor(word);
  // Stories are a quarter of the dataset and only the open entry shows one,
  // so they are fetched on first selection rather than shipped with the map.
  const story = useStory(word.slug);
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
          {word.register ? (
            <span className="chip chip-register" title={REGISTER_NOTE[word.register]}>
              {REGISTER_LABEL[word.register]}
            </span>
          ) : null}
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
          <p className="atlas-story">{story}</p>
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
              <Link href={countryPath(word.place.countryCode)}>
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

/* ------------------------------------------------------------------ */

function PlacePicker({
  words,
  onPick,
  onClose,
}: {
  words: Word[];
  onPick: (slug: string) => void;
  onClose: () => void;
}) {
  const place = words[0].place;
  return (
    <>
      <div className="atlas-rail-head">
        <div className="atlas-inspector-top">
          <span className="atlas-filter-label" style={{ margin: 0 }}>
            {words.length} words pinned here
          </span>
          <button type="button" aria-label="Close place" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <p className="atlas-inspector-lemma lemma" style={{ fontSize: 30 }}>
          {place.name}
        </p>
        <p className="atlas-inspector-meta mono">{place.country}</p>
      </div>

      <div className="atlas-scroll">
        <ul className="atlas-starters" style={{ padding: "0 18px" }}>
          {words.map((word) => (
            <li key={word.slug}>
              <button type="button" onClick={() => onPick(word.slug)}>
                <span className="lemma">{word.lemma}</span>
                <span>{word.hook}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="atlas-rail-foot">
        <Link href={`/place/${place.slug}`} className="btn" style={{ width: "100%" }}>
          Open the place page <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}
