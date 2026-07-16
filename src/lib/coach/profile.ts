import {
  emptyTypingProfile,
  type MistakeSummary,
  type ProfilePair,
  type TypingProfile,
} from "./types";

const TOP_N = 12;

function topEntries(
  map: Record<string, number>,
  n = TOP_N,
): { key: string; count: number }[] {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function withTrend(
  current: { key: string; count: number }[],
  previous: ProfilePair[],
): ProfilePair[] {
  const prevMap = new Map(previous.map((p) => [p.key, p.count]));
  return current.map(({ key, count }) => {
    const before = prevMap.get(key);
    let trend: ProfilePair["trend"] = "flat";
    if (before == null) trend = "up";
    else if (count > before * 1.15) trend = "up";
    else if (count < before * 0.85) trend = "down";
    return { key, count, trend };
  });
}

function mergeCounts(
  into: Record<string, number>,
  from: Record<string, number>,
) {
  for (const [k, v] of Object.entries(from)) {
    into[k] = (into[k] ?? 0) + v;
  }
}

/** Rebuild profile from recent session summaries (source of truth). */
export function rebuildTypingProfile(
  summaries: MistakeSummary[],
  previous: TypingProfile | null = null,
): TypingProfile {
  const base = previous ?? emptyTypingProfile();
  if (summaries.length === 0) {
    return {
      ...emptyTypingProfile(),
      narrative: base.narrative,
      narrativeAt: base.narrativeAt,
      narrativeSource: base.narrativeSource,
      suggestedDrill: base.suggestedDrill,
    };
  }

  const pairs: Record<string, number> = {};
  const bigrams: Record<string, number> = {};
  const byChar: Record<string, number> = {};
  let earlyErrors = 0;
  let lateErrors = 0;
  let punctuationErrors = 0;
  let totalMistakes = 0;

  for (const s of summaries) {
    mergeCounts(pairs, s.pairs);
    mergeCounts(bigrams, s.bigrams);
    mergeCounts(byChar, s.byChar);
    earlyErrors += s.earlyErrors;
    lateErrors += s.lateErrors;
    punctuationErrors += s.punctuationErrors;
    totalMistakes += s.totalMistakes;
  }

  return {
    updatedAt: new Date().toISOString(),
    sessionsSampled: summaries.length,
    topPairs: withTrend(topEntries(pairs), base.topPairs),
    topBigrams: withTrend(topEntries(bigrams), base.topBigrams),
    weakChars: withTrend(topEntries(byChar), base.weakChars),
    earlyErrors,
    lateErrors,
    punctuationErrors,
    totalMistakes,
    narrative: base.narrative,
    narrativeAt: base.narrativeAt,
    narrativeSource: base.narrativeSource,
    suggestedDrill: base.suggestedDrill,
  };
}

export function summariesFromSessions(
  sessions: { mistakeSummary?: MistakeSummary | null }[],
  limit = 40,
): MistakeSummary[] {
  return sessions
    .slice(0, limit)
    .map((s) => s.mistakeSummary)
    .filter((s): s is MistakeSummary => Boolean(s && s.totalMistakes >= 0));
}
