import {
  emptyPaceBuckets,
  emptyTypingProfile,
  type MistakeSummary,
  type ProfilePair,
  type TypingProfile,
} from "./types";

const TOP_N = 12;

function topEntries(
  map: Record<string, number>,
  sessionHits: Record<string, number>,
  n = TOP_N,
): { key: string; count: number; sessions: number }[] {
  return Object.entries(map)
    .map(([key, count]) => ({
      key,
      count,
      sessions: sessionHits[key] ?? 0,
    }))
    .sort((a, b) => b.count - a.count || b.sessions - a.sessions)
    .slice(0, n);
}

function withTrend(
  current: { key: string; count: number; sessions: number }[],
  previous: ProfilePair[],
): ProfilePair[] {
  const prevMap = new Map(previous.map((p) => [p.key, p.count]));
  return current.map(({ key, count, sessions }) => {
    const before = prevMap.get(key);
    let trend: ProfilePair["trend"] = "flat";
    if (before == null) trend = "up";
    else if (count > before * 1.15) trend = "up";
    else if (count < before * 0.85) trend = "down";
    return { key, count, trend, sessions };
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

function bumpSessionHits(
  hits: Record<string, number>,
  from: Record<string, number>,
) {
  for (const [k, v] of Object.entries(from)) {
    if (v > 0) hits[k] = (hits[k] ?? 0) + 1;
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
  const pairSessions: Record<string, number> = {};
  const bigramSessions: Record<string, number> = {};
  const charSessions: Record<string, number> = {};
  const paceErrors = emptyPaceBuckets();
  let earlyErrors = 0;
  let lateErrors = 0;
  let punctuationErrors = 0;
  let totalMistakes = 0;

  for (const s of summaries) {
    mergeCounts(pairs, s.pairs);
    mergeCounts(bigrams, s.bigrams);
    mergeCounts(byChar, s.byChar);
    bumpSessionHits(pairSessions, s.pairs);
    bumpSessionHits(bigramSessions, s.bigrams);
    bumpSessionHits(charSessions, s.byChar);
    earlyErrors += s.earlyErrors;
    lateErrors += s.lateErrors;
    punctuationErrors += s.punctuationErrors;
    totalMistakes += s.totalMistakes;
    const pe = s.paceErrors ?? emptyPaceBuckets();
    paceErrors.rush += pe.rush;
    paceErrors.steady += pe.steady;
    paceErrors.slow += pe.slow;
  }

  return {
    updatedAt: new Date().toISOString(),
    sessionsSampled: summaries.length,
    topPairs: withTrend(topEntries(pairs, pairSessions), base.topPairs),
    topBigrams: withTrend(
      topEntries(bigrams, bigramSessions),
      base.topBigrams,
    ),
    weakChars: withTrend(topEntries(byChar, charSessions), base.weakChars),
    earlyErrors,
    lateErrors,
    punctuationErrors,
    totalMistakes,
    paceErrors,
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
    .filter((s): s is MistakeSummary => Boolean(s && s.totalMistakes >= 0))
    .map((s) => ({
      ...s,
      paceErrors: s.paceErrors ?? emptyPaceBuckets(),
    }));
}
