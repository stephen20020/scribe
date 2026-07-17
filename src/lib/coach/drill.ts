import {
  contextSentences,
  fatiguePhrases,
  punctPhrases,
  wordsForChar,
  wordsForDigraph,
} from "./word-banks";
import {
  formatPairKey,
  type CoachSeverity,
  type DrillPhase,
  type PracticeDeal,
} from "./types";

export type { DrillPhase, PracticeDeal };

function parsePair(focus: string): { expected: string; typed: string } | null {
  if (!focus.includes(">")) return null;
  const [expectedRaw, typedRaw] = focus.split(">");
  if (!expectedRaw || typedRaw == null) return null;
  return {
    expected: expectedRaw === "␣" ? " " : expectedRaw,
    typed: typedRaw === "␣" ? " " : typedRaw,
  };
}

function parseBigramFocus(focus: string): string | null {
  if (!focus.includes(">")) {
    return focus.length === 2 ? focus : null;
  }
  const left = focus.split(">")[0] ?? "";
  if (left.length >= 2) return left.slice(-2);
  return left || null;
}

function joinRounds(parts: string[], rounds: number): string {
  const unit = parts.filter(Boolean).join(" ");
  return Array.from({ length: rounds }, () => unit).join(" ");
}

function buildPairPhases(expected: string, confused: string): DrillPhase[] {
  const e = expected === " " ? "space" : expected;
  const words =
    expected === " "
      ? ["a", "an", "the", "to", "of", "in", "and", "for"]
      : wordsForChar(expected, 14);

  // Real words only — no gibberish letter spam (that remounted AI text felt buggy).
  const isolate = joinRounds([words.slice(0, 10).join(" ")], 2);
  const context = contextSentences(expected === " " ? "a" : expected).join(" ");
  const transfer = [
    contextSentences(expected === " " ? "th" : expected).join(" "),
    `Keep the ${e} reach clean` +
      (confused && confused !== " "
        ? `, not drifting toward ${confused}.`
        : "."),
    words.slice(0, 8).join(" "),
  ].join(" ");

  return [
    {
      id: "isolate",
      label: "Isolate",
      cue: `Warm the ${e} key. Slow. Accurate.`,
      text: isolate,
    },
    {
      id: "context",
      label: "Context",
      cue: "Same reach, inside real phrases.",
      text: context,
    },
    {
      id: "transfer",
      label: "Transfer",
      cue: "Keep form when lines lengthen.",
      text: transfer,
    },
  ];
}

function buildDigraphPhases(digraph: string): DrillPhase[] {
  const words = wordsForDigraph(digraph, 14);
  const isolate = joinRounds([words.join(" ")], 3);
  const context = contextSentences(digraph).join(" ");
  const transfer = [
    context,
    `Again: ${words.slice(0, 8).join(" ")}.`,
    "Finish calm. Same motion every time.",
  ].join(" ");

  return [
    {
      id: "isolate",
      label: "Isolate",
      cue: `Type ${digraph} as one stroke pair.`,
      text: isolate,
    },
    {
      id: "context",
      label: "Context",
      cue: `Feel ${digraph} inside full phrases.`,
      text: context,
    },
    {
      id: "transfer",
      label: "Transfer",
      cue: "Hold the pattern under light pressure.",
      text: transfer,
    },
  ];
}

function buildPunctPhases(): DrillPhase[] {
  const phrases = punctPhrases();
  return [
    {
      id: "isolate",
      label: "Isolate",
      cue: "Land each mark. Pause after it.",
      text: joinRounds(phrases.slice(0, 4), 2),
    },
    {
      id: "context",
      label: "Context",
      cue: "Marks inside short lines of sense.",
      text: phrases.join(" "),
    },
    {
      id: "transfer",
      label: "Transfer",
      cue: "Keep punctuation clean at pace.",
      text: [...phrases, ...phrases.slice(0, 3)].join(" "),
    },
  ];
}

function buildFatiguePhases(): DrillPhase[] {
  const phrases = fatiguePhrases();
  return [
    {
      id: "isolate",
      label: "Pace",
      cue: "Deliberately slow. No racing.",
      text: joinRounds(phrases.slice(0, 3), 2),
    },
    {
      id: "context",
      label: "Sustain",
      cue: "Same calm through the middle.",
      text: phrases.join(" "),
    },
    {
      id: "transfer",
      label: "Finish",
      cue: "End as clean as you began.",
      text: [...phrases, phrases[0]!, phrases[1]!].join(" "),
    },
  ];
}

/** Build a full progressive practice deal for a coach focus key. */
export function buildPracticeDeal(opts: {
  focus: string;
  count?: number;
  trend?: "up" | "down" | "flat";
  severity?: CoachSeverity;
  evidence?: string[];
}): PracticeDeal {
  const { focus } = opts;
  const severity =
    opts.severity ?? (opts.count && opts.count >= 10 ? "focus" : "watch");
  const evidence = opts.evidence ?? [];

  if (focus === "punctuation") {
    return {
      id: "deal-punctuation",
      focus,
      title: "Punctuation clinic",
      why: "Scripture is dense with commas, apostrophes, and pauses. This deal rebuilds clean mark landings.",
      severity: severity === "info" ? "focus" : severity,
      evidence,
      phases: buildPunctPhases(),
      href: drillHref(focus),
    };
  }

  if (focus === "fatigue") {
    return {
      id: "deal-fatigue",
      focus,
      title: "Steady-finish deal",
      why: "Your errors climb late. This deal trains an even pace so the last line matches the first.",
      severity: "info",
      evidence,
      phases: buildFatiguePhases(),
      href: drillHref(focus),
    };
  }

  const pair = parsePair(focus);
  if (pair && [...pair.expected].length === 1) {
    const label = formatPairKey(focus);
    const [want, got] = label.split(">");
    return {
      id: `deal-${focus}`,
      focus,
      title: `Fix ${label}`,
      why: `When the text wants “${want}”, you often hit “${got}”. Three phases: isolate the reach, then words, then longer lines.`,
      severity,
      evidence:
        evidence.length > 0
          ? evidence
          : opts.count != null
            ? [
                `${label} ×${opts.count}${opts.trend === "up" ? " · rising" : ""}`,
              ]
            : [],
      expectedChar: pair.expected,
      confusedWith: pair.typed,
      phases: buildPairPhases(pair.expected, pair.typed),
      href: drillHref(focus),
    };
  }

  const digraph = parseBigramFocus(focus) ?? focus;
  return {
    id: `deal-${focus}`,
    focus,
    title: `Link ${digraph}`,
    why: `A repeating two-letter pattern is catching you. Practice ${digraph} as one motion.`,
    severity,
    evidence,
    phases: buildDigraphPhases(digraph),
    href: drillHref(focus),
  };
}

export function flattenDealText(deal: PracticeDeal): string {
  return deal.phases.map((p) => p.text).join("  ");
}

export function getDealPhase(
  deal: PracticeDeal,
  phaseId?: string | null,
): DrillPhase {
  if (!phaseId) return deal.phases[0]!;
  return deal.phases.find((p) => p.id === phaseId) ?? deal.phases[0]!;
}

export function drillHref(focus: string, phase?: string): string {
  const params = new URLSearchParams({ focus });
  if (phase) params.set("phase", phase);
  return `/coach/drill?${params.toString()}`;
}

export function drillLabel(focus: string): string {
  if (focus === "punctuation") return "Punctuation clinic";
  if (focus === "fatigue") return "Steady-finish deal";
  if (focus.includes(">")) return `Practice ${formatPairKey(focus)}`;
  return "Coach practice";
}

export function buildDrillText(focusKeys: string[], rounds = 4): string {
  const focus = focusKeys[0];
  if (!focus) return "The quick brown fox jumps over the lazy dog.";
  const deal = buildPracticeDeal({ focus });
  const text = flattenDealText(deal);
  if (rounds <= 1) return text;
  return joinRounds([text], Math.min(2, rounds));
}

export function focusPairMisses(
  focus: string,
  pairs: Record<string, number> | undefined,
): number {
  if (!pairs) return 0;
  return pairs[focus] ?? 0;
}
