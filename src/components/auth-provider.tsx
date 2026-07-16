"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  fetchAccountBundle,
  pushCustomPlan,
  pushPlanProgress,
  pushSessions,
  pushTypingProfile,
  upsertProfile,
} from "@/lib/supabase/sync";
import { useScribeStore } from "@/lib/store/use-scribe-store";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null; needsConfirm?: boolean }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateFromCloud = useScribeStore((s) => s.hydrateFromCloud);
  const getLocalSnapshot = useScribeStore((s) => s.getLocalSnapshot);

  const mergeAndLoad = useCallback(
    async (nextUser: User) => {
      const local = getLocalSnapshot();
      // Upload any guest progress once on login
      await Promise.all([
        pushSessions(nextUser.id, local.sessions).catch(() => {}),
        pushTypingProfile(nextUser.id, local.typingProfile).catch(() => {}),
        ...Object.values(local.planProgress).map((p) =>
          pushPlanProgress(nextUser.id, p).catch(() => {}),
        ),
        ...local.customPlans.map((p) =>
          pushCustomPlan(nextUser.id, p).catch(() => {}),
        ),
      ]);

      const bundle = await fetchAccountBundle(nextUser.id);
      hydrateFromCloud({
        accountName:
          bundle.displayName ??
          (nextUser.user_metadata?.display_name as string | undefined) ??
          nextUser.email?.split("@")[0] ??
          null,
        sessions: bundle.sessions,
        planProgress: bundle.planProgress,
        customPlans: bundle.customPlans,
        typingProfile: bundle.typingProfile,
      });
    },
    [getLocalSnapshot, hydrateFromCloud],
  );

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        void mergeAndLoad(data.session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void mergeAndLoad(nextSession.user);
      } else {
        useScribeStore.getState().setAccountName(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [mergeAndLoad]);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) return { error: error.message };
      if (data.user) {
        await upsertProfile(data.user.id, displayName).catch(() => {});
      }
      if (data.session?.user) {
        await mergeAndLoad(data.session.user);
        return { error: null };
      }
      return {
        error: null,
        needsConfirm: true,
      };
    },
    [mergeAndLoad],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      if (data.user) await mergeAndLoad(data.user);
      return { error: null };
    },
    [mergeAndLoad],
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useScribeStore.getState().setAccountName(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signUp, signIn, signOut }),
    [user, session, loading, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
