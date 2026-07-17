import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import type { PricingConfigItem } from "@/lib/paymentConfig";
import type { Booking, TrainerWorkoutVideo } from "@/lib/supabaseApi";
import { API_BASE_URL, getApiBaseUrlErrorMessage } from "@/lib/videoCallConfig";

export const ONLINE_PAYMENT_UNAVAILABLE_MESSAGE =
  "Online payment is not available yet. Please enter a promo code or contact support.";

interface CheckoutResponse {
  url?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

interface BookingCheckoutResponse extends CheckoutResponse {
  booking?: Booking;
  paymentStatus?: "free_promo";
  promo?: {
    code?: string;
    message?: string;
  };
}

export interface AppAccessStatus {
  active: boolean;
  access_type?: "free_first_100" | "trial" | "paid_membership" | "free_code";
  status?: string;
  starts_at?: string;
  ends_at?: string | null;
  promo_source?: string | null;
  first_100_slots_remaining?: number;
  trial_available?: boolean;
  membership_price_key?: string;
}

export interface ContentAccessStatus {
  contentType: "booking" | "membership" | "meal_plan" | "workout_video";
  contentId?: string | null;
  hasAccess: boolean;
  reason: "free" | "purchased" | "assigned" | "trainer" | "locked" | "not_found";
}

export interface AccessStatusResponse {
  access: AppAccessStatus;
  contentAccess?: ContentAccessStatus | null;
  error?: string;
}

export interface PromoRedeemResult {
  ok: boolean;
  message?: string;
  type?: "discount" | "free_membership";
  discount_percent?: number | null;
  discount_amount_cents?: number | null;
  grants_free_membership?: boolean;
  duration_days?: number | null;
  access?: AppAccessStatus | null;
}

function getApiUrl(path: string) {
  const apiError = getApiBaseUrlErrorMessage();
  if (apiError) throw new Error(apiError);
  return `${API_BASE_URL.replace(/\/+$/, "")}${path}`;
}

async function readJson<T>(response: Response) {
  return (await response.json().catch(() => null)) as T | null;
}

function getUserFacingPaymentError(message?: string) {
  if (
    message &&
    /online payment is not available yet|(?:stripe|membership payments?).*(?:not configured|secret|price|key)/i.test(
      message,
    )
  ) {
    return ONLINE_PAYMENT_UNAVAILABLE_MESSAGE;
  }
  return message;
}

async function getJson<T>(path: string, accessToken?: string) {
  const response = await fetch(getApiUrl(path), {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  const data = await readJson<T & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(data?.error || "Could not reach the API server.");
  }
  return data as T;
}

async function postJson<T>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(getApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await readJson<T & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(getUserFacingPaymentError(data?.error) || "Could not complete this request.");
  }
  return data as T;
}

async function postCheckout(path: string, accessToken: string, body: Record<string, unknown>) {
  const data = await postJson<CheckoutResponse>(path, accessToken, body);
  if (!data?.url) {
    throw new Error("Online payment could not be started. Please try again or contact support.");
  }
  return data;
}

export async function openStripeUrl(url: string) {
  await WebBrowser.openBrowserAsync(url);
}

export function paymentReturnUrl(path: string) {
  return Linking.createURL(path);
}

export async function fetchPricingConfig() {
  const data = await getJson<{ pricing: PricingConfigItem[] }>("/api/pricing/config");
  return data.pricing ?? [];
}

export async function fetchAccessStatus(values: {
  accessToken: string;
  contentType?: ContentAccessStatus["contentType"];
  contentId?: string | null;
}) {
  const params = new URLSearchParams();
  if (values.contentType) params.set("contentType", values.contentType);
  if (values.contentId) params.set("contentId", values.contentId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<AccessStatusResponse>(`/api/access/status${suffix}`, values.accessToken);
}

export async function fetchWorkoutVideoContent(values: {
  accessToken: string;
  workoutVideoId: string;
}) {
  return getJson<{
    workout: TrainerWorkoutVideo;
    contentAccess: ContentAccessStatus;
  }>(`/api/content/workout-video/${encodeURIComponent(values.workoutVideoId)}`, values.accessToken);
}

export async function redeemPromoCode(values: {
  accessToken: string;
  code: string;
}) {
  const data = await postJson<{ result: PromoRedeemResult }>("/api/promo/redeem", values.accessToken, {
    code: values.code,
  });
  return data.result;
}

export async function createMembershipCheckout(values: {
  accessToken: string;
}) {
  return postCheckout("/api/stripe/create-membership-checkout", values.accessToken, {
    successUrl: paymentReturnUrl("/(user)/membership?checkout=success"),
    cancelUrl: paymentReturnUrl("/(user)/membership?checkout=cancel"),
  });
}

export async function createBookingPaymentCheckout(values: {
  accessToken: string;
  sessionType: string;
  sessionDate: string;
  sessionTime: string;
  note?: string | null;
  promoCode?: string | null;
}) {
  const data = await postJson<BookingCheckoutResponse>(
    "/api/stripe/create-booking-checkout",
    values.accessToken,
    {
      sessionType: values.sessionType,
      sessionDate: values.sessionDate,
      sessionTime: values.sessionTime,
      note: values.note ?? "",
      promoCode: values.promoCode?.trim() ?? "",
      successUrl: paymentReturnUrl("/(user)/booking?checkout=success"),
      cancelUrl: paymentReturnUrl("/(user)/booking?checkout=cancel"),
    },
  );
  if (!data?.url && !data?.booking) {
    throw new Error("Could not create this booking.");
  }
  return data;
}

export async function markBookingPaymentStatus(values: {
  accessToken: string;
  bookingId: string;
  paymentStatus: "free_promo" | "waived";
}) {
  return postJson<{ booking: Booking }>(
    `/api/bookings/${encodeURIComponent(values.bookingId)}/payment-status`,
    values.accessToken,
    { paymentStatus: values.paymentStatus },
  );
}

export async function createMealPlanCheckout(values: {
  accessToken: string;
  mealPlanId?: string | null;
}) {
  return postCheckout("/api/stripe/create-meal-plan-checkout", values.accessToken, {
    mealPlanId: values.mealPlanId ?? "",
    successUrl: paymentReturnUrl("/(user)/meals?checkout=success"),
    cancelUrl: paymentReturnUrl("/(user)/meals?checkout=cancel"),
  });
}

export async function createWorkoutVideoCheckout(values: {
  accessToken: string;
  workoutVideoId: string;
}) {
  return postCheckout("/api/stripe/create-workout-video-checkout", values.accessToken, {
    workoutVideoId: values.workoutVideoId,
    successUrl: paymentReturnUrl(`/(user)/workout-detail?workoutId=${values.workoutVideoId}&checkout=success`),
    cancelUrl: paymentReturnUrl(`/(user)/workout-detail?workoutId=${values.workoutVideoId}&checkout=cancel`),
  });
}

export async function createCustomerPortalSession(values: {
  accessToken: string;
}) {
  return postCheckout("/api/stripe/create-customer-portal-session", values.accessToken, {
    returnUrl: paymentReturnUrl("/(user)/membership"),
  });
}
