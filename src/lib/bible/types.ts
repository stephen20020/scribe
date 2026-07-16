export type BibleVersionId = "web" | "kjv" | "asv";

export type LessonScope = "verse" | "passage" | "chapter";

export interface BibleBook {
  id: string | number;
  name: string;
  testament: "OT" | "NT";
  chapters: string[][];
}

export interface BibleData {
  version: BibleVersionId;
  name: string;
  license: string;
  books: BibleBook[];
}

export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}

export interface PassageRef {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

export interface LessonTarget {
  version: BibleVersionId;
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  scope: LessonScope;
  verses: { verse: number; text: string }[];
  text: string;
  referenceLabel: string;
}

export const BIBLE_VERSIONS: {
  id: BibleVersionId;
  name: string;
  short: string;
}[] = [
  { id: "web", name: "World English Bible", short: "WEB" },
  { id: "kjv", name: "King James Version", short: "KJV" },
  { id: "asv", name: "American Standard Version", short: "ASV" },
];
