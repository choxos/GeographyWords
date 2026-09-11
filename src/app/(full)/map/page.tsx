import type { Metadata } from "next";
import { MapExplorer } from "@/components/MapExplorer";
import { getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "The atlas",
  description:
    "Every English word in this atlas, pinned to the place it came from. Search, filter by confidence, and open any entry.",
  alternates: { canonical: "/map" },
};

export default function MapPage() {
  const stats = getStats();
  return (
    <>
      <h1 className="sr-only">
        The Geography Words atlas: {stats.words} English words on {stats.places}{" "}
        pins across {stats.countries} countries
      </h1>
      <MapExplorer />
    </>
  );
}
