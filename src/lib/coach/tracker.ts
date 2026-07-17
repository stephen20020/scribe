import {
  emptyMistakeSummary,
  isPunctuation,
  pairKey,
  paceBucket,
  type MistakeEvent,
  type MistakeSummary,
} from "./types";

const MAX_EVENTS = 200;
const EARLY_MS = 15_000;
const LATE_MS = 60_000;

/** Ref-friendly mistake collector — no React, no allocations on correct keys. */
export function createMistakeTracker() {
  const events: MistakeEvent[] = [];

  return {
    reset() {
      events.length = 0;
    },

    record(event: MistakeEvent) {
      if (events.length >= MAX_EVENTS) events.shift();
      events.push(event);
    },

    summarize(): MistakeSummary {
      const summary = emptyMistakeSummary();
      for (const ev of events) {
        summary.totalMistakes += 1;
        const pk = pairKey(ev.expected, ev.typed);
        summary.pairs[pk] = (summary.pairs[pk] ?? 0) + 1;
        summary.byChar[ev.expected] = (summary.byChar[ev.expected] ?? 0) + 1;

        if (ev.prev) {
          const expectedBi = `${ev.prev}${ev.expected}`;
          const typedBi = `${ev.prev}${ev.typed}`;
          const bk =
            ev.typed === ev.prev
              ? `${expectedBi}>${ev.typed}${ev.expected}`
              : `${expectedBi}>${typedBi}`;
          summary.bigrams[bk] = (summary.bigrams[bk] ?? 0) + 1;
        }

        if (ev.atMs < EARLY_MS) summary.earlyErrors += 1;
        if (ev.atMs >= LATE_MS) summary.lateErrors += 1;
        if (isPunctuation(ev.expected)) summary.punctuationErrors += 1;

        const bucket = paceBucket(ev.gapMs);
        summary.paceErrors[bucket] += 1;
      }
      return summary;
    },
  };
}

export type MistakeTracker = ReturnType<typeof createMistakeTracker>;
