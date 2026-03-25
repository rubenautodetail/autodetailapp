"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
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

  const fetchProfile = async (userId: string) => {
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
  };

  // Check auth state on mount and listen for changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          const prevUser = user;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            // If the user changed (e.g. another tab signed in as different account),
            // clear stale profile immediately to prevent cross-role contamination
            if (prevUser && prevUser.id !== session.user.id) {
              setProfile(null);
            }
            setIsLoading(true);
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setIsLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    };

    initializeAuth();
  }, [supabase]);

  // Action: Login with Supabase
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

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

    // Create profile row via service-role API route (anon key can't write with RLS enabled).
    // This is BLOCKING — if it fails the user exists in auth but has no profile, causing errors everywhere.
    const isContractorFlow = postConfirmRedirect.includes('contractors/apply');
    if (data.user?.id) {
      const profileRes = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setProfile(null);
    // Clear any sensitive booking data left in session storage
    try {
      sessionStorage.removeItem('dtailwash_booking_state');
    } catch {
      // Private browsing may block sessionStorage — non-fatal
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
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

