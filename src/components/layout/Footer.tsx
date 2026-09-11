import Link from "next/link";
import { getStats } from "@/lib/data";

export function Footer() {
  const stats = getStats();

  return (
    <footer style={{ borderTop: "1px solid var(--border)", marginTop: 72 }}>
      <div className="shell py-10 flex flex-wrap gap-8 justify-between">
        <div style={{ maxWidth: 420 }}>
          <p className="serif m-0" style={{ fontSize: 18, letterSpacing: "-0.015em" }}>
            Geography Words
          </p>
          <p className="muted m-0 mt-2" style={{ fontSize: 13, lineHeight: 1.6 }}>
            A curated atlas of {stats.words} English words that carry a place
            inside them. Not a complete etymological dictionary, and not a claim
            that every story is settled.
          </p>
        </div>

        <div className="flex gap-12 flex-wrap">
          <div className="flex flex-col gap-2">
            <span className="h-eyebrow">Explore</span>
            <Link href="/map" className="text-[13px] muted">
              The atlas
            </Link>
            <Link href="/words" className="text-[13px] muted">
              All words
            </Link>
            <Link href="/countries" className="text-[13px] muted">
              Countries
            </Link>
            <Link href="/guess" className="text-[13px] muted">
              Guess mode
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <span className="h-eyebrow">Sources</span>
            <a
              href="https://en.wiktionary.org/wiki/Category:English_terms_derived_from_toponyms"
              className="text-[13px] muted"
              target="_blank"
              rel="noreferrer"
            >
              Wiktionary
            </a>
            <a
              href="https://www.wikidata.org"
              className="text-[13px] muted"
              target="_blank"
              rel="noreferrer"
            >
              Wikidata
            </a>
            <Link href="/about" className="text-[13px] muted">
              Method and licenses
            </Link>
          </div>
        </div>
      </div>

      <div className="shell pb-8">
        <p className="mono m-0" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
          Map tiles © OpenFreeMap, data © OpenStreetMap contributors. Place
          identifiers and coordinates from Wikidata (CC0). Explanations written
          for this atlas.
        </p>
      </div>
    </footer>
  );
}
