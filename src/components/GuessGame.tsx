"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { CONFIDENCE_LABEL, CONFIDENCE_TONE } from "@/lib/copy";
import { getPlaces, words as allWords } from "@/lib/data";
import { formatKm, haversineKm, type LngLat } from "@/lib/geo";
import type { Word } from "@/lib/types";

const AtlasMap = dynamic(
  () => import("./AtlasMap").then((mod) => mod.AtlasMap),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100%", height: "100%", background: "var(--surface-2)" }} />
    ),
  },
);

function shuffle(list: Word[]): Word[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Distance bands, loose enough to feel fair on a world map. */
function verdict(km: number) {
  if (km < 100) return { label: "Bullseye", tone: "chip-attested" };
  if (km < 500) return { label: "Close", tone: "chip-attested" };
  if (km < 2000) return { label: "In the region", tone: "chip-probable" };
  return { label: "Way off", tone: "chip-disputed" };
}

export function GuessGame() {
  const places = useMemo(() => getPlaces(), []);
  const [deck, setDeck] = useState(() => shuffle(allWords));
  const [round, setRound] = useState(1);
  const [pin, setPin] = useState<LngLat | null>(null);
  const [distances, setDistances] = useState<number[]>([]);

  const word = deck[0];
  const revealed = Boolean(word && pin);
  const distanceKm =
    word && pin
      ? haversineKm(pin, { lng: word.place.lng, lat: word.place.lat })
      : undefined;

  const best = distances.length ? Math.min(...distances) : null;
  const average = distances.length
    ? distances.reduce((sum, value) => sum + value, 0) / distances.length
    : null;

  function onPick(point: LngLat) {
    if (!word || pin) return;
    setPin(point);
    setDistances((current) => [
      ...current,
      haversineKm(point, { lng: word.place.lng, lat: word.place.lat }),
    ]);
  }

  function nextWord() {
    setPin(null);
    setRound((value) => value + 1);
    setDeck((current) => {
      const rest = current.slice(1);
      return rest.length > 0 ? rest : shuffle(allWords);
    });
  }

  function restart() {
    setDeck(shuffle(allWords));
    setRound(1);
    setPin(null);
    setDistances([]);
  }

  if (!word) return null;

  const band = distanceKm !== undefined ? verdict(distanceKm) : null;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <AtlasMap
        places={places}
        hidePins={!revealed}
        selectedPlaceSlug={revealed ? word.place.slug : undefined}
        flyTarget={
          revealed
            ? { lng: word.place.lng, lat: word.place.lat, zoom: word.place.zoom ?? 5 }
            : null
        }
        arc={
          revealed && pin
            ? { from: pin, to: { lng: word.place.lng, lat: word.place.lat } }
            : null
        }
        guessPin={pin}
        onPickPoint={onPick}
      />

      {/* --------------------------------------------------- Score strip */}
      <div className="card map-strip">
        <Stat label="Round" value={String(round)} />
        <span className="w-px h-4" style={{ background: "var(--border)" }} aria-hidden />
        <Stat label="Best" value={best === null ? "--" : formatKm(best)} />
        <span className="w-px h-4" style={{ background: "var(--border)" }} aria-hidden />
        <Stat label="Average" value={average === null ? "--" : formatKm(average)} />
        {distances.length > 0 ? (
          <>
            <span className="w-px h-4" style={{ background: "var(--border)" }} aria-hidden />
            <button type="button" className="btn btn-ghost" style={{ padding: 6 }} onClick={restart} aria-label="Start over">
              <RotateCcw size={14} />
            </button>
          </>
        ) : null}
      </div>

      {/* ---------------------------------------------------- Prompt card */}
      <aside className="card map-sheet" aria-live="polite">
        <div
          className="flex items-center justify-between gap-3 px-5 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
        >
          <span className="h-eyebrow">{revealed ? "Revealed" : "Guess the place"}</span>
          {revealed ? (
            <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
              <span className="dot" aria-hidden />
              {CONFIDENCE_LABEL[word.confidence]}
            </span>
          ) : (
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
              {word.pos}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 20 }}>
          <p className="lemma m-0" style={{ fontSize: 44, lineHeight: 1 }}>
            {word.lemma}
          </p>

          <p className="m-0 mt-3" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
            {word.definition}
          </p>

          {revealed && distanceKm !== undefined && band ? (
            <>
              <div
                className="flex items-center gap-3 mt-5 pt-4"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className={`chip ${band.tone}`}>
                  <span className="dot" aria-hidden />
                  {band.label}
                </span>
                <span className="mono num" style={{ fontSize: 14, color: "var(--ink)" }}>
                  {formatKm(distanceKm)} off
                </span>
              </div>

              <p className="serif m-0 mt-4" style={{ fontSize: 24, letterSpacing: "-0.015em" }}>
                {word.place.name}
                <span style={{ color: "var(--ink-4)" }}>, {word.place.country}</span>
              </p>

              <p className="m-0 mt-3" style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-2)" }}>
                {word.story}
              </p>
            </>
          ) : (
            <p className="m-0 mt-5" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-3)" }}>
              Click the globe where you think this word came from. The pins stay
              hidden until you commit.
            </p>
          )}
        </div>

        {revealed ? (
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button type="button" className="btn btn-primary btn-lg flex-1" onClick={nextWord}>
              Next word <ArrowRight size={14} />
            </button>
            <Link href={`/word/${word.slug}`} className="btn btn-lg">
              Read the entry
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2">
      <span
        className="mono"
        style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)" }}
      >
        {label}
      </span>
      <span className="mono num" style={{ fontSize: 13, color: "var(--ink)" }}>
        {value}
      </span>
    </span>
  );
}
