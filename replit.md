# Crunchtime Fitness Training

A complete role-based fitness coaching mobile app (Expo/React Native) with user and trainer dashboards, workout tracking, meal plans, BMI calculator, progress tracking, session booking, video submissions, and push notification reminders.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app (web preview on assigned port)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, optional)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, Expo Router 6, React Native
- State: React Context (Auth, Theme), Supabase Auth/Database/Storage, AsyncStorage for local theme/onboarding preferences
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
│   ├── profile-setup.tsx      # 4-step profile setup (saves profiles row in Supabase)
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
    ├── supabase.ts            # Supabase client using EXPO_PUBLIC_* env vars
    ├── supabaseApi.ts         # Database/storage helpers
    ├── dummyData.ts           # Local fallback content for workouts and meal plans
    └── notifications.ts       # expo-notifications helpers (schedule/cancel/permissions)
```

## Architecture decisions

- **Supabase backend** — Auth, profiles, BMI, workout progress, chat, bookings, video submissions, notifications, and storage are connected to Supabase.
- **Role-based routing** — single login screen routes trainer/admin→`/(trainer)/dashboard` and user→`/(user)/home` (or `/profile-setup` if profile incomplete).
- **Profile completion gate** — `index.tsx` (splash) checks `profile_setup_completed` from Supabase; new users are routed through 4-step setup before home.
- **Onboarding gate** — `index.tsx` checks `onboardingComplete` key; returning users skip straight to login.
- **AuthContext.login()** returns `AppUser | null` (not boolean) — callers can read `.role` and `.profileSetupCompleted` directly for navigation.
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
- **expo-notifications must stay at `~0.32.17`** for SDK 54 compatibility — do not upgrade to `56.x`.
- **Web preview uses localStorage for AsyncStorage** — clearing browser storage resets all state (onboarding, profile, auth).
- **Training types** are stored as `training_types text[]` in Supabase.
- Typecheck with `cd artifacts/mobile && pnpm exec tsc --noEmit` — should show zero errors.
- `pnpm run typecheck` at the root runs ALL packages; run per-package for faster iteration.

## Supabase Setup

1. Create a Supabase project.
2. Copy the Project URL and anon public key from Project Settings > API.
3. Add them to `artifacts/mobile/.env`:
   - `EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key`
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Confirm the `video-submissions` storage bucket exists. The schema creates it as a public bucket and adds owner/trainer policies.
6. Create a trainer user manually in Supabase Authentication.
7. In the `profiles` table, update that account with `role = 'trainer'` or `role = 'admin'`.
8. Run the app.

Do not add a Supabase service role key to the Expo app. Any service role usage must stay server-only.

## Video Call Setup

The mobile video call screen uses the native Agora React Native SDK (`react-native-agora`) and requests an Agora RTC token from the existing backend before joining a channel. The Agora Primary Certificate must stay server-side in `artifacts/api-server/.env`.

Optional Expo public placeholders:

```sh
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_VIDEO_CALL_PROVIDER=agora
EXPO_PUBLIC_AGORA_APP_ID=your-agora-app-id
```

Backend/server-only placeholders in `artifacts/api-server/.env`:

```sh
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_primary_certificate
AGORA_TOKEN_EXPIRE_SECONDS=3600
PORT=3001
```

Token endpoint:

```sh
POST http://localhost:3001/api/agora/token
```

Request body:

```json
{
  "channelName": "call-user-trainer",
  "uid": 12345,
  "role": "publisher"
}
```

Run the token server:

```sh
pnpm --filter @workspace/api-server dev
```

Health check:

```sh
curl http://localhost:3001/api/health
```

Native Agora video calls do not run in Expo Go or the web preview because they require native iOS/Android code. Use an Expo Development Build, APK, or EAS build:

```sh
cd artifacts/mobile
pnpm exec expo start --dev-client
eas build --platform android --profile development
eas build --platform android --profile preview
```

The backend `api-server` must be running before joining a call so the mobile app can call `POST ${EXPO_PUBLIC_API_BASE_URL}/api/agora/token`.

Direct user/trainer calls use this shared channel format:

```text
call-{user_id}-{trainer_id}
```

Booking calls use this channel format when a `bookingId` route param is provided:

```text
booking-{booking_id}
```

To test a real call:

1. Replace the placeholder Agora values in `artifacts/api-server/.env` with the real Agora App ID and Primary Certificate.
2. Replace `EXPO_PUBLIC_AGORA_APP_ID` in `artifacts/mobile/.env` with the same Agora App ID.
3. Start the backend with `pnpm --filter @workspace/api-server dev`.
4. Install/open the development build or APK on two devices or two native test clients.
5. Sign in as a user on one device and as the trainer on the other.
6. Open the same chat pair and tap the call button on both devices.
7. Confirm local video, remote video, microphone mute, camera toggle, camera switch, and end call.

If video call env keys or the backend token server are missing, the app shows a friendly setup/backend error instead of crashing.

## Groq / AI

Groq is not used by the current app. Do not add `GROQ_API_KEY` to Expo public env. If AI feedback or AI posture explanations are added later, keep `GROQ_API_KEY=` in a backend/server-only environment and call it from a server endpoint.

## Android Build

From the repo root:

```sh
pnpm --filter @workspace/mobile typecheck
pnpm --filter @workspace/mobile exec expo start
```

For Android builds, configure EAS credentials and run from `artifacts/mobile`:

```sh
eas build --platform android --profile preview
eas build --platform android --profile production
```

Preview builds generate an APK. Production builds generate an AAB.
