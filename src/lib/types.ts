export type RelationshipType =
  | "direct_toponym"
  | "demonym"
  | "product_from_place"
  | "historical_place_name"
  | "indirect_derivation"
  | "disputed";

export type Confidence = "well-attested" | "probable" | "disputed";

/**
 * Usage label, in the lexicographic sense. The atlas records terms that are
 * pejorative or worse, because their derivation from a place is exactly the
 * phenomenon being catalogued and omitting them would misrepresent how the
 * language actually works. Recording one without marking how it is used
 * would be the inaccurate choice, so entries that need a label carry one.
 */
export type Register =
  | "derogatory"
  | "ethnic-slur"
  | "offensive"
  | "vulgar"
  | "dated"
  | "humorous";

export type PartOfSpeech = "noun" | "verb" | "adjective";

export type Place = {
  slug: string;
  name: string;
  wikidata: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  zoom?: number;
};

export type ExtraSource = {
  publisher: string;
  citation: string;
  url: string;
};

export type Word = {
  slug: string;
  lemma: string;
  pos: PartOfSpeech;
  definition: string;
  hook: string;
  chain: string[];
  relationship: RelationshipType;
  confidence: Confidence;
  /** Absent means the term is in neutral general use. */
  register?: Register;
  attestation: string;
  wiktionary: string;
  place: Place;
  extraSources?: ExtraSource[];
};

export type Source = ExtraSource;
