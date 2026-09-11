/**
 * Search results cut titles around 60 characters and descriptions around 155.
 * Composing those from prose fields is easy to get wrong for one entry in
 * eight hundred, so this measures every page rather than a sample.
 *
 * A title is allowed past the budget only when it has already fallen back to
 * its shortest form: a 43 character lemma cannot be made to fit, and cutting
 * one would be worse than letting the listing truncate it.
 */
import { WORDS } from "../src/data/words.ts";
import {
  countryDescription,
  countryTitle,
  placeDescription,
  placeLabel,
  placeTitle,
  wordDescription,
  wordTitle,
} from "../src/lib/seo.ts";

const SUFFIX = " | Geography Words";
const TITLE_BUDGET = 60;
const DESCRIPTION_BUDGET = 155;

function group(keyOf, nameOf) {
  const out = new Map();
  for (const word of WORDS) {
    const key = keyOf(word);
    if (!key) continue;
    const entry = out.get(key) ?? { key, name: nameOf(word), lemmas: [], place: word.place };
    entry.lemmas.push(word.lemma);
    out.set(key, entry);
  }
  return [...out.values()];
}

const places = group((w) => w.place.slug, (w) => w.place.name);
const countries = group((w) => w.place.countryCode, (w) => w.place.country);

let failed = 0;

function check(label, rows, budget) {
  const lens = rows.map((r) => r.text.length).sort((a, b) => a - b);
  const over = rows.filter((r) => r.text.length > budget && !r.irreducible);
  const truncated = rows.filter((r) => r.text.length > budget && r.irreducible);
  console.log(
    `${label.padEnd(20)} n=${String(rows.length).padStart(4)}  min ${lens[0]}  median ${
      lens[Math.floor(lens.length / 2)]
    }  max ${lens.at(-1)}  over ${budget}: ${over.length}` +
      (truncated.length > 0 ? ` (+${truncated.length} irreducible)` : ""),
  );
  if (over.length > 0) {
    failed += 1;
    for (const r of over.slice(0, 3)) console.log(`   ${r.text.length}  ${r.text}`);
  }
}

check(
  "word title",
  WORDS.map((w) => ({
    text: wordTitle(w) + SUFFIX,
    irreducible: wordTitle(w) === w.lemma,
  })),
  TITLE_BUDGET,
);
check("word description", WORDS.map((w) => ({ text: wordDescription(w) })), DESCRIPTION_BUDGET);
check(
  "place title",
  places.map((p) => ({
    text: placeTitle(p.place, p.lemmas) + SUFFIX,
    irreducible: placeTitle(p.place, p.lemmas) === p.place.name,
  })),
  TITLE_BUDGET,
);
check(
  "place description",
  places.map((p) => ({ text: placeDescription(p.place, p.lemmas) })),
  DESCRIPTION_BUDGET,
);
check(
  "country title",
  countries.map((c) => ({
    text: countryTitle(c.name, c.lemmas.length) + SUFFIX,
    irreducible: countryTitle(c.name, c.lemmas.length) === `English words from ${c.name}`,
  })),
  TITLE_BUDGET,
);
check(
  "country description",
  countries.map((c) => ({ text: countryDescription(c.name, c.lemmas) })),
  DESCRIPTION_BUDGET,
);

/**
 * The place label is what puts a country into a title or a description, so a
 * thin record shows up there as a dangling comma or a name written twice.
 */
const badLabels = [...new Map(WORDS.map((w) => [w.place.slug, w.place])).values()]
  .map((place) => ({ place, label: placeLabel(place) }))
  .filter(
    ({ place, label }) =>
      /,\s*$/.test(label) ||
      label.includes(", ,") ||
      (place.country.trim() && label === `${place.country}, ${place.country}`),
  );

console.log(`\nmalformed place labels: ${badLabels.length}`);
for (const { place, label } of badLabels.slice(0, 5)) {
  console.log(`   ${place.slug}: ${JSON.stringify(label)}`);
}
if (badLabels.length > 0) failed += 1;

if (failed > 0) {
  console.error(`\nseo-audit: ${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nseo-audit: every title and description fits");
