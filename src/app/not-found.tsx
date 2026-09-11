import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="shell" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <Eyebrow>404</Eyebrow>
        <h1 className="h-display mt-3">That pin is missing</h1>
        <p
          className="m-0 mt-5"
          style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-3)", maxWidth: 560 }}
        >
          This atlas does not have that word or place yet. Search from the header,
          or start from the globe.
        </p>
        <div className="flex flex-wrap gap-2.5 mt-8">
          <Link href="/" className="btn btn-primary btn-lg">
            Open the atlas
          </Link>
          <Link href="/words" className="btn btn-lg">
            Browse every word
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
