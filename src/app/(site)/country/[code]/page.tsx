import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_TONE,
  RELATIONSHIP_SHORT,
} from "@/lib/copy";
import { getCountries, getCountry } from "@/lib/data";

type CountryParams = { code: string };

export function generateStaticParams() {
  return getCountries().map((country) => ({ code: country.code.toLowerCase() }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<CountryParams>;
}): Promise<Metadata> {
  const { code } = await params;
  const country = getCountry(code);
  if (!country) return { title: "Not found" };
  const list = country.words.map((word) => word.lemma).join(", ");
  return {
    title: `${country.words.length} English words from ${country.name}`,
    description: `English words in this atlas that point back to ${country.name}: ${list}.`,
    alternates: { canonical: `/country/${country.code.toLowerCase()}` },
    openGraph: {
      title: `${country.words.length} English words hiding inside ${country.name}`,
      description: list,
      url: `/country/${country.code.toLowerCase()}`,
    },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<CountryParams>;
}) {
  const { code } = await params;
  const country = getCountry(code);
  if (!country) notFound();

  const all = getCountries();
  const rank = all.findIndex((item) => item.code === country.code) + 1;

  // Group the country's entries by the place they point at.
  const byPlace = new Map<string, typeof country.words>();
  for (const word of country.words) {
    const list = byPlace.get(word.place.slug);
    if (list) list.push(word);
    else byPlace.set(word.place.slug, [word]);
  }
  const places = [...byPlace.values()].sort(
    (a, b) => b.length - a.length || a[0].place.name.localeCompare(b[0].place.name, "en"),
  );

  return (
    <article>
      <nav
        aria-label="Breadcrumb"
        className="shell flex items-center gap-1.5 pt-6 mono"
        style={{ fontSize: 11, color: "var(--ink-4)" }}
      >
        <Link href="/countries" style={{ color: "var(--ink-3)" }}>
          Countries
        </Link>
        <ChevronRight size={11} aria-hidden />
        <span>{country.name}</span>
      </nav>

      <header className="shell pt-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Eyebrow>Rank {rank} of {all.length}</Eyebrow>
          <span className="chip">
            {country.words.length} {country.words.length === 1 ? "word" : "words"}
          </span>
          <span className="chip chip-plain">
            {places.length} {places.length === 1 ? "place" : "places"}
          </span>
        </div>

        <h1 className="h-display">{country.name}</h1>

        <p className="m-0 mt-5" style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-3)", maxWidth: 660 }}>
          {country.words.length === 1
            ? "One English word in this atlas points back to"
            : `${country.words.length} English words in this atlas point back to`}{" "}
          {country.name}, spread across {places.length}{" "}
          {places.length === 1 ? "place" : "places"}.
        </p>

        <div className="mt-7">
          <ShareButton
            title={country.name}
            text={`${country.words.length} English words hiding inside ${country.name}:`}
            className="btn btn-primary btn-lg"
          />
        </div>
      </header>

      <section className="shell pt-12">
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Word</th>
                <th scope="col">The place</th>
                <th scope="col">Relationship</th>
                <th scope="col">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {country.words.map((word) => (
                <tr key={word.slug} className="clickable">
                  <td>
                    <Link href={`/word/${word.slug}`} className="block">
                      <span className="lemma block" style={{ fontSize: 20, lineHeight: 1.15 }}>
                        {word.lemma}
                      </span>
                      <span className="block mt-1" style={{ color: "var(--ink-3)" }}>
                        {word.hook}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <Link href={`/place/${word.place.slug}`} style={{ color: "var(--xera)" }}>
                      {word.place.name}
                    </Link>
                  </td>
                  <td className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    {RELATIONSHIP_SHORT[word.relationship]}
                  </td>
                  <td>
                    <span className={`chip ${CONFIDENCE_TONE[word.confidence]}`}>
                      <span className="dot" aria-hidden />
                      {CONFIDENCE_LABEL[word.confidence]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="shell pt-14">
        <Eyebrow>Elsewhere in the atlas</Eyebrow>
        <div className="flex flex-wrap gap-2 mt-4">
          {all
            .filter((item) => item.code !== country.code)
            .slice(0, 14)
            .map((item) => (
              <Link
                key={item.code}
                href={`/country/${item.code.toLowerCase()}`}
                className="btn"
              >
                {item.name}
                <span className="mono num" style={{ color: "var(--ink-4)" }}>
                  {item.words.length}
                </span>
              </Link>
            ))}
          <Link href="/countries" className="btn btn-ghost">
            All {all.length} countries →
          </Link>
        </div>
      </section>
    </article>
  );
}
