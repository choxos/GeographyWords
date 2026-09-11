#!/usr/bin/env python3
"""Check every place in src/data/words.ts against Wikidata.

Each entry cites a Wikidata Q-id as its evidence, so a wrong id is a broken
claim, not a cosmetic bug. This asserts that the id exists, that it has
coordinates, and that those coordinates agree with the ones we ship.

    python3 scripts/validate-places.py [--tolerance 1.0]

Exits non-zero if anything fails, so it can gate a release.
"""
import argparse, json, pathlib, re, sys, urllib.parse, urllib.request

UA = "GeographyWords/0.1 (https://geowords.xera.ac; ahmad.pub@gmail.com)"
WORDS = pathlib.Path(__file__).resolve().parent.parent / "src/data/words.ts"

FIELD = {
    "word": re.compile(r'^    slug: "([^"]+)"', re.M),
    "name": re.compile(r'^      name: "([^"]+)"', re.M),
    "qid": re.compile(r'^      wikidata: "([^"]+)"', re.M),
    "lat": re.compile(r"^      lat: (-?[\d.]+)", re.M),
    "lng": re.compile(r"^      lng: (-?[\d.]+)", re.M),
}


def parse(text):
    """Split the array into entries and read each one on its own.

    One regex across the whole file silently swallowed the entry after any
    block it could not match, so two entries went unchecked while the run
    still reported success. Parsing per entry means an unreadable block is a
    failure instead of a gap.
    """
    body = text.split("export const WORDS: Word[] = [", 1)[1].rsplit("];", 1)[0]
    rows, broken = [], []
    for chunk in re.split(r"\n  \},\n", body):
        if 'slug: "' not in chunk:
            continue
        got = {}
        for key, pat in FIELD.items():
            m = pat.search(chunk)
            if m:
                got[key] = m.group(1)
        if len(got) == len(FIELD):
            rows.append(got)
        else:
            label = got.get("word", chunk.strip()[:40])
            broken.append(f"{label}: missing {sorted(set(FIELD) - set(got))}")
    return rows, broken


def wikidata(ids):
    out = {}
    for i in range(0, len(ids), 45):
        url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode({
            "action": "wbgetentities", "format": "json",
            "ids": "|".join(ids[i : i + 45]),
            "props": "labels|claims", "languages": "en",
        })
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            out.update(json.load(r)["entities"])
    return out


def coord(entity):
    try:
        return entity["claims"]["P625"][0]["mainsnak"]["datavalue"]["value"]
    except (KeyError, IndexError):
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tolerance", type=float, default=1.0,
                    help="allowed degrees between our coordinates and Wikidata's")
    args = ap.parse_args()

    text = WORDS.read_text(encoding="utf-8")
    rows, broken = parse(text)
    declared = len(re.findall(r'^    slug: "', text, re.M))
    if not rows:
        sys.exit("could not parse any entries out of words.ts")
    if len(rows) != declared:
        broken.append(f"parsed {len(rows)} entries but the file declares {declared}")

    entities = wikidata(sorted({r["qid"] for r in rows}))
    missing, drifted = [], []
    for r in rows:
        e = entities.get(r["qid"], {})
        # An item with no English label is not a missing item. Small places are
        # often labelled only in their own language, and the id plus its
        # coordinates are what this check is really about.
        if not e or "missing" in e or not e.get("claims"):
            missing.append(f'{r["word"]}: {r["qid"]} does not exist')
            continue
        c = coord(e)
        if not c:
            missing.append(f'{r["word"]}: {r["qid"]} has no coordinates')
            continue
        d = ((float(r["lat"]) - c["latitude"]) ** 2
             + (float(r["lng"]) - c["longitude"]) ** 2) ** 0.5
        if d > args.tolerance:
            drifted.append(
                f'{r["word"]}: {r["name"]} ({r["qid"]}) ours {r["lat"]},{r["lng"]} '
                f'vs Wikidata {c["latitude"]:.4f},{c["longitude"]:.4f} ({d:.2f} deg)'
            )

    print(f"checked {len(rows)} entries against {len(entities)} Wikidata items")
    for line in broken + missing + drifted:
        print("  FAIL", line)
    if broken or missing or drifted:
        sys.exit(
            f"{len(broken)} unreadable, {len(missing)} bad ids, "
            f"{len(drifted)} coordinate mismatches"
        )
    print("all place ids exist and agree with Wikidata")


if __name__ == "__main__":
    main()
