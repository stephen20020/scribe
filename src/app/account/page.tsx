"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageEnter } from "@/components/page-enter";
import { useAuth } from "@/components/auth-provider";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    if (mode === "signup") {
      if (!name.trim()) {
        setMessage("Add a display name.");
        setBusy(false);
        return;
      }
      const result = await signUp(email.trim(), password, name.trim());
      setBusy(false);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (result.needsConfirm) {
        setMessage(
          "Check your email to confirm your account, then sign in.",
        );
        setMode("signin");
        return;
      }
      setMessage("Welcome — your stats will sync to this account.");
      window.setTimeout(() => router.push("/dashboard"), 600);
      return;
    }

    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Signed in. Syncing your progress…");
    window.setTimeout(() => router.push("/dashboard"), 600);
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
    setMessage("Signed out. Local progress cleared — sign in again to load your account.");
  }

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main>
      <PageEnter className="mx-auto w-full max-w-md px-5 py-10 sm:px-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-ink-faint uppercase">
          Account
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          {loading
            ? "Loading…"
            : user
              ? "Your account"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">
          Guests can type anytime. An account saves stats and plans in the
          cloud so they follow you across devices.
        </p>

        {user ? (
          <div className="mt-10 space-y-4">
            <p className="text-ink">
              Signed in as{" "}
              <strong>{user.email ?? user.id.slice(0, 8)}</strong>
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
                disabled={busy}
                onClick={handleSignOut}
                className="rounded-full border border-line px-6 py-3 text-ink-muted hover:text-ink disabled:opacity-50"
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
              {mode === "signup" && (
                <label className="block text-sm">
                  <span className="mb-2 block text-ink-muted">Display name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 outline-none ring-accent focus:ring-2"
                    autoComplete="nickname"
                    required
                  />
                </label>
              )}
              <label className="block text-sm">
                <span className="mb-2 block text-ink-muted">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg-elevated/80 px-4 py-3 outline-none ring-accent focus:ring-2"
                  autoComplete="email"
                  required
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
                  required
                />
              </label>
              <button
                type="submit"
                disabled={busy || loading}
                className="w-full rounded-full bg-ink px-6 py-3.5 text-bg transition hover:opacity-90 disabled:opacity-50"
              >
                {busy
                  ? "Working…"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
          </>
        )}

        {message && (
          <p className="mt-6 text-sm text-accent" role="status" aria-live="polite">
            {message}
          </p>
        )}

        <p className="mt-10 text-sm text-ink-faint">
          Prefer to stay a guest?{" "}
          <Link href="/type" className="text-ink underline">
            Keep typing
          </Link>
          .
        </p>
      </PageEnter>
      </main>
    </div>
  );
}
