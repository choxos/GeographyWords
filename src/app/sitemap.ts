import { getCountries, getPlaces, words } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

/**
 * No lastModified. The only date available here is build time, and a date
 * that changes on every deploy without the entry changing is a signal search
 * engines learn to discount. No priority or changeFrequency either: both are
 * ignored, and they would only add weight to the file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/words` },
    { url: `${SITE_URL}/countries` },
    { url: `${SITE_URL}/guess` },
    { url: `${SITE_URL}/about` },
    ...words.map((word) => ({ url: `${SITE_URL}/word/${word.slug}` })),
    ...getPlaces().map((place) => ({ url: `${SITE_URL}/place/${place.slug}` })),
    ...getCountries().map((country) => ({
      url: `${SITE_URL}/country/${country.code.toLowerCase()}`,
    })),
  ];
}
