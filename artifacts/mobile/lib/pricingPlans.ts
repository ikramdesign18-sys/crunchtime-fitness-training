export type SubscriptionPlanId = "basic" | "bronze" | "silver" | "gold";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceCents: number;
  currency: "usd";
  interval: "month";
  description: string;
  features: readonly string[];
  cta: string;
  isMostPopular: boolean;
  checkoutKey: "membership_monthly" | null;
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic App Access",
    priceCents: 800,
    currency: "usd",
    interval: "month",
    description: "Basic monthly access to the CrunchTime Fitness app.",
    features: [
      "Access to the app",
      "Basic progress tracking",
      "Standard workout library access",
      "App-based workout tracking",
      "Ability to use the platform",
      "First 100 users promo can be free using promo code FREE100",
    ],
    cta: "Start Basic Access",
    isMostPopular: false,
    checkoutKey: "membership_monthly",
  },
  {
    id: "bronze",
    name: "Bronze / Starter",
    priceCents: 12500,
    currency: "usd",
    interval: "month",
    description:
      "Designed for self-directed clients who need professional programming and basic guidance.",
    features: [
      "Personalized workout routine",
      "Proven training methods",
      "Access to exercise video library",
      "App-based workout tracking",
      "Basic meal planning",
      "2 meal plans",
      "Weekly progress check-in through the app",
    ],
    cta: "Choose Bronze",
    isMostPopular: false,
    checkoutKey: null,
  },
  {
    id: "silver",
    name: "Silver / Standard",
    priceCents: 17500,
    currency: "usd",
    interval: "month",
    description:
      "The core coaching package for clients who want more accountability and support.",
    features: [
      "Everything in Bronze",
      "3 custom meal plans",
      "3 trainer calls",
      "Video form review",
      "More frequent check-ins",
      "Customized nutrition guidance",
      "Trainer support through the app",
    ],
    cta: "Choose Silver",
    isMostPopular: true,
    checkoutKey: null,
  },
  {
    id: "gold",
    name: "Gold / Premium",
    priceCents: 22500,
    currency: "usd",
    interval: "month",
    description:
      "Premium coaching for clients who want higher accountability and faster progress.",
    features: [
      "Everything in Silver",
      "1:1 video coaching calls",
      "Advanced habit and lifestyle coaching",
      "Priority messaging support",
      "Same-day response support when available",
      "Premium coaching experience",
    ],
    cta: "Choose Gold",
    isMostPopular: false,
    checkoutKey: null,
  },
];

export const BASIC_SUBSCRIPTION_PLAN = SUBSCRIPTION_PLANS[0];

export function formatSubscriptionPrice(plan: SubscriptionPlan) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency.toUpperCase(),
    minimumFractionDigits: plan.priceCents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: plan.priceCents % 100 === 0 ? 0 : 2,
  }).format(plan.priceCents / 100);
}
