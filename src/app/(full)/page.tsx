import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasWorkspace } from "@/components/AtlasWorkspace";
import { getStats } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const stats = getStats();

  return (
    <>
      {/* The atlas is a map, so the page's heading and summary are for
          readers using a screen reader and for crawlers, which otherwise see
          a canvas and no text at all. */}
      <h1 className="sr-only">
        Geography Words: {stats.words} English words that come from place names
      </h1>
      <p className="sr-only">
        An atlas of everyday English words named after places, from denim and
        Nîmes to bikini and Bikini Atoll. {stats.words} entries across{" "}
        {stats.places} places in {stats.countries} countries, each with its
        etymology, how settled it is, and its sources.
      </p>

      {/* The workspace reads its state from the query string, which Next
          requires to sit behind a Suspense boundary on a prerendered page. */}
      <Suspense fallback={<div className="atlas-stage-skeleton" />}>
        <AtlasWorkspace />
      </Suspense>
      {/* No SearchAction: it would advertise /words?q= as a search endpoint,
          and the index filters in the browser rather than reading a query. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description: `A curated atlas of ${stats.words} English words that carry a place inside them, across ${stats.places} places in ${stats.countries} countries.`,
          inLanguage: "en",
          publisher: {
            "@type": "Organization",
            name: "Xera Research",
            url: "https://xera.ac",
          },
        }}
      />
    </>
  );
}
