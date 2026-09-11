import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CONFIDENCE_LABEL, CONFIDENCE_NOTE, RELATIONSHIP_LABEL } from "@/lib/copy";
import { countConfidence, countRelationships, getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Geography Words decides what counts as a word from a place, how confidence is recorded, and where the data comes from.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const stats = getStats();
  const confidence = countConfidence();
  const relationships = countRelationships();

  return (
    <article style={{ paddingTop: 48 }}>
      <header className="shell">
        <Eyebrow>Method</Eyebrow>
        <h1 className="h-display mt-3">A curated atlas, not a complete dictionary</h1>
        <p
          className="m-0 mt-6"
          style={{ fontSize: 18, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 680 }}
        >
          Geography Words maps English terms whose names hide a place. Search{" "}
          <em>denim</em> and the globe flies to Nîmes. Open Bikini Atoll and the
          swimsuit is waiting there. The point is a shareable discovery with a
          pin, not a claim that every etymology is settled.
        </p>
        <p
          className="m-0 mt-4"
          style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-3)", maxWidth: 680 }}
        >
          This first public set has {stats.words} hand-checked entries across{" "}
          {stats.places} places and {stats.countries} countries. Each one records
          a relationship type, a confidence label, a short original explanation,
          and links to Wiktionary and Wikidata. Dictionary prose is not copied
          into the database.
        </p>
      </header>

      <section className="shell pt-14">
        <Eyebrow>What &ldquo;from a place&rdquo; means here</Eyebrow>
        <h2 className="h-section mt-2">{relationships.length} kinds of link</h2>

        <div className="card overflow-hidden mt-6">
          {relationships.map((row) => (
            <div
              key={row.type}
              className="flex flex-wrap items-baseline justify-between gap-4 px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div style={{ minWidth: 220 }}>
                <p className="m-0" style={{ fontSize: 15 }}>
                  {RELATIONSHIP_LABEL[row.type]}
                </p>
                <p className="m-0 mt-1" style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
                  {row.words.slice(0, 4).map((word, index) => (
                    <span key={word.slug}>
                      {index > 0 ? ", " : ""}
                      <Link href={`/word/${word.slug}`} style={{ color: "var(--xera)" }}>
                        {word.lemma}
                      </Link>
                    </span>
                  ))}
                </p>
              </div>
              <span className="mono num" style={{ fontSize: 12, color: "var(--ink-4)" }}>
                {row.words.length}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="shell pt-14">
        <Eyebrow>Uncertainty is part of the interface</Eyebrow>
        <h2 className="h-section mt-2">Three confidence states</h2>
        <p
          className="m-0 mt-4"
          style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-3)", maxWidth: 680 }}
        >
          Etymology is often contested. Every entry carries a label, and{" "}
          {stats.disputed} of the {stats.words} entries are not fully settled. If
          one is wrong, the sources are there to challenge it.
        </p>

        <div className="grid gap-4 mt-6 md:grid-cols-3">
          {(["well-attested", "probable", "disputed"] as const).map((value) => (
            <div key={value} className="card card-pad">
              <span
                className={`chip chip-${value === "well-attested" ? "attested" : value}`}
              >
                <span className="dot" aria-hidden />
                {CONFIDENCE_LABEL[value]}
              </span>
              <p className="m-0 mt-3" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>
                {CONFIDENCE_NOTE[value]}
              </p>
              <p className="mono num m-0 mt-3" style={{ fontSize: 12, color: "var(--ink-4)" }}>
                {confidence[value]} entries
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell pt-14">
        <Eyebrow>Sources and licenses</Eyebrow>
        <h2 className="h-section mt-2">Where the data comes from</h2>
        <div className="card overflow-hidden mt-6">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Role</th>
                <th scope="col">License</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Wikidata</td>
                <td>Place identifiers, coordinates, country</td>
                <td className="mono" style={{ fontSize: 12 }}>CC0</td>
              </tr>
              <tr>
                <td>Wiktionary</td>
                <td>Candidate terms and page links</td>
                <td className="mono" style={{ fontSize: 12 }}>CC BY-SA 4.0 / GFDL</td>
              </tr>
              <tr>
                <td>OpenFreeMap &amp; OpenStreetMap</td>
                <td>Vector map tiles</td>
                <td className="mono" style={{ fontSize: 12 }}>ODbL</td>
              </tr>
              <tr>
                <td>Geography Words</td>
                <td>Explanations, relationship types, confidence labels</td>
                <td className="mono" style={{ fontSize: 12 }}>Written here</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          className="m-0 mt-4"
          style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-4)", maxWidth: 680 }}
        >
          Wikimedia text carries attribution and share-alike obligations, so this
          site writes its own short explanations rather than republishing
          dictionary articles.
        </p>
      </section>

      <section className="shell pt-14">
        <Eyebrow>Limits</Eyebrow>
        <h2 className="h-section mt-2">What this is not</h2>
        <p
          className="m-0 mt-4"
          style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 680 }}
        >
          It is not a complete etymological dictionary, a prevalence map, or
          medical or legal advice. A pin marks the place a name is associated
          with. It does not mean the thing originated there in a physical sense,
          or that it is typical of that place today.
        </p>
        <div className="flex flex-wrap gap-2.5 mt-7">
          <Link href="/" className="btn btn-primary btn-lg">
            Open the atlas
          </Link>
          <Link href="/words" className="btn btn-lg">
            Browse all {stats.words} words
          </Link>
        </div>
      </section>
    </article>
  );
}
