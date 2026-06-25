---
name: Crunchtime Fitness Training
description: Key decisions and sharp edges for the Crunchtime mobile app
---

## Auth
- `AuthContext.login()` returns `AppUser | null` (not boolean). Callers read `.role` to route trainer vs user.
- Logout: `AsyncStorage.multiRemove(["authUser"])` then `setUser(null)`. Does NOT remove `userProfile` or `onboardingComplete`.
- Demo creds: user@test.com / password123 (role: user), trainer@test.com / password123 (role: trainer)

## Navigation gates
- Splash (`index.tsx`) checks `onboardingComplete` — if not set, go to /onboarding
- After auth, checks `userProfile` — if not set, go to /profile-setup
- Login screen navigates explicitly after `login()` returns — does NOT rely on layout redirect

## Profile setup
- Saves: `{ name, age, gender, height, weight, goal, activity, trainingTypes: string[], completedAt }`
- Key: `userProfile` in AsyncStorage
- Old format had `training: string`; profile.tsx handles both via `Array.isArray(profile.trainingTypes)`

## Notifications
- expo-notifications MUST stay at `~0.32.17` (SDK 53). Do not upgrade to 56.x.
- Web falls back to Web Notifications API via dynamic import in lib/notifications.ts

## Why AuthContext returns user not boolean
- Login screen needed to read `.role` immediately after auth to decide routing (trainer vs user vs profile-setup). Returning the user object avoids a second AsyncStorage read.
