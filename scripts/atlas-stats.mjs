/**
 * Print the dataset's headline numbers, and refresh the counts in README.md.
 *
 * The README carried hand-typed totals that went stale the moment the dataset
 * grew. Numbers that describe data should be read from the data.
 */
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("src/data/words.ts", "utf8");
const words = [...src.matchAll(/^    slug: "([^"]+)"/gm)].map((m) => m[1]);
const places = new Set([...src.matchAll(/\n      slug: "([^"]+)"/g)].map((m) => m[1]));
const countries = new Set([...src.matchAll(/countryCode: "([^"]+)"/g)].map((m) => m[1]));
const confidence = {};
for (const m of src.matchAll(/confidence: "([^"]+)"/g)) {
  confidence[m[1]] = (confidence[m[1]] ?? 0) + 1;
}

const stats = {
  words: words.length,
  places: places.size,
  countries: countries.size,
  ...confidence,
};
console.log(stats);

const line = `**${stats.words} words · ${stats.places} places · ${stats.countries} countries** — ${confidence["well-attested"] ?? 0} well attested, ${confidence.probable ?? 0} probable, ${confidence.disputed ?? 0} disputed.`;
const readme = readFileSync("README.md", "utf8");
const marked = readme.replace(
  /<!-- stats -->[\s\S]*?<!-- \/stats -->/,
  `<!-- stats -->\n${line}\n<!-- /stats -->`,
);
writeFileSync("README.md", marked);
console.log("README stats updated");
