import type { PlanDay, StockPlan } from "./types";

function chapterDays(
  book: string,
  chapters: number,
  startDay = 1,
): PlanDay[] {
  return Array.from({ length: chapters }, (_, i) => ({
    day: startDay + i,
    book,
    chapter: i + 1,
    startVerse: 1,
    scope: "chapter" as const,
    label: `${book} ${i + 1}`,
  }));
}

function psalmPortion(day: number, chapter: number): PlanDay {
  return {
    day,
    book: "Psalms",
    chapter,
    startVerse: 1,
    scope: "chapter",
    label: `Psalm ${chapter}`,
  };
}

/** Short NT chunks: one chapter per day across a selection of books */
function ntSprintDays(): PlanDay[] {
  const sequence: { book: string; chapters: number }[] = [
    { book: "Matthew", chapters: 7 },
    { book: "Mark", chapters: 4 },
    { book: "Luke", chapters: 6 },
    { book: "John", chapters: 5 },
    { book: "Acts", chapters: 6 },
    { book: "Romans", chapters: 4 },
    { book: "1 Corinthians", chapters: 3 },
    { book: "Ephesians", chapters: 2 },
    { book: "Philippians", chapters: 2 },
    { book: "Hebrews", chapters: 3 },
    { book: "James", chapters: 2 },
    { book: "1 Peter", chapters: 2 },
    { book: "1 John", chapters: 2 },
    { book: "Revelation", chapters: 3 },
  ];

  const days: PlanDay[] = [];
  let day = 1;
  for (const { book, chapters } of sequence) {
    for (let c = 1; c <= chapters; c++) {
      days.push({
        day,
        book,
        chapter: c,
        startVerse: 1,
        scope: "chapter",
        label: `${book} ${c}`,
      });
      day += 1;
    }
  }
  return days;
}

export const STOCK_PLANS: StockPlan[] = [
  {
    id: "gospel-of-john",
    title: "Gospel of John",
    description: "Type through John one chapter a day — twenty-one quiet mornings.",
    recommendedVersion: "web",
    days: chapterDays("John", 21),
  },
  {
    id: "psalms-path",
    title: "Psalms Path",
    description: "A short daily portion through beloved psalms.",
    recommendedVersion: "web",
    days: [
      psalmPortion(1, 1),
      psalmPortion(2, 8),
      psalmPortion(3, 19),
      psalmPortion(4, 23),
      psalmPortion(5, 27),
      psalmPortion(6, 34),
      psalmPortion(7, 46),
      psalmPortion(8, 51),
      psalmPortion(9, 63),
      psalmPortion(10, 84),
      psalmPortion(11, 91),
      psalmPortion(12, 100),
      psalmPortion(13, 103),
      psalmPortion(14, 121),
      psalmPortion(15, 139),
      psalmPortion(16, 145),
      psalmPortion(17, 150),
    ],
  },
  {
    id: "genesis-start",
    title: "Genesis Start",
    description: "Begin at the beginning — the first twelve chapters of Genesis.",
    recommendedVersion: "web",
    days: chapterDays("Genesis", 12),
  },
  {
    id: "nt-sprint",
    title: "New Testament Sprint",
    description: "A longer arc through key New Testament chapters, one day at a time.",
    recommendedVersion: "web",
    days: ntSprintDays(),
  },
];

export function getStockPlan(id: string): StockPlan | undefined {
  return STOCK_PLANS.find((p) => p.id === id);
}
