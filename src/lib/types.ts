export type RelationshipType =
  | "direct_toponym"
  | "demonym"
  | "product_from_place"
  | "historical_place_name"
  | "indirect_derivation"
  | "disputed";

export type Confidence = "well-attested" | "probable" | "disputed";

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
  story: string;
  chain: string[];
  relationship: RelationshipType;
  confidence: Confidence;
  attestation: string;
  wiktionary: string;
  place: Place;
  extraSources?: ExtraSource[];
};

export type Source = ExtraSource;
