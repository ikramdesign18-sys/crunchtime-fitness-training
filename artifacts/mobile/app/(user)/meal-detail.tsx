import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { MEAL_PLANS, type Meal } from "@/lib/dummyData";

const MEAL_TABS = ["breakfast", "lunch", "dinner", "snacks"] as const;
type MealTab = (typeof MEAL_TABS)[number];

const TAB_ICONS = {
  breakfast: "sunny-outline" as const,
  lunch: "partly-sunny-outline" as const,
  dinner: "moon-outline" as const,
  snacks: "nutrition-outline" as const,
};

function MealSection({ meal }: { meal: Meal }) {
  const colors = useColors();
  return (
    <View>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealName, { color: colors.foreground }]}>{meal.name}</Text>
        <Badge label={`${meal.calories} cal`} color="primary" />
      </View>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INGREDIENTS</Text>
      {meal.ingredients.map((ing, i) => (
        <View key={i} style={styles.ingRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.ingText, { color: colors.foreground }]}>{ing}</Text>
        </View>
      ))}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 14 }]}>PREPARATION</Text>
      <Text style={[styles.prepText, { color: colors.foreground }]}>{meal.preparation}</Text>
    </View>
  );
}

export default function MealDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<MealTab>("breakfast");

  const plan = MEAL_PLANS.find((p) => p.id === mealId) ?? MEAL_PLANS[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{plan.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.macroBar, { backgroundColor: colors.card }]}>
        {[
          { label: "Calories", value: String(plan.calories), unit: "cal" },
          { label: "Protein", value: String(plan.protein), unit: "g" },
          { label: "Carbs", value: String(plan.carbs), unit: "g" },
          { label: "Fat", value: String(plan.fat), unit: "g" },
        ].map((m) => (
          <View key={m.label} style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: colors.primary }]}>{m.value}</Text>
            <Text style={[styles.macroUnit, { color: colors.mutedForeground }]}>{m.unit}</Text>
            <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {MEAL_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, { borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: colors.primary }]}
          >
            <Ionicons name={TAB_ICONS[tab]} size={16} color={activeTab === tab ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <AppCard>
          <MealSection meal={plan.meals[activeTab]} />
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  macroBar: { flexDirection: "row", marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  macroItem: { flex: 1, alignItems: "center" },
  macroValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  macroUnit: { fontFamily: "Inter_400Regular", fontSize: 11 },
  macroLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, marginTop: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 4 },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  mealName: { fontFamily: "Inter_700Bold", fontSize: 18, flex: 1, marginRight: 8 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  ingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ingText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  prepText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
});
