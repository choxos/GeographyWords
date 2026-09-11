import { getCountries, getPlaces, words } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now },
    { url: `${SITE_URL}/map`, lastModified: now },
    { url: `${SITE_URL}/guess`, lastModified: now },
    { url: `${SITE_URL}/words`, lastModified: now },
    { url: `${SITE_URL}/countries`, lastModified: now },
    { url: `${SITE_URL}/about`, lastModified: now },
    ...words.map((word) => ({
      url: `${SITE_URL}/word/${word.slug}`,
      lastModified: now,
    })),
    ...getPlaces().map((place) => ({
      url: `${SITE_URL}/place/${place.slug}`,
      lastModified: now,
    })),
    ...getCountries().map((country) => ({
      url: `${SITE_URL}/country/${country.code.toLowerCase()}`,
      lastModified: now,
    })),
  ];
}
