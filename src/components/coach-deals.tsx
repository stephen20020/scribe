"use client";

import { useState } from "react";
import Link from "next/link";
import { buildRulesCoach } from "@/lib/coach/rules";
import { formatPairKey } from "@/lib/coach/types";
import { useScribeStore } from "@/lib/store/use-scribe-store";
import { syncTypingProfile } from "@/lib/supabase/persist";

export function CoachDeals({ compact = false }: { compact?: boolean }) {
  const profile = useScribeStore((s) => s.typingProfile);
  const setCoach = useScribeStore((s) => s.setTypingProfileCoach);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rules = buildRulesCoach(profile);
  const narrative = profile.narrative ?? rules.narrative;
  const source = profile.narrativeSource ?? rules.source;
  const deals = rules.deals;

  async function refreshAi() {
    if (profile.totalMistakes < 3) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            sessionsSampled: profile.sessionsSampled,
            topPairs: profile.topPairs.slice(0, 8),
            topBigrams: profile.topBigrams.slice(0, 6),
            weakChars: profile.weakChars.slice(0, 8),
            earlyErrors: profile.earlyErrors,
            lateErrors: profile.lateErrors,
            punctuationErrors: profile.punctuationErrors,
            totalMistakes: profile.totalMistakes,
          },
        }),
      });
      const data = (await res.json()) as {
        narrative?: string;
        suggestedDrill?: typeof rules.suggestedDrill;
        source?: "rules" | "ai";
        error?: string;
        aiError?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Coach unavailable");
        return;
      }
      if (data.narrative) {
        setCoach({
          narrative: data.narrative,
          narrativeSource: data.source === "ai" ? "ai" : "rules",
          suggestedDrill: data.suggestedDrill ?? rules.suggestedDrill,
        });
        void syncTypingProfile();
      }
      if (data.source !== "ai" && data.aiError) setError(data.aiError);
    } catch {
      setError("Could not reach coach");
    } finally {
      setBusy(false);
    }
  }

  if (deals.length === 0) {
    return (
      <div className={compact ? "mt-6" : "mt-10"}>
        {!compact && (
          <p className="text-sm text-ink-muted">{narrative}</p>
        )}
        <p className="mt-4 text-sm text-ink-muted">
          No practice deals yet.{" "}
          <Link href="/type" className="underline">
            Type a few imperfect lessons
          </Link>{" "}
          and your weak patterns will show up here as custom drills.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "mt-6" : "mt-10"}>
      {!compact && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] tracking-[0.14em] text-ink-faint uppercase">
              {source === "ai" ? "Claude + patterns" : "Pattern tips"}
              {busy ? " · updating" : ""}
            </p>
            <button
              type="button"
              onClick={() => void refreshAi()}
              disabled={busy || profile.totalMistakes < 3}
              className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-40"
            >
              Refresh coach
            </button>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
            {narrative}
          </p>
        </>
      )}

      <ul className="mt-8 space-y-0">
        {deals.map((deal, i) => (
          <li
            key={deal.id}
            className="border-t border-line py-7 first:border-t-0 first:pt-0"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase">
                  Deal {i + 1} · {deal.severity}
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-tight">
                  {deal.title}
                </h3>
              </div>
              {deal.evidence[0] && (
                <span className="font-mono text-[11px] text-ink-faint">
                  {deal.evidence[0]}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-xl text-sm text-ink-muted">{deal.why}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {deal.phases.map((phase) => (
                <Link
                  key={phase.id}
                  href={`${deal.href}&phase=${phase.id}`}
                  className="rounded-full border border-line px-4 py-2 text-xs text-ink-muted hover:border-ink hover:text-ink"
                >
                  {phase.label}
                </Link>
              ))}
              <Link
                href={deal.href}
                className="rounded-full bg-ink px-4 py-2 text-xs text-bg"
              >
                Full deal
              </Link>
            </div>
          </li>
        ))}
      </ul>

      {profile.topPairs.length > 0 && (
        <p className="mt-6 font-mono text-[11px] text-ink-faint">
          Miss map:{" "}
          {profile.topPairs.slice(0, 6).map((p, i) => (
            <span key={p.key}>
              {i > 0 ? " · " : ""}
              {formatPairKey(p.key)}×{p.count}
            </span>
          ))}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-ink-muted">{error}</p>}

      {compact && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/coach"
            className="rounded-full bg-ink px-6 py-3 text-sm text-bg"
          >
            All practice deals
          </Link>
          <button
            type="button"
            onClick={() => void refreshAi()}
            disabled={busy || profile.totalMistakes < 3}
            className="rounded-full border border-line px-6 py-3 text-sm text-ink-muted hover:text-ink disabled:opacity-40"
          >
            Refresh coach
          </button>
        </div>
      )}
    </div>
  );
}
