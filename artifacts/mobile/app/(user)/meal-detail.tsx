import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchMealPlanById,
  fetchMealProgressForDate,
  saveMealProgress,
  type MealPlan,
  type MealProgress,
  type MealProgressKey,
} from "@/lib/supabaseApi";

function todayDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DetailSection({
  title,
  body,
  icon,
  completed,
  onToggle,
}: {
  title: string;
  body?: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  completed?: boolean;
  onToggle?: () => void;
}) {
  const colors = useColors();
  if (!body?.trim()) return null;
  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {onToggle ? (
          <TouchableOpacity
            onPress={onToggle}
            style={[
              styles.completeButton,
              { backgroundColor: completed ? colors.primary : colors.muted, borderColor: completed ? colors.primary : colors.border },
            ]}
          >
            <Ionicons
              name={completed ? "checkmark" : "ellipse-outline"}
              size={16}
              color={completed ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text style={[styles.completeText, { color: completed ? colors.primaryForeground : colors.mutedForeground }]}>
              {completed ? "Completed" : "Mark"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={[styles.sectionBody, { color: colors.foreground }]}>{body.trim()}</Text>
    </AppCard>
  );
}

export default function MealDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const today = todayDateString();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [progress, setProgress] = useState<MealProgress | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mealId) return;
    setLoading(true);
    fetchMealPlanById(mealId)
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [mealId]);

  useEffect(() => {
    if (!user || !mealId) return;
    fetchMealProgressForDate(user.id, mealId, today)
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [mealId, today, user]);

  const macroItems = plan
    ? [
        plan.calories_per_day ? { label: "Calories", value: String(plan.calories_per_day), unit: "cal" } : null,
        plan.protein ? { label: "Protein", value: String(plan.protein), unit: "g" } : null,
        plan.carbs ? { label: "Carbs", value: String(plan.carbs), unit: "g" } : null,
        plan.fats ? { label: "Fats", value: String(plan.fats), unit: "g" } : null,
      ].filter((item): item is { label: string; value: string; unit: string } => !!item)
    : [];

  const mealSections = plan
    ? [
        { title: "Breakfast", body: plan.breakfast, icon: "sunny-outline" as const, key: "breakfast_completed" as const },
        { title: "Lunch", body: plan.lunch, icon: "partly-sunny-outline" as const, key: "lunch_completed" as const },
        { title: "Dinner", body: plan.dinner, icon: "moon-outline" as const, key: "dinner_completed" as const },
        { title: "Snacks", body: plan.snacks, icon: "nutrition-outline" as const, key: "snacks_completed" as const },
      ].filter((section) => !!section.body?.trim())
    : [];

  const completedCount = mealSections.filter((section) => !!progress?.[section.key]).length;

  const toggleMeal = async (key: MealProgressKey) => {
    if (!user || !plan) return;
    const next = {
      breakfast_completed: progress?.breakfast_completed ?? false,
      lunch_completed: progress?.lunch_completed ?? false,
      dinner_completed: progress?.dinner_completed ?? false,
      snacks_completed: progress?.snacks_completed ?? false,
      [key]: !(progress?.[key] ?? false),
    };
    const totalCount = mealSections.length;
    const nextCompletedCount = mealSections.filter((section) => next[section.key]).length;
    const saved = await saveMealProgress({
      user_id: user.id,
      meal_plan_id: plan.id,
      progress_date: today,
      ...next,
      completed_count: nextCompletedCount,
      total_count: totalCount,
    });
    setProgress(saved);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {plan?.title ?? "Meal Plan"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading meal plan...</Text>
          </View>
        ) : !plan ? (
          <View style={styles.empty}>
            <Ionicons name="nutrition-outline" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Meal plan not available.</Text>
          </View>
        ) : (
          <>
            <AppCard style={styles.heroCard}>
              {plan.goal ? <Text style={[styles.goal, { color: colors.primary }]}>{plan.goal.toUpperCase()}</Text> : null}
              <Text style={[styles.title, { color: colors.foreground }]}>{plan.title}</Text>
              {plan.description ? <Text style={[styles.description, { color: colors.mutedForeground }]}>{plan.description}</Text> : null}
              {plan.duration_days ? (
                <View style={[styles.durationPill, { backgroundColor: colors.muted }]}>
                  <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.durationText, { color: colors.foreground }]}>{plan.duration_days} days</Text>
                </View>
              ) : null}
            </AppCard>

            {macroItems.length > 0 ? (
              <View style={[styles.macroBar, { backgroundColor: colors.card }]}>
                {macroItems.map((m) => (
                  <View key={m.label} style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: colors.primary }]}>{m.value}</Text>
                    <Text style={[styles.macroUnit, { color: colors.mutedForeground }]}>{m.unit}</Text>
                    <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {mealSections.length > 0 ? (
              <AppCard style={styles.todayCard}>
                <Text style={[styles.todayTitle, { color: colors.foreground }]}>
                  Today: {completedCount} of {mealSections.length} meals completed
                </Text>
                <Text style={[styles.todaySub, { color: colors.mutedForeground }]}>
                  Completion resets each day and your history stays saved.
                </Text>
              </AppCard>
            ) : null}

            {mealSections.map((section) => (
              <DetailSection
                key={section.key}
                title={section.title}
                body={section.body}
                icon={section.icon}
                completed={!!progress?.[section.key]}
                onToggle={() => {
                  toggleMeal(section.key).catch(() => {});
                }}
              />
            ))}
            <DetailSection title="Notes" body={plan.notes} icon="document-text-outline" />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 17, textAlign: "center", marginHorizontal: 10 },
  heroCard: { marginBottom: 12 },
  goal: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, marginBottom: 8 },
  description: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginBottom: 12 },
  durationPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6 },
  durationText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  macroBar: { flexDirection: "row", borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  macroItem: { flex: 1, alignItems: "center" },
  macroValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  macroUnit: { fontFamily: "Inter_400Regular", fontSize: 11 },
  macroLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  sectionCard: { marginBottom: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionTitle: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 16 },
  sectionBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  todayCard: { marginBottom: 10 },
  todayTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  todaySub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  completeButton: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6 },
  completeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, textAlign: "center" },
});
