import { Router } from "express";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import Stripe from "stripe";

const router = Router();

type BillingInterval = "monthly" | "yearly";
type LegacyPlanName = "bronze" | "silver" | "gold" | "platinum";
type PricingKey =
  | "membership_monthly"
  | "booking_one_hour"
  | "custom_meal_plan"
  | "premium_workout_video";
type PaymentType =
  | "booking"
  | "subscription"
  | "membership"
  | "access_fee"
  | "meal_plan"
  | "workout_video";
type ContentType = "booking" | "membership" | "meal_plan" | "workout_video";

interface SupabaseUserResponse {
  id?: unknown;
  email?: unknown;
}

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  trainer_id: string | null;
}

interface BookingRow {
  id: string;
  user_id: string;
  trainer_id: string;
  payment_status: string | null;
}

interface PricingConfigRow {
  id?: string;
  key: PricingKey;
  title: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  stripe_price_id: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
}

interface UserSubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: string | null;
  status: string;
}

interface WorkoutVideoRow {
  id: string;
  trainer_id?: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  duration?: number;
  calories?: number;
  exercises?: number;
  thumbnail_url?: string | null;
  video_url?: string | null;
  instructions?: string | null;
  tips?: string | null;
  common_mistakes?: string | null;
  published: boolean;
  is_paid: boolean | null;
  price_cents: number | null;
  access_type?: string;
  stripe_price_id: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AccessStatus {
  active: boolean;
  access_type?: string;
  status?: string;
  starts_at?: string;
  ends_at?: string | null;
  promo_source?: string | null;
  first_100_slots_remaining?: number;
  trial_available?: boolean;
  membership_price_key?: PricingKey;
}

interface ContentAccessStatus {
  contentType: ContentType;
  contentId?: string | null;
  hasAccess: boolean;
  reason: "free" | "purchased" | "assigned" | "trainer" | "locked" | "not_found";
}

type FetchInit = {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
};

const LEGACY_PLAN_NAMES: LegacyPlanName[] = ["bronze", "silver", "gold", "platinum"];

const FALLBACK_PRICING: Record<PricingKey, Omit<PricingConfigRow, "id" | "is_active">> = {
  membership_monthly: {
    key: "membership_monthly",
    title: "Membership Access",
    description: "Basic app access after the first 100 free promo members.",
    amount_cents: readPositiveInt("STRIPE_MEMBERSHIP_MONTHLY_PRICE_CENTS", 800),
    currency: getCurrency(),
    stripe_price_id: env("STRIPE_PRICE_MEMBERSHIP_MONTHLY") || null,
    metadata: { interval: "month", trial_days: 7, first_100_free: true },
  },
  booking_one_hour: {
    key: "booking_one_hour",
    title: "1-hour Trainer Session",
    description: "Separate paid one-hour trainer or video call session.",
    amount_cents: readPositiveInt(
      "STRIPE_BOOKING_ONE_HOUR_PRICE_CENTS",
      readPositiveInt("STRIPE_BOOKING_SESSION_PRICE_CENTS", 5000),
    ),
    currency: getCurrency(),
    stripe_price_id: env("STRIPE_PRICE_BOOKING_ONE_HOUR") || null,
    metadata: { duration_minutes: 60 },
  },
  custom_meal_plan: {
    key: "custom_meal_plan",
    title: "Custom Meal Plan",
    description: "Separate paid custom meal plan request.",
    amount_cents: readPositiveInt("STRIPE_CUSTOM_MEAL_PLAN_PRICE_CENTS", 2500),
    currency: getCurrency(),
    stripe_price_id: env("STRIPE_PRICE_CUSTOM_MEAL_PLAN") || null,
    metadata: {},
  },
  premium_workout_video: {
    key: "premium_workout_video",
    title: "Premium Workout Video",
    description: "Separate paid workout video unlock.",
    amount_cents: readPositiveInt("STRIPE_PREMIUM_WORKOUT_VIDEO_PRICE_CENTS", 800),
    currency: getCurrency(),
    stripe_price_id: env("STRIPE_PRICE_PREMIUM_WORKOUT_VIDEO") || null,
    metadata: {},
  },
};

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function readPositiveInt(name: string, fallback: number) {
  const value = Number(env(name));
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function getStripe() {
  const secretKey = env("STRIPE_SECRET_KEY");
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

function getSupabaseConfig() {
  const url = env("SUPABASE_URL");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/+$/, ""), serviceRoleKey };
}

function getBearerToken(authHeader: unknown) {
  if (typeof authHeader !== "string") return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function getAppUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function getCurrency() {
  return env("STRIPE_CURRENCY").toLowerCase() || "usd";
}

function getLegacyPriceId(planName: LegacyPlanName, interval: BillingInterval) {
  const envName = `STRIPE_PRICE_${planName.toUpperCase()}_${interval === "monthly" ? "MONTHLY" : "YEARLY"}`;
  return env(envName);
}

function normalizeLegacyPlanName(value: unknown): LegacyPlanName | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return LEGACY_PLAN_NAMES.includes(normalized as LegacyPlanName)
    ? (normalized as LegacyPlanName)
    : null;
}

function normalizeInterval(value: unknown): BillingInterval {
  return value === "yearly" ? "yearly" : "monthly";
}

function normalizeContentType(value: unknown): ContentType | null {
  if (value === "booking" || value === "membership" || value === "meal_plan" || value === "workout_video") {
    return value;
  }
  return null;
}

async function supabaseFetch<T>(path: string, init?: FetchInit) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("supabase-not-configured");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`supabase-${response.status}-${text}`);
  }

  return (await response.json().catch(() => null)) as T;
}

async function supabaseSingle<T>(path: string) {
  const rows = await supabaseFetch<T[]>(path);
  return rows?.[0] ?? null;
}

async function supabaseRpc<T>(functionName: string, body: Record<string, unknown>) {
  return supabaseFetch<T>(`rpc/${functionName}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function getAuthenticatedUser(accessToken: string) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("supabase-not-configured");

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  const user = (await response.json().catch(() => null)) as SupabaseUserResponse | null;
  if (typeof user?.id !== "string") return null;
  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : null,
  };
}

async function requireUser(req: ExpressRequest) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) return null;
  return getAuthenticatedUser(token);
}

async function fetchProfile(userId: string) {
  return supabaseSingle<ProfileRow>(
    `profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,full_name,role,trainer_id&limit=1`,
  );
}

async function getDefaultTrainerId(userId: string) {
  const userProfile = await fetchProfile(userId);
  if (userProfile?.trainer_id) return userProfile.trainer_id;

  const trainer = await supabaseSingle<ProfileRow>(
    "profiles?role=in.(trainer,admin)&select=id,email,full_name,role,trainer_id&limit=1",
  );
  if (!trainer) throw new Error("No trainer account is available for this booking.");
  return trainer.id;
}

async function getOrCreateCustomer(stripe: Stripe, userId: string, email?: string | null) {
  const existing = await supabaseSingle<UserSubscriptionRow>(
    `user_subscriptions?user_id=eq.${encodeURIComponent(userId)}&stripe_customer_id=not.is.null&select=id,user_id,stripe_customer_id,stripe_subscription_id,plan_name,status&limit=1`,
  );
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const profile = await fetchProfile(userId);
  const customer = await stripe.customers.create({
    email: email ?? profile?.email ?? undefined,
    name: profile?.full_name ?? undefined,
    metadata: { user_id: userId },
  });

  return customer.id;
}

async function fetchPricingRows() {
  if (!getSupabaseConfig()) return [];
  try {
    const rows = await supabaseFetch<PricingConfigRow[]>(
      "pricing_config?is_active=eq.true&select=id,key,title,description,amount_cents,currency,stripe_price_id,is_active,metadata&order=created_at.asc",
    );
    return rows ?? [];
  } catch {
    return [];
  }
}

async function getPricingConfig() {
  const rows = await fetchPricingRows();
  const map = new Map<PricingKey, PricingConfigRow>();
  for (const fallback of Object.values(FALLBACK_PRICING)) {
    map.set(fallback.key, { ...fallback, is_active: true });
  }
  for (const row of rows) {
    if (row.is_active) map.set(row.key, row);
  }
  return Array.from(map.values());
}

async function getPricingItem(key: PricingKey) {
  const rows = await getPricingConfig();
  return rows.find((row) => row.key === key) ?? { ...FALLBACK_PRICING[key], is_active: true };
}

function buildCheckoutLineItem(
  item: PricingConfigRow,
  productName?: string,
  recurring?: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.Recurring,
) {
  if (item.stripe_price_id) {
    return { price: item.stripe_price_id, quantity: 1 };
  }

  return {
    quantity: 1,
    price_data: {
      currency: item.currency || getCurrency(),
      unit_amount: item.amount_cents,
      product_data: { name: productName ?? item.title },
      ...(recurring ? { recurring } : {}),
    },
  };
}

async function upsertPayment(values: {
  user_id: string;
  booking_id?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_checkout_session_id?: string | null;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  status: string;
}) {
  const existing = values.stripe_checkout_session_id
    ? await supabaseSingle<{ id: string }>(
        `payments?stripe_checkout_session_id=eq.${encodeURIComponent(values.stripe_checkout_session_id)}&select=id&limit=1`,
      )
    : null;

  if (existing) {
    const rows = await supabaseFetch<Array<{ id: string }>>(`payments?id=eq.${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    return rows[0] ?? existing;
  }

  const rows = await supabaseFetch<Array<{ id: string }>>("payments", {
    method: "POST",
    body: JSON.stringify(values),
  });
  return rows[0];
}

async function upsertSubscription(values: {
  user_id: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_name?: string | null;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}) {
  const existing = values.stripe_subscription_id
    ? await supabaseSingle<{ id: string }>(
        `user_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(values.stripe_subscription_id)}&select=id&limit=1`,
      )
    : null;

  if (existing) {
    await supabaseFetch(`user_subscriptions?id=eq.${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    return;
  }

  await supabaseFetch("user_subscriptions", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

async function upsertAppAccess(values: {
  user_id: string;
  access_type: "trial" | "paid_membership";
  status: "active" | "expired" | "cancelled";
  promo_source?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
}) {
  const existing = values.stripe_subscription_id
    ? await supabaseSingle<{ id: string }>(
        `app_access?stripe_subscription_id=eq.${encodeURIComponent(values.stripe_subscription_id)}&select=id&limit=1`,
      )
    : null;

  const payload = {
    user_id: values.user_id,
    access_type: values.access_type,
    status: values.status,
    promo_source: values.promo_source ?? null,
    starts_at: values.starts_at ?? new Date().toISOString(),
    ends_at: values.ends_at ?? null,
    stripe_customer_id: values.stripe_customer_id ?? null,
    stripe_subscription_id: values.stripe_subscription_id ?? null,
  };

  if (existing) {
    await supabaseFetch(`app_access?id=eq.${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return;
  }

  await supabaseFetch("app_access", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function upsertContentPurchase(values: {
  user_id: string;
  content_type: ContentType;
  content_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  amount_cents: number;
  currency: string;
  status: string;
}) {
  const existing = values.stripe_checkout_session_id
    ? await supabaseSingle<{ id: string }>(
        `content_purchases?stripe_checkout_session_id=eq.${encodeURIComponent(values.stripe_checkout_session_id)}&select=id&limit=1`,
      )
    : null;

  if (existing) {
    await supabaseFetch(`content_purchases?id=eq.${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    return;
  }

  await supabaseFetch("content_purchases", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

async function ensureAppAccess(userId: string) {
  return supabaseRpc<AccessStatus>("ensure_app_access", { p_user_id: userId });
}

async function fetchWorkoutVideo(workoutId: string) {
  return supabaseSingle<WorkoutVideoRow>(
    `workout_videos?id=eq.${encodeURIComponent(workoutId)}&select=id,trainer_id,title,published,is_paid,price_cents,stripe_price_id&limit=1`,
  );
}

async function fetchWorkoutVideoDetail(workoutId: string) {
  return supabaseSingle<WorkoutVideoRow>(
    `workout_videos?id=eq.${encodeURIComponent(workoutId)}&select=id,trainer_id,title,description,category,difficulty,duration,calories,exercises,thumbnail_url,video_url,instructions,tips,common_mistakes,published,is_paid,price_cents,access_type,stripe_price_id,created_at,updated_at&limit=1`,
  );
}

async function fetchPublishedWorkoutVideoDetails() {
  return supabaseFetch<WorkoutVideoRow[]>(
    "workout_videos?published=eq.true&select=id,trainer_id,title,description,category,difficulty,duration,calories,exercises,thumbnail_url,video_url,instructions,tips,common_mistakes,published,is_paid,price_cents,access_type,stripe_price_id,created_at,updated_at&order=created_at.desc",
  );
}

async function hasSuccessfulContentPurchase(userId: string, contentType: ContentType, contentId?: string | null) {
  const contentFilter = contentId
    ? `&content_id=eq.${encodeURIComponent(contentId)}`
    : "&content_id=is.null";
  const purchase = await supabaseSingle<{ id: string }>(
    `content_purchases?user_id=eq.${encodeURIComponent(userId)}&content_type=eq.${contentType}${contentFilter}&status=eq.succeeded&select=id&limit=1`,
  );
  return !!purchase;
}

async function getContentAccess(userId: string, contentType: ContentType, contentId?: string | null): Promise<ContentAccessStatus> {
  const profile = await fetchProfile(userId);

  if (contentType === "workout_video") {
    if (!contentId) return { contentType, contentId, hasAccess: false, reason: "not_found" };
    const workout = await fetchWorkoutVideo(contentId);
    const canManageWorkout = profile?.role === "admin" || workout?.trainer_id === userId;
    if (!workout || (!workout.published && !canManageWorkout)) {
      return { contentType, contentId, hasAccess: false, reason: "not_found" };
    }
    if (canManageWorkout) return { contentType, contentId, hasAccess: true, reason: "trainer" };
    if (!workout.is_paid) return { contentType, contentId, hasAccess: true, reason: "free" };
    const purchased = await hasSuccessfulContentPurchase(userId, "workout_video", contentId);
    return { contentType, contentId, hasAccess: purchased, reason: purchased ? "purchased" : "locked" };
  }

  if (profile?.role === "admin") {
    return { contentType, contentId, hasAccess: true, reason: "trainer" };
  }

  if (contentType === "meal_plan") {
    const purchased = await hasSuccessfulContentPurchase(userId, "meal_plan", contentId ?? null);
    return { contentType, contentId, hasAccess: purchased, reason: purchased ? "purchased" : "locked" };
  }

  const purchased = await hasSuccessfulContentPurchase(userId, contentType, contentId ?? null);
  return { contentType, contentId, hasAccess: purchased, reason: purchased ? "purchased" : "locked" };
}

function stripeTimestampToIso(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function checkoutPaymentSucceeded(status: Stripe.Checkout.Session.PaymentStatus | null) {
  return status === "paid" || status === "no_payment_required";
}

function checkoutPurchaseStatus(status: Stripe.Checkout.Session.PaymentStatus | null) {
  if (checkoutPaymentSucceeded(status)) return "succeeded";
  if (status === "unpaid") return "pending";
  return "pending";
}

function bookingPaymentStatus(status: Stripe.Checkout.Session.PaymentStatus | null) {
  return checkoutPaymentSucceeded(status) ? "paid" : "unpaid";
}

async function handleBookingCheckoutCompleted(session: Stripe.Checkout.Session, userId: string) {
  const amount = session.amount_total ?? Number(session.metadata?.amount ?? 0);
  const currency = session.currency ?? getCurrency();
  const trainerId = session.metadata?.trainer_id;
  const sessionType = session.metadata?.session_type;
  const sessionDate = session.metadata?.session_date;
  const sessionTime = session.metadata?.session_time;

  if (!trainerId || !sessionType || !sessionDate || !sessionTime || amount < 0) return;
  const paymentSucceeded = checkoutPaymentSucceeded(session.payment_status);
  const paymentStatus = bookingPaymentStatus(session.payment_status);
  const purchaseStatus = checkoutPurchaseStatus(session.payment_status);

  const payment = await upsertPayment({
    user_id: userId,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    stripe_checkout_session_id: session.id,
    amount,
    currency,
    payment_type: "booking",
    status: purchaseStatus,
  });

  const existingBooking = await supabaseSingle<BookingRow>(
    `bookings?payment_id=eq.${payment.id}&select=id,user_id,trainer_id,payment_status&limit=1`,
  );

  const bookingId = existingBooking?.id ?? "";
  let finalBookingId = bookingId;
  if (!existingBooking) {
    const rows = await supabaseFetch<Array<{ id: string }>>("bookings", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        trainer_id: trainerId,
        session_type: sessionType,
        session_date: sessionDate,
        session_time: sessionTime,
        note: session.metadata?.note || null,
        status: "pending",
        payment_status: paymentStatus,
        payment_id: payment.id,
        amount_paid: paymentSucceeded ? amount : 0,
      }),
    });
    finalBookingId = rows[0]?.id ?? "";
  }

  if (finalBookingId) {
    await upsertPayment({
      user_id: userId,
      booking_id: finalBookingId,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripe_checkout_session_id: session.id,
      amount,
      currency,
      payment_type: "booking",
      status: purchaseStatus,
    });

    await upsertContentPurchase({
      user_id: userId,
      content_type: "booking",
      content_id: finalBookingId,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      stripe_checkout_session_id: session.id,
      amount_cents: amount,
      currency,
      status: purchaseStatus,
    });
  }
}

async function handleOneTimeContentCheckoutCompleted(
  session: Stripe.Checkout.Session,
  userId: string,
  contentType: "meal_plan" | "workout_video",
) {
  const amount = session.amount_total ?? Number(session.metadata?.amount ?? 0);
  const currency = session.currency ?? getCurrency();
  const contentId = session.metadata?.content_id || null;
  const status = checkoutPurchaseStatus(session.payment_status);

  await upsertPayment({
    user_id: userId,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    stripe_checkout_session_id: session.id,
    amount,
    currency,
    payment_type: contentType,
    status,
  });

  await upsertContentPurchase({
    user_id: userId,
    content_type: contentType,
    content_id: contentId,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    stripe_checkout_session_id: session.id,
    amount_cents: amount,
    currency,
    status,
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const paymentType = session.metadata?.payment_type as PaymentType | undefined;
  if (!userId || !paymentType) return;

  if (paymentType === "booking") {
    await handleBookingCheckoutCompleted(session, userId);
    return;
  }

  if ((paymentType === "membership" || paymentType === "subscription") && typeof session.subscription === "string") {
    await upsertPayment({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? getCurrency(),
      payment_type: "membership",
      status: session.payment_status ?? "paid",
    });
    return;
  }

  if (paymentType === "meal_plan" || paymentType === "workout_video") {
    await handleOneTimeContentCheckoutCompleted(session, userId, paymentType);
  }
}

async function handleSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id;
  if (!userId) return;
  const currentItem = subscription.items.data[0];
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const currentPeriodStart = stripeTimestampToIso(currentItem?.current_period_start);
  const currentPeriodEnd = stripeTimestampToIso(currentItem?.current_period_end);

  await upsertSubscription({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan_name: subscription.metadata.plan_name ?? "membership_monthly",
    status: subscription.status,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
  });

  const active = subscription.status === "trialing" || subscription.status === "active";
  await upsertAppAccess({
    user_id: userId,
    access_type: subscription.status === "trialing" ? "trial" : "paid_membership",
    status: active ? "active" : subscription.status === "canceled" ? "cancelled" : "expired",
    promo_source: subscription.status === "trialing" ? "stripe_trial" : "stripe_membership",
    starts_at: currentPeriodStart,
    ends_at: currentPeriodEnd,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
  });
}

async function handlePaymentIntent(intent: Stripe.PaymentIntent) {
  const status = intent.status === "succeeded" ? "succeeded" : "failed";
  const payment = await supabaseSingle<{ id: string; user_id: string }>(
    `payments?stripe_payment_intent_id=eq.${encodeURIComponent(intent.id)}&select=id,user_id&limit=1`,
  );
  if (payment) {
    await supabaseFetch(`payments?id=eq.${payment.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  const purchase = await supabaseSingle<{ id: string }>(
    `content_purchases?stripe_payment_intent_id=eq.${encodeURIComponent(intent.id)}&select=id&limit=1`,
  );
  if (purchase) {
    await supabaseFetch(`content_purchases?id=eq.${purchase.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}

async function handleInvoice(stripe: Stripe, invoice: Stripe.Invoice) {
  const looseInvoice = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    parent?: {
      subscription_details?: {
        subscription?: string | Stripe.Subscription | null;
      } | null;
    } | null;
  };
  const subscriptionValue =
    looseInvoice.subscription ?? looseInvoice.parent?.subscription_details?.subscription ?? null;
  const subscriptionId =
    typeof subscriptionValue === "string" ? subscriptionValue : subscriptionValue?.id;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscription(subscription);
}

router.get("/pricing/config", async (_req, res) => {
  res.json({ pricing: await getPricingConfig() });
});

router.get("/access/status", async (req, res) => {
  if (!getSupabaseConfig()) {
    res.status(503).json({ error: "Access server is not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to check access." });
    return;
  }

  try {
    const access = await ensureAppAccess(user.id);
    const contentType = normalizeContentType(req.query.contentType);
    const contentId = typeof req.query.contentId === "string" ? req.query.contentId : null;
    const contentAccess = contentType
      ? await getContentAccess(user.id, contentType, contentId)
      : null;
    res.json({ access, contentAccess });
  } catch (error) {
    req.log?.error({ err: error }, "Access status check failed");
    res.status(500).json({ error: "Could not check app access. Please try again." });
  }
});

router.get("/content/workout-video/:id", async (req, res) => {
  if (!getSupabaseConfig()) {
    res.status(503).json({ error: "Content server is not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to view this workout." });
    return;
  }

  try {
    const workout = await fetchWorkoutVideoDetail(req.params.id);
    const profile = await fetchProfile(user.id);
    const isOwnerOrAdmin =
      profile?.role === "admin" || workout?.trainer_id === user.id;

    if (!workout || (!workout.published && !isOwnerOrAdmin)) {
      res.status(404).json({ error: "Workout video was not found." });
      return;
    }

    const contentAccess = await getContentAccess(user.id, "workout_video", workout.id);
    res.json({
      workout: {
        ...workout,
        video_url: contentAccess.hasAccess ? workout.video_url ?? null : null,
      },
      contentAccess,
    });
  } catch (error) {
    req.log?.error({ err: error }, "Workout video content fetch failed");
    res.status(500).json({ error: "Could not load this workout video." });
  }
});

router.get("/content/workout-videos", async (req, res) => {
  if (!getSupabaseConfig()) {
    res.status(503).json({ error: "Content server is not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to view workout videos." });
    return;
  }

  try {
    const workouts = await fetchPublishedWorkoutVideoDetails();
    const rows = await Promise.all(
      workouts.map(async (workout) => {
        const contentAccess = await getContentAccess(user.id, "workout_video", workout.id);
        return {
          ...workout,
          video_url: contentAccess.hasAccess ? workout.video_url ?? null : null,
          contentAccess,
        };
      }),
    );
    res.json({ workouts: rows });
  } catch (error) {
    req.log?.error({ err: error }, "Workout video catalog fetch failed");
    res.status(500).json({ error: "Could not load workout videos." });
  }
});

router.post("/promo/redeem", async (req, res) => {
  if (!getSupabaseConfig()) {
    res.status(503).json({ error: "Promo code redemption is not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to redeem a code." });
    return;
  }

  const code = typeof (req.body as Record<string, unknown>).code === "string"
    ? ((req.body as Record<string, unknown>).code as string).trim()
    : "";
  if (!code) {
    res.status(400).json({ error: "Enter a promo code first." });
    return;
  }

  try {
    const result = await supabaseRpc<Record<string, unknown>>("redeem_promo_code", {
      p_user_id: user.id,
      p_code: code,
    });
    if (result.ok === false) {
      res.status(400).json({ error: result.message ?? "This code could not be redeemed.", result });
      return;
    }
    res.json({ result });
  } catch (error) {
    req.log?.error({ err: error }, "Promo code redemption failed");
    res.status(500).json({ error: "Could not redeem this code. Please try again." });
  }
});

async function createMembershipCheckout(req: ExpressRequest, res: ExpressResponse) {
  const stripe = getStripe();
  if (!stripe || !getSupabaseConfig()) {
    res.status(503).json({ error: "Stripe memberships are not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in before starting membership." });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const successUrl = getAppUrl(body.successUrl);
  const cancelUrl = getAppUrl(body.cancelUrl);
  if (!successUrl || !cancelUrl) {
    res.status(400).json({ error: "Success URL and cancel URL are required." });
    return;
  }

  try {
    const access = await ensureAppAccess(user.id);
    if (access.active) {
      res.status(409).json({ error: "You already have active membership access.", access });
      return;
    }

    const pricing = await getPricingItem("membership_monthly");
    const customer = await getOrCreateCustomer(stripe, user.id, user.email);
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      payment_method_types: ["card"],
      line_items: [buildCheckoutLineItem(pricing, pricing.title, { interval: "month" })],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
          plan_name: "membership_monthly",
          billing_interval: "monthly",
          payment_type: "membership",
        },
      },
      metadata: {
        payment_type: "membership",
        user_id: user.id,
        plan_name: "membership_monthly",
        billing_interval: "monthly",
        amount: String(pricing.amount_cents),
      },
    });
    res.json({ url: checkout.url, amount: pricing.amount_cents, currency: pricing.currency });
  } catch (error) {
    req.log?.error({ err: error }, "Stripe membership Checkout failed");
    res.status(500).json({ error: "Could not start membership checkout. Please try again." });
  }
}

async function createBookingCheckout(req: ExpressRequest, res: ExpressResponse) {
  const stripe = getStripe();
  if (!stripe || !getSupabaseConfig()) {
    res.status(503).json({ error: "Stripe payments are not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in before paying." });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const sessionType = typeof body.sessionType === "string" ? body.sessionType.trim() : "";
  const sessionDate = typeof body.sessionDate === "string" ? body.sessionDate.trim() : "";
  const sessionTime = typeof body.sessionTime === "string" ? body.sessionTime.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";
  const successUrl = getAppUrl(body.successUrl);
  const cancelUrl = getAppUrl(body.cancelUrl);

  if (!sessionType || !sessionDate || !sessionTime || !successUrl || !cancelUrl) {
    res.status(400).json({ error: "Session type, date, time, success URL, and cancel URL are required." });
    return;
  }

  try {
    const pricing = await getPricingItem("booking_one_hour");
    const trainerId = await getDefaultTrainerId(user.id);
    const customer = await getOrCreateCustomer(stripe, user.id, user.email);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer,
      payment_method_types: ["card"],
      line_items: [buildCheckoutLineItem(pricing, sessionType)],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        payment_type: "booking",
        user_id: user.id,
        trainer_id: trainerId,
        session_type: sessionType,
        session_date: sessionDate,
        session_time: sessionTime,
        note,
        amount: String(pricing.amount_cents),
      },
    });

    res.json({ url: checkout.url, amount: pricing.amount_cents, currency: pricing.currency });
  } catch (error) {
    req.log?.error({ err: error }, "Stripe booking Checkout failed");
    res.status(500).json({ error: "Could not start booking payment. Please try again." });
  }
}

async function createMealPlanCheckout(req: ExpressRequest, res: ExpressResponse) {
  const stripe = getStripe();
  if (!stripe || !getSupabaseConfig()) {
    res.status(503).json({ error: "Stripe meal plan payments are not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in before purchasing a meal plan." });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const successUrl = getAppUrl(body.successUrl);
  const cancelUrl = getAppUrl(body.cancelUrl);
  const mealPlanId = typeof body.mealPlanId === "string" ? body.mealPlanId.trim() : "";
  if (!successUrl || !cancelUrl) {
    res.status(400).json({ error: "Success URL and cancel URL are required." });
    return;
  }

  try {
    const pricing = await getPricingItem("custom_meal_plan");
    const customer = await getOrCreateCustomer(stripe, user.id, user.email);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer,
      payment_method_types: ["card"],
      line_items: [buildCheckoutLineItem(pricing, pricing.title)],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        payment_type: "meal_plan",
        user_id: user.id,
        content_id: mealPlanId,
        amount: String(pricing.amount_cents),
      },
    });
    res.json({ url: checkout.url, amount: pricing.amount_cents, currency: pricing.currency });
  } catch (error) {
    req.log?.error({ err: error }, "Stripe meal plan Checkout failed");
    res.status(500).json({ error: "Could not start meal plan checkout. Please try again." });
  }
}

async function createWorkoutVideoCheckout(req: ExpressRequest, res: ExpressResponse) {
  const stripe = getStripe();
  if (!stripe || !getSupabaseConfig()) {
    res.status(503).json({ error: "Stripe workout video payments are not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in before unlocking a video." });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const workoutVideoId = typeof body.workoutVideoId === "string" ? body.workoutVideoId.trim() : "";
  const successUrl = getAppUrl(body.successUrl);
  const cancelUrl = getAppUrl(body.cancelUrl);
  if (!workoutVideoId || !successUrl || !cancelUrl) {
    res.status(400).json({ error: "Workout video, success URL, and cancel URL are required." });
    return;
  }

  try {
    const contentAccess = await getContentAccess(user.id, "workout_video", workoutVideoId);
    if (contentAccess.hasAccess) {
      res.status(409).json({ error: "You already have access to this workout video.", contentAccess });
      return;
    }

    const workout = await fetchWorkoutVideo(workoutVideoId);
    if (!workout?.published || !workout.is_paid) {
      res.status(404).json({ error: "This paid workout video is not available." });
      return;
    }

    const fallbackPricing = await getPricingItem("premium_workout_video");
    const pricing: PricingConfigRow = {
      ...fallbackPricing,
      title: workout.title,
      amount_cents: workout.price_cents && workout.price_cents > 0 ? workout.price_cents : fallbackPricing.amount_cents,
      stripe_price_id: workout.stripe_price_id || fallbackPricing.stripe_price_id,
    };
    const customer = await getOrCreateCustomer(stripe, user.id, user.email);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer,
      payment_method_types: ["card"],
      line_items: [buildCheckoutLineItem(pricing, workout.title)],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        payment_type: "workout_video",
        user_id: user.id,
        content_id: workout.id,
        amount: String(pricing.amount_cents),
      },
    });
    res.json({ url: checkout.url, amount: pricing.amount_cents, currency: pricing.currency });
  } catch (error) {
    req.log?.error({ err: error }, "Stripe workout video Checkout failed");
    res.status(500).json({ error: "Could not start workout video checkout. Please try again." });
  }
}

router.post("/stripe/create-membership-checkout", createMembershipCheckout);
router.post("/stripe/create-booking-checkout", createBookingCheckout);
router.post("/stripe/create-booking-payment", createBookingCheckout);
router.post("/stripe/create-meal-plan-checkout", createMealPlanCheckout);
router.post("/stripe/create-workout-video-checkout", createWorkoutVideoCheckout);

router.post("/stripe/create-subscription-session", async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !getSupabaseConfig()) {
    res.status(503).json({ error: "Stripe subscriptions are not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in before subscribing." });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const planName = normalizeLegacyPlanName(body.planName);
  const interval = normalizeInterval(body.interval);
  const successUrl = getAppUrl(body.successUrl);
  const cancelUrl = getAppUrl(body.cancelUrl);
  if (!successUrl || !cancelUrl) {
    res.status(400).json({ error: "Success URL and cancel URL are required." });
    return;
  }

  if (!planName) {
    await createMembershipCheckout(req, res);
    return;
  }

  const priceId = getLegacyPriceId(planName, interval);
  if (!priceId) {
    await createMembershipCheckout(req, res);
    return;
  }

  try {
    const customer = await getOrCreateCustomer(stripe, user.id, user.email);
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_name: planName,
          billing_interval: interval,
          payment_type: "subscription",
        },
      },
      metadata: {
        payment_type: "subscription",
        user_id: user.id,
        plan_name: planName,
        billing_interval: interval,
      },
    });
    res.json({ url: checkout.url });
  } catch (error) {
    req.log?.error({ err: error }, "Stripe legacy subscription Checkout failed");
    res.status(500).json({ error: "Could not start subscription checkout. Please try again." });
  }
});

router.post("/stripe/create-checkout-session", async (_req, res) => {
  res.status(400).json({
    error:
      "Use /api/stripe/create-membership-checkout, /api/stripe/create-booking-checkout, /api/stripe/create-meal-plan-checkout, or /api/stripe/create-workout-video-checkout.",
  });
});

router.post("/stripe/create-customer-portal-session", async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !getSupabaseConfig()) {
    res.status(503).json({ error: "Stripe customer portal is not configured yet." });
    return;
  }

  const user = await requireUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in before managing billing." });
    return;
  }

  const returnUrl = getAppUrl((req.body as Record<string, unknown>).returnUrl);
  if (!returnUrl) {
    res.status(400).json({ error: "Return URL is required." });
    return;
  }

  try {
    const customer = await getOrCreateCustomer(stripe, user.id, user.email);
    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
    });
    res.json({ url: portal.url });
  } catch (error) {
    req.log?.error({ err: error }, "Stripe customer portal failed");
    res.status(500).json({ error: "Could not open billing management. Please try again." });
  }
});

router.post("/stripe/webhook", async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = env("STRIPE_WEBHOOK_SECRET");
  if (!stripe || !webhookSecret || !getSupabaseConfig()) {
    res.status(503).json({ error: "Stripe webhook is not configured." });
    return;
  }

  const signature = req.headers["stripe-signature"];
  const rawBody = (req as ExpressRequest & { rawBody?: Buffer }).rawBody;
  if (!signature || !rawBody) {
    res.status(400).json({ error: "Stripe signature or raw body is missing." });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    res.status(400).json({ error: "Invalid Stripe webhook signature." });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscription(event.data.object);
        break;
      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        await handleInvoice(stripe, event.data.object);
        break;
      case "payment_intent.succeeded":
      case "payment_intent.payment_failed":
        await handlePaymentIntent(event.data.object);
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    req.log?.error({ err: error, eventType: event.type }, "Stripe webhook handling failed");
    res.status(500).json({ error: "Webhook could not be processed." });
  }
});

export default router;
