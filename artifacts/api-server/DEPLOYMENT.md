# API Server Vercel Deployment

This package is deployable as a Vercel Express backend. The Vercel serverless entry is `api/index.js`, which exports the compiled Express app from `dist/vercel-app.mjs`. The local development listener remains `src/index.ts`.

## Vercel project setup

1. Create a Vercel project from this repository.
2. Set the project Root Directory to `artifacts/api-server`.
3. Vercel routes all requests to the single `api/index.js` function through `vercel.json` rewrites.
4. Leave secrets in Vercel Project Settings > Environment Variables. Do not put real values in this file.
5. Deploy from Vercel after environment variables are configured.

If the Vercel build cannot resolve workspace packages, keep the same Root Directory and set the install/build commands from the Vercel dashboard to run at the monorepo root:

```sh
cd ../.. && pnpm install --frozen-lockfile
cd ../.. && pnpm --filter @workspace/api-server build
```

## Required Vercel environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MEMBERSHIP_MONTHLY`
- `STRIPE_PRICE_BOOKING_ONE_HOUR`
- `STRIPE_PRICE_CUSTOM_MEAL_PLAN`
- `STRIPE_PRICE_PREMIUM_WORKOUT_VIDEO`

## Mobile app configuration

Set the mobile app's public API base URL to the deployed Vercel origin only:

```sh
EXPO_PUBLIC_API_BASE_URL=https://your-api-project.vercel.app
```

Do not include `/api` in `EXPO_PUBLIC_API_BASE_URL`; the mobile app already appends `/api/...` paths. Do not expose Supabase service role, Stripe secret, Stripe webhook secret, or Agora certificate values to the mobile app.

## Routes

The Express app mounts all API routes under `/api`. Vercel should only deploy `api/index.js` as the function entry; files under `src/routes` are app modules, not standalone functions. Routes include:

- `GET /api/health`
- `POST /api/agora/token`
- `POST /api/stripe/create-membership-checkout`
- `POST /api/stripe/create-booking-checkout`
- `POST /api/stripe/create-meal-plan-checkout`
- `POST /api/stripe/create-workout-video-checkout`
- `POST /api/stripe/create-customer-portal-session`
- `POST /api/stripe/webhook`
- `POST /api/bookings/:id/payment-status`
- `GET /api/pricing/config`
- `GET /api/access/status`
- `POST /api/promo/redeem`

## Stripe webhook

Configure Stripe's webhook endpoint to:

```text
https://your-api-project.vercel.app/api/stripe/webhook
```

The Express JSON parser stores the raw request body for `/api/stripe/webhook` before parsing, so Stripe signature verification can use `STRIPE_WEBHOOK_SECRET`. Keep the webhook secret only in Vercel server-side environment variables.

## Local development

Local development is unchanged:

```sh
pnpm --filter @workspace/api-server dev
```

The local server still reads `artifacts/api-server/.env`, requires `PORT`, and listens with `src/index.ts`.
