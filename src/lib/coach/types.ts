export type MistakePairKey = string; // "e>r"

export type PaceBucket = "rush" | "steady" | "slow";

export interface MistakeEvent {
  expected: string;
  typed: string;
  prev: string | null;
  atMs: number;
  /** Inter-key interval before this mistake (ms). 0 if unknown. */
  gapMs: number;
  index: number;
}

export interface PaceBuckets {
  rush: number;
  steady: number;
  slow: number;
}

export interface MistakeSummary {
  pairs: Record<string, number>;
  bigrams: Record<string, number>;
  byChar: Record<string, number>;
  earlyErrors: number;
  lateErrors: number;
  punctuationErrors: number;
  totalMistakes: number;
  /** Mistakes bucketed by inter-key gap */
  paceErrors: PaceBuckets;
}

export interface ProfilePair {
  key: string;
  count: number;
  trend: "up" | "down" | "flat";
  /** Distinct sessions where this pair appeared */
  sessions?: number;
}

export interface TypingProfile {
  updatedAt: string;
  sessionsSampled: number;
  topPairs: ProfilePair[];
  topBigrams: ProfilePair[];
  weakChars: ProfilePair[];
  earlyErrors: number;
  lateErrors: number;
  punctuationErrors: number;
  totalMistakes: number;
  paceErrors: PaceBuckets;
  /** Cached AI / rules narrative */
  narrative: string | null;
  narrativeAt: string | null;
  narrativeSource: "rules" | "ai" | null;
  suggestedDrill: { label: string; href: string; focus: string } | null;
}

export type CoachSeverity = "info" | "watch" | "focus";

export interface DrillPhase {
  id: "isolate" | "context" | "transfer";
  label: string;
  cue: string;
  text: string;
}

export interface PracticeDeal {
  id: string;
  focus: string;
  title: string;
  why: string;
  severity: CoachSeverity;
  evidence: string[];
  expectedChar?: string;
  confusedWith?: string;
  phases: DrillPhase[];
  href: string;
}

export interface CoachInsight {
  id: string;
  headline: string;
  detail: string;
  severity: CoachSeverity;
  evidence: string[];
  drill?: { label: string; href: string; focus: string };
}

export interface CoachResult {
  insights: CoachInsight[];
  deals: PracticeDeal[];
  /** Near-miss patterns — shown as gathering, not actionable deals */
  watching: { key: string; count: number; sessions: number; note: string }[];
  narrative: string;
  pacingNote: string | null;
  source: "rules" | "ai";
  suggestedDrill: { label: string; href: string; focus: string } | null;
}

export function emptyPaceBuckets(): PaceBuckets {
  return { rush: 0, steady: 0, slow: 0 };
}

export function emptyMistakeSummary(): MistakeSummary {
  return {
    pairs: {},
    bigrams: {},
    byChar: {},
    earlyErrors: 0,
    lateErrors: 0,
    punctuationErrors: 0,
    totalMistakes: 0,
    paceErrors: emptyPaceBuckets(),
  };
}

export function emptyTypingProfile(): TypingProfile {
  return {
    updatedAt: new Date(0).toISOString(),
    sessionsSampled: 0,
    topPairs: [],
    topBigrams: [],
    weakChars: [],
    earlyErrors: 0,
    lateErrors: 0,
    punctuationErrors: 0,
    totalMistakes: 0,
    paceErrors: emptyPaceBuckets(),
    narrative: null,
    narrativeAt: null,
    narrativeSource: null,
    suggestedDrill: null,
  };
}

export function pairKey(expected: string, typed: string): string {
  const e = expected === " " ? "␣" : expected;
  const t = typed === " " ? "␣" : typed;
  return `${e}>${t}`;
}

export function formatPairKey(key: string): string {
  return key.replace(/␣/g, "space");
}

export function isPunctuation(ch: string): boolean {
  return /[^\p{L}\p{N}\s]/u.test(ch);
}

/** Classify inter-key gap. Rush ≈ above comfortable speed. */
export function paceBucket(gapMs: number): PaceBucket {
  if (gapMs > 0 && gapMs < 90) return "rush";
  if (gapMs >= 90 && gapMs <= 220) return "steady";
  return "slow";
}

export function dominantPace(buckets: PaceBuckets): PaceBucket | null {
  const total = buckets.rush + buckets.steady + buckets.slow;
  if (total < 8) return null;
  const entries = Object.entries(buckets) as [PaceBucket, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [top, n] = entries[0]!;
  if (n / total < 0.45) return null;
  return top;
}
