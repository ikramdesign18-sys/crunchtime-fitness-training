import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import { fetchUserSubscriptions, type UserSubscription } from "@/lib/supabaseApi";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function accessLabel(access: AppAccessStatus | null) {
  if (!access?.active) return "Inactive";
  if (access.access_type === "free_first_100") return "First 100 Free";
  if (access.access_type === "free_code") return "Free Code";
  if (access.access_type === "trial") return "Trial";
  if (access.access_type === "paid_membership") return "Active";
  return "Active";
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
  const membershipPrice = pricing.membership_monthly;
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
      Alert.alert("Membership Started", "Stripe will confirm your trial or membership shortly.");
    } catch (error) {
      Alert.alert("Membership Unavailable", (error as Error).message);
    } finally {
      setLoading(false);
    }
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
      Alert.alert("Meal Plan Request", "Stripe will confirm the purchase before your trainer prepares the custom plan.");
    } catch (error) {
      Alert.alert("Meal Plan Payment Failed", (error as Error).message);
    } finally {
      setMealPlanLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Membership</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusLabel, { color: colors.mutedForeground }]}>CURRENT ACCESS</Text>
              <Text style={[styles.statusTitle, { color: colors.foreground }]}>{accessLabel(access)}</Text>
              {access?.ends_at ? (
                <Text style={[styles.statusMeta, { color: colors.mutedForeground }]}>
                  Active through {new Date(access.ends_at).toLocaleDateString()}
                </Text>
              ) : activeSubscription?.current_period_end ? (
                <Text style={[styles.statusMeta, { color: colors.mutedForeground }]}>
                  Billing period ends {new Date(activeSubscription.current_period_end).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
            <Badge label={access?.active ? "Active" : "Inactive"} color={access?.active ? "success" : "muted"} small />
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

        <AppCard style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <Ionicons name="star-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Membership Access</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.foreground }]}>
            First 100 users receive free promotional membership access automatically.
          </Text>
          <Text style={[styles.sectionText, { color: colors.foreground }]}>
            After the promo slots, new members get a 7-day free trial, then {formatPrice(membershipPrice.amount_cents, membershipPrice.currency)}/month.
          </Text>
          <View style={styles.factRow}>
            <Badge label="First 100 free" color="success" small />
            <Badge label="7-day trial" color="warning" small style={{ marginLeft: 6 }} />
            <Badge label={`${formatPrice(membershipPrice.amount_cents, membershipPrice.currency)}/mo`} color="muted" small style={{ marginLeft: 6 }} />
          </View>
          <AppButton
            title={access?.trial_available ? "Start Free Trial" : "Start Membership"}
            onPress={startMembership}
            loading={loading}
            disabled={!!access?.active}
            style={styles.cardButton}
          />
        </AppCard>

        <Text style={[styles.blockTitle, { color: colors.foreground }]}>Paid Services</Text>
        <View style={styles.serviceList}>
          <AppCard style={styles.serviceCard}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.serviceCopy}>
                <Text style={[styles.serviceTitle, { color: colors.foreground }]}>1-hour Trainer Session</Text>
                <Text style={[styles.serviceSub, { color: colors.mutedForeground }]}>
                  Separate booking payment, trainer approval, then video call access.
                </Text>
              </View>
              <Text style={[styles.servicePrice, { color: colors.primary }]}>{formatPrice(bookingPrice.amount_cents, bookingPrice.currency)}</Text>
            </View>
            <AppButton title="Book Session" onPress={() => router.push("/(user)/booking" as any)} variant="outline" size="sm" style={styles.cardButton} />
          </AppCard>

          <AppCard style={styles.serviceCard}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.serviceCopy}>
                <Text style={[styles.serviceTitle, { color: colors.foreground }]}>Custom Meal Plan</Text>
                <Text style={[styles.serviceSub, { color: colors.mutedForeground }]}>Assigned trainer meal plans remain visible.</Text>
              </View>
              <Text style={[styles.servicePrice, { color: colors.primary }]}>{formatPrice(mealPlanPrice.amount_cents, mealPlanPrice.currency)}</Text>
            </View>
            <AppButton title="Request Plan" onPress={requestMealPlan} loading={mealPlanLoading} variant="outline" size="sm" style={styles.cardButton} />
          </AppCard>

          <AppCard style={styles.serviceCard}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.serviceCopy}>
                <Text style={[styles.serviceTitle, { color: colors.foreground }]}>Premium Workout Videos</Text>
                <Text style={[styles.serviceSub, { color: colors.mutedForeground }]}>Paid videos unlock separately from membership.</Text>
              </View>
              <Text style={[styles.servicePrice, { color: colors.primary }]}>from {formatPrice(workoutVideoPrice.amount_cents, workoutVideoPrice.currency)}</Text>
            </View>
            <AppButton title="Browse Videos" onPress={() => router.push("/(user)/workouts" as any)} variant="outline" size="sm" style={styles.cardButton} />
          </AppCard>
        </View>

        <AppCard style={styles.sectionCard}>
          <Text style={[styles.codeTitle, { color: colors.foreground }]}>Promo Code</Text>
          <AppInput
            value={promoCode}
            onChangeText={setPromoCode}
            placeholder="Enter promo code"
            autoCapitalize="characters"
            style={styles.codeInput}
          />
          <AppButton title="Apply Code" onPress={() => redeem("promo")} loading={promoLoading === "promo"} variant="outline" />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={[styles.codeTitle, { color: colors.foreground }]}>Free Membership Code</Text>
          <AppInput
            value={freeCode}
            onChangeText={setFreeCode}
            placeholder="Enter free membership code"
            autoCapitalize="characters"
            style={styles.codeInput}
          />
          <AppButton title="Redeem Code" onPress={() => redeem("free")} loading={promoLoading === "free"} />
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  statusCard: { marginBottom: 14 },
  statusRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  statusCopy: { flex: 1 },
  statusLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  statusTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statusMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  sectionCard: { marginBottom: 14 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  sectionText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginBottom: 8 },
  factRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  cardButton: { marginTop: 14 },
  blockTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 10 },
  serviceList: { gap: 10, marginBottom: 14 },
  serviceCard: {},
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  serviceIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  serviceCopy: { flex: 1 },
  serviceTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  serviceSub: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17, marginTop: 2 },
  servicePrice: { fontFamily: "Inter_700Bold", fontSize: 14, textAlign: "right", maxWidth: 84 },
  codeTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  codeInput: { marginBottom: 12 },
});
