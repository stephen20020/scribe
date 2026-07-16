import type { BibleData, BibleVersionId } from "./types";

const cache = new Map<BibleVersionId, Promise<BibleData>>();

function normalizeBible(raw: BibleData): BibleData {
  return {
    ...raw,
    books: raw.books.map((book) => ({
      ...book,
      id: String(book.id),
      name: book.name,
      testament: book.testament,
      chapters: book.chapters,
    })),
  };
}

export function loadBible(version: BibleVersionId): Promise<BibleData> {
  const existing = cache.get(version);
  if (existing) return existing;

  const promise = fetch(`/bible/${version}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${version}: ${res.status}`);
      return res.json() as Promise<BibleData>;
    })
    .then(normalizeBible)
    .catch((err) => {
      cache.delete(version);
      throw err;
    });

  cache.set(version, promise);
  return promise;
}

export function getBook(bible: BibleData, bookName: string) {
  const needle = bookName.toLowerCase().replace(/\s+/g, "");
  return (
    bible.books.find((b) => {
      const name = b.name.toLowerCase();
      const id = String(b.id).toLowerCase();
      return (
        name === bookName.toLowerCase() ||
        id === bookName.toLowerCase() ||
        name.replace(/\s+/g, "") === needle
      );
    }) ?? null
  );
}

export function chapterCount(bible: BibleData, bookName: string): number {
  return getBook(bible, bookName)?.chapters.length ?? 0;
}

export function verseCount(
  bible: BibleData,
  bookName: string,
  chapter: number,
): number {
  const book = getBook(bible, bookName);
  if (!book || chapter < 1 || chapter > book.chapters.length) return 0;
  return book.chapters[chapter - 1].length;
}
