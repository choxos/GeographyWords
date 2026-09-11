# Geography Words

A curated atlas of English words that carry a place inside them. Search *denim*
and the globe flies to Nîmes; open Bikini Atoll and the swimsuit is waiting
there.

74 hand-checked entries across 73 places and 32 countries. Every entry records
what kind of link it is (named from the place, named for a product of it, from
its people, through a historical name, indirect, or disputed), how settled the
etymology is, a short explanation written for this atlas, and links to
Wiktionary and Wikidata. Dictionary prose is not copied into the database.

## Stack

- Next.js 16 (App Router, static export of every word/place/country page)
- MapLibre GL via react-map-gl, OpenFreeMap vector tiles
- Tailwind 4 plus the Xera design tokens shared with the OpenScience platform
- No database: the dataset lives in `src/data/words.ts`

## Routes

| Route | What it is |
|---|---|
| `/` | Landing: the reveal, stats, featured entries, league table |
| `/map` | Full-screen atlas with search, confidence filters and a detail rail |
| `/guess` | Guess mode: drop a pin, see the great-circle arc and the distance |
| `/words` | Every entry, filterable by confidence and relationship |
| `/word/[slug]` | One entry: chain, mini-map, record, sources, related |
| `/place/[slug]` | A place and the words pinned to it |
| `/countries`, `/country/[code]` | The league table and one country |
| `/about` | Method, confidence states, sources and licenses |

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
NEXT_PUBLIC_SITE_URL=https://geowords.xera.ac npm run build
npm start            # serves on $PORT, default 3021
```

`NEXT_PUBLIC_SITE_URL` drives canonical URLs, the sitemap and Open Graph image
URLs, so it must be set at build time in production.

## Data and licenses

Place identifiers and coordinates come from Wikidata (CC0). Candidate terms and
page links point at English Wiktionary (CC BY-SA 4.0 / GFDL). Map tiles are
OpenFreeMap, data © OpenStreetMap contributors (ODbL). Explanations,
relationship types and confidence labels are written for this atlas.
