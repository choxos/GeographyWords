import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { MiniMap } from "@/components/MiniMap";
import { ShareButton } from "@/components/ShareButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  RELATIONSHIP_LABEL,
} from "@/lib/copy";
import { getPlaces, getWordsByPlace, nearestWords } from "@/lib/data";
import { storyFor } from "@/data/stories";
import { formatKm } from "@/lib/geo";
import {
  breadcrumbLd,
  placeCrumbs,
  placeDescription,
  placeLabel,
  placeTitle,
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

type PlaceParams = { slug: string };

export function generateStaticParams() {
  return getPlaces().map((place) => ({ slug: place.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<PlaceParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const placeWords = getWordsByPlace(slug);
  const place = placeWords[0]?.place;
  if (!place) return { title: "Not found" };
  const lemmas = placeWords.map((word) => word.lemma);
  return {
    title: placeTitle(place, lemmas),
    description: placeDescription(place, lemmas),
    alternates: { canonical: `/place/${place.slug}` },
    openGraph: {
      title: `English words hiding in ${place.name}`,
      description: lemmas.join(", "),
      url: `/place/${place.slug}`,
    },
  };
}

export default async function PlacePage({
  params,
}: {
  params: Promise<PlaceParams>;
}) {
  const { slug } = await params;
  const placeWords = getWordsByPlace(slug);
  const place = placeWords[0]?.place;
  if (!place) notFound();

  const nearby = nearestWords(placeWords[0], 4);
  // A place spanning several countries has no country page to point at, so
  // the links fall back to the country index rather than disappearing.
  const countryHref = place.countryCode
    ? `/country/${place.countryCode.toLowerCase()}`
    : "/countries";
  const crumbs = placeCrumbs(place);

  return (
    <article>
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
        <ChevronRight size={11} aria-hidden />
        <span>{place.name}</span>
      </nav>

      <header className="shell pt-6 grid gap-8 lg:grid-cols-[1fr_520px] items-center">
        <div>
          <Eyebrow>
            {placeWords.length === 1 ? "One word" : `${placeWords.length} words`} pinned here
          </Eyebrow>

          <h1 className="h-display mt-3">{place.name}</h1>

          <p className="mono m-0 mt-4" style={{ fontSize: 11.5, color: "var(--ink-4)", letterSpacing: "0.06em" }}>
            {place.lat.toFixed(4)}°{place.lat >= 0 ? "N" : "S"}{" "}
            {place.lng.toFixed(4)}°{place.lng >= 0 ? "E" : "W"} · {place.wikidata}
          </p>

          <p className="m-0 mt-5" style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--ink-3)", maxWidth: 520 }}>
            {placeWords.length === 1
              ? `One English word in this atlas traces back to ${place.name}.`
              : `${placeWords.length} English words in this atlas trace back to ${place.name}.`}{" "}
            It sits in{" "}
            <Link href={countryHref} style={{ color: "var(--xera)" }}>
              {place.country}
            </Link>
            .
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-7">
            <ShareButton
              title={place.name}
              text={`English words hiding in ${place.name}:`}
              className="btn btn-primary btn-lg"
            />
            <Link href={countryHref} className="btn btn-lg">
              All of {place.country} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div style={{ height: 360, background: "var(--surface-2)" }}>
            <MiniMap
              lng={place.lng}
              lat={place.lat}
              zoom={place.zoom ?? 6}
              label={place.name}
            />
          </div>
        </div>
      </header>

      <section className="shell pt-14">
        <Eyebrow>Pinned here</Eyebrow>
        <div className="grid gap-4 mt-4 lg:grid-cols-2">
          {placeWords.map((word) => (
            <Link
              key={word.slug}
              href={`/word/${word.slug}`}
              className="card card-link card-pad flex flex-col gap-4"
              style={{ padding: 28 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="lemma block" style={{ fontSize: 42, lineHeight: 1 }}>
                    {word.lemma}
                  </span>
                  <span
                    className="mono block mt-2"
                    style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-4)" }}
                  >
                    {word.pos} · {word.attestation}
                  </span>
                </div>
                <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
                  <span className="dot" aria-hidden />
                  {CONFIDENCE_LABEL[word.confidence]}
                </span>
              </div>

              <p
                className="serif m-0"
                style={{ fontSize: 20, lineHeight: 1.34, color: "var(--xera)" }}
              >
                {word.hook}
              </p>

              <p className="m-0" style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
                {storyFor(word.slug)}
              </p>

              <div
                className="flex items-center justify-between gap-4 pt-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-4)" }}
                >
                  {RELATIONSHIP_LABEL[word.relationship]}
                </span>
                <span style={{ fontSize: 13, color: "var(--xera)" }}>Read →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell pt-14">
        <Eyebrow>Nearest pins</Eyebrow>
        <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-4">
          {nearby.map(({ word, km }) => (
            <Link
              key={word.slug}
              href={`/word/${word.slug}`}
              className="card card-link card-pad flex flex-col gap-2"
            >
              <span className="lemma" style={{ fontSize: 24, lineHeight: 1.1 }}>
                {word.lemma}
              </span>
              <span className="flex-1" style={{ fontSize: 13, color: "var(--ink-3)" }}>
                {word.place.name}, {word.place.country}
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
          "@type": "Place",
          name: place.name,
          description: placeDescription(
            place,
            placeWords.map((word) => word.lemma),
          ),
          url: `${SITE_URL}/place/${place.slug}`,
          sameAs: `https://www.wikidata.org/wiki/${place.wikidata}`,
          ...(placeLabel(place) === place.name
            ? {}
            : { address: { "@type": "PostalAddress", addressCountry: place.country } }),
          geo: {
            "@type": "GeoCoordinates",
            latitude: place.lat,
            longitude: place.lng,
          },
        }}
      />
      <JsonLd data={breadcrumbLd(crumbs, place.name, SITE_URL)} />
    </article>
  );
}
