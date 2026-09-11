#!/usr/bin/env python3
"""Give every Wiktionary category member one recorded disposition.

"All the words" cannot mean a pin for all 887 members: some name fictional
places, some name continents, and some are insults coined about a town with
no etymology worth recording. What it can mean is that no member is silently
missing. Every one is either published, or declined with a reason anyone can
read and argue with.

Regenerates from the dataset and the category list on every run, so it cannot
drift the way a hand-maintained count did.

Exit 1 when a member has no disposition, which makes this a release gate.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATEGORY = ROOT / "data" / "toponym-category.json"
DECLINED = ROOT / "data" / "declined.json"
WORDS = ROOT / "src" / "data" / "words.ts"
LEDGER = ROOT / "data" / "coverage-ledger.json"

REASONS = {
    "fictional-place",
    "legendary-place",
    "continent-or-ocean",
    "place-insult",
    "not-toponymic",
    "unverifiable",
    "case-variant",
    "duplicate",
    "person-not-place",
    "other",
}


def published_lemmas():
    source = WORDS.read_text(encoding="utf-8")
    return {m.group(1) for m in re.finditer(r'lemma:\s*"((?:[^"\\]|\\.)*)"', source)}


def main():
    members = json.loads(CATEGORY.read_text(encoding="utf-8"))["pages"]
    declined = json.loads(DECLINED.read_text(encoding="utf-8")) if DECLINED.exists() else []
    lemmas = {l.lower() for l in published_lemmas()}
    by_term = {d["term"].lower(): d for d in declined}

    rows, missing, bad_reason = [], [], []
    counts = {"published": 0, "declined": 0}
    for term in members:
        key = term.lower()
        if key in lemmas:
            rows.append({"term": term, "disposition": "published"})
            counts["published"] += 1
        elif key in by_term:
            entry = by_term[key]
            reason = entry.get("reason", "other")
            if reason not in REASONS:
                bad_reason.append((term, reason))
            rows.append({
                "term": term,
                "disposition": "declined",
                "reason": reason,
                "note": entry.get("note", ""),
            })
            counts["declined"] += 1
        else:
            missing.append(term)

    by_reason = {}
    for row in rows:
        if row["disposition"] == "declined":
            by_reason[row["reason"]] = by_reason.get(row["reason"], 0) + 1

    LEDGER.write_text(
        json.dumps({
            "generated_from": "data/toponym-category.json, data/declined.json, src/data/words.ts",
            "members": len(members),
            "published": counts["published"],
            "declined": counts["declined"],
            "declined_by_reason": dict(sorted(by_reason.items())),
            "rows": rows,
        }, indent=1, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"category members : {len(members)}")
    print(f"published        : {counts['published']}")
    print(f"declined         : {counts['declined']}")
    for reason, n in sorted(by_reason.items()):
        print(f"  {reason:20s} {n}")

    if bad_reason:
        print("\nunknown decline reasons:", file=sys.stderr)
        for term, reason in bad_reason:
            print(f"  {term}: {reason}", file=sys.stderr)

    if missing:
        print(f"\n{len(missing)} member(s) with no disposition:", file=sys.stderr)
        for term in missing[:40]:
            print(f"  {term}", file=sys.stderr)
        if len(missing) > 40:
            print(f"  ... and {len(missing) - 40} more", file=sys.stderr)
        print("\nAdd each to data/declined.json with a reason, or publish it.", file=sys.stderr)

    return 1 if (missing or bad_reason) else 0


if __name__ == "__main__":
    sys.exit(main())
