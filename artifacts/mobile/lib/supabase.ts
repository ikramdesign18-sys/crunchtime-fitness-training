// ============================================================
// SUPABASE SETUP INSTRUCTIONS
// ============================================================
// 1. Install: pnpm --filter @workspace/mobile add @supabase/supabase-js
// 2. Create a project at https://supabase.com
// 3. Add env vars to your Replit secrets:
//    EXPO_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
//    EXPO_PUBLIC_SUPABASE_ANON_KEY = YOUR_ANON_KEY
// 4. Uncomment the createClient call below
// 5. Replace AsyncStorage auth in AuthContext with Supabase auth
//
// Required database tables:
//   users, workouts, exercises, meal_plans, progress,
//   chat_messages, bookings, video_submissions, trainer_feedback
// ============================================================

export const SUPABASE_URL = process.env["EXPO_PUBLIC_SUPABASE_URL"] ?? "";
export const SUPABASE_ANON_KEY =
  process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] ?? "";

// Uncomment when keys are added:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
//   auth: {
//     storage: AsyncStorage,
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false,
//   },
// });
