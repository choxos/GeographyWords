import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { HeroReveal } from "@/components/HeroReveal";
import { MiniMap } from "@/components/MiniMap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  countConfidence,
  countRelationships,
  featuredWords,
  getCountries,
  getPlaces,
  getStats,
  words,
} from "@/lib/data";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  RELATIONSHIP_LABEL,
} from "@/lib/copy";

export default function HomePage() {
  const stats = getStats();
  const featured = featuredWords(6);
  const countries = getCountries();
  const places = getPlaces();
  const confidence = countConfidence();
  const relationships = countRelationships();
  const top = countries.slice(0, 8);
  const most = top[0]?.words.length ?? 1;

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section className="shell" style={{ paddingTop: 60, paddingBottom: 28 }}>
        <div className="flex items-center gap-2.5 mb-4">
          <Eyebrow>A curated etymology atlas</Eyebrow>
          <span className="chip chip-attested">
            <span className="dot" aria-hidden />
            {stats.words} entries
          </span>
        </div>

        <HeroReveal words={featured} />
      </section>

      {/* --------------------------------------------------------- Stats */}
      <section className="shell pt-6">
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Words</div>
            <div className="stat-value num">{stats.words}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Places</div>
            <div className="stat-value num">{stats.places}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Countries</div>
            <div className="stat-value num">{stats.countries}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Not settled</div>
            <div className="stat-value num">{stats.disputed}</div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ Featured */}
      <section className="shell pt-16">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <Eyebrow>Start anywhere</Eyebrow>
            <h2 className="h-section mt-1">Words that give away where they have been</h2>
          </div>
          <Link href="/words" className="btn">
            All {stats.words} words <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((word) => (
            <Link
              key={word.slug}
              href={`/word/${word.slug}`}
              className="card card-link card-pad flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="lemma" style={{ fontSize: 30, lineHeight: 1.05 }}>
                  {word.lemma}
                </span>
                <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
                  <span className="dot" aria-hidden />
                  {CONFIDENCE_LABEL[word.confidence]}
                </span>
              </div>

              <p className="m-0 flex-1" style={{ fontSize: 14.5, color: "var(--ink-2)" }}>
                {word.hook}
              </p>

              <div
                className="flex items-center gap-2 pt-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <MapPin size={13} style={{ color: "var(--xera)" }} aria-hidden />
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {word.place.name} · {word.place.country}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- The globe */}
      <section className="shell pt-16">
        <div className="card overflow-hidden">
          <div className="card-head flex-wrap">
            <div>
              <Eyebrow>{stats.places} pins</Eyebrow>
              <h2
                className="serif font-normal mt-1 m-0"
                style={{ fontSize: 24, letterSpacing: "-0.015em" }}
              >
                Every word on one map
              </h2>
            </div>
            <Link href="/map" className="btn">
              Open the atlas <ArrowRight size={13} />
            </Link>
          </div>
          <div style={{ height: 420, background: "var(--surface-2)" }}>
            <MiniMap
              lng={14}
              lat={34}
              zoom={1.5}
              places={places}
              label="The Geography Words atlas"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------- League + legend row */}
      <section className="shell pt-16 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="card-head">
            <div>
              <Eyebrow>Which country lent the most</Eyebrow>
              <h2
                className="serif font-normal mt-1 m-0"
                style={{ fontSize: 24, letterSpacing: "-0.015em" }}
              >
                League table
              </h2>
            </div>
            <Link href="/countries" className="btn btn-ghost">
              All {stats.countries}
            </Link>
          </div>

          <div>
            {top.map((country) => (
              <Link
                key={country.code}
                href={`/country/${country.code.toLowerCase()}`}
                className="grid items-center gap-4 px-5 py-3"
                style={{
                  gridTemplateColumns: "minmax(110px, 34%) 1fr 28px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 13.5 }}>{country.name}</span>
                <span className="bar-bg">
                  <span
                    className="bar-fill"
                    style={{ width: `${(country.words.length / most) * 100}%` }}
                  />
                </span>
                <span
                  className="mono num text-right"
                  style={{ fontSize: 12, color: "var(--ink-3)" }}
                >
                  {country.words.length}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-head">
            <div>
              <Eyebrow>How to read a pin</Eyebrow>
              <h2
                className="serif font-normal mt-1 m-0"
                style={{ fontSize: 24, letterSpacing: "-0.015em" }}
              >
                Kinds of borrowing
              </h2>
            </div>
          </div>

          <div>
            {relationships.map((row) => (
              <div
                key={row.type}
                className="flex items-baseline justify-between gap-4 px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <p className="m-0" style={{ fontSize: 13.5 }}>
                    {RELATIONSHIP_LABEL[row.type]}
                  </p>
                  <p
                    className="m-0 mt-0.5 truncate"
                    style={{ fontSize: 12.5, color: "var(--ink-4)" }}
                  >
                    {row.words
                      .slice(0, 3)
                      .map((word) => word.lemma)
                      .join(", ")}
                  </p>
                </div>
                <span className="mono num" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {row.words.length}
                </span>
              </div>
            ))}
          </div>

          <div className="card-pad flex flex-wrap gap-2">
            <span className="chip chip-attested">
              <span className="dot" aria-hidden />
              {confidence["well-attested"]} well attested
            </span>
            <span className="chip chip-probable">
              <span className="dot" aria-hidden />
              {confidence.probable} probable
            </span>
            <span className="chip chip-disputed">
              <span className="dot" aria-hidden />
              {confidence.disputed} disputed
            </span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- Guess CTA */}
      <section className="shell pt-16">
        <div
          className="card card-pad flex flex-wrap items-center justify-between gap-6"
          style={{ padding: 32 }}
        >
          <div style={{ maxWidth: 560 }}>
            <Eyebrow>Guess mode</Eyebrow>
            <h2 className="h-section mt-2">You get the word. Find the place.</h2>
            <p className="m-0 mt-3" style={{ fontSize: 15, color: "var(--ink-3)" }}>
              Drop a pin anywhere on the globe. The arc shows how far off you
              were, then the entry explains itself. {words.length} rounds, no
              timer.
            </p>
          </div>
          <Link href="/guess" className="btn btn-primary btn-lg">
            Start a round <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
