import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { MEAL_PLANS } from "@/lib/dummyData";

const CATEGORIES = ["All", "Weight Loss", "Muscle Gain", "Athlete", "Balanced"];

const CATEGORY_ICONS = {
  "Weight Loss": "trending-down-outline" as const,
  "Muscle Gain": "barbell-outline" as const,
  "Athlete": "medal-outline" as const,
  "Balanced": "nutrition-outline" as const,
};

const GOAL_COLORS: Record<string, string> = {
  "Weight Loss": "#22C55E",
  "Muscle Gain": "#3B82F6",
  "Athlete": "#F59E0B",
  "Balanced": "#8B5CF6",
};

export default function MealsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? MEAL_PLANS
      : MEAL_PLANS.filter((p) => p.category === activeCategory);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.title, { color: colors.foreground }]}>Meal Plans</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Expert-designed nutrition for your goals
      </Text>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ marginBottom: 20 }}
      >
        {CATEGORIES.map((cat) => {
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
              <Text
                style={[
                  styles.filterChipText,
                  { color: active ? "#FFF" : colors.foreground },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Plan cards */}
      {filtered.map((plan) => {
        const accentColor = GOAL_COLORS[plan.category] ?? colors.primary;
        const iconName = CATEGORY_ICONS[plan.category as keyof typeof CATEGORY_ICONS] ?? ("restaurant-outline" as const);

        return (
          <TouchableOpacity
            key={plan.id}
            onPress={() =>
              router.push({ pathname: "/(user)/meal-detail", params: { mealId: plan.id } })
            }
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
            {/* Color accent bar */}
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

            <View style={styles.cardBody}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: accentColor + "18" },
                  ]}
                >
                  <Ionicons name={iconName} size={22} color={accentColor} />
                </View>
                <View style={styles.cardTopText}>
                  <Text style={[styles.cardCategory, { color: accentColor }]}>
                    {plan.category.toUpperCase()}
                  </Text>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{plan.title}</Text>
                </View>
                <Text style={[styles.calories, { color: colors.primary }]}>
                  {plan.calories}
                  <Text style={[styles.calUnit, { color: colors.mutedForeground }]}> cal</Text>
                </Text>
              </View>

              {/* Description */}
              <Text
                style={[styles.desc, { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {plan.description}
              </Text>

              {/* Macro pills */}
              <View style={styles.macroRow}>
                {[
                  { label: "Protein", value: `${plan.protein}g` },
                  { label: "Carbs", value: `${plan.carbs}g` },
                  { label: "Fat", value: `${plan.fat}g` },
                ].map((m) => (
                  <View
                    key={m.label}
                    style={[styles.macroPill, { backgroundColor: colors.muted }]}
                  >
                    <Text style={[styles.macroValue, { color: colors.foreground }]}>{m.value}</Text>
                    <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>
                      {m.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* CTA */}
              <View style={[styles.cta, { borderTopColor: colors.border }]}>
                <Text style={[styles.ctaText, { color: colors.primary }]}>View Full Meal Plan</Text>
                <View style={[styles.ctaArrow, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 16 },
  filterRow: { gap: 8, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  filterChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  card: {
    marginBottom: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTopText: { flex: 1 },
  cardCategory: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  calories: { fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "right" },
  calUnit: { fontFamily: "Inter_400Regular", fontSize: 12 },
  desc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginBottom: 12 },
  macroRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  macroPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  macroValue: { fontFamily: "Inter_700Bold", fontSize: 14 },
  macroLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  ctaText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  ctaArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
