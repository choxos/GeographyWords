import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, ExternalLink, MapPin } from "lucide-react";
import { MiniMap } from "@/components/MiniMap";
import { storyFor } from "@/data/stories";
import { ShareButton } from "@/components/ShareButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_NOTE,
  CONFIDENCE_TONE,
  REGISTER_LABEL,
  REGISTER_NOTE,
  RELATIONSHIP_LABEL,
} from "@/lib/copy";
import {
  getCountry,
  getWord,
  getWordsByPlace,
  nearestWords,
  randomWord,
  sourcesFor,
  words,
} from "@/lib/data";
import { formatKm } from "@/lib/geo";
import {
  breadcrumbLd,
  wordCrumbs,
  wordDescription,
  wordTitle,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/site";

type WordParams = { slug: string };

export function generateStaticParams() {
  return words.map((word) => ({ slug: word.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<WordParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const word = getWord(slug);
  if (!word) return { title: "Not found" };
  return {
    title: wordTitle(word),
    description: wordDescription(word),
    openGraph: {
      // The hook is the line worth sharing, so the card keeps it even though
      // the search title cannot fit it.
      title: `${word.lemma}: ${word.hook}`,
      description: storyFor(word.slug),
      url: `/word/${word.slug}`,
      type: "article",
    },
    alternates: { canonical: `/word/${word.slug}` },
  };
}

export default async function WordPage({
  params,
}: {
  params: Promise<WordParams>;
}) {
  const { slug } = await params;
  const word = getWord(slug);
  if (!word) notFound();

  const sources = sourcesFor(word);
  const samePlace = getWordsByPlace(word.place.slug).filter(
    (item) => item.slug !== word.slug,
  );
  const country = word.place.countryCode
    ? getCountry(word.place.countryCode)
    : undefined;
  const sameCountry = (country?.words ?? []).filter(
    (item) => item.slug !== word.slug && item.place.slug !== word.place.slug,
  );
  const nearby = nearestWords(word, 4);
  const next = randomWord(word.slug);
  const countryHref = word.place.countryCode
    ? `/country/${word.place.countryCode.toLowerCase()}`
    : null;
  const crumbs = wordCrumbs(word);

  return (
    <article>
      {/* --------------------------------------------------- Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="shell flex items-center gap-1.5 pt-6 mono"
        style={{ fontSize: 11, color: "var(--ink-4)" }}
      >
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 ? <ChevronRight size={11} aria-hidden /> : null}
            <Link href={crumb.href} style={{ color: "var(--ink-3)" }}>
              {crumb.name}
            </Link>
          </Fragment>
        ))}
      </nav>

      {/* -------------------------------------------------------- Hero */}
      <header className="shell pt-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
            <span className="dot" aria-hidden />
            {CONFIDENCE_LABEL[word.confidence]}
          </span>
          <span className="chip chip-plain">
            {RELATIONSHIP_LABEL[word.relationship]}
          </span>
          {word.register ? (
            <span className="chip chip-register">
              {REGISTER_LABEL[word.register]}
            </span>
          ) : null}
        </div>

        <h1
          className="lemma m-0"
          style={{ fontSize: "clamp(56px, 13vw, 120px)", lineHeight: 0.92 }}
        >
          {word.lemma}
        </h1>

        <p
          className="mono m-0 mt-4"
          style={{ fontSize: 11.5, letterSpacing: "0.06em", color: "var(--ink-4)", textTransform: "uppercase" }}
        >
          {word.pos} · first attested {word.attestation}
        </p>

        <p
          className="serif m-0 mt-6"
          style={{
            fontSize: "clamp(22px, 3.4vw, 30px)",
            lineHeight: 1.3,
            letterSpacing: "-0.015em",
            color: "var(--xera)",
            maxWidth: 760,
          }}
        >
          {word.hook}
        </p>

        <p
          className="m-0 mt-5"
          style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 660 }}
        >
          {word.definition}
        </p>

        <div className="flex flex-wrap items-center gap-2.5 mt-7">
          <ShareButton
            title={word.lemma}
            text={`${word.lemma}: ${word.hook}`}
            className="btn btn-primary btn-lg"
          />
          <Link href={`/word/${next.slug}`} className="btn btn-lg">
            Another word <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------ Map + record */}
      <section className="shell pt-12 grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        <div className="card overflow-hidden">
          <div style={{ height: 340, background: "var(--surface-2)" }}>
            <MiniMap
              lng={word.place.lng}
              lat={word.place.lat}
              zoom={word.place.zoom ?? 6}
              label={word.place.name}
            />
          </div>
          <div className="card-pad flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="m-0 flex items-center gap-2" style={{ fontSize: 15 }}>
                <MapPin size={14} style={{ color: "var(--xera)" }} aria-hidden />
                <Link href={`/place/${word.place.slug}`}>{word.place.name}</Link>
                <span style={{ color: "var(--ink-4)" }}>·</span>
                {countryHref ? (
                  <Link href={countryHref} style={{ color: "var(--ink-3)" }}>
                    {word.place.country}
                  </Link>
                ) : (
                  <span style={{ color: "var(--ink-3)" }}>{word.place.country}</span>
                )}
              </p>
              <p className="mono m-0 mt-1.5" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                {word.place.lat.toFixed(4)}°{word.place.lat >= 0 ? "N" : "S"}{" "}
                {word.place.lng.toFixed(4)}°{word.place.lng >= 0 ? "E" : "W"} ·{" "}
                {word.place.wikidata}
              </p>
            </div>
            <Link href="/" className="btn">
              Open on the atlas <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-head">
            <h2
              className="serif font-normal m-0"
              style={{ fontSize: 20, letterSpacing: "-0.015em" }}
            >
              Record
            </h2>
          </div>

          <dl className="m-0">
            <Row label="Relationship">{RELATIONSHIP_LABEL[word.relationship]}</Row>
            <Row label="Confidence">
              <span style={{ color: `var(--${confidenceVar(word.confidence)})` }}>
                {CONFIDENCE_LABEL[word.confidence]}
              </span>
              <span className="block mt-1" style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
                {CONFIDENCE_NOTE[word.confidence]}
              </span>
            </Row>
            {word.register ? (
              <Row label="Usage">
                <span style={{ color: "var(--ink-2)" }}>
                  {REGISTER_LABEL[word.register]}
                </span>
                <span className="block mt-1" style={{ fontSize: 12.5, color: "var(--ink-4)" }}>
                  {REGISTER_NOTE[word.register]}
                </span>
              </Row>
            ) : null}
            <Row label="Attested">{word.attestation}</Row>
            <Row label="Part of speech">{word.pos}</Row>
            <Row label="Sources">
              <span className="flex flex-col gap-1.5">
                {sources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5"
                    style={{ color: "var(--xera)" }}
                  >
                    {source.publisher}: {source.citation}
                    <ExternalLink size={11} aria-hidden />
                  </a>
                ))}
              </span>
            </Row>
          </dl>

          <div className="card-pad" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="m-0" style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-4)" }}>
              Explanations here are written for this atlas. Dictionary text is
              not copied; the sources are linked so the claim can be checked.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Chain */}
      {word.chain.length > 0 ? (
        <section className="shell pt-14">
          <Eyebrow>How it traveled</Eyebrow>
          <ol
            className="grid gap-3 mt-4 m-0 p-0"
            style={{
              listStyle: "none",
              gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
            }}
          >
            {[...word.chain].reverse().map((step, index) => (
              <li
                key={`${step}-${index}`}
                className="card card-pad"
                style={{ borderTop: "2px solid var(--border-strong)" }}
              >
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "var(--ink-4)", textTransform: "uppercase" }}>
                  Step {index + 1}
                </span>
                <p className="serif m-0 mt-1.5" style={{ fontSize: 26, lineHeight: 1.15 }}>
                  {step}
                </p>
              </li>
            ))}
            <li
              className="card card-pad"
              style={{ borderTop: "2px solid var(--xera)" }}
            >
              <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "var(--xera)", textTransform: "uppercase" }}>
                In English
              </span>
              <p className="serif m-0 mt-1.5" style={{ fontSize: 26, lineHeight: 1.15 }}>
                {word.lemma}
              </p>
            </li>
          </ol>
        </section>
      ) : null}

      {/* ------------------------------------------------------- Story */}
      <section className="shell pt-14">
        <Eyebrow>The entry</Eyebrow>
        <p
          className="m-0 mt-4"
          style={{ fontSize: 19, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 680 }}
        >
          {storyFor(word.slug)}
        </p>
      </section>

      {/* ----------------------------------------------------- Related */}
      {samePlace.length > 0 ? (
        <RelatedGrid
          eyebrow={`Also pinned to ${word.place.name}`}
          heading={`${samePlace.length} more from the same place`}
          items={samePlace}
        />
      ) : null}

      {sameCountry.length > 0 && countryHref ? (
        <RelatedGrid
          eyebrow={word.place.country}
          heading={`${sameCountry.length} more ${sameCountry.length === 1 ? "word" : "words"} from ${word.place.country}`}
          items={sameCountry.slice(0, 8)}
          href={countryHref}
          hrefLabel={`All ${country?.words.length} entries`}
        />
      ) : null}

      <section className="shell pt-14">
        <Eyebrow>Nearest pins</Eyebrow>
        <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-4">
          {nearby.map(({ word: other, km }) => (
            <Link
              key={other.slug}
              href={`/word/${other.slug}`}
              className="card card-link card-pad flex flex-col gap-2"
            >
              <span className="lemma" style={{ fontSize: 24, lineHeight: 1.1 }}>
                {other.lemma}
              </span>
              <span className="flex-1" style={{ fontSize: 13, color: "var(--ink-3)" }}>
                {other.place.name}, {other.place.country}
              </span>
              <span className="mono num" style={{ fontSize: 11, color: "var(--xera)" }}>
                {formatKm(km)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          name: word.lemma,
          description: storyFor(word.slug),
          inDefinedTermSet: {
            "@type": "DefinedTermSet",
            name: SITE_NAME,
            url: SITE_URL,
          },
          url: `${SITE_URL}/word/${word.slug}`,
          inLanguage: "en",
          termCode: word.slug,
          // The place is the claim this entry makes, so it is stated as data
          // rather than left for a reader to infer from the prose.
          about: {
            "@type": "Place",
            name: word.place.name,
            sameAs: `https://www.wikidata.org/wiki/${word.place.wikidata}`,
            geo: {
              "@type": "GeoCoordinates",
              latitude: word.place.lat,
              longitude: word.place.lng,
            },
          },
          sameAs: sources.map((source) => source.url),
          citation: sources.map((source) => source.url),
        }}
      />
      <JsonLd data={breadcrumbLd(crumbs, word.lemma, SITE_URL)} />
    </article>
  );
}

function confidenceVar(confidence: string) {
  if (confidence === "well-attested") return "attested";
  if (confidence === "probable") return "probable";
  return "disputed";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="grid items-start gap-4 px-5 py-3.5"
      style={{
        gridTemplateColumns: "116px 1fr",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <dt
        className="mono"
        style={{
          fontSize: 10.5,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-4)",
          paddingTop: 2,
        }}
      >
        {label}
      </dt>
      <dd className="m-0" style={{ fontSize: 13.5 }}>
        {children}
      </dd>
    </div>
  );
}

function RelatedGrid({
  eyebrow,
  heading,
  items,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  heading: string;
  items: typeof words;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <section className="shell pt-14">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="serif font-normal m-0 mt-1" style={{ fontSize: 26, letterSpacing: "-0.015em" }}>
            {heading}
          </h2>
        </div>
        {href ? (
          <Link href={href} className="btn">
            {hrefLabel} <ArrowRight size={13} />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/word/${item.slug}`}
            className="card card-link card-pad flex flex-col gap-2"
          >
            <span className="lemma" style={{ fontSize: 24, lineHeight: 1.1 }}>
              {item.lemma}
            </span>
            <span className="flex-1" style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
              {item.hook}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {item.place.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
