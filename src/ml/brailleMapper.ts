/**
 * Braille Mapper Module
 * 
 * Converts detected dot patterns into text characters.
 * Supports Grade-1 and Grade-2 (contracted) Braille.
 */

import BRAILLE_MAP, { type BrailleDots } from "@/lib/brailleMap";

// Reverse map: dots pattern → character
const REVERSE_MAP = new Map<string, string>();
Object.entries(BRAILLE_MAP).forEach(([char, dots]) => {
  REVERSE_MAP.set(dots.join(","), char);
});

/**
 * Convert a single dot pattern to its character.
 */
export function dotsToChar(dots: BrailleDots): string {
  return REVERSE_MAP.get(dots.join(",")) || "?";
}

/**
 * Convert an array of dot patterns to text.
 */
export function patternsToText(patterns: BrailleDots[]): string {
  return patterns.map(dotsToChar).join("");
}

/**
 * Grade-2 contraction expansion (stub).
 * Common contractions like "the", "and", "for", etc.
 */
const CONTRACTIONS: Record<string, string> = {
  "⠮": "the",
  "⠿": "for",
  "⠯": "and",
  "⠾": "with",
  "⠡": "ch",
  "⠩": "sh",
  "⠹": "th",
  "⠱": "wh",
  "⠳": "ou",
  "⠪": "ow",
};

export function expandContractions(brailleText: string): string {
  let result = brailleText;
  for (const [symbol, expansion] of Object.entries(CONTRACTIONS)) {
    result = result.split(symbol).join(expansion);
  }
  return result;
}
