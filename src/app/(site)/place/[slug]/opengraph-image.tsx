import { getWordsByPlace } from "@/lib/data";
import { ogCard } from "@/lib/ogCard";

export const alt = "Geography Words";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PlaceOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const placeWords = getWordsByPlace(slug);
  const place = placeWords[0]?.place;
  if (!place) {
    return ogCard({
      lemma: "Missing",
      hook: "That place is not in this atlas yet.",
      placeLine: "Geography Words",
    });
  }
  return ogCard({
    lemma: place.name,
    hook:
      placeWords.length === 1
        ? placeWords[0].hook
        : `${placeWords.length} English words are pinned to this place.`,
    placeLine: place.country,
  });
}
