export type MistakePairKey = string; // "e>r"

export interface MistakeEvent {
  expected: string;
  typed: string;
  prev: string | null;
  atMs: number;
  index: number;
}

export interface MistakeSummary {
  pairs: Record<string, number>;
  bigrams: Record<string, number>;
  byChar: Record<string, number>;
  earlyErrors: number;
  lateErrors: number;
  punctuationErrors: number;
  totalMistakes: number;
}

export interface ProfilePair {
  key: string;
  count: number;
  trend: "up" | "down" | "flat";
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
  /** Cached AI / rules narrative */
  narrative: string | null;
  narrativeAt: string | null;
  narrativeSource: "rules" | "ai" | null;
  suggestedDrill: { label: string; href: string; focus: string } | null;
}

export type CoachSeverity = "info" | "watch" | "focus";

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
  narrative: string;
  source: "rules" | "ai";
  suggestedDrill: { label: string; href: string; focus: string } | null;
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
