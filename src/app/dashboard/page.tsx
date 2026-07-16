"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { CoachCard } from "@/components/coach-card";
import { STOCK_PLANS } from "@/lib/plans/stock";
import {
  computeAggregates,
  useScribeStore,
} from "@/lib/store/use-scribe-store";
import { formatDuration } from "@/lib/utils";

export default function DashboardPage() {
  const sessions = useScribeStore((s) => s.sessions);
  const planProgress = useScribeStore((s) => s.planProgress);
  const customPlans = useScribeStore((s) => s.customPlans);
  const accountName = useScribeStore((s) => s.accountName);
  const aggregates = computeAggregates(sessions);

  const allPlans = [...STOCK_PLANS, ...customPlans];
  const plansCompleted = allPlans.filter((p) => {
    const done = planProgress[p.id]?.completedDays.length ?? 0;
    return done >= p.days.length && p.days.length > 0;
  }).length;

  const activePlans = allPlans.filter((p) => {
    const done = planProgress[p.id]?.completedDays.length ?? 0;
    return done > 0 && done < p.days.length;
  });

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
      <PageEnter className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          {accountName ? "Account" : "Guest"}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          {accountName ? `Hello, ${accountName}` : "Your dashboard"}
        </h1>
        <p className="mt-3 text-ink-muted">
          {accountName
            ? "Your stats sync with your account across devices."
            : "Sign in to keep stats and coach progress. Nothing is saved in this browser when you’re signed out."}
        </p>

        {!accountName && (
          <Link
            href="/account"
            className="mt-6 inline-block text-sm text-accent underline underline-offset-4"
          >
            Create account →
          </Link>
        )}

        <section className="mt-10 border-t border-line pt-8">
          <p className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
            Warm-up
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            The quick brown fox
          </h2>
          <p className="mt-2 max-w-md text-sm text-ink-muted">
            A classic pangram to loosen your fingers before Scripture.
          </p>
          <Link
            href="/warm-up"
            className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-bg transition hover:opacity-90"
          >
            Start pangram test
          </Link>
        </section>

        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3">
          <DashStat label="Verses typed" value={String(aggregates.totalVerses)} />
          <DashStat label="Sessions" value={String(aggregates.totalSessions)} />
          <DashStat
            label="Total time"
            value={formatDuration(aggregates.totalTimeMs)}
          />
          <DashStat label="Avg WPM" value={String(aggregates.avgWpm)} />
          <DashStat label="Avg accuracy" value={`${aggregates.avgAccuracy}%`} />
          <DashStat
            label="Streak"
            value={`${aggregates.currentStreak} day${aggregates.currentStreak === 1 ? "" : "s"}`}
          />
        </div>

        <CoachCard />

        <section className="mt-14 border-t border-line pt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl">Plans</h2>
            <span className="font-mono text-xs text-ink-faint">
              {plansCompleted} completed
            </span>
          </div>

          {activePlans.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              No active plans.{" "}
              <Link href="/plans" className="text-ink underline">
                Browse plans
              </Link>
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {activePlans.map((plan) => {
                const done = planProgress[plan.id]?.completedDays.length ?? 0;
                const pct = Math.round((done / plan.days.length) * 100);
                return (
                  <li key={plan.id}>
                    <Link href={`/plans/${plan.id}`} className="block">
                      <div className="flex justify-between text-sm">
                        <span>{plan.title}</span>
                        <span className="font-mono text-ink-faint">
                          {done}/{plan.days.length}
                        </span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Recent sessions</h2>
            <Link href="/stats" className="text-sm text-ink-muted hover:text-ink">
              All stats
            </Link>
          </div>
          {sessions.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              Nothing yet —{" "}
              <Link href="/type" className="underline">
                start typing
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {sessions.slice(0, 8).map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap justify-between gap-2 border-b border-line/60 py-3 text-sm"
                >
                  <Link href={`/stats?session=${s.id}`} className="hover:underline">
                    {s.referenceLabel}
                  </Link>
                  <span className="font-mono text-ink-faint">
                    {s.wpm} wpm · {s.accuracy}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/type"
            className="rounded-full bg-ink px-6 py-3 text-bg"
          >
            Type now
          </Link>
          <Link
            href="/warm-up"
            className="rounded-full border border-line px-6 py-3 text-ink-muted hover:text-ink"
          >
            Pangram warm-up
          </Link>
          <Link
            href="/plans"
            className="rounded-full border border-line px-6 py-3 text-ink-muted hover:text-ink"
          >
            Plans
          </Link>
        </div>
      </PageEnter>
      </main>
    </div>
  );
}

function DashStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.16em] text-ink-faint uppercase">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl tracking-tight">{value}</div>
    </div>
  );
}
