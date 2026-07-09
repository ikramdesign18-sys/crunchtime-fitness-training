import type { Session } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ensureProfile,
  friendlyAuthError,
  getProfile,
  type Profile,
  type UserRole,
} from "@/lib/supabaseApi";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getSupabaseMissingConfigMessage } from "@/lib/envDebug";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileSetupCompleted: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<AppUser | null>;
  signup: (name: string, email: string, password: string) => Promise<AppUser | null>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  setProfile: (profile: Profile | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  login: async () => null,
  signup: async () => null,
  resetPassword: async () => {},
  refreshProfile: async () => null,
  setProfile: () => {},
  logout: async () => {},
});

function toAppUser(profile: Profile, fallbackEmail?: string | null): AppUser {
  const email = profile.email ?? fallbackEmail ?? "";
  return {
    id: profile.id,
    name: profile.full_name ?? email.split("@")[0] ?? "Athlete",
    email,
    role: profile.role,
    profileSetupCompleted: profile.profile_setup_completed,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadProfileForSession = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setProfileState(null);
      setUser(null);
      return null;
    }

    const nextProfile = await ensureProfile(
      nextSession.user.id,
      nextSession.user.email ?? null,
      typeof nextSession.user.user_metadata["full_name"] === "string"
        ? nextSession.user.user_metadata["full_name"]
        : undefined
    );
    setProfileState(nextProfile);
    setUser(toAppUser(nextProfile, nextSession.user.email));
    return nextProfile;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!isSupabaseConfigured) {
        setAuthError(getSupabaseMissingConfigMessage());
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;
        setSession(data.session);
        await loadProfileForSession(data.session);
      } catch (error) {
        if (mounted) setAuthError(friendlyAuthError((error as Error).message));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfileForSession(nextSession).catch((error) => {
        setAuthError(friendlyAuthError((error as Error).message));
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForSession]);

  const login = async (email: string, password: string): Promise<AppUser | null> => {
    setAuthError(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(getSupabaseMissingConfigMessage());
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
      const nextProfile = await loadProfileForSession(data.session);
      return nextProfile ? toAppUser(nextProfile, data.user.email) : null;
    } catch (error) {
      const message = friendlyAuthError((error as Error).message);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<AppUser | null> => {
    setAuthError(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(getSupabaseMissingConfigMessage());
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      if (!data.user) return null;
      if (!data.session) return null;

      const nextProfile = await ensureProfile(data.user.id, data.user.email ?? email, name);
      setProfileState(nextProfile);
      setUser(toAppUser(nextProfile, email));
      setSession(data.session);
      return toAppUser(nextProfile, email);
    } catch (error) {
      const message = friendlyAuthError((error as Error).message);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(getSupabaseMissingConfigMessage());
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      const message = friendlyAuthError((error as Error).message);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const refreshProfile = async () => {
    if (!session?.user) return null;
    const nextProfile = await getProfile(session.user.id);
    setProfileState(nextProfile);
    setUser(nextProfile ? toAppUser(nextProfile, session.user.email) : null);
    return nextProfile;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfileState(null);
    setUser(null);
  };

  const setProfile = (nextProfile: Profile | null) => {
    setProfileState(nextProfile);
    setUser(nextProfile ? toAppUser(nextProfile, session?.user.email) : null);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isAuthenticated: !!session?.user && !!user,
      isLoading,
      authError,
      login,
      signup,
      resetPassword,
      refreshProfile,
      setProfile,
      logout,
    }),
    [user, profile, session, isLoading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
