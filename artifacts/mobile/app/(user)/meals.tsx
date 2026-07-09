import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { createMealPlanCheckout, fetchPricingConfig, openStripeUrl } from "@/lib/paymentApi";
import { formatPrice, mergePricingConfig, type PricingConfigItem } from "@/lib/paymentConfig";
import { fetchPublishedMealPlans, type MealPlan } from "@/lib/supabaseApi";

const GOAL_COLORS: Record<string, string> = {
  "Weight Loss": "#22C55E",
  "Muscle Gain": "#3B82F6",
  Maintenance: "#F59E0B",
  "General Health": "#8B5CF6",
};

export default function MealsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeCategory, setActiveCategory] = useState("All");
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [pricingRows, setPricingRows] = useState<PricingConfigItem[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const pricing = mergePricingConfig(pricingRows);
  const mealPlanPrice = pricing.custom_meal_plan;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchPublishedMealPlans(user.id)
      .then(setMealPlans)
      .catch(() => setMealPlans([]))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchPricingConfig()
      .then(setPricingRows)
      .catch(() => setPricingRows([]));
  }, []);

  const requestCustomMealPlan = async () => {
    if (!session?.access_token) {
      Alert.alert("Sign In Required", "Please sign in before purchasing a custom meal plan.");
      return;
    }
    setPurchaseLoading(true);
    try {
      const checkout = await createMealPlanCheckout({ accessToken: session.access_token });
      await openStripeUrl(checkout.url!);
      Alert.alert("Meal Plan Request", "Stripe will confirm the purchase before your trainer prepares the custom plan.");
    } catch (error) {
      Alert.alert("Payment Failed", (error as Error).message);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const categories = useMemo(() => {
    const goals = mealPlans.map((plan) => plan.goal).filter((goal): goal is string => !!goal);
    return ["All", ...Array.from(new Set(goals))];
  }, [mealPlans]);

  const filtered =
    activeCategory === "All"
      ? mealPlans
      : mealPlans.filter((plan) => plan.goal === activeCategory);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Meal Plans</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Nutrition plans published or assigned by your trainer
      </Text>

      <View style={[styles.customPlanCard, { backgroundColor: colors.card, borderRadius: colors.radius, shadowColor: colors.isDark ? "#000" : "#1A1A1A" }]}>
        <View style={styles.customPlanTop}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.cardTopText}>
            <Text style={[styles.cardCategory, { color: colors.primary }]}>CUSTOM PLAN</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Request a trainer-built meal plan</Text>
          </View>
          <Text style={[styles.calories, { color: colors.primary }]}>
            {formatPrice(mealPlanPrice.amount_cents, mealPlanPrice.currency)}
          </Text>
        </View>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          Assigned meal plans still open normally. Custom plans are a separate paid request.
        </Text>
        <AppButton title="Request Custom Plan" onPress={requestCustomMealPlan} loading={purchaseLoading} size="sm" />
      </View>

      {categories.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={{ marginBottom: 20 }}
        >
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {loading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading meal plans...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="nutrition-outline" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No meal plans available yet.</Text>
        </View>
      ) : (
        filtered.map((plan) => {
          const accentColor = GOAL_COLORS[plan.goal ?? ""] ?? colors.primary;
          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => router.push({ pathname: "/(user)/meal-detail", params: { mealId: plan.id } })}
              activeOpacity={0.85}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  shadowColor: colors.isDark ? "#000" : "#1A1A1A",
                },
              ]}
            >
              <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: accentColor + "18" }]}>
                    <Ionicons name="restaurant-outline" size={22} color={accentColor} />
                  </View>
                  <View style={styles.cardTopText}>
                    {plan.goal ? (
                      <Text style={[styles.cardCategory, { color: accentColor }]}>{plan.goal.toUpperCase()}</Text>
                    ) : null}
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{plan.title}</Text>
                  </View>
                  {plan.calories_per_day ? (
                    <Text style={[styles.calories, { color: colors.primary }]}>
                      {plan.calories_per_day}
                      <Text style={[styles.calUnit, { color: colors.mutedForeground }]}> cal</Text>
                    </Text>
                  ) : null}
                </View>

                {plan.description ? (
                  <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {plan.description}
                  </Text>
                ) : null}

                <View style={styles.metaRow}>
                  {plan.duration_days ? (
                    <View style={[styles.metaPill, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.metaText, { color: colors.foreground }]}>{plan.duration_days} days</Text>
                    </View>
                  ) : null}
                  {plan.visibility === "assigned" ? (
                    <View style={[styles.metaPill, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.metaText, { color: colors.primary }]}>Assigned to you</Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.cta, { borderTopColor: colors.border }]}>
                  <Text style={[styles.ctaText, { color: colors.primary }]}>View Meal Plan</Text>
                  <View style={[styles.ctaArrow, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 16 },
  filterRow: { gap: 8, paddingRight: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1.5 },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  card: { marginBottom: 14, flexDirection: "row", overflow: "hidden", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  customPlanCard: { marginBottom: 16, padding: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  customPlanTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  accentBar: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTopText: { flex: 1 },
  cardCategory: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  calories: { fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "right" },
  calUnit: { fontFamily: "Inter_400Regular", fontSize: 12 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 12 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  metaPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  metaText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 12 },
  ctaText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  ctaArrow: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, textAlign: "center" },
});
