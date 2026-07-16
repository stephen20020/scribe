import { formatPairKey } from "./types";

/** Build a short practice string from weak substitution pairs. */
export function buildDrillText(focusKeys: string[], rounds = 4): string {
  const chunks: string[] = [];
  for (const key of focusKeys.slice(0, 4)) {
    const [expected] = key.split(">");
    const ch = expected === "␣" ? " " : expected;
    if (!ch) continue;
    // Repeat the expected char in short words-ish patterns
    if (ch === " ") {
      chunks.push("a a a an an the the");
    } else if (/[.,;:'"!?]/.test(ch)) {
      chunks.push(`yes${ch} no${ch} yes${ch}`);
    } else {
      chunks.push(`${ch}${ch}${ch} ${ch}a${ch} ${ch}e${ch} ${ch}${ch}`);
    }
  }
  if (chunks.length === 0) {
    return "The quick brown fox jumps over the lazy dog.";
  }
  const unit = chunks.join("  ");
  return Array.from({ length: rounds }, () => unit).join("  ");
}

export function drillHref(focus: string): string {
  const params = new URLSearchParams({
    mode: "coach",
    focus,
  });
  return `/warm-up?${params.toString()}`;
}

export function drillLabel(focus: string): string {
  if (focus === "punctuation") return "Practice punctuation";
  if (focus === "fatigue") return "Steady-pace warm-up";
  if (focus.includes(">")) {
    return `Drill ${formatPairKey(focus)}`;
  }
  return "Coach warm-up";
}
