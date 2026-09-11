"""Pull every member of the Wiktionary toponym category via the API.

The category is paginated in the web UI (?from=A); the API gives the whole
thing with cmcontinue, which is what the research report recommends over
scraping. Structural facts only: page titles. No Wiktionary prose is read here.
"""
import json, time, urllib.parse, urllib.request

API = "https://en.wiktionary.org/w/api.php"
UA = "GeographyWords/0.1 (https://geowords.xera.ac; ahmad.pub@gmail.com)"

def get(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def members(category, kind):
    out, cont = [], None
    while True:
        p = {
            "action": "query", "format": "json", "formatversion": "2",
            "list": "categorymembers",
            "cmtitle": category,
            "cmlimit": "500",
            "cmtype": kind,
        }
        if cont:
            p["cmcontinue"] = cont
        d = get(p)
        out += [m["title"] for m in d.get("query", {}).get("categorymembers", [])]
        cont = d.get("continue", {}).get("cmcontinue")
        if not cont:
            return out
        time.sleep(0.2)

CAT = "Category:English terms derived from toponyms"
pages = members(CAT, "page")
subcats = members(CAT, "subcat")

print(f"direct pages : {len(pages)}")
print(f"subcategories: {len(subcats)}")
for c in subcats[:15]:
    print("   ", c)

json.dump({"pages": pages, "subcats": subcats}, open("category.json", "w"), indent=1)
print("\nfirst 20 A-terms:", [p for p in pages if p.upper().startswith("A")][:20])
