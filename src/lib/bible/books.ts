import type { BibleLanguageId } from "./types";

/** Protestant canon order — shared across English and Spanish texts. */
export const CANON_BOOKS: { en: string; es: string }[] = [
  { en: "Genesis", es: "Génesis" },
  { en: "Exodus", es: "Éxodo" },
  { en: "Leviticus", es: "Levítico" },
  { en: "Numbers", es: "Números" },
  { en: "Deuteronomy", es: "Deuteronomio" },
  { en: "Joshua", es: "Josué" },
  { en: "Judges", es: "Jueces" },
  { en: "Ruth", es: "Rut" },
  { en: "1 Samuel", es: "1 Samuel" },
  { en: "2 Samuel", es: "2 Samuel" },
  { en: "1 Kings", es: "1 Reyes" },
  { en: "2 Kings", es: "2 Reyes" },
  { en: "1 Chronicles", es: "1 Crónicas" },
  { en: "2 Chronicles", es: "2 Crónicas" },
  { en: "Ezra", es: "Esdras" },
  { en: "Nehemiah", es: "Nehemías" },
  { en: "Esther", es: "Ester" },
  { en: "Job", es: "Job" },
  { en: "Psalms", es: "Salmos" },
  { en: "Proverbs", es: "Proverbios" },
  { en: "Ecclesiastes", es: "Eclesiastés" },
  { en: "Song of Solomon", es: "Cantares" },
  { en: "Isaiah", es: "Isaías" },
  { en: "Jeremiah", es: "Jeremías" },
  { en: "Lamentations", es: "Lamentaciones" },
  { en: "Ezekiel", es: "Ezequiel" },
  { en: "Daniel", es: "Daniel" },
  { en: "Hosea", es: "Oseas" },
  { en: "Joel", es: "Joel" },
  { en: "Amos", es: "Amós" },
  { en: "Obadiah", es: "Abdías" },
  { en: "Jonah", es: "Jonás" },
  { en: "Micah", es: "Miqueas" },
  { en: "Nahum", es: "Nahúm" },
  { en: "Habakkuk", es: "Habacuc" },
  { en: "Zephaniah", es: "Sofonías" },
  { en: "Haggai", es: "Hageo" },
  { en: "Zechariah", es: "Zacarías" },
  { en: "Malachi", es: "Malaquías" },
  { en: "Matthew", es: "Mateo" },
  { en: "Mark", es: "Marcos" },
  { en: "Luke", es: "Lucas" },
  { en: "John", es: "Juan" },
  { en: "Acts", es: "Hechos" },
  { en: "Romans", es: "Romanos" },
  { en: "1 Corinthians", es: "1 Corintios" },
  { en: "2 Corinthians", es: "2 Corintios" },
  { en: "Galatians", es: "Gálatas" },
  { en: "Ephesians", es: "Efesios" },
  { en: "Philippians", es: "Filipenses" },
  { en: "Colossians", es: "Colosenses" },
  { en: "1 Thessalonians", es: "1 Tesalonicenses" },
  { en: "2 Thessalonians", es: "2 Tesalonicenses" },
  { en: "1 Timothy", es: "1 Timoteo" },
  { en: "2 Timothy", es: "2 Timoteo" },
  { en: "Titus", es: "Tito" },
  { en: "Philemon", es: "Filemón" },
  { en: "Hebrews", es: "Hebreos" },
  { en: "James", es: "Santiago" },
  { en: "1 Peter", es: "1 Pedro" },
  { en: "2 Peter", es: "2 Pedro" },
  { en: "1 John", es: "1 Juan" },
  { en: "2 John", es: "2 Juan" },
  { en: "3 John", es: "3 Juan" },
  { en: "Jude", es: "Judas" },
  { en: "Revelation", es: "Apocalipsis" },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "");
}

export function bookIndex(bookName: string): number {
  const needle = norm(bookName);
  return CANON_BOOKS.findIndex(
    (b) => norm(b.en) === needle || norm(b.es) === needle,
  );
}

/** Map a book name into the display language of a Bible text. */
export function localizeBookName(
  bookName: string,
  language: BibleLanguageId,
): string {
  const i = bookIndex(bookName);
  if (i < 0) return bookName;
  return language === "es" ? CANON_BOOKS[i].es : CANON_BOOKS[i].en;
}
