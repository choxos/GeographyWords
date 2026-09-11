import type { Confidence, RelationshipType } from "./types";

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  direct_toponym: "Named from the place",
  demonym: "From the people of the place",
  product_from_place: "Named for a product of the place",
  historical_place_name: "Named through a historical place-name",
  indirect_derivation: "Indirect, via a person or title",
  disputed: "Origin is disputed",
};

export const RELATIONSHIP_SHORT: Record<RelationshipType, string> = {
  direct_toponym: "From the place",
  demonym: "From its people",
  product_from_place: "From its product",
  historical_place_name: "Historical name",
  indirect_derivation: "Indirect",
  disputed: "Disputed",
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  "well-attested": "Well attested",
  probable: "Probable",
  disputed: "Disputed",
};

/** Maps a confidence value onto the chip variant that colors it. */
export const CONFIDENCE_TONE: Record<Confidence, string> = {
  "well-attested": "chip-attested",
  probable: "chip-probable",
  disputed: "chip-disputed",
};

export const CONFIDENCE_NOTE: Record<Confidence, string> = {
  "well-attested": "The place link is the standard scholarly account.",
  probable: "The conventional story is likely, with caveats.",
  disputed: "Competing explanations remain live.",
};
