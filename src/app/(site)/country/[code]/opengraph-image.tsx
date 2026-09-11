import { getCountry } from "@/lib/data";
import { ogCard } from "@/lib/ogCard";

export const alt = "Geography Words";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CountryOgImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const country = getCountry(code);
  if (!country) {
    return ogCard({
      lemma: "Missing",
      hook: "That country is not in this atlas yet.",
      placeLine: "Geography Words",
    });
  }
  return ogCard({
    lemma: country.name,
    hook: `${country.words.length} English words hiding inside ${country.name}.`,
    placeLine: country.words.map((word) => word.lemma).slice(0, 6).join(", "),
  });
}
