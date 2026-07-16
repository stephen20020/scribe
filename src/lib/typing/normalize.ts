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

export function normalizeTypingText(text: string): string {
  return [...text]
    .map(normalizeTypingChar)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
