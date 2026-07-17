import { COACH_GATES, gatheringNote, pairIsConfirmed } from "./certainty";
import {
  buildPracticeDeal,
  drillHref,
  drillLabel,
  type PracticeDeal,
} from "./drill";
import {
  dominantPace,
  emptyPaceBuckets,
  formatPairKey,
  type CoachInsight,
  type CoachResult,
  type TypingProfile,
} from "./types";

function linkFor(focus: string) {
  return {
    label: drillLabel(focus),
    href: drillHref(focus),
    focus,
  };
}

function pacingNoteFor(profile: TypingProfile): string | null {
  const pace = profile.paceErrors ?? emptyPaceBuckets();
  const dom = dominantPace(pace);
  if (!dom) return null;
  const total = pace.rush + pace.steady + pace.slow;
  const n = pace[dom];
  const pct = Math.round((n / Math.max(1, total)) * 100);
  if (dom === "rush") {
    return `${pct}% of recent mistakes happen when you rush (under ~90ms between keys). Slow the stroke just before weak reaches.`;
  }
  if (dom === "slow") {
    return `${pct}% of mistakes come on hesitant keys (long pauses). Hesitation often means an unsure reach — isolate that key in a short drill once it’s confirmed.`;
  }
  return `${pct}% of mistakes happen at a steady pace — more likely a true finger confusion than fatigue.`;
}

/** Deterministic coach — only surfaces deals when gates pass. */
export function buildRulesCoach(profile: TypingProfile): CoachResult {
  const insights: CoachInsight[] = [];
  const deals: PracticeDeal[] = [];
  const watching: CoachResult["watching"] = [];

  if (
    profile.sessionsSampled < COACH_GATES.minSessions ||
    profile.totalMistakes < COACH_GATES.minTotalMistakes
  ) {
    return {
      insights: [],
      deals: [],
      watching: [],
      narrative: gatheringNote(profile),
      pacingNote: pacingNoteFor(profile),
      source: "rules",
      suggestedDrill: null,
    };
  }

  for (const pair of profile.topPairs.slice(0, 8)) {
    if (pairIsConfirmed(pair, profile)) {
      if (deals.length >= COACH_GATES.maxDeals) continue;
      const deal = buildPracticeDeal({
        focus: pair.key,
        count: pair.count,
        trend: pair.trend,
        severity: pair.count >= 20 ? "focus" : "watch",
        evidence: [
          `${formatPairKey(pair.key)} ×${pair.count} in ${pair.sessions ?? "?"} sessions`,
        ],
      });
      deals.push(deal);
      insights.push({
        id: `pair-${pair.key}`,
        headline: deal.title,
        detail: deal.why,
        severity: deal.severity,
        evidence: deal.evidence,
        drill: linkFor(pair.key),
      });
    } else if (pair.count >= 5 && (pair.sessions ?? 0) >= 2) {
      watching.push({
        key: pair.key,
        count: pair.count,
        sessions: pair.sessions ?? 0,
        note: `Seen ${pair.count}× across ${pair.sessions ?? 0} sessions — not confirmed yet.`,
      });
    }
  }

  const bi = profile.topBigrams[0];
  if (
    bi &&
    bi.count >= COACH_GATES.minBigramCount &&
    (bi.sessions ?? 0) >= COACH_GATES.minBigramSessions &&
    deals.length < COACH_GATES.maxDeals
  ) {
    const digraphFocus = bi.key.includes(">")
      ? (bi.key.split(">")[0]?.slice(-2) ?? bi.key)
      : bi.key;
    if (!deals.some((d) => d.focus === digraphFocus)) {
      const deal = buildPracticeDeal({
        focus: digraphFocus,
        count: bi.count,
        severity: "watch",
        evidence: [
          `${formatPairKey(bi.key)} ×${bi.count} in ${bi.sessions ?? "?"} sessions`,
        ],
      });
      deals.push(deal);
      insights.push({
        id: `bigram-${bi.key}`,
        headline: deal.title,
        detail: deal.why,
        severity: deal.severity,
        evidence: deal.evidence,
        drill: linkFor(digraphFocus),
      });
    }
  }

  if (
    profile.punctuationErrors >= COACH_GATES.minPunctCount &&
    profile.totalMistakes > 0 &&
    profile.punctuationErrors / profile.totalMistakes >=
      COACH_GATES.minPunctShare &&
    deals.length < COACH_GATES.maxDeals
  ) {
    const deal = buildPracticeDeal({
      focus: "punctuation",
      severity: "focus",
      evidence: [
        `${profile.punctuationErrors} punctuation misses of ${profile.totalMistakes}`,
      ],
    });
    deals.push(deal);
    insights.push({
      id: "punctuation",
      headline: deal.title,
      detail: deal.why,
      severity: deal.severity,
      evidence: deal.evidence,
      drill: linkFor("punctuation"),
    });
  }

  if (
    profile.lateErrors >= COACH_GATES.minLateErrors &&
    profile.lateErrors > profile.earlyErrors * COACH_GATES.lateVsEarlyRatio &&
    deals.length < COACH_GATES.maxDeals
  ) {
    const deal = buildPracticeDeal({
      focus: "fatigue",
      severity: "info",
      evidence: [
        `${profile.earlyErrors} early vs ${profile.lateErrors} after the first minute`,
      ],
    });
    deals.push(deal);
    insights.push({
      id: "fatigue",
      headline: deal.title,
      detail: deal.why,
      severity: deal.severity,
      evidence: deal.evidence,
      drill: linkFor("fatigue"),
    });
  }

  const pacingNote = pacingNoteFor(profile);
  const primary = deals[0] ? linkFor(deals[0].focus) : null;

  let narrative: string;
  if (deals.length === 0) {
    narrative = gatheringNote(profile);
  } else if (deals.length === 1) {
    narrative = `Confirmed pattern: ${deals[0].title.replace(/^Fix /, "")}. ${deals[0].why}`;
  } else {
    narrative = `Confirmed ${deals.length} patterns. Start with ${deals[0].title}, then ${deals[1].title}.`;
  }

  return {
    insights,
    deals,
    watching: watching.slice(0, 4),
    narrative,
    pacingNote,
    source: "rules",
    suggestedDrill: primary,
  };
}
