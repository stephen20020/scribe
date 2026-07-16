import {
  buildPracticeDeal,
  drillHref,
  drillLabel,
  type PracticeDeal,
} from "./drill";
import {
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

/** Deterministic coach — always available, feeds the same shape as AI. */
export function buildRulesCoach(profile: TypingProfile): CoachResult {
  const insights: CoachInsight[] = [];
  const deals: PracticeDeal[] = [];

  if (profile.sessionsSampled === 0 || profile.totalMistakes < 3) {
    return {
      insights: [],
      deals: [],
      narrative:
        "Type a few lessons and your coach will start spotting patterns — then build custom practice deals for each one.",
      source: "rules",
      suggestedDrill: null,
    };
  }

  // Top substitution pairs → each gets its own practice deal
  for (const pair of profile.topPairs.slice(0, 4)) {
    if (pair.count < 2) continue;
    const deal = buildPracticeDeal({
      focus: pair.key,
      count: pair.count,
      trend: pair.trend,
      severity: pair.count >= 10 ? "focus" : "watch",
      evidence: [
        `${formatPairKey(pair.key)} ×${pair.count} across ${profile.sessionsSampled} sessions`,
        pair.trend === "up"
          ? "Rising lately"
          : pair.trend === "down"
            ? "Easing — keep the pressure on"
            : "Still in your top misses",
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
  }

  const bi = profile.topBigrams[0];
  if (bi && bi.count >= 3) {
    const digraphFocus = bi.key.includes(">")
      ? (bi.key.split(">")[0]?.slice(-2) ?? bi.key)
      : bi.key;
    // Avoid duplicate if already covered by a pair deal
    if (!deals.some((d) => d.focus === digraphFocus || d.id.includes(digraphFocus))) {
      const deal = buildPracticeDeal({
        focus: digraphFocus,
        count: bi.count,
        severity: "watch",
        evidence: [`${formatPairKey(bi.key)} ×${bi.count}`],
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
    profile.punctuationErrors >= 4 &&
    profile.totalMistakes > 0 &&
    profile.punctuationErrors / profile.totalMistakes >= 0.18
  ) {
    const deal = buildPracticeDeal({
      focus: "punctuation",
      severity: "focus",
      evidence: [
        `${profile.punctuationErrors} punctuation misses of ${profile.totalMistakes} total`,
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
    profile.lateErrors >= 5 &&
    profile.lateErrors > profile.earlyErrors * 1.35
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

  const limitedDeals = deals.slice(0, 5);
  const limitedInsights = insights.slice(0, 5);
  const primary = limitedDeals[0]
    ? linkFor(limitedDeals[0].focus)
    : null;

  const narrative =
    limitedDeals.length === 0
      ? "Keep typing — once a few patterns repeat, your coach will open practice deals here."
      : limitedDeals.length === 1
        ? `${limitedDeals[0].title}. ${limitedDeals[0].why}`
        : `You have ${limitedDeals.length} custom practice deals. Start with ${limitedDeals[0].title.toLowerCase()} — ${limitedDeals[0].why} Also queued: ${limitedDeals
            .slice(1)
            .map((d) => d.title.toLowerCase())
            .join("; ")}.`;

  return {
    insights: limitedInsights,
    deals: limitedDeals,
    narrative,
    source: "rules",
    suggestedDrill: primary,
  };
}
