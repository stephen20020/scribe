/** Curated English words for digraph / letter density drills. Calm, plain prose. */

const BY_LETTER: Record<string, string[]> = {
  a: ["and", "that", "faith", "grace", "always", "away", "again", "apart", "call", "path"],
  b: ["be", "but", "bless", "about", "before", "bring", "able", "bread", "humble", "better"],
  c: ["can", "come", "peace", "each", "voice", "care", "clear", "grace", "place", "because"],
  d: ["and", "word", "good", "did", "day", "Lord", "under", "deed", "guided", "ended"],
  e: ["the", "be", "there", "every", "peace", "these", "were", "even", "here", "never", "seek", "keep", "mercy", "deep", "rest"],
  f: ["of", "for", "faith", "from", "life", "after", "before", "soft", "offer", "comfort"],
  g: ["good", "grace", "give", "long", "light", "among", "going", "great", "sing", "strength"],
  h: ["the", "that", "with", "have", "when", "here", "heart", "truth", "shall", "hope", "path", "high"],
  i: ["in", "it", "is", "with", "his", "will", "light", "spirit", "faith", "still", "quiet", "rise"],
  j: ["just", "joy", "judge", "major", "enjoy", "journey", "reject", "project", "adjure"],
  k: ["like", "know", "keep", "make", "seek", "speak", "king", "ask", "dark", "take"],
  l: ["all", "will", "Lord", "light", "shall", "call", "still", "people", "holy", "bless", "little"],
  m: ["from", "him", "them", "come", "time", "make", "mercy", "among", "name", "amen", "calm"],
  n: ["and", "in", "not", "one", "when", "then", "into", "none", "under", "open", "known"],
  o: ["to", "of", "for", "not", "one", "word", "Lord", "good", "hope", "from", "onto", "soul"],
  p: ["up", "peace", "people", "path", "hope", "spirit", "open", "speak", "keep", "praise"],
  q: ["quiet", "quest", "equal", "require", "quite", "request", "sequence", "frequent"],
  r: ["are", "for", "from", "Lord", "there", "were", "truth", "grace", "mercy", "heart", "spirit", "ever"],
  s: ["is", "as", "this", "his", "shall", "peace", "bless", "spirit", "these", "rest", "seek"],
  t: ["the", "to", "that", "it", "with", "not", "truth", "heart", "still", "into", "light", "rest"],
  u: ["but", "you", "our", "under", "truth", "quiet", "upon", "sure", "full", "soul"],
  v: ["have", "every", "over", "even", "live", "give", "voice", "never", "cover", "serve"],
  w: ["with", "was", "when", "will", "word", "were", "who", "away", "power", "between"],
  x: ["next", "expect", "example", "except", "exalt", "extend", "express", "fix"],
  y: ["by", "you", "they", "my", "your", "only", "every", "glory", "mercy", "yet", "holy"],
  z: ["zeal", "gaze", "amazed", "frozen", "realize", "horizon", "prize", "buzz"],
};

const BY_DIGRAPH: Record<string, string[]> = {
  th: ["the", "that", "this", "with", "then", "them", "there", "these", "truth", "path", "faith", "both", "other"],
  he: ["the", "he", "they", "when", "there", "these", "heart", "where", "here", "she", "help"],
  in: ["in", "into", "within", "since", "bring", "mind", "find", "sing", "king", "light"],
  er: ["there", "were", "every", "mercy", "ever", "other", "under", "over", "serve", "power"],
  re: ["are", "there", "were", "rest", "grace", "great", "spirit", "present", "ready", "true"],
  an: ["and", "an", "than", "many", "can", "man", "hand", "stand", "thank", "grant"],
  on: ["on", "one", "into", "upon", "only", "among", "none", "known", "song", "strong"],
  en: ["when", "then", "even", "open", "ended", "sent", "enter", "strength", "gentle"],
  nd: ["and", "under", "end", "hand", "find", "stand", "kind", "land", "sound", "bound"],
  ed: ["ended", "needed", "called", "walked", "blessed", "guided", "opened", "rested"],
  es: ["these", "rest", "yes", "bless", "peace", "does", "times", "verses", "praises"],
  or: ["for", "or", "Lord", "word", "from", "before", "more", "glory", "world", "door"],
  te: ["the", "to", "truth", "still", "into", "water", "later", "quiet", "heart", "rest"],
  ti: ["it", "with", "still", "into", "time", "truth", "spirit", "light", "until", "quiet"],
  st: ["still", "rest", "first", "most", "just", "stand", "strength", "trust", "best"],
  nt: ["not", "into", "want", "unto", "sent", "present", "gentle", "grant", "count"],
  ou: ["you", "our", "your", "out", "about", "should", "sound", "house", "found", "soul"],
  ea: ["peace", "heart", "each", "great", "near", "hear", "leave", "teach", "bread", "clear"],
  ai: ["faith", "said", "again", "wait", "praise", "against", "rain", "fair", "remain"],
  ou2: ["you", "our", "your", "out", "about", "should", "sound", "house", "found"],
};

const PUNCT_PHRASES = [
  "Yes, Lord; keep me near.",
  "Wait: hope, then rise.",
  "Faith, hope, and love remain.",
  "Amen. So be it.",
  "Be still; know peace.",
  "Ask, seek, knock.",
  "Softly, surely, steadily.",
  "Here, now — and always.",
];

const FATIGUE_PHRASES = [
  "Slow is smooth. Smooth is fast.",
  "Breathe once. Then type the next word.",
  "Keep a quiet pace from start to finish.",
  "Accuracy first. Speed follows later.",
  "Finish as calmly as you began.",
  "One phrase at a time. No rush.",
];

function unique(words: string[]): string[] {
  return [...new Set(words.filter(Boolean))];
}

export function wordsForChar(ch: string, n = 12): string[] {
  const key = ch.toLowerCase();
  const bank = BY_LETTER[key] ?? [];
  if (bank.length >= n) return bank.slice(0, n);
  // Fallback: invent simple CV patterns around the letter
  const fillers = ["a", "e", "i", "o", "u"].flatMap((v) => [
    `${ch}${v}${ch}`,
    `${v}${ch}${v}`,
    `${ch}${v}`,
  ]);
  return unique([...bank, ...fillers]).slice(0, n);
}

export function wordsForDigraph(digraph: string, n = 12): string[] {
  const key = digraph.toLowerCase();
  const bank = BY_DIGRAPH[key] ?? [];
  if (bank.length > 0) return bank.slice(0, n);
  // Pull words containing both letters in order when possible
  const [a, b] = [...key];
  if (!a || !b) return wordsForChar(key[0] ?? "e", n);
  const fromA = wordsForChar(a, 20).filter((w) => w.includes(key));
  const mixed = unique([
    ...fromA,
    ...wordsForChar(a, 10),
    ...wordsForChar(b, 10),
  ]);
  return mixed.slice(0, n);
}

export function punctPhrases(): string[] {
  return [...PUNCT_PHRASES];
}

export function fatiguePhrases(): string[] {
  return [...FATIGUE_PHRASES];
}

/** Sentences that pack a digraph / letter without sounding like gibberish. */
export function contextSentences(target: string): string[] {
  const t = target.toLowerCase();
  if (t === "th") {
    return [
      "Then the path of truth held them both.",
      "With that faith they went through the thicket.",
      "These thoughts gather strength within the heart.",
    ];
  }
  if (t.length === 1) {
    const words = wordsForChar(t, 8).join(" ");
    return [
      `Keep ${words} in a steady line.`,
      `Again: ${words}. Soft hands, clear eyes.`,
      `One more pass with ${t}: ${words}.`,
    ];
  }
  if (t.length === 2) {
    const words = wordsForDigraph(t, 8).join(" ");
    return [
      `Link ${t} as one motion: ${words}.`,
      `Again through ${t}: ${words}.`,
      `Hold the rhythm of ${t} here: ${words}.`,
    ];
  }
  return ["Slow is smooth. Smooth is fast. Keep a steady pace."];
}
