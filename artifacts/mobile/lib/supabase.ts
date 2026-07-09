import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseMissingConfigMessage } from "@/lib/envDebug";

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20;

export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : "https://example.supabase.co",
  isSupabaseConfigured ? SUPABASE_ANON_KEY : "missing-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(getSupabaseMissingConfigMessage());
  }
}
