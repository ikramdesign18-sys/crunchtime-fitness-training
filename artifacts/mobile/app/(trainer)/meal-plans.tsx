import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  deleteTrainerMealPlan,
  fetchTrainerMealPlans,
  saveTrainerMealPlan,
  type MealPlan,
} from "@/lib/supabaseApi";

export default function TrainerMealPlansScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setPlans(await fetchTrainerMealPlans(user.id));
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const confirmDelete = (plan: MealPlan) => {
    Alert.alert("Delete Meal Plan", `Delete "${plan.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTrainerMealPlan(plan.id)
            .then(() => setPlans((prev) => prev.filter((item) => item.id !== plan.id)))
            .catch((error) => Alert.alert("Delete Failed", (error as Error).message));
        },
      },
    ]);
  };

  const toggleStatus = (plan: MealPlan) => {
    if (!user) return;
    if (!plan.title.trim()) {
      Alert.alert("Missing Title", "Add a meal plan title before publishing.");
      return;
    }
    const nextStatus = plan.status === "published" ? "draft" : "published";
    saveTrainerMealPlan(
      user.id,
      {
        title: plan.title,
        description: plan.description,
        goal: plan.goal,
        duration_days: plan.duration_days,
        calories_per_day: plan.calories_per_day,
        protein: plan.protein,
        carbs: plan.carbs,
        fats: plan.fats,
        breakfast: plan.breakfast,
        lunch: plan.lunch,
        dinner: plan.dinner,
        snacks: plan.snacks,
        notes: plan.notes,
        visibility: plan.visibility,
        assigned_user_id: plan.assigned_user_id,
        status: nextStatus,
      },
      plan.id
    )
      .then((updated) => setPlans((prev) => prev.map((item) => item.id === updated.id ? { ...item, ...updated } : item)))
      .catch((error) => Alert.alert("Update Failed", (error as Error).message));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Meal Plans</Text>
        <TouchableOpacity onPress={() => router.push("/(trainer)/meal-plan-editor" as any)} style={[styles.iconButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 88, 112) }]}
      >
        {loading ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading meal plans...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="nutrition-outline" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No meal plans yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Create a plan for all users or assign one to a client.</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <AppCard key={plan.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.planTitle, { color: colors.foreground }]}>{plan.title}</Text>
                  <Text style={[styles.planMeta, { color: colors.mutedForeground }]}>
                    {[plan.goal, plan.duration_days ? `${plan.duration_days} days` : null, plan.calories_per_day ? `${plan.calories_per_day} cal/day` : null]
                      .filter(Boolean)
                      .join(" · ") || "No details added"}
                  </Text>
                  <View style={styles.badges}>
                    <Badge label={plan.status === "published" ? "Published" : "Draft"} color={plan.status === "published" ? "success" : "warning"} small />
                    <Badge
                      label={plan.visibility === "all" ? "All users" : plan.assignedUserName ?? "Assigned"}
                      color="muted"
                      small
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/(trainer)/meal-plan-editor" as any, params: { mealPlanId: plan.id } })}
                    style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(plan)}
                    style={[styles.actionButton, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => toggleStatus(plan)}
                style={[styles.publishButton, { backgroundColor: plan.status === "published" ? colors.muted : colors.primaryLight }]}
              >
                <Text style={[styles.publishText, { color: plan.status === "published" ? colors.mutedForeground : colors.primary }]}>
                  {plan.status === "published" ? "Move to Draft" : "Publish"}
                </Text>
              </TouchableOpacity>
            </AppCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22 },
  content: { paddingHorizontal: 16, paddingTop: 14 },
  card: { marginBottom: 10 },
  cardTop: { flexDirection: "row", gap: 12 },
  cardInfo: { flex: 1 },
  planTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 4 },
  planMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 },
  badges: { flexDirection: "row", flexWrap: "wrap" },
  actions: { flexDirection: "row", gap: 8 },
  actionButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  publishButton: { alignItems: "center", borderRadius: 8, marginTop: 12, paddingVertical: 10 },
  publishText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 72, gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, textAlign: "center", lineHeight: 21 },
});
