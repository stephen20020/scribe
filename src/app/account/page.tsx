"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { useScribeStore } from "@/lib/store/use-scribe-store";

export default function AccountPage() {
  const router = useRouter();
  const accountName = useScribeStore((s) => s.accountName);
  const setAccountName = useScribeStore((s) => s.setAccountName);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState(accountName ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage("Add a display name for the local account shell.");
      return;
    }
    setAccountName(name.trim());
    setMessage(
      mode === "signup"
        ? "Account shell created on this device. Real auth comes later."
        : "Signed in locally. Backend sync is not wired yet.",
    );
    window.setTimeout(() => router.push("/dashboard"), 700);
  }

  function signOut() {
    setAccountName(null);
    setName("");
    setMessage("Signed out of the local shell.");
  }

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <PageEnter className="mx-auto w-full max-w-md px-5 py-10 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          Account shell
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {accountName ? "Your account" : mode === "signup" ? "Create account" : "Sign in"}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Frontend only for now — no password is sent anywhere. Your typing
          progress stays in this browser.
        </p>

        {accountName ? (
          <div className="mt-10 space-y-4">
            <p className="text-ink">
              Signed in as <strong>{accountName}</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-ink px-6 py-3 text-bg"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-line px-6 py-3 text-ink-muted hover:text-ink"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-full px-4 py-2 text-sm ${
                  mode === "signup"
                    ? "bg-accent-soft text-ink"
                    : "text-ink-muted"
                }`}
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-full px-4 py-2 text-sm ${
                  mode === "signin"
                    ? "bg-accent-soft text-ink"
                    : "text-ink-muted"
                }`}
              >
                Sign in
              </button>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">Display name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 outline-none ring-accent focus:ring-2"
                  autoComplete="nickname"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 outline-none ring-accent focus:ring-2"
                  autoComplete="email"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 outline-none ring-accent focus:ring-2"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full bg-ink px-6 py-3.5 text-bg transition hover:opacity-90"
              >
                {mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
          </>
        )}

        {message && (
          <p className="mt-6 text-sm text-accent">{message}</p>
        )}

        <p className="mt-10 text-sm text-ink-faint">
          Prefer to stay a guest?{" "}
          <Link href="/type" className="text-ink underline">
            Keep typing
          </Link>
          .
        </p>
      </PageEnter>
    </div>
  );
}
