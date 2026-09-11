import type { Place, Word } from "@/lib/types";

/**
 * Titles get the site name appended by the metadata template, so the page's
 * own half has to fit in what is left of the ~60 characters a result shows.
 * Anything longer is cut mid-phrase in the listing.
 */
const TITLE_BUDGET = 60 - " | Geography Words".length;
const DESCRIPTION_BUDGET = 155;

/**
 * "Nîmes, France", but just "Sweden" when the place is the country and just
 * "Balkans" when it spans several. Naming a country twice, or trailing a bare
 * comma, reads as a bug in a search result.
 */
export function placeLabel(place: Place): string {
  const country = place.country.trim();
  if (!country || country === place.name) return place.name;
  return `${place.name}, ${country}`;
}

/** Longest form that fits, so a long lemma keeps the title rather than the place. */
export function wordTitle(word: Word): string {
  const candidates = [
    `${word.lemma}: the word from ${placeLabel(word.place)}`,
    `${word.lemma}: the word from ${word.place.name}`,
    `${word.lemma}: from ${word.place.name}`,
    `${word.lemma}: word origin`,
    word.lemma,
  ];
  return candidates.find((title) => title.length <= TITLE_BUDGET) ?? word.lemma;
}

export function wordDescription(word: Word): string {
  const tail = ` Pinned to ${placeLabel(word.place)}.`;
  const candidates = [
    `${word.hook} ${word.definition}${tail}`,
    `${word.hook}${tail}`,
  ];
  return (
    candidates.find((text) => text.length <= DESCRIPTION_BUDGET) ??
    clamp(word.hook, DESCRIPTION_BUDGET - tail.length) + tail
  );
}

export function placeTitle(place: Place, lemmas: string[]): string {
  const candidates = [
    `${place.name}: ${lemmas.join(", ")}`,
    `${place.name}: ${count(lemmas.length, "English word")} from here`,
    place.name,
  ];
  return candidates.find((title) => title.length <= TITLE_BUDGET) ?? place.name;
}

export function placeDescription(place: Place, lemmas: string[]): string {
  const lead = `${count(lemmas.length, "English word")} in this atlas ${
    lemmas.length === 1 ? "traces" : "trace"
  } back to ${placeLabel(place)}: `;
  return clamp(lead + lemmas.join(", "), DESCRIPTION_BUDGET - 1) + ".";
}

export function countryTitle(name: string, wordCount: number): string {
  const full = `${count(wordCount, "English word")} from ${name}`;
  return full.length <= TITLE_BUDGET ? full : `English words from ${name}`;
}

export function countryDescription(name: string, lemmas: string[]): string {
  const lead = `English words in this atlas that point back to ${name}: `;
  return clamp(lead + lemmas.join(", "), DESCRIPTION_BUDGET - 1) + ".";
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/** Cut at a word boundary so a snippet never ends mid-word. */
function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const space = cut.lastIndexOf(" ");
  const kept = space > limit * 0.6 ? cut.slice(0, space) : cut;
  return `${kept.replace(/[,;:]$/, "")}…`;
}

export type Crumb = { name: string; href: string };

/**
 * One trail, rendered as the visible breadcrumb and emitted as BreadcrumbList,
 * so the markup cannot drift from what the page shows. The country step is
 * dropped when a place spans more than one country and has no country page.
 */
export function wordCrumbs(word: Word): Crumb[] {
  return [
    { name: "Atlas", href: "/" },
    ...countryCrumb(word.place),
    { name: word.place.name, href: `/place/${word.place.slug}` },
  ];
}

export function placeCrumbs(place: Place): Crumb[] {
  return [{ name: "Atlas", href: "/" }, ...countryCrumb(place)];
}

function countryCrumb(place: Place): Crumb[] {
  if (!place.countryCode || !place.country.trim()) return [];
  return [
    {
      name: place.country,
      href: `/country/${place.countryCode.toLowerCase()}`,
    },
  ];
}

export function breadcrumbLd(crumbs: Crumb[], current: string, siteUrl: string) {
  const trail = [...crumbs, { name: current, href: "" }];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.href ? { item: `${siteUrl}${crumb.href}` } : {}),
    })),
  };
}
