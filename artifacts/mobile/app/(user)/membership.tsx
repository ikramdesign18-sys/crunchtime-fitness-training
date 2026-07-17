import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  createCustomerPortalSession,
  createMealPlanCheckout,
  createMembershipCheckout,
  fetchAccessStatus,
  fetchPricingConfig,
  openStripeUrl,
  redeemPromoCode,
  type AppAccessStatus,
} from "@/lib/paymentApi";
import { formatPrice, mergePricingConfig, type PricingConfigItem } from "@/lib/paymentConfig";
import {
  formatSubscriptionPrice,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from "@/lib/pricingPlans";
import { fetchUserSubscriptions, type UserSubscription } from "@/lib/supabaseApi";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

const PLAN_ICONS: Record<SubscriptionPlanId, keyof typeof Ionicons.glyphMap> = {
  basic: "phone-portrait-outline",
  bronze: "barbell-outline",
  silver: "shield-checkmark-outline",
  gold: "diamond-outline",
};

function accessLabel(access: AppAccessStatus | null) {
  if (!access?.active) return "No active subscription";
  if (access.access_type === "free_first_100") return "Promotional access";
  if (access.access_type === "free_code") return "Complimentary access";
  if (access.access_type === "trial") return "Trial access";
  if (access.access_type === "paid_membership") return "Active membership";
  return "Active access";
}

export default function MembershipScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [pricingRows, setPricingRows] = useState<PricingConfigItem[]>([]);
  const [access, setAccess] = useState<AppAccessStatus | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [freeCode, setFreeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState<"promo" | "free" | null>(null);

  const pricing = useMemo(() => mergePricingConfig(pricingRows), [pricingRows]);
  const bookingPrice = pricing.booking_one_hour;
  const mealPlanPrice = pricing.custom_meal_plan;
  const workoutVideoPrice = pricing.premium_workout_video;

  const activeSubscription = useMemo(
    () => subscriptions.find((item) => ACTIVE_STATUSES.has(item.status)) ?? null,
    [subscriptions],
  );

  const loadBilling = async () => {
    try {
      setPricingRows(await fetchPricingConfig());
    } catch {
      setPricingRows([]);
    }

    if (!user || !session?.access_token) return;

    try {
      const [accessResult, subscriptionRows] = await Promise.all([
        fetchAccessStatus({ accessToken: session.access_token }),
        fetchUserSubscriptions(user.id),
      ]);
      setAccess(accessResult.access);
      setSubscriptions(subscriptionRows);
    } catch {
      setAccess(null);
      setSubscriptions([]);
    }
  };

  useEffect(() => {
    loadBilling();
  }, [session?.access_token, user]);

  const startMembership = async () => {
    if (!session?.access_token) {
      Alert.alert("Sign In Required", "Please sign in before starting membership.");
      return;
    }
    setLoading(true);
    try {
      const checkout = await createMembershipCheckout({ accessToken: session.access_token });
      await openStripeUrl(checkout.url!);
      await loadBilling();
      Alert.alert(
        "Checkout Opened",
        "Stripe will confirm your Basic App Access subscription after payment is completed.",
      );
    } catch (error) {
      Alert.alert("Membership Unavailable", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (plan: SubscriptionPlan) => {
    if (plan.checkoutKey === "membership_monthly") {
      void startMembership();
      return;
    }

    Alert.alert(
      `${plan.name} Coaching`,
      "Online checkout for this coaching plan is not available yet. Please contact CrunchTime Fitness support to get started. No payment has been taken.",
    );
  };

  const manageSubscription = async () => {
    if (!session?.access_token) return;
    setPortalLoading(true);
    try {
      const portal = await createCustomerPortalSession({ accessToken: session.access_token });
      await openStripeUrl(portal.url!);
      await loadBilling();
    } catch (error) {
      Alert.alert("Billing Unavailable", (error as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  const redeem = async (kind: "promo" | "free") => {
    if (!session?.access_token) {
      Alert.alert("Sign In Required", "Please sign in before redeeming a code.");
      return;
    }
    const code = kind === "promo" ? promoCode : freeCode;
    if (!code.trim()) {
      Alert.alert("Code Required", "Enter a code first.");
      return;
    }

    setPromoLoading(kind);
    try {
      const result = await redeemPromoCode({ accessToken: session.access_token, code });
      if (kind === "promo") setPromoCode("");
      else setFreeCode("");
      await loadBilling();
      Alert.alert("Code Redeemed", result.message || "Your code was redeemed.");
    } catch (error) {
      Alert.alert("Code Not Redeemed", (error as Error).message);
    } finally {
      setPromoLoading(null);
    }
  };

  const requestMealPlan = async () => {
    if (!session?.access_token) {
      Alert.alert("Sign In Required", "Please sign in before purchasing a custom meal plan.");
      return;
    }
    setMealPlanLoading(true);
    try {
      const checkout = await createMealPlanCheckout({ accessToken: session.access_token });
      await openStripeUrl(checkout.url!);
      Alert.alert(
        "Meal Plan Request",
        "Stripe will confirm the purchase before your trainer prepares the custom plan.",
      );
    } catch (error) {
      Alert.alert("Meal Plan Payment Failed", (error as Error).message);
    } finally {
      setMealPlanLoading(false);
    }
  };

  const getPlanAccent = (planId: SubscriptionPlanId) => {
    if (planId === "bronze") return "#C98543";
    if (planId === "silver") return colors.isDark ? "#D7DCE5" : "#687386";
    if (planId === "gold") return colors.primary;
    return colors.isDark ? "#C7C7C7" : "#4B5563";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            borderBottomColor: colors.border,
            backgroundColor: colors.headerBg,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Membership</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 56) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={
            colors.isDark
              ? ["#211E14", "#121212"]
              : ["#FFFFFF", "#FFF7DA"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            {
              borderColor: colors.isDark ? "#443A18" : "#E9D897",
              shadowColor: colors.isDark ? "#000000" : colors.primaryDark,
            },
          ]}
        >
          <View style={[styles.heroIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="trophy-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.heroEyebrow, { color: colors.primary }]}>CRUNCHTIME FITNESS</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Monthly Subscription Plans
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            Start with basic access or upgrade to a coaching package.
          </Text>
          <View style={styles.heroFacts}>
            <View
              style={[
                styles.heroPill,
                { backgroundColor: colors.isDark ? "#292929" : "#FFFFFF" },
              ]}
            >
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.heroPillText, { color: colors.foreground }]}>
                All prices are monthly.
              </Text>
            </View>
            <View
              style={[
                styles.heroPill,
                { backgroundColor: colors.isDark ? "#292929" : "#FFFFFF" },
              ]}
            >
              <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
              <Text style={[styles.heroPillText, { color: colors.foreground }]}>
                Promo codes supported
              </Text>
            </View>
          </View>
        </LinearGradient>

        <AppCard
          style={[
            styles.statusCard,
            {
              borderColor: access?.active ? colors.primary : colors.border,
              shadowColor: colors.isDark ? "#000000" : "#6B5A24",
            },
          ]}
        >
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIcon,
                {
                  backgroundColor: access?.active ? colors.primaryLight : colors.muted,
                },
              ]}
            >
              <Ionicons
                name={access?.active ? "checkmark-circle-outline" : "card-outline"}
                size={22}
                color={access?.active ? colors.primary : colors.mutedForeground}
              />
            </View>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>
                CURRENT ACCESS
              </Text>
              <Text style={[styles.statusTitle, { color: colors.foreground }]}>
                {accessLabel(access)}
              </Text>
              {access?.ends_at ? (
                <Text style={[styles.statusMeta, { color: colors.mutedForeground }]}>
                  Active through {new Date(access.ends_at).toLocaleDateString()}
                </Text>
              ) : activeSubscription?.current_period_end ? (
                <Text style={[styles.statusMeta, { color: colors.mutedForeground }]}>
                  Billing period ends{" "}
                  {new Date(activeSubscription.current_period_end).toLocaleDateString()}
                </Text>
              ) : (
                <Text style={[styles.statusMeta, { color: colors.mutedForeground }]}>
                  Choose the monthly plan that fits your goals.
                </Text>
              )}
            </View>
            <Badge
              label={access?.active ? "Active" : "Inactive"}
              color={access?.active ? "success" : "muted"}
              small
            />
          </View>
          {activeSubscription ? (
            <AppButton
              title="Manage Billing"
              onPress={manageSubscription}
              loading={portalLoading}
              variant="outline"
              style={styles.cardButton}
            />
          ) : null}
        </AppCard>

        <View style={styles.sectionIntro}>
          <View>
            <Text style={[styles.blockEyebrow, { color: colors.primary }]}>CHOOSE YOUR LEVEL</Text>
            <Text style={[styles.blockTitle, { color: colors.foreground }]}>
              Built for every stage
            </Text>
          </View>
          <Ionicons name="arrow-down-circle-outline" size={24} color={colors.primary} />
        </View>

        <View style={styles.planList}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const accent = getPlanAccent(plan.id);
            const isBasicActive = plan.id === "basic" && !!access?.active;
            const planBackground = plan.isMostPopular
              ? colors.isDark
                ? "#211E14"
                : "#FFFCF2"
              : colors.card;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: planBackground,
                    borderColor: plan.isMostPopular ? colors.primary : colors.border,
                    borderWidth: plan.isMostPopular ? 2 : 1,
                    shadowColor: plan.isMostPopular
                      ? colors.isDark
                        ? "#000000"
                        : colors.primaryDark
                      : "#000000",
                    shadowOpacity: plan.isMostPopular
                      ? colors.isDark
                        ? 0.38
                        : 0.18
                      : colors.isDark
                        ? 0.25
                        : 0.07,
                  },
                ]}
              >
                {plan.isMostPopular ? (
                  <View
                    style={[
                      styles.popularBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="sparkles" size={13} color={colors.primaryForeground} />
                    <Text
                      style={[
                        styles.popularBadgeText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      MOST POPULAR
                    </Text>
                  </View>
                ) : null}

                <View style={styles.planHeader}>
                  <View
                    style={[
                      styles.planIcon,
                      {
                        backgroundColor: `${accent}1A`,
                        borderColor: `${accent}40`,
                      },
                    ]}
                  >
                    <Ionicons name={PLAN_ICONS[plan.id]} size={23} color={accent} />
                  </View>
                  <View style={styles.planHeadingCopy}>
                    <Text style={[styles.planName, { color: colors.foreground }]}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.planBilling, { color: accent }]}>
                      MONTHLY SUBSCRIPTION
                    </Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: colors.foreground }]}>
                    {formatSubscriptionPrice(plan)}
                  </Text>
                  <Text style={[styles.planInterval, { color: colors.mutedForeground }]}>
                    / month
                  </Text>
                </View>

                <Text style={[styles.planDescription, { color: colors.mutedForeground }]}>
                  {plan.description}
                </Text>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.includesLabel, { color: colors.foreground }]}>
                  What&apos;s included
                </Text>

                <View style={styles.featureList}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <View
                        style={[
                          styles.checkIcon,
                          {
                            backgroundColor: plan.isMostPopular
                              ? colors.primaryLight
                              : `${accent}16`,
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={plan.isMostPopular ? colors.primary : accent}
                        />
                      </View>
                      <Text style={[styles.featureText, { color: colors.foreground }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                <AppButton
                  title={plan.cta}
                  onPress={() => selectPlan(plan)}
                  loading={plan.id === "basic" && loading}
                  disabled={isBasicActive}
                  variant={plan.isMostPopular ? "primary" : "outline"}
                  style={styles.planButton}
                  textStyle={styles.planButtonText}
                />
                {isBasicActive ? (
                  <Text style={[styles.activePlanNote, { color: colors.primary }]}>
                    Basic app access is already active on your account.
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <LinearGradient
          colors={
            colors.isDark
              ? ["#1F1B0E", "#181818"]
              : ["#FFF8DF", "#FFFFFF"]
          }
          style={[
            styles.promoCard,
            {
              borderColor: colors.isDark ? "#443A18" : "#E9D897",
              shadowColor: colors.isDark ? "#000000" : colors.primaryDark,
            },
          ]}
        >
          <View style={styles.promoHeader}>
            <View style={[styles.promoIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="gift-outline" size={23} color={colors.primary} />
            </View>
            <View style={styles.promoHeadingCopy}>
              <Text style={[styles.promoEyebrow, { color: colors.primary }]}>
                EARLY ACCESS OFFER
              </Text>
              <Text style={[styles.promoTitle, { color: colors.foreground }]}>
                First 100 users can join free
              </Text>
            </View>
          </View>
          <Text style={[styles.promoDescription, { color: colors.mutedForeground }]}>
            Enter promo code{" "}
            <Text style={[styles.inlineCode, { color: colors.primary }]}>FREE100</Text> for
            promotional Basic App Access, subject to availability.
          </Text>
          <AppInput
            value={promoCode}
            onChangeText={setPromoCode}
            placeholder="Enter promo code (for example, FREE100)"
            autoCapitalize="characters"
            leftIcon="pricetag-outline"
            style={styles.codeInput}
          />
          <AppButton
            title="Apply Promo Code"
            onPress={() => redeem("promo")}
            loading={promoLoading === "promo"}
          />

          <View style={[styles.codeDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.accessCodeTitle, { color: colors.foreground }]}>
            Have a complimentary access code?
          </Text>
          <Text style={[styles.accessCodeDescription, { color: colors.mutedForeground }]}>
            Redeem a separate membership access code provided by CrunchTime Fitness.
          </Text>
          <AppInput
            value={freeCode}
            onChangeText={setFreeCode}
            placeholder="Enter access code"
            autoCapitalize="characters"
            leftIcon="key-outline"
            style={styles.codeInput}
          />
          <AppButton
            title="Redeem Access Code"
            onPress={() => redeem("free")}
            loading={promoLoading === "free"}
            variant="outline"
          />
        </LinearGradient>

        <View style={styles.servicesHeading}>
          <View>
            <Text style={[styles.blockEyebrow, { color: colors.primary }]}>
              OPTIONAL ADD-ONS
            </Text>
            <Text style={[styles.blockTitle, { color: colors.foreground }]}>
              Separate services
            </Text>
          </View>
          <Text style={[styles.servicesNote, { color: colors.mutedForeground }]}>
            Not subscriptions
          </Text>
        </View>

        <View style={styles.serviceList}>
          <AppCard style={[styles.serviceCard, { borderColor: colors.border }]}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.serviceCopy}>
                <Text style={[styles.serviceTitle, { color: colors.foreground }]}>
                  1-hour Trainer Session
                </Text>
                <Text style={[styles.serviceSub, { color: colors.mutedForeground }]}>
                  Separate booking payment, trainer approval, then video call access.
                </Text>
              </View>
              <Text style={[styles.servicePrice, { color: colors.primary }]}>
                {formatPrice(bookingPrice.amount_cents, bookingPrice.currency)}
              </Text>
            </View>
            <AppButton
              title="Book Session"
              onPress={() => router.push("/(user)/booking" as any)}
              variant="outline"
              size="sm"
              style={styles.cardButton}
            />
          </AppCard>

          <AppCard style={[styles.serviceCard, { borderColor: colors.border }]}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.serviceCopy}>
                <Text style={[styles.serviceTitle, { color: colors.foreground }]}>
                  Custom Meal Plan
                </Text>
                <Text style={[styles.serviceSub, { color: colors.mutedForeground }]}>
                  Assigned trainer meal plans remain visible.
                </Text>
              </View>
              <Text style={[styles.servicePrice, { color: colors.primary }]}>
                {formatPrice(mealPlanPrice.amount_cents, mealPlanPrice.currency)}
              </Text>
            </View>
            <AppButton
              title="Request Plan"
              onPress={requestMealPlan}
              loading={mealPlanLoading}
              variant="outline"
              size="sm"
              style={styles.cardButton}
            />
          </AppCard>

          <AppCard style={[styles.serviceCard, { borderColor: colors.border }]}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.serviceCopy}>
                <Text style={[styles.serviceTitle, { color: colors.foreground }]}>
                  Premium Workout Videos
                </Text>
                <Text style={[styles.serviceSub, { color: colors.mutedForeground }]}>
                  Paid videos unlock separately from membership.
                </Text>
              </View>
              <Text style={[styles.servicePrice, { color: colors.primary }]}>
                from{" "}
                {formatPrice(
                  workoutVideoPrice.amount_cents,
                  workoutVideoPrice.currency,
                )}
              </Text>
            </View>
            <AppButton
              title="Browse Videos"
              onPress={() => router.push("/(user)/workouts" as any)}
              variant="outline"
              size="sm"
              style={styles.cardButton}
            />
          </AppCard>
        </View>

        <View style={[styles.securityNote, { borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
          <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
            Payments use the existing secure Stripe checkout. Access is activated only after
            payment or a valid promo is confirmed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 40, height: 40 },
  title: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  heroEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 29,
    lineHeight: 35,
    maxWidth: 430,
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 9,
    maxWidth: 500,
  },
  heroFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 100,
  },
  heroPillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCopy: { flex: 1, minWidth: 0 },
  statusLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  statusTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  statusMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  sectionIntro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  blockEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  blockTitle: { fontFamily: "Inter_700Bold", fontSize: 21 },
  planList: { gap: 16, marginBottom: 24 },
  planCard: {
    borderRadius: 22,
    padding: 18,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 16,
    elevation: 4,
  },
  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginBottom: 15,
  },
  popularBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.9,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  planHeadingCopy: { flex: 1, minWidth: 0 },
  planName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 25,
  },
  planBilling: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginTop: 18,
  },
  planPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 39,
    lineHeight: 44,
    letterSpacing: -1.2,
  },
  planInterval: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    paddingBottom: 6,
    marginLeft: 5,
  },
  planDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  divider: { height: 1, marginVertical: 17 },
  includesLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 12,
  },
  featureList: { gap: 11 },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  featureText: {
    flex: 1,
    minWidth: 0,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  planButton: {
    marginTop: 20,
    minHeight: 52,
  },
  planButtonText: { fontFamily: "Inter_700Bold" },
  activePlanNote: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 10,
  },
  promoCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 26,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 13,
  },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  promoHeadingCopy: { flex: 1, minWidth: 0 },
  promoEyebrow: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  promoTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 23,
  },
  promoDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  inlineCode: { fontFamily: "Inter_700Bold" },
  codeInput: { marginBottom: 12 },
  codeDivider: { height: 1, marginVertical: 18 },
  accessCodeTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    marginBottom: 4,
  },
  accessCodeDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  servicesHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  servicesNote: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    paddingBottom: 2,
  },
  serviceList: { gap: 11, marginBottom: 18 },
  serviceCard: { borderWidth: 1, borderRadius: 18 },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceCopy: { flex: 1, minWidth: 0 },
  serviceTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  serviceSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  servicePrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    lineHeight: 17,
    textAlign: "right",
    maxWidth: 82,
    flexShrink: 1,
  },
  cardButton: { marginTop: 14 },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
  },
  securityText: {
    flex: 1,
    minWidth: 0,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 17,
  },
});
