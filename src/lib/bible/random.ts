import type { BibleData } from "./types";

export interface RandomVersePick {
  book: string;
  chapter: number;
  verse: number;
}

export function pickRandomVerse(bible: BibleData): RandomVersePick {
  const book = bible.books[Math.floor(Math.random() * bible.books.length)];
  const chapterIndex = Math.floor(Math.random() * book.chapters.length);
  const verses = book.chapters[chapterIndex];
  const verseIndex = Math.floor(Math.random() * verses.length);

  return {
    book: book.name,
    chapter: chapterIndex + 1,
    verse: verseIndex + 1,
  };
}

export function randomVerseHref(
  version: string,
  pick: RandomVersePick,
): string {
  const params = new URLSearchParams({
    version,
    book: pick.book,
    chapter: String(pick.chapter),
    verse: String(pick.verse),
    scope: "verse",
    go: "1",
  });
  return `/type?${params.toString()}`;
}
