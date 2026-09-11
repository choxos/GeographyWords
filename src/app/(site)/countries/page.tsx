import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCountries, getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: `${getStats().countries} countries that gave English a word`,
  description:
    "Every country represented in the Geography Words atlas, ranked by how many English words point back to it.",
  alternates: { canonical: "/countries" },
};

export default function CountriesPage() {
  const countries = getCountries();
  const stats = getStats();
  const most = countries[0]?.words.length ?? 1;

  return (
    <>
      <header className="shell" style={{ paddingTop: 48 }}>
        <Eyebrow>{stats.countries} countries · {stats.words} words</Eyebrow>
        <h1 className="h-display mt-3">The league table</h1>
        <p
          className="m-0 mt-5"
          style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-3)", maxWidth: 660 }}
        >
          A country appears here when an English word in the atlas points at a
          place inside it. The count is of words, not of places, and it says
          nothing about how many words that country has actually given English.
        </p>
      </header>

      <section className="shell pt-10">
        <div className="card overflow-hidden">
          {countries.map((country, index) => (
            <Link
              key={country.code}
              href={`/country/${country.code.toLowerCase()}`}
              className="entry-row grid items-center gap-4"
              style={{ gridTemplateColumns: "28px minmax(120px, 26%) 1fr auto" }}
            >
              <span className="mono num" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 14.5 }}>{country.name}</span>
              <span className="bar-bg hidden sm:block">
                <span
                  className="bar-fill"
                  style={{ width: `${(country.words.length / most) * 100}%` }}
                />
              </span>
              <span
                className="mono num text-right"
                style={{ fontSize: 12, color: "var(--ink-3)", minWidth: 24 }}
              >
                {country.words.length}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
