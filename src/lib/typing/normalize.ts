/** Map curly/smart punctuation to keys a keyboard actually sends. */
export function normalizeTypingChar(ch: string): string {
  switch (ch) {
    case "\u2018": // ‘
    case "\u2019": // ’
    case "\u02BC": // ʼ
    case "`":
      return "'";
    case "\u201C": // “
    case "\u201D": // ”
      return '"';
    case "\u2013": // –
    case "\u2014": // —
      return "-";
    case "\u00A0": // nbsp
      return " ";
    default:
      return ch;
  }
}

/**
 * Strip combining marks so Spanish accents/tildes don't require special keys.
 * á/Á → a/A, ñ/Ñ → n/N, ü → u, etc. Display text keeps the accents.
 */
export function foldDiacritics(ch: string): string {
  return ch.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Compare what the user typed against the expected character. */
export function normalizeForMatch(ch: string): string {
  return foldDiacritics(normalizeTypingChar(ch));
}

export function normalizeTypingText(text: string): string {
  return [...text]
    .map(normalizeTypingChar)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
