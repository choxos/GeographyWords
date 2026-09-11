"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { Word } from "@/lib/types";

/**
 * The core idea of the site in one line: a word, then the place hiding in it.
 * Cycles through a handful of entries so the point lands without being read.
 */
export function HeroReveal({ words }: { words: Word[] }) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || words.length < 2) return;
    const id = window.setInterval(
      () => setIndex((value) => (value + 1) % words.length),
      3800,
    );
    return () => window.clearInterval(id);
  }, [reducedMotion, words.length]);

  const word = words[index];
  if (!word) return null;

  return (
    <div>
      <h1 className="h-display">
        The word{" "}
        <Link
          key={`lemma-${word.slug}`}
          href={`/word/${word.slug}`}
          className="fade-in"
          style={{
            display: "inline-block",
            borderBottom: "2px solid var(--xera)",
            paddingBottom: 2,
          }}
        >
          {word.lemma}
        </Link>{" "}
        <br />
        is a place:{" "}
        <span
          key={`place-${word.slug}`}
          className="fade-in"
          style={{ color: "var(--xera)" }}
        >
          {word.place.name}
        </span>
        .
      </h1>

      <p
        key={`hook-${word.slug}`}
        className="fade-in mt-5 m-0"
        style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-3)", maxWidth: 640 }}
      >
        {word.hook}
      </p>

      <div className="flex flex-wrap items-center gap-2.5 mt-8">
        <Link href={`/word/${word.slug}`} className="btn btn-primary btn-lg">
          Read this entry <ArrowRight size={14} />
        </Link>
        <Link href="/" className="btn btn-lg">
          Open the atlas
        </Link>
        <Link href="/guess" className="btn btn-lg">
          Play guess mode
        </Link>
      </div>

      <div className="flex gap-1.5 mt-8" aria-hidden>
        {words.map((item, itemIndex) => (
          <span
            key={item.slug}
            style={{
              width: itemIndex === index ? 22 : 8,
              height: 3,
              borderRadius: 999,
              background:
                itemIndex === index ? "var(--xera)" : "var(--border-strong)",
              transition: "width .3s var(--ease), background .3s var(--ease)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
