export type BibleLanguageId = "en" | "es";

export type BibleVersionId =
  | "web"
  | "kjv"
  | "asv"
  | "rv1909"
  | "bll"
  | "onbv";

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
  language?: BibleLanguageId;
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

export interface BibleVersionMeta {
  id: BibleVersionId;
  name: string;
  short: string;
  language: BibleLanguageId;
}

export const BIBLE_LANGUAGES: {
  id: BibleLanguageId;
  label: string;
  short: string;
}[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "es", label: "Español", short: "ES" },
];

export const BIBLE_VERSIONS: BibleVersionMeta[] = [
  { id: "web", name: "World English Bible", short: "WEB", language: "en" },
  { id: "kjv", name: "King James Version", short: "KJV", language: "en" },
  { id: "asv", name: "American Standard Version", short: "ASV", language: "en" },
  {
    id: "rv1909",
    name: "Reina-Valera 1909",
    short: "RV1909",
    language: "es",
  },
  {
    id: "bll",
    name: "Biblia Libre Latinoamericana",
    short: "BLL",
    language: "es",
  },
  {
    id: "onbv",
    name: "Open Nueva Biblia Viva",
    short: "ONBV",
    language: "es",
  },
];

export const DEFAULT_VERSION: Record<BibleLanguageId, BibleVersionId> = {
  en: "web",
  es: "rv1909",
};

export function isBibleVersionId(value: string | null | undefined): value is BibleVersionId {
  return BIBLE_VERSIONS.some((v) => v.id === value);
}

export function languageForVersion(id: BibleVersionId): BibleLanguageId {
  return BIBLE_VERSIONS.find((v) => v.id === id)?.language ?? "en";
}

export function versionsForLanguage(language: BibleLanguageId): BibleVersionMeta[] {
  return BIBLE_VERSIONS.filter((v) => v.language === language);
}
