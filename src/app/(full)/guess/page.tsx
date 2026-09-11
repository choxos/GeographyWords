import type { Metadata } from "next";
import { GuessGameClient } from "@/components/GuessGameClient";
import { openGraphBase } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guess mode",
  description:
    "You get the word. Find the place. Drop a pin on the globe and see how far off you were.",
  alternates: { canonical: "/guess" },
  openGraph: {
    ...openGraphBase,
    title: "Guess the place behind the word",
    description:
      "You get the word. Find the place. Drop a pin on the globe and see how far off you were.",
    url: "/guess",
  },
};

export default function GuessPage() {
  return (
    <>
      <h1 className="sr-only">Guess the place behind an English word</h1>
      <GuessGameClient />
    </>
  );
}
