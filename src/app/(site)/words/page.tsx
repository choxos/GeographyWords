import type { Metadata } from "next";
import { WordIndex } from "@/components/WordIndex";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getStats, words } from "@/lib/data";
import { openGraphBase } from "@/lib/site";

export const metadata: Metadata = {
  title: `All ${getStats().words} English words named after places`,
  description:
    "Every entry in the Geography Words atlas, with the place it points at, the kind of borrowing, and how settled the etymology is.",
  alternates: { canonical: "/words" },
  openGraph: {
    ...openGraphBase,
    title: `All ${getStats().words} English words named after places`,
    description:
      "Every entry in the atlas, with the place it points at, the kind of borrowing, and how settled the etymology is.",
    url: "/words",
  },
};

export default function WordsPage() {
  const stats = getStats();
  const sorted = [...words].sort((a, b) =>
    a.lemma.localeCompare(b.lemma, "en", { sensitivity: "base" }),
  );

  return (
    <>
      <header className="shell" style={{ paddingTop: 48 }}>
        <Eyebrow>
          {stats.words} words · {stats.places} places · {stats.countries} countries
        </Eyebrow>
        <h1 className="h-display mt-3">Every entry</h1>
        <p
          className="m-0 mt-5"
          style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-3)", maxWidth: 660 }}
        >
          The whole atlas in one list. Filter by how settled the etymology is,
          or by the kind of link between the word and the place.
        </p>
      </header>

      <WordIndex words={sorted} />
    </>
  );
}
