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
  const deals = rules.deals;
  const watching = rules.watching;
  const pacingNote = rules.pacingNote;

  async function refreshAi() {
    if (profile.totalMistakes < 20) return;
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
            paceErrors: profile.paceErrors,
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

  return (
    <div className={compact ? "mt-6" : "mt-8"}>
      {compact && (
        <p className="max-w-xl text-sm leading-relaxed text-ink-muted">
          {narrative}
        </p>
      )}

      {pacingNote && (
        <p className="mt-4 max-w-xl border-l border-line pl-4 text-sm text-ink-muted">
          {pacingNote}
        </p>
      )}

      {deals.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          No confirmed practice deals yet.{" "}
          <Link href="/type" className="underline underline-offset-4">
            Keep typing Scripture
          </Link>
          — patterns must repeat across several sessions before a deal opens.
        </p>
      ) : (
        <ul className="mt-8 space-y-8">
          {deals.map((deal) => (
            <li key={deal.id}>
              <h3 className="font-display text-2xl tracking-tight">
                {deal.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm text-ink-muted">{deal.why}</p>
              {deal.evidence[0] && (
                <p className="mt-2 font-mono text-[11px] text-ink-faint">
                  {deal.evidence[0]}
                </p>
              )}
              <Link
                href={deal.href}
                className="mt-5 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-bg transition hover:opacity-90"
              >
                Practice this
              </Link>
            </li>
          ))}
        </ul>
      )}

      {watching.length > 0 && (
        <div className="mt-10 border-t border-line pt-8">
          <p className="font-mono text-[11px] tracking-[0.16em] text-ink-faint uppercase">
            Still watching
          </p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {watching.map((w) => (
              <li key={w.key}>
                <span className="font-mono text-ink-faint">
                  {formatPairKey(w.key)}
                </span>
                <span className="mx-2 text-ink-faint">·</span>
                {w.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-ink-muted">{error}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {compact && deals.length > 0 && (
          <Link
            href="/coach"
            className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Open coach
          </Link>
        )}
        <button
          type="button"
          onClick={() => void refreshAi()}
          disabled={busy || profile.totalMistakes < 20}
          className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-40"
        >
          {busy ? "Updating…" : "Refresh coach note"}
        </button>
      </div>
    </div>
  );
}
