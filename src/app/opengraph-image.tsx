import { words } from "@/lib/data";
import { ogCard } from "@/lib/ogCard";

export const alt = "Geography Words";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function RootOgImage() {
  return ogCard({
    lemma: "denim",
    hook: "Everyday English, pinned to the map.",
    placeLine: `${words.length} curated place-derived words`,
  });
}
