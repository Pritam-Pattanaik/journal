/**
 * Entity Tagger
 *
 * Maps news headlines to NSE sector buckets using keyword matching.
 * This is intentionally a dictionary approach (not an NLP model) for:
 *  - Zero additional API cost
 *  - Deterministic, auditable output
 *  - Zero latency (synchronous)
 *  - Easy maintenance by non-engineers (just update SECTOR_KEYWORDS in config.ts)
 *
 * Returns an array of matching Nifty sector names.
 * An item can match multiple sectors (e.g., an RBI rate decision impacts both
 * Nifty Bank AND Nifty Financial Services).
 */

import { SECTOR_KEYWORDS } from '../config';

/**
 * Tag a headline with matching Nifty sector buckets.
 * Returns deduplicated array of sector names.
 */
export function tagSectors(headline: string, body?: string): string[] {
  const text = `${headline} ${body || ''}`.toLowerCase();
  const matched = new Set<string>();

  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) {
        matched.add(sector);
        break; // One keyword match per sector is enough
      }
    }
  }

  return Array.from(matched);
}

/**
 * Determine if an item is likely India-market relevant based on keywords.
 * Used as a pre-triage gate to skip truly irrelevant items before LLM.
 *
 * Returns true if the headline contains any Indian market indicator.
 */
const INDIA_RELEVANCE_KEYWORDS = [
  'india', 'indian', 'nse', 'bse', 'nifty', 'sensex', 'sebi', 'rbi', 'ₓ₹',
  'rupee', 'mumbai', 'delhi', 'government of india', 'finance ministry',
  'q1', 'q2', 'q3', 'q4', 'fy', 'crore', 'lakh', 'inr',
  // Major Indian companies — not for ADVISORY output, only for relevance gate
  'reliance', 'tcs', 'infosys', 'hdfc', 'icici', 'sbi', 'adani', 'tata',
  'bajaj', 'wipro', 'kotak', 'maruti', 'ongc', 'powergrid', 'ntpc',
];

export function isIndiaRelevant(headline: string, source: string): boolean {
  // NSE, BSE, RBI, PIB are always India-relevant by definition
  if (['NSE', 'BSE', 'RBI', 'PIB'].includes(source.toUpperCase())) return true;

  const text = headline.toLowerCase();
  return INDIA_RELEVANCE_KEYWORDS.some(kw => text.includes(kw));
}
