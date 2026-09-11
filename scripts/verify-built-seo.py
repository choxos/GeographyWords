#!/usr/bin/env python3
"""
Check the built HTML, not the source that produced it.

Every gap this catches was invisible upstream: page metadata replaces the
root's openGraph block whole rather than merging into it, so a page that sets
its own title silently drops og:site_name and og:type, and tsc has no opinion
about either. Run after `next build`.
"""
import html
import json
import pathlib
import random
import re
import sys

ROOT = pathlib.Path(".next/server/app")
LD = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)


def meta(page_html: str, attr: str, key: str) -> str | None:
    found = re.search(
        rf'<meta {attr}="{re.escape(key)}" content="(.*?)"', page_html
    )
    return html.unescape(found.group(1)) if found else None


def main() -> int:
    pages = sorted(ROOT.rglob("*.html"))
    if not pages:
        print("no built pages: run next build first", file=sys.stderr)
        return 1

    kinds = {
        "word": [p for p in pages if p.parent.name == "word"],
        "place": [p for p in pages if p.parent.name == "place"],
        "country": [p for p in pages if p.parent.name == "country"],
    }
    rng = random.Random(7)
    sample = [p for group in kinds.values() for p in rng.sample(group, min(60, len(group)))]
    # The static pages set metadata without openGraph, which is exactly how
    # all four ended up sharing the site tagline as their card title.
    flat = {"index.html", "about.html", "words.html", "countries.html", "guess.html"}
    sample += [p for p in pages if p.parent == ROOT and p.name in flat]

    errors: list[str] = []
    seen_types: dict[str, int] = {}

    for page in sample:
        text = page.read_text(errors="replace")
        name = str(page.relative_to(ROOT))

        for tag, attr, key in (
            ("og:title", "property", "og:title"),
            ("og:type", "property", "og:type"),
            ("og:site_name", "property", "og:site_name"),
            ("og:url", "property", "og:url"),
            ("description", "name", "description"),
            ("twitter:card", "name", "twitter:card"),
        ):
            if meta(text, attr, key) is None:
                errors.append(f"{name}: missing {tag}")

        # The whole point of dropping twitter.title from the root: each page
        # has to carry its own, or every share reads the same.
        # The home page's title really is the tagline; anywhere else it means
        # the page inherited the root's card instead of describing itself.
        tw = meta(text, "name", "twitter:title")
        if name != "index.html" and tw and "pinned to the map" in tw:
            errors.append(f"{name}: twitter:title fell back to the site tagline")
        og_title = meta(text, "property", "og:title")
        if name != "index.html" and og_title and "pinned to the map" in og_title:
            errors.append(f"{name}: og:title fell back to the site tagline")

        if not re.search(r'<link rel="canonical" href="https://', text):
            errors.append(f"{name}: no absolute canonical")

        if page.parent.name in ("word", "place", "country") and "<h1" not in text:
            errors.append(f"{name}: no h1")

        for raw in LD.findall(text):
            try:
                data = json.loads(html.unescape(raw))
            except json.JSONDecodeError as exc:
                errors.append(f"{name}: unparsable JSON-LD: {exc}")
                continue
            kind = data.get("@type", "?")
            seen_types[kind] = seen_types.get(kind, 0) + 1

            if kind == "BreadcrumbList":
                items = data["itemListElement"]
                positions = [i["position"] for i in items]
                if positions != list(range(1, len(items) + 1)):
                    errors.append(f"{name}: breadcrumb positions {positions}")
                if not all(i.get("name") for i in items):
                    errors.append(f"{name}: breadcrumb with an empty name")
            if kind == "DefinedTerm":
                same = data.get("sameAs")
                if not isinstance(same, str) or "wiktionary.org" not in same:
                    errors.append(f"{name}: DefinedTerm sameAs is not its dictionary entry")
                about = data.get("about", {})
                if "wikidata.org" not in about.get("sameAs", ""):
                    errors.append(f"{name}: DefinedTerm about is not a Wikidata place")
            if kind == "Place":
                if not isinstance(data.get("geo", {}).get("latitude"), (int, float)):
                    errors.append(f"{name}: Place without coordinates")
                country = data.get("address", {}).get("addressCountry")
                if country is not None and not re.fullmatch(r"[A-Z]{2}", country):
                    errors.append(f"{name}: addressCountry {country!r} is not an ISO code")

    print(f"built pages: {len(pages)}   sampled: {len(sample)}")
    print(f"json-ld blocks: {seen_types}")
    for kind, group in kinds.items():
        print(f"  {kind}: {len(group)}")

    if errors:
        print(f"\n{len(errors)} problem(s):", file=sys.stderr)
        for line in errors[:20]:
            print(f"  {line}", file=sys.stderr)
        return 1
    print("\nbuilt output: head tags and structured data check out")
    return 0


if __name__ == "__main__":
    sys.exit(main())
