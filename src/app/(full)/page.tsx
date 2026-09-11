import type { Metadata } from "next";
import { AtlasWorkspace } from "@/components/AtlasWorkspace";
import { getStats } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const stats = getStats();

  return (
    <>
      <AtlasWorkspace />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: SITE_URL,
            description: `A curated atlas of ${stats.words} English words that carry a place inside them, across ${stats.places} places in ${stats.countries} countries.`,
            inLanguage: "en",
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/words?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}
