import type { Metadata } from "next";
import { GuessGameClient } from "@/components/GuessGameClient";

export const metadata: Metadata = {
  title: "Guess mode",
  description:
    "You get the word. Find the place. Drop a pin on the globe and see how far off you were.",
  alternates: { canonical: "/guess" },
};

export default function GuessPage() {
  return (
    <>
      <h1 className="sr-only">Guess the place behind an English word</h1>
      <GuessGameClient />
    </>
  );
}
