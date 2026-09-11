"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, Shuffle, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { randomWord, searchAtlas } from "@/lib/data";

const NAVIGATION = [
  { name: "Atlas", href: "/" },
  { name: "Words", href: "/words" },
  { name: "Countries", href: "/countries" },
  { name: "Guess", href: "/guess" },
  { name: "About", href: "/about" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * One bar on every route. The atlas needs a full width header above its
 * edge to edge rails, and switching between that and a centered container
 * on the other pages moved the nav sideways on every navigation.
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = q.trim() ? searchAtlas(q) : null;

  // Reset the search and menus when the route changes. Done during render
  // rather than in an effect so the new page never paints with the old panel.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setMobileOpen(false);
    setQ("");
  }

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "saturate(140%) blur(14px)",
        WebkitBackdropFilter: "saturate(140%) blur(14px)",
      }}
    >
      <div
        className="flex items-center gap-6 h-[60px] px-5"
      >
        <Link href="/" className="flex items-center gap-2.5 select-none shrink-0">
          <span
            className="grid place-items-center mono font-bold"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 13,
              letterSpacing: "-0.04em",
            }}
          >
            X
          </span>
          <span className="hidden sm:inline text-[14px] font-semibold tracking-[-0.015em]">
            xera
            <span className="mx-1.5 font-normal" style={{ color: "var(--ink-4)" }}>
              /
            </span>
            <span style={{ color: "var(--ink-3)" }}>geography words</span>
          </span>
        </Link>

        <div
          ref={boxRef}
          className="hidden md:block relative ml-auto"
          style={{ width: open ? 320 : 240, transition: "width .15s var(--ease)" }}
        >
          <Search
            size={14}
            aria-hidden
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--ink-4)" }}
          />
          <input
            type="search"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search a word or place…"
            aria-label="Search the whole atlas"
            className="mono text-[12.5px] rounded-md w-full"
            style={{
              paddingLeft: 28,
              paddingRight: 10,
              paddingTop: 6,
              paddingBottom: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink)",
              outline: "none",
            }}
          />

          {open && results ? (
            <div
              className="card absolute left-0 right-0 top-[calc(100%+6px)] overflow-hidden"
              style={{ boxShadow: "0 18px 40px rgba(0,0,0,0.16)" }}
              role="listbox"
            >
              {results.words.length === 0 &&
              results.places.length === 0 &&
              results.countries.length === 0 ? (
                <p className="muted-sm m-0 px-3 py-3">
                  No matches. Try <em>bikini</em>, <em>dollar</em> or <em>spa</em>.
                </p>
              ) : null}

              {results.words.slice(0, 5).map((word) => (
                <button
                  key={word.slug}
                  type="button"
                  onClick={() => go(`/word/${word.slug}`)}
                  className="w-full flex items-baseline justify-between gap-3 px-3 py-2 text-left"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span className="serif text-[17px]">{word.lemma}</span>
                  <span className="mono text-[10.5px]" style={{ color: "var(--ink-4)" }}>
                    {word.place.name}
                  </span>
                </button>
              ))}

              {results.countries.slice(0, 3).map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => go(`/country/${country.code.toLowerCase()}`)}
                  className="w-full flex items-baseline justify-between gap-3 px-3 py-2 text-left"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span className="text-[13px]">{country.name}</span>
                  <span className="mono text-[10.5px]" style={{ color: "var(--ink-4)" }}>
                    {country.words.length} words
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {NAVIGATION.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors"
                style={{
                  color: active ? "var(--ink)" : "var(--ink-3)",
                  background: active ? "var(--surface-2)" : "transparent",
                }}
              >
                {item.name}
              </Link>
            );
          })}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: 7 }}
            aria-label="Open a random word"
            onClick={() => router.push(`/word/${randomWord().slug}`)}
          >
            <Shuffle size={15} />
          </button>
          <span
            className="w-px h-[18px] mx-1"
            style={{ background: "var(--border)" }}
            aria-hidden
          />
          <ThemeToggle />
        </nav>

        <div className="ml-auto md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: 7 }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          aria-label="Primary"
          className="md:hidden px-5 pb-4 flex flex-col"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
        >
          {NAVIGATION.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="py-3 text-[15px]"
              style={{
                borderBottom: "1px solid var(--border)",
                color: isActive(pathname, item.href) ? "var(--ink)" : "var(--ink-3)",
              }}
            >
              {item.name}
            </Link>
          ))}
          <button
            type="button"
            className="py-3 text-[15px] text-left"
            style={{ color: "var(--ink-3)" }}
            onClick={() => router.push(`/word/${randomWord().slug}`)}
          >
            Surprise me
          </button>
        </nav>
      ) : null}
    </header>
  );
}
