import { drillHref, drillLabel } from "./drill";
import { formatPairKey, type CoachInsight, type CoachResult, type TypingProfile } from "./types";

function pairDrill(key: string) {
  return {
    label: drillLabel(key),
    href: drillHref(key),
    focus: key,
  };
}

/** Deterministic coach — always available, feeds the same shape as AI. */
export function buildRulesCoach(profile: TypingProfile): CoachResult {
  const insights: CoachInsight[] = [];

  if (profile.sessionsSampled === 0 || profile.totalMistakes < 3) {
    return {
      insights: [],
      narrative:
        "Type a few lessons and your coach will start spotting patterns in your mistakes.",
      source: "rules",
      suggestedDrill: null,
    };
  }

  const top = profile.topPairs[0];
  if (top && top.count >= 3) {
    insights.push({
      id: `pair-${top.key}`,
      headline: `Watch ${formatPairKey(top.key)}`,
      detail: `When the text wants “${formatPairKey(top.key).split(">")[0] ?? "?"}”, you often hit the other key instead. Slow down just on that reach.`,
      severity: top.count >= 10 ? "focus" : "watch",
      evidence: [
        `${formatPairKey(top.key)} ×${top.count} across ${profile.sessionsSampled} sessions`,
        top.trend === "up" ? "Showing up more lately" : "Still in your top misses",
      ],
      drill: pairDrill(top.key),
    });
  }

  const bi = profile.topBigrams[0];
  if (bi && bi.count >= 3) {
    const focus = top?.key ?? bi.key;
    insights.push({
      id: `bigram-${bi.key}`,
      headline: "Letter-pair stumble",
      detail:
        "A repeating two-letter pattern is catching you. Practice that sequence as one motion instead of two separate keys.",
      severity: "watch",
      evidence: [`${formatPairKey(bi.key)} ×${bi.count}`],
      drill: pairDrill(focus),
    });
  }

  if (
    profile.punctuationErrors >= 4 &&
    profile.totalMistakes > 0 &&
    profile.punctuationErrors / profile.totalMistakes >= 0.2
  ) {
    insights.push({
      id: "punctuation",
      headline: "Punctuation friction",
      detail:
        "A large share of your misses are commas, apostrophes, or similar marks — common in Scripture typing.",
      severity: "focus",
      evidence: [
        `${profile.punctuationErrors} punctuation misses of ${profile.totalMistakes} total`,
      ],
      drill: {
        label: drillLabel("punctuation"),
        href: drillHref("punctuation"),
        focus: "punctuation",
      },
    });
  }

  if (
    profile.lateErrors >= 5 &&
    profile.lateErrors > profile.earlyErrors * 1.4
  ) {
    insights.push({
      id: "fatigue",
      headline: "Errors rise as you go",
      detail:
        "You start cleaner than you finish. Try shorter passages, or pause once when accuracy dips.",
      severity: "info",
      evidence: [
        `${profile.earlyErrors} early vs ${profile.lateErrors} after the first minute`,
      ],
      drill: {
        label: drillLabel("fatigue"),
        href: drillHref("fatigue"),
        focus: "fatigue",
      },
    });
  }

  const limited = insights.slice(0, 3);
  const primary = limited.find((i) => i.severity)?.drill ?? limited[0]?.drill ?? null;

  const narrative =
    limited.length === 0
      ? "Keep typing — once a few patterns repeat, your coach will call them out here."
      : limited.length === 1
        ? `${limited[0].headline}. ${limited[0].detail}`
        : `Your strongest signal is ${limited[0].headline.toLowerCase()}. ${limited[0].detail} Also worth watching: ${limited
            .slice(1)
            .map((i) => i.headline.toLowerCase())
            .join("; ")}.`;

  return {
    insights: limited,
    narrative,
    source: "rules",
    suggestedDrill: primary,
  };
}
