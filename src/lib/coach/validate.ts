import type { MistakeSummary, TypingProfile } from "./types";
import { emptyMistakeSummary, emptyTypingProfile } from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asCountMap(v: unknown): Record<string, number> {
  if (!isRecord(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v)) {
    if (typeof n === "number" && Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return out;
}

export function parseMistakeSummary(raw: unknown): MistakeSummary | null {
  if (!isRecord(raw)) return null;
  const base = emptyMistakeSummary();
  return {
    pairs: asCountMap(raw.pairs),
    bigrams: asCountMap(raw.bigrams),
    byChar: asCountMap(raw.byChar),
    earlyErrors:
      typeof raw.earlyErrors === "number" ? raw.earlyErrors : base.earlyErrors,
    lateErrors:
      typeof raw.lateErrors === "number" ? raw.lateErrors : base.lateErrors,
    punctuationErrors:
      typeof raw.punctuationErrors === "number"
        ? raw.punctuationErrors
        : base.punctuationErrors,
    totalMistakes:
      typeof raw.totalMistakes === "number"
        ? raw.totalMistakes
        : base.totalMistakes,
  };
}

export function parseTypingProfile(raw: unknown): TypingProfile | null {
  if (!isRecord(raw)) return null;
  const base = emptyTypingProfile();
  const drill = isRecord(raw.suggestedDrill)
    ? {
        label: String(raw.suggestedDrill.label ?? "Coach warm-up"),
        href: String(raw.suggestedDrill.href ?? "/warm-up"),
        focus: String(raw.suggestedDrill.focus ?? "general"),
      }
    : null;

  return {
    ...base,
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
    sessionsSampled:
      typeof raw.sessionsSampled === "number"
        ? raw.sessionsSampled
        : base.sessionsSampled,
    topPairs: Array.isArray(raw.topPairs)
      ? (raw.topPairs as TypingProfile["topPairs"])
      : [],
    topBigrams: Array.isArray(raw.topBigrams)
      ? (raw.topBigrams as TypingProfile["topBigrams"])
      : [],
    weakChars: Array.isArray(raw.weakChars)
      ? (raw.weakChars as TypingProfile["weakChars"])
      : [],
    earlyErrors:
      typeof raw.earlyErrors === "number" ? raw.earlyErrors : 0,
    lateErrors: typeof raw.lateErrors === "number" ? raw.lateErrors : 0,
    punctuationErrors:
      typeof raw.punctuationErrors === "number" ? raw.punctuationErrors : 0,
    totalMistakes:
      typeof raw.totalMistakes === "number" ? raw.totalMistakes : 0,
    narrative: typeof raw.narrative === "string" ? raw.narrative : null,
    narrativeAt: typeof raw.narrativeAt === "string" ? raw.narrativeAt : null,
    narrativeSource:
      raw.narrativeSource === "ai" || raw.narrativeSource === "rules"
        ? raw.narrativeSource
        : null,
    suggestedDrill: drill,
  };
}
