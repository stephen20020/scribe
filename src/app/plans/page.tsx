"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { STOCK_PLANS } from "@/lib/plans/stock";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { cn } from "@/lib/utils";

export default function PlansPage() {
  const planProgress = useScribeStore((s) => s.planProgress);
  const customPlans = useScribeStore((s) => s.customPlans);

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
      <PageEnter className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
              Daily paths
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
              Plans
            </h1>
            <p className="mt-3 max-w-md text-ink-muted">
              Follow a simple daily path, or build your own.
            </p>
          </div>
          <Link
            href="/plans/new"
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-bg transition hover:opacity-90"
          >
            Build a plan
          </Link>
        </div>

        <section className="mt-12 space-y-4">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
            Stock plans
          </h2>
          {STOCK_PLANS.map((plan) => {
            const progress = planProgress[plan.id];
            const done = progress?.completedDays.length ?? 0;
            const pct = Math.round((done / plan.days.length) * 100);
            return (
              <Link
                key={plan.id}
                href={`/plans/${plan.id}`}
                className="block border-b border-line py-5 transition hover:opacity-90"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl tracking-tight">
                    {plan.title}
                  </h3>
                  <span className="font-mono text-xs text-ink-faint">
                    {done}/{plan.days.length} days · {pct}%
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm text-ink-muted">
                  {plan.description}
                </p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
                  <div
                    className={cn("h-full bg-accent transition-all")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mt-14 space-y-4">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
            Your plans
          </h2>
          {customPlans.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No custom plans yet.{" "}
              <Link href="/plans/new" className="text-ink underline">
                Create one
              </Link>
              .
            </p>
          ) : (
            customPlans.map((plan) => {
              const progress = planProgress[plan.id];
              const done = progress?.completedDays.length ?? 0;
              const pct = Math.round((done / plan.days.length) * 100);
              return (
                <Link
                  key={plan.id}
                  href={`/plans/${plan.id}`}
                  className="block border-b border-line py-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="font-display text-2xl tracking-tight">
                      {plan.title}
                    </h3>
                    <span className="font-mono text-xs text-ink-faint">
                      {done}/{plan.days.length} · {pct}%
                    </span>
                  </div>
                  {plan.description && (
                    <p className="mt-2 text-sm text-ink-muted">
                      {plan.description}
                    </p>
                  )}
                </Link>
              );
            })
          )}
        </section>
      </PageEnter>
      </main>
    </div>
  );
}
