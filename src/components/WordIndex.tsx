"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  RELATIONSHIP_LABEL,
  RELATIONSHIP_SHORT,
} from "@/lib/copy";
import type { Confidence, RelationshipType, Word } from "@/lib/types";

const CONFIDENCES: Confidence[] = ["well-attested", "probable", "disputed"];

export function WordIndex({ words }: { words: Word[] }) {
  const [query, setQuery] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [relationship, setRelationship] = useState<RelationshipType | null>(null);

  const relationships = useMemo(() => {
    const seen = new Map<RelationshipType, number>();
    for (const word of words) {
      seen.set(word.relationship, (seen.get(word.relationship) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [words]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((word) => {
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
  }, [confidence, query, relationship, words]);

  return (
    <>
      <section className="shell pt-8">
        <div className="search-field">
          <Search size={16} aria-hidden style={{ color: "var(--ink-4)" }} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by word, place or country…"
            aria-label="Filter the word list"
          />
          <span
            className="mono num pr-3"
            style={{ fontSize: 12, color: "var(--ink-4)" }}
          >
            {shown.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            className={confidence || relationship ? "btn" : "btn btn-primary"}
            onClick={() => {
              setConfidence(null);
              setRelationship(null);
            }}
          >
            All {words.length}
          </button>

          {CONFIDENCES.map((value) => (
            <button
              key={value}
              type="button"
              className={confidence === value ? "btn btn-primary" : "btn"}
              aria-pressed={confidence === value}
              onClick={() => setConfidence(confidence === value ? null : value)}
            >
              {CONFIDENCE_LABEL[value]}
            </button>
          ))}

          <span className="w-px my-1" style={{ background: "var(--border)" }} aria-hidden />

          {relationships.map(([type, count]) => (
            <button
              key={type}
              type="button"
              className={relationship === type ? "btn btn-primary" : "btn"}
              aria-pressed={relationship === type}
              title={RELATIONSHIP_LABEL[type]}
              onClick={() => setRelationship(relationship === type ? null : type)}
            >
              {RELATIONSHIP_SHORT[type]}
              <span className="mono num" style={{ color: "inherit", opacity: 0.65 }}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="shell pt-6">
        {shown.length === 0 ? (
          <div className="card card-pad">
            <p className="m-0 muted">
              Nothing matches that. Clear the filters, or try <em>bikini</em>.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {shown.map((word) => (
              <Link
                key={word.slug}
                href={`/word/${word.slug}`}
                className="entry-row grid gap-4 items-baseline"
                style={{ gridTemplateColumns: "minmax(140px, 22%) 1fr auto" }}
              >
                <span className="lemma" style={{ fontSize: 22, lineHeight: 1.15 }}>
                  {word.lemma}
                </span>

                <span className="min-w-0">
                  <span className="block" style={{ fontSize: 14, color: "var(--ink-2)" }}>
                    {word.hook}
                  </span>
                  <span
                    className="mono block mt-1"
                    style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-4)" }}
                  >
                    {word.place.name} · {word.place.country} ·{" "}
                    {RELATIONSHIP_SHORT[word.relationship]}
                  </span>
                </span>

                <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
                  <span className="dot" aria-hidden />
                  {CONFIDENCE_LABEL[word.confidence]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
