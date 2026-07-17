import type { ProfilePair, TypingProfile } from "./types";

/** How sure we are before opening a practice deal. */
export const COACH_GATES = {
  minSessions: 6,
  minTotalMistakes: 20,
  /** Absolute miss count for a substitution pair */
  minPairCount: 10,
  /** Pair must show up in this many distinct sessions */
  minPairSessions: 3,
  /** Pair must be at least this share of all mistakes */
  minPairShare: 0.08,
  minBigramCount: 12,
  minBigramSessions: 3,
  minPunctShare: 0.28,
  minPunctCount: 12,
  minLateErrors: 15,
  lateVsEarlyRatio: 1.8,
  maxDeals: 2,
} as const;

export function pairIsConfirmed(
  pair: ProfilePair & { sessions?: number },
  profile: TypingProfile,
): boolean {
  if (profile.sessionsSampled < COACH_GATES.minSessions) return false;
  if (profile.totalMistakes < COACH_GATES.minTotalMistakes) return false;
  if (pair.count < COACH_GATES.minPairCount) return false;
  const sessions = pair.sessions ?? 0;
  if (sessions < COACH_GATES.minPairSessions) return false;
  const share = pair.count / Math.max(1, profile.totalMistakes);
  return share >= COACH_GATES.minPairShare;
}

export function gatheringNote(profile: TypingProfile): string {
  const needSessions = Math.max(
    0,
    COACH_GATES.minSessions - profile.sessionsSampled,
  );
  const needMistakes = Math.max(
    0,
    COACH_GATES.minTotalMistakes - profile.totalMistakes,
  );
  if (needSessions > 0 || needMistakes > 0) {
    const bits: string[] = [];
    if (needSessions > 0) {
      bits.push(
        `${needSessions} more session${needSessions === 1 ? "" : "s"}`,
      );
    }
    if (needMistakes > 0) {
      bits.push("more typing with natural mistakes");
    }
    return `Still gathering signal — need ${bits.join(" and ")} before opening practice deals.`;
  }
  return "Patterns are forming, but nothing is confirmed yet. Keep typing — weak reaches must repeat across several sessions.";
}
