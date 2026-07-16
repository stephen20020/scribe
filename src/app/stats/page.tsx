"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import {
  computeAggregates,
  typingSessionHref,
  useScribeStore,
} from "@/lib/store/use-scribe-store";
import { formatDuration } from "@/lib/utils";

function StatsContent() {
  const params = useSearchParams();
  const sessionId = params.get("session");
  const sessions = useScribeStore((s) => s.sessions);
  const session = sessionId
    ? sessions.find((s) => s.id === sessionId)
    : sessions[0];
  const aggregates = computeAggregates(sessions);

  return (
    <PageEnter className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      {session ? (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
              Lesson complete
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
              {session.referenceLabel}
            </h1>
            <p className="mt-2 text-ink-muted">
              {session.version.toUpperCase()} · {session.versesCompleted} verse
              {session.versesCompleted === 1 ? "" : "s"}
            </p>
          </motion.div>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <BigStat label="WPM" value={String(session.wpm)} />
            <BigStat label="Accuracy" value={`${session.accuracy}%`} />
            <BigStat label="Time" value={formatDuration(session.durationMs)} />
            <BigStat label="Characters" value={String(session.charsTyped)} />
            <BigStat label="Errors" value={String(session.errors)} />
            <BigStat
              label="Verses"
              value={String(session.versesCompleted)}
            />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={typingSessionHref(session)}
              className="rounded-full bg-ink px-6 py-3 text-bg transition hover:opacity-90"
            >
              Type again
            </Link>
            <Link
              href="/plans"
              className="rounded-full border border-line px-6 py-3 text-ink-muted transition hover:text-ink"
            >
              View plans
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-line px-6 py-3 text-ink-muted transition hover:text-ink"
            >
              Dashboard
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl tracking-tight">Stats</h1>
          <p className="mt-3 text-ink-muted">
            Complete a lesson to see session stats here.
          </p>
          <Link
            href="/type"
            className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-bg"
          >
            Start typing
          </Link>
        </>
      )}

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="font-display text-2xl">Overall</h2>
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <SmallStat label="Sessions" value={String(aggregates.totalSessions)} />
          <SmallStat label="Verses" value={String(aggregates.totalVerses)} />
          <SmallStat label="Avg WPM" value={String(aggregates.avgWpm)} />
          <SmallStat label="Streak" value={`${aggregates.currentStreak}d`} />
        </div>

        {sessions.length > 0 && (
          <ul className="mt-10 space-y-3">
            {sessions.slice(0, 12).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 py-3 text-sm"
              >
                <Link
                  href={`/stats?session=${s.id}`}
                  className="text-ink hover:underline"
                >
                  {s.referenceLabel}
                </Link>
                <span className="font-mono text-ink-faint">
                  {s.wpm} wpm · {s.accuracy}% · {formatDuration(s.durationMs)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageEnter>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">
        {value}
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
        <Suspense fallback={<p className="px-8 py-16 text-ink-muted">Loading…</p>}>
          <StatsContent />
        </Suspense>
      </main>
    </div>
  );
}
