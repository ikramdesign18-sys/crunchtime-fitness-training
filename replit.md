# Crunchtime Fitness Training

A complete role-based fitness coaching mobile app (Expo/React Native) with user and trainer dashboards, workout tracking, meal plans, BMI calculator, progress tracking, session booking, video submissions, and push notification reminders.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app (web preview on assigned port)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, optional)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 53, Expo Router 6, React Native
- State: React Context (Auth, Theme) + AsyncStorage (no backend required for MVP)
- Fonts: Inter (via expo-google-fonts)
- Icons: @expo/vector-icons (Ionicons)
- Notifications: expo-notifications (~0.32.17, SDK-compatible)
- Image/Video: expo-image-picker
- Gradients: expo-linear-gradient

## Where things live

```
artifacts/mobile/
├── app/
│   ├── index.tsx              # Splash screen + routing logic
│   ├── onboarding.tsx         # 4-slide onboarding (saves onboardingComplete flag)
│   ├── profile-setup.tsx      # 4-step profile setup (saves userProfile to AsyncStorage)
│   ├── (auth)/                # login, signup, forgot-password
│   ├── (user)/                # All user screens behind tab nav
│   └── (trainer)/             # All trainer screens behind tab nav
├── components/ui/             # AppButton, AppCard, AppInput, Avatar, Badge, etc.
├── constants/colors.ts        # Full light/dark palette, primary = #D66433
├── contexts/
│   ├── AuthContext.tsx        # login() returns AppUser | null, logout() clears storage
│   └── ThemeContext.tsx       # isDark toggle, persisted to AsyncStorage
├── hooks/useColors.ts         # Returns full palette + radius + isDark
└── lib/
    ├── dummyData.ts           # All mock data (Workouts, MealPlans, Clients, etc.)
    └── notifications.ts       # expo-notifications helpers (schedule/cancel/permissions)
```

## Architecture decisions

- **No real backend** — app is a complete high-fidelity prototype using AsyncStorage + dummy data. Connect Supabase by replacing `AuthContext.tsx` login/signup and `lib/dummyData.ts` API calls.
- **Role-based routing** — single login screen routes trainer→`/(trainer)/dashboard` and user→`/(user)/home` (or `/profile-setup` if profile incomplete).
- **Profile completion gate** — `index.tsx` (splash) checks `userProfile` key in AsyncStorage; new users are routed through 4-step setup before home.
- **Onboarding gate** — `index.tsx` checks `onboardingComplete` key; returning users skip straight to login.
- **AuthContext.login()** returns `AppUser | null` (not boolean) — callers can read `.role` directly for navigation.
- **expo-notifications** — installed at `~0.32.17` (SDK 53 compatible). Web falls back gracefully using the Web Notifications API.

## Product

**User side:** Splash → Onboarding → Login/Signup → Profile Setup (4 steps) → Home Dashboard → Workouts (list, detail, exercise detail, active, done) → Meal Plans (list, detail) → BMI Calculator → Progress (weight chart, workout bars, BMI history) → Chat → Book Session → Video Submission → Notifications → Profile → Settings (reminders, dark mode, logout)

**Trainer side:** Login → Trainer Dashboard → Clients (list, detail) → Messages (list, chat detail) → Bookings (accept/decline) → Video Reviews (list, review with feedback) → Profile/Settings → Logout

## User preferences

- Primary color: `#D66433`
- App name: Crunchtime Fitness Training
- Support light and dark theme
- Clean modern fitness app aesthetic
- No real AI posture correction, no Play Store deployment steps

## Gotchas

- **Do NOT use `expo install` from the workspace root.** Always `cd artifacts/mobile` first: `pnpm exec expo install <pkg>`.
- **expo-notifications must stay at `~0.32.17`** for SDK 53 compatibility — do not upgrade to `56.x`.
- **Web preview uses localStorage for AsyncStorage** — clearing browser storage resets all state (onboarding, profile, auth).
- **Training types** are stored as `trainingTypes: string[]` in `userProfile` (new format). Old format used `training: string`. Profile screen handles both.
- Typecheck with `cd artifacts/mobile && pnpm exec tsc --noEmit` — should show zero errors.
- `pnpm run typecheck` at the root runs ALL packages; run per-package for faster iteration.

## Backend Integration Notes (when ready)

To connect a real backend (Supabase recommended):
1. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to environment secrets.
2. Replace `AuthContext.tsx` `login()`/`logout()` with `supabase.auth.signInWithPassword()` / `signOut()`.
3. Replace `lib/dummyData.ts` exports with Supabase queries.
4. Push notifications in production require EAS Build (not Expo Go) and APNs/FCM credentials.
