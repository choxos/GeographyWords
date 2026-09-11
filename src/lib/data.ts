import { WORDS } from "@/data/words";
import { haversineKm } from "@/lib/geo";
import type { Place, Source, Word } from "@/lib/types";

export const words = WORDS;

export type PlaceIndex = Place & { words: Word[] };

export type CountryIndex = {
  code: string;
  name: string;
  words: Word[];
};

export function getWord(slug: string): Word | undefined {
  return WORDS.find((word) => word.slug === slug);
}

export function getWordsByPlace(placeSlug: string): Word[] {
  return WORDS.filter((word) => word.place.slug === placeSlug);
}

export function getPlace(placeSlug: string): Place | undefined {
  return WORDS.find((word) => word.place.slug === placeSlug)?.place;
}

export function getPlaces(): PlaceIndex[] {
  const map = new Map<string, PlaceIndex>();
  for (const word of WORDS) {
    const existing = map.get(word.place.slug);
    if (existing) {
      existing.words.push(word);
    } else {
      map.set(word.place.slug, { ...word.place, words: [word] });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function getCountries(): CountryIndex[] {
  const map = new Map<string, CountryIndex>();
  for (const word of WORDS) {
    // Transnational places carry no country code, so they join no country.
    const code = word.place.countryCode;
    if (!code) continue;
    const existing = map.get(code);
    if (existing) {
      existing.words.push(word);
    } else {
      map.set(code, {
        code,
        name: word.place.country,
        words: [word],
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const count = b.words.length - a.words.length;
    return count !== 0 ? count : a.name.localeCompare(b.name, "en");
  });
}

export function getCountry(code: string): CountryIndex | undefined {
  const needle = code.toLowerCase();
  return getCountries().find((country) => country.code.toLowerCase() === needle);
}

export function sourcesFor(word: Word): Source[] {
  return [
    {
      publisher: "Wiktionary",
      citation: word.lemma,
      url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word.wiktionary)}`,
    },
    {
      publisher: "Wikidata",
      citation: word.place.wikidata,
      url: `https://www.wikidata.org/wiki/${word.place.wikidata}`,
    },
    ...(word.extraSources ?? []),
  ];
}

function score(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 50;
  const parts = t.split(/[\s,'’-]+/);
  if (parts.some((part) => part.startsWith(q))) return 40;
  return 0;
}

export function searchAtlas(query: string): {
  words: Word[];
  places: PlaceIndex[];
  countries: CountryIndex[];
} {
  const q = query.trim();
  if (q.length < 1) {
    return { words: [], places: [], countries: [] };
  }
  const scoredWords = WORDS.map((word) => ({
    word,
    n:
      score(q, word.lemma) * 3 +
      score(q, word.place.name) +
      score(q, word.hook) * 0.3,
  }))
    .filter((row) => row.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
    .map((row) => row.word);

  const scoredPlaces = getPlaces()
    .map((place) => ({ place, n: score(q, place.name) + score(q, place.country) * 0.5 }))
    .filter((row) => row.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((row) => row.place);

  const scoredCountries = getCountries()
    .map((country) => ({
      country,
      n: score(q, country.name) + score(q, country.code),
    }))
    .filter((row) => row.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((row) => row.country);

  return { words: scoredWords, places: scoredPlaces, countries: scoredCountries };
}

export function randomWord(except?: string): Word {
  const pool = except ? WORDS.filter((word) => word.slug !== except) : WORDS;
  return pool[Math.floor(Math.random() * pool.length)] ?? WORDS[0];
}

export const STARTER_SLUGS = [
  "denim",
  "bikini",
  "dollar",
  "spa",
  "sandwich",
  "turquoise",
] as const;

export type AtlasStats = {
  words: number;
  places: number;
  countries: number;
  disputed: number;
};

export function getStats(): AtlasStats {
  return {
    words: WORDS.length,
    places: new Set(WORDS.map((word) => word.place.slug)).size,
    countries: new Set(
      WORDS.map((word) => word.place.countryCode).filter(Boolean),
    ).size,
    disputed: WORDS.filter((word) => word.confidence !== "well-attested").length,
  };
}

export function countConfidence(): Record<Word["confidence"], number> {
  const out = { "well-attested": 0, probable: 0, disputed: 0 };
  for (const word of WORDS) out[word.confidence] += 1;
  return out;
}

export function countRelationships(): { type: Word["relationship"]; words: Word[] }[] {
  const map = new Map<Word["relationship"], Word[]>();
  for (const word of WORDS) {
    const list = map.get(word.relationship);
    if (list) list.push(word);
    else map.set(word.relationship, [word]);
  }
  return [...map.entries()]
    .map(([type, list]) => ({ type, words: list }))
    .sort((a, b) => b.words.length - a.words.length);
}

/** Other entries whose place is physically closest to this one. */
export function nearestWords(word: Word, limit = 4): { word: Word; km: number }[] {
  const from = { lng: word.place.lng, lat: word.place.lat };
  return WORDS.filter((other) => other.place.slug !== word.place.slug)
    .map((other) => ({
      word: other,
      km: haversineKm(from, { lng: other.place.lng, lat: other.place.lat }),
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

/** A deterministic rotation, so the server and client agree on the order. */
export function featuredWords(limit = 6): Word[] {
  const picked = STARTER_SLUGS.map((slug) => getWord(slug)).filter(
    (word): word is Word => Boolean(word),
  );
  return picked.slice(0, limit);
}
