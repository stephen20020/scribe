"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { getStockPlan } from "@/lib/plans/stock";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { removeCustomPlan } from "@/lib/supabase/persist";
import { cn } from "@/lib/utils";
import type { AnyPlan } from "@/lib/plans/types";

export default function PlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const customPlans = useScribeStore((s) => s.customPlans);
  const planProgress = useScribeStore((s) => s.planProgress);
  const preferences = useScribeStore((s) => s.preferences);

  const stock = getStockPlan(id);
  const custom = customPlans.find((p) => p.id === id);
  const plan: AnyPlan | undefined = stock ?? custom;

  if (!plan) {
    return (
      <div className="relative z-10 min-h-screen">
        <SiteHeader />
        <main className="px-8 py-16">
          <p className="text-ink-muted">Plan not found.</p>
          <Link href="/plans" className="mt-4 inline-block text-ink underline">
            Back to plans
          </Link>
        </main>
      </div>
    );
  }

  const progress = planProgress[plan.id];
  const completed = new Set(progress?.completedDays ?? []);
  const done = completed.size;
  const pct = Math.round((done / plan.days.length) * 100);
  const nextDay =
    plan.days.find((d) => !completed.has(d.day)) ?? plan.days[0];

  function continueDay(day = nextDay) {
    if (!plan) return;
    const activePlan = plan;
    const version =
      ("recommendedVersion" in activePlan && activePlan.recommendedVersion) ||
      preferences.version;
    const qs = new URLSearchParams({
      version,
      book: day.book,
      chapter: String(day.chapter),
      verse: String(day.startVerse),
      scope: day.scope,
      passage: String(day.passageLength ?? preferences.passageLength),
      planId: activePlan.id,
      planDay: String(day.day),
      go: "1",
    });
    router.push(`/type?${qs.toString()}`);
  }

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
      <PageEnter className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <Link
          href="/plans"
          className="text-sm text-ink-muted transition hover:text-ink"
        >
          ← Plans
        </Link>

        <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
          {plan.title}
        </h1>
        <p className="mt-3 max-w-xl text-ink-muted">{plan.description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => continueDay()}
            className="rounded-full bg-ink px-6 py-3 text-bg transition hover:opacity-90"
          >
            {done === 0 ? "Start day 1" : done >= plan.days.length ? "Review" : "Continue"}
          </button>
          <span className="font-mono text-xs text-ink-faint">
            {done}/{plan.days.length} complete · {pct}%
          </span>
          {"isCustom" in plan && plan.isCustom && (
            <button
              type="button"
              onClick={() => {
                void removeCustomPlan(plan.id);
                router.push("/plans");
              }}
              className="text-sm text-incorrect"
            >
              Delete plan
            </button>
          )}
        </div>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>

        <ol className="mt-12 space-y-1">
          {plan.days.map((day) => {
            const isDone = completed.has(day.day);
            return (
              <li key={day.day}>
                <button
                  type="button"
                  onClick={() => continueDay(day)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 border-b border-line/70 py-3.5 text-left transition hover:opacity-90",
                    isDone && "opacity-60",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[11px]",
                        isDone
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-line text-ink-faint",
                      )}
                    >
                      {isDone ? "✓" : day.day}
                    </span>
                    <span className="text-ink">{day.label}</span>
                  </span>
                  <span className="font-mono text-[11px] tracking-wide text-ink-faint uppercase">
                    {day.scope}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </PageEnter>
      </main>
    </div>
  );
}
