"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { RandomVerseButton } from "@/components/random-verse-button";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <SiteHeader transparent />

      <main className="relative z-10 flex flex-1 flex-col justify-center px-5 pb-16 pt-6 sm:px-10">
        <PageEnter className="mx-auto w-full max-w-4xl">
          <motion.p
            className="font-mono text-[11px] tracking-[0.28em] text-ink-faint uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            Type the Word
          </motion.p>

          <h1 className="mt-4 font-display text-[clamp(4.5rem,16vw,9rem)] leading-[0.9] tracking-[-0.03em] text-ink">
            Scribe
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted sm:text-xl">
            A quiet place to type Scripture — one verse, a short passage, or a
            whole chapter.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/type"
              className="rounded-full bg-ink px-8 py-3.5 font-display text-lg text-bg transition hover:opacity-90"
            >
              Start typing
            </Link>
            <RandomVerseButton
              language="en"
              label="Type a random verse"
              className="rounded-full border border-line px-6 py-3.5 text-sm text-ink-muted transition hover:text-ink"
            />
            <Link
              href="/plans"
              className="rounded-full border border-line px-6 py-3.5 text-sm text-ink-muted transition hover:text-ink"
            >
              Daily plans
            </Link>
          </div>

          <p className="mt-14 font-mono text-[11px] tracking-[0.18em] text-ink-faint uppercase">
            EN · ES — open translations
          </p>
        </PageEnter>
      </main>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42vh] opacity-40"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, var(--accent-soft), transparent 70%)",
        }}
      />
    </div>
  );
}
