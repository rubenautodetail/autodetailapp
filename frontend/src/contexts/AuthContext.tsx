"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  // User state
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, lang?: string, next?: string) => Promise<{ needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Memoize so the same instance is used across renders — prevents the
  // useEffect([supabase]) dependency from triggering on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  // Use a ref to track the current user ID so the onAuthStateChange callback
  // always sees the latest value (avoids stale closure over `user`).
  const userIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  }, [supabase]);

  // Check auth state on mount and listen for changes
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        userIdRef.current = session?.user?.id ?? null;
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }

      // IMPORTANT: this callback must stay synchronous and must NOT await any
      // supabase call. supabase-js holds its internal auth lock while the
      // callback runs; awaiting a query here (which needs the same lock)
      // deadlocks and leaves isLoading stuck at true — every layout gated on
      // it then spins forever, especially on tab refocus / back navigation
      // when TOKEN_REFRESHED / SIGNED_IN re-fire.
      const { data } = supabase.auth.onAuthStateChange(
        (_event: any, session: any) => {
          const prevUserId = userIdRef.current;
          setSession(session);
          setUser(session?.user ?? null);
          userIdRef.current = session?.user?.id ?? null;

          if (!session?.user) {
            setProfile(null);
            setIsLoading(false);
            return;
          }

          // Same user (token refresh, focus re-emit): session state is already
          // updated above; the profile is unchanged — no refetch, no loading flash.
          if (prevUserId === session.user.id) {
            return;
          }

          // User changed (fresh sign-in, or another tab signed in as a
          // different account): clear stale profile to prevent cross-role
          // contamination, then fetch the new one outside the auth callback.
          setProfile(null);
          setIsLoading(true);
          const userId = session.user.id;
          setTimeout(() => {
            fetchProfile(userId).finally(() => setIsLoading(false));
          }, 0);
        }
      );
      subscription = data.subscription;
    };

    initializeAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  // Action: Login with Supabase
  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }, [supabase]);

  // Action: Register with Supabase
  const register = async (name: string, email: string, password: string, lang = 'en', next?: string): Promise<{ needsEmailConfirmation: boolean }> => {
    const siteUrl = typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    // Use the caller-supplied `next` so the confirmation email lands on the right page
    // (e.g. /en/contractors/apply instead of the generic dashboard)
    const postConfirmRedirect = next && next.startsWith('/') ? next : `/${lang}/login`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          // Store the redirect intent in metadata so the callback can recover it
          // even if Supabase strips our ?next= query param from the redirect URL
          pending_redirect: postConfirmRedirect,
        },
        emailRedirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent(postConfirmRedirect)}`,
      },
    });

    if (error) throw error;

    // Supabase returns a fake user with identities=[] when the email is already registered
    // (to prevent email enumeration). Detect this and show a clear error.
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      throw new Error(
        lang === 'es'
          ? 'Ya existe una cuenta con este correo. Inicia sesión en su lugar.'
          : 'An account with this email already exists. Please sign in instead.'
      );
    }

    // Create profile row via service-role API route (anon key can't write with RLS enabled).
    // This is BLOCKING — if it fails the user exists in auth but has no profile, causing errors everywhere.
    const isContractorFlow = postConfirmRedirect.includes('contractors/apply');
    if (data.user?.id) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (data.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
      const profileRes = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: data.user.id,
          name,
          role: isContractorFlow ? 'contractor' : 'user',
        }),
      });
      if (!profileRes.ok) {
        let detail = '';
        try { detail = await profileRes.text(); } catch { /* ignore */ }
        throw new Error(`Profile creation failed (${profileRes.status})${detail ? `: ${detail}` : ''}`);
      }
    }

    // Fire welcome email immediately after signup (non-blocking — won't break registration if it fails)
    fetch('/api/auth/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        userId: data.user?.id,
      }),
    }).catch((err) => console.warn('Welcome email failed (non-critical):', err));

    // If session is null, Supabase requires email confirmation before the user is signed in
    return { needsEmailConfirmation: !data.session };
  };

  // Action: Logout
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
    userIdRef.current = null;
    // Clear any sensitive booking data left in session storage
    try {
      sessionStorage.removeItem('dtailwash_booking_state');
    } catch {
      // Private browsing may block sessionStorage — non-fatal
    }
  }, [supabase]);

  const value: AuthContextType = {
    user,
    session,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshProfile: userIdRef.current ? () => fetchProfile(userIdRef.current!) : () => Promise.resolve(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export type { User, Session };

