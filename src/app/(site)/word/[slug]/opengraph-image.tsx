import { getWord } from "@/lib/data";
import { ogCard } from "@/lib/ogCard";

export const alt = "Geography Words";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function WordOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const word = getWord(slug);
  if (!word) {
    return ogCard({
      lemma: "Missing",
      hook: "That word is not in this atlas yet.",
      placeLine: "Geography Words",
    });
  }
  return ogCard({
    lemma: word.lemma,
    hook: word.hook,
    placeLine: `${word.place.name}, ${word.place.country}`,
  });
}
