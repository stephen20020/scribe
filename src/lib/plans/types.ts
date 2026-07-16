import type { BibleVersionId, LessonScope } from "../bible/types";

export interface PlanDay {
  day: number;
  book: string;
  chapter: number;
  startVerse: number;
  scope: LessonScope;
  passageLength?: number;
  label: string;
}

export interface StockPlan {
  id: string;
  title: string;
  description: string;
  days: PlanDay[];
  recommendedVersion?: BibleVersionId;
}

export interface CustomPlan {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  days: PlanDay[];
  isCustom: true;
}

export type AnyPlan = StockPlan | CustomPlan;

export interface PlanProgress {
  planId: string;
  completedDays: number[];
  lastCompletedAt: string | null;
}
