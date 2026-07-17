import { BASIC_SUBSCRIPTION_PLAN } from "@/lib/pricingPlans";

export type PricingKey =
  | "membership_monthly"
  | "booking_one_hour"
  | "custom_meal_plan"
  | "premium_workout_video";

export interface PricingConfigItem {
  key: PricingKey;
  title: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  stripe_price_id?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

export const DEFAULT_PRICING_CONFIG: Record<PricingKey, PricingConfigItem> = {
  membership_monthly: {
    key: "membership_monthly",
    title: BASIC_SUBSCRIPTION_PLAN.name,
    description: BASIC_SUBSCRIPTION_PLAN.description,
    amount_cents: BASIC_SUBSCRIPTION_PLAN.priceCents,
    currency: BASIC_SUBSCRIPTION_PLAN.currency,
    metadata: {
      interval: BASIC_SUBSCRIPTION_PLAN.interval,
      first_100_promo_code: "FREE100",
    },
  },
  booking_one_hour: {
    key: "booking_one_hour",
    title: "1-hour Trainer Session",
    description: "Separate paid one-hour trainer/video session booking.",
    amount_cents: 5000,
    currency: "usd",
    metadata: { duration_minutes: 60 },
  },
  custom_meal_plan: {
    key: "custom_meal_plan",
    title: "Custom Meal Plan",
    description: "Separate paid custom meal plan request.",
    amount_cents: 2500,
    currency: "usd",
  },
  premium_workout_video: {
    key: "premium_workout_video",
    title: "Premium Workout Video",
    description: "Separate paid premium workout video unlock.",
    amount_cents: 800,
    currency: "usd",
  },
};

export function mergePricingConfig(items: PricingConfigItem[] = []) {
  return items.reduce(
    (map, item) => ({
      ...map,
      [item.key]: {
        ...map[item.key],
        ...item,
      },
    }),
    { ...DEFAULT_PRICING_CONFIG },
  );
}

export function formatPrice(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
