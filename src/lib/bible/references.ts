import { getBook } from "./load";
import { normalizeTypingText } from "@/lib/typing/normalize";
import type {
  BibleData,
  BibleVersionId,
  LessonScope,
  LessonTarget,
  PassageRef,
} from "./types";

const BOOK_ALIASES: Record<string, string> = {
  gen: "Genesis",
  ge: "Genesis",
  gn: "Genesis",
  exo: "Exodus",
  ex: "Exodus",
  exod: "Exodus",
  lev: "Leviticus",
  le: "Leviticus",
  num: "Numbers",
  nu: "Numbers",
  deut: "Deuteronomy",
  dt: "Deuteronomy",
  josh: "Joshua",
  jos: "Joshua",
  judg: "Judges",
  jdg: "Judges",
  ruth: "Ruth",
  "1sam": "1 Samuel",
  "2sam": "2 Samuel",
  "1kgs": "1 Kings",
  "2kgs": "2 Kings",
  "1chr": "1 Chronicles",
  "2chr": "2 Chronicles",
  ezra: "Ezra",
  neh: "Nehemiah",
  est: "Esther",
  job: "Job",
  ps: "Psalms",
  psa: "Psalms",
  psalm: "Psalms",
  prov: "Proverbs",
  pr: "Proverbs",
  eccl: "Ecclesiastes",
  ecc: "Ecclesiastes",
  song: "Song of Solomon",
  sos: "Song of Solomon",
  isa: "Isaiah",
  jer: "Jeremiah",
  lam: "Lamentations",
  ezek: "Ezekiel",
  eze: "Ezekiel",
  dan: "Daniel",
  hos: "Hosea",
  joel: "Joel",
  amos: "Amos",
  obad: "Obadiah",
  jonas: "Jonah",
  jonah: "Jonah",
  mic: "Micah",
  nah: "Nahum",
  hab: "Habakkuk",
  zeph: "Zephaniah",
  hag: "Haggai",
  zech: "Zechariah",
  mal: "Malachi",
  matt: "Matthew",
  mt: "Matthew",
  mat: "Matthew",
  mk: "Mark",
  mrk: "Mark",
  lk: "Luke",
  luk: "Luke",
  jn: "John",
  joh: "John",
  acts: "Acts",
  rom: "Romans",
  "1cor": "1 Corinthians",
  "2cor": "2 Corinthians",
  gal: "Galatians",
  eph: "Ephesians",
  phil: "Philippians",
  php: "Philippians",
  col: "Colossians",
  "1thess": "1 Thessalonians",
  "2thess": "2 Thessalonians",
  "1tim": "1 Timothy",
  "2tim": "2 Timothy",
  titus: "Titus",
  phlm: "Philemon",
  heb: "Hebrews",
  jas: "James",
  "1pet": "1 Peter",
  "2pet": "2 Peter",
  "1jn": "1 John",
  "2jn": "2 John",
  "3jn": "3 John",
  jude: "Jude",
  rev: "Revelation",
  re: "Revelation",
  // Spanish
  genesis: "Genesis",
  exodo: "Exodus",
  levitico: "Leviticus",
  numeros: "Numbers",
  deuteronomio: "Deuteronomy",
  josue: "Joshua",
  jueces: "Judges",
  rut: "Ruth",
  "1reyes": "1 Kings",
  "2reyes": "2 Kings",
  "1cronicas": "1 Chronicles",
  "2cronicas": "2 Chronicles",
  esdras: "Ezra",
  nehemias: "Nehemiah",
  ester: "Esther",
  salmos: "Psalms",
  salmo: "Psalms",
  proverbios: "Proverbs",
  eclesiastes: "Ecclesiastes",
  cantares: "Song of Solomon",
  cantar: "Song of Solomon",
  isaias: "Isaiah",
  jeremias: "Jeremiah",
  ezequiel: "Ezekiel",
  oseas: "Hosea",
  abdias: "Obadiah",
  miqueas: "Micah",
  nahum: "Nahum",
  habacuc: "Habakkuk",
  sofonias: "Zephaniah",
  hageo: "Haggai",
  zacarias: "Zechariah",
  malaquias: "Malachi",
  mateo: "Matthew",
  marcos: "Mark",
  lucas: "Luke",
  juan: "John",
  hechos: "Acts",
  romanos: "Romans",
  "1corintios": "1 Corinthians",
  "2corintios": "2 Corinthians",
  galatas: "Galatians",
  efesios: "Ephesians",
  filipenses: "Philippians",
  colosenses: "Colossians",
  "1tesalonicenses": "1 Thessalonians",
  "2tesalonicenses": "2 Thessalonians",
  "1timoteo": "1 Timothy",
  "2timoteo": "2 Timothy",
  tito: "Titus",
  filemon: "Philemon",
  hebreos: "Hebrews",
  santiago: "James",
  "1pedro": "1 Peter",
  "2pedro": "2 Peter",
  "1juan": "1 John",
  "2juan": "2 John",
  "3juan": "3 John",
  judas: "Jude",
  apocalipsis: "Revelation",
};

function foldKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "");
}

function normalizeBookToken(raw: string): string {
  const cleaned = raw.trim().replace(/\./g, "");
  const compact = foldKey(cleaned);
  if (BOOK_ALIASES[compact]) return BOOK_ALIASES[compact];

  const match = cleaned.match(/^(\d)\s*(.+)$/u);
  if (match) {
    const key = foldKey(`${match[1]}${match[2]}`);
    if (BOOK_ALIASES[key]) return BOOK_ALIASES[key];
  }

  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Parse "John 3:16", "Juan 3:16", "Genesis 1", "Salmo 23" */
export function parseReference(input: string): PassageRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^((?:\d\s*)?[\p{L}]+(?:\s+[\p{L}]+)*)\s+(\d+)(?::(\d+)(?:\s*[-–—]\s*(\d+))?)?$/u,
  );
  if (!match) return null;

  const book = normalizeBookToken(match[1]);
  const chapter = Number(match[2]);
  const startVerse = match[3] ? Number(match[3]) : 1;
  const endVerse = match[4] ? Number(match[4]) : match[3] ? Number(match[3]) : 0;

  return {
    book,
    chapter,
    startVerse,
    endVerse: endVerse || startVerse,
  };
}

export function formatReference(ref: {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}): string {
  if (ref.startVerse === ref.endVerse) {
    return `${ref.book} ${ref.chapter}:${ref.startVerse}`;
  }
  return `${ref.book} ${ref.chapter}:${ref.startVerse}–${ref.endVerse}`;
}

export function buildLessonTarget(
  bible: BibleData,
  opts: {
    book: string;
    chapter: number;
    startVerse: number;
    scope: LessonScope;
    passageLength?: number;
  },
): LessonTarget | null {
  const book = getBook(bible, opts.book);
  if (!book) return null;
  if (opts.chapter < 1 || opts.chapter > book.chapters.length) return null;

  const chapterVerses = book.chapters[opts.chapter - 1];
  const maxVerse = chapterVerses.length;
  if (opts.startVerse < 1 || opts.startVerse > maxVerse) return null;

  let endVerse = opts.startVerse;

  if (opts.scope === "chapter") {
    endVerse = maxVerse;
  } else if (opts.scope === "passage") {
    const len = Math.max(1, opts.passageLength ?? 5);
    endVerse = Math.min(maxVerse, opts.startVerse + len - 1);
  }

  const startVerse = opts.scope === "chapter" ? 1 : opts.startVerse;
  const resolvedEnd = opts.scope === "chapter" ? maxVerse : endVerse;

  const verses = [];
  for (let v = startVerse; v <= resolvedEnd; v++) {
    verses.push({
      verse: v,
      text: normalizeTypingText(chapterVerses[v - 1]),
    });
  }

  const text = normalizeTypingText(
    verses
      .map((v) => v.text.trim())
      .join(" ")
      .replace(/\s+/g, " ")
      .trim(),
  );

  return {
    version: bible.version as BibleVersionId,
    book: book.name,
    chapter: opts.chapter,
    startVerse,
    endVerse: resolvedEnd,
    scope: opts.scope,
    verses,
    text,
    referenceLabel: formatReference({
      book: book.name,
      chapter: opts.chapter,
      startVerse,
      endVerse: resolvedEnd,
    }),
  };
}
