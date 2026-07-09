import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchClientProfiles,
  fetchMealPlanById,
  saveTrainerMealPlan,
  type MealPlanVisibility,
  type Profile,
} from "@/lib/supabaseApi";

const GOALS = ["Weight Loss", "Muscle Gain", "Maintenance", "General Health"];
const DURATIONS = ["7", "14", "30"];

function numberOrNull(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function TrainerMealPlanEditorScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { mealPlanId } = useLocalSearchParams<{ mealPlanId?: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [clients, setClients] = useState<Profile[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("General Health");
  const [durationDays, setDurationDays] = useState("7");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [breakfast, setBreakfast] = useState("");
  const [lunch, setLunch] = useState("");
  const [dinner, setDinner] = useState("");
  const [snacks, setSnacks] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<MealPlanVisibility>("all");
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "published" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchClientProfiles(),
      mealPlanId ? fetchMealPlanById(mealPlanId) : Promise.resolve(null),
    ])
      .then(([clientRows, plan]) => {
        setClients(clientRows);
        if (!plan) return;
        setTitle(plan.title);
        setDescription(plan.description ?? "");
        setGoal(plan.goal ?? "General Health");
        setDurationDays(plan.duration_days ? String(plan.duration_days) : "");
        setCalories(plan.calories_per_day ? String(plan.calories_per_day) : "");
        setProtein(plan.protein ? String(plan.protein) : "");
        setCarbs(plan.carbs ? String(plan.carbs) : "");
        setFats(plan.fats ? String(plan.fats) : "");
        setBreakfast(plan.breakfast ?? "");
        setLunch(plan.lunch ?? "");
        setDinner(plan.dinner ?? "");
        setSnacks(plan.snacks ?? "");
        setNotes(plan.notes ?? "");
        setVisibility(plan.visibility);
        setAssignedUserId(plan.assigned_user_id);
      })
      .catch((error) => Alert.alert("Load Failed", (error as Error).message))
      .finally(() => setLoading(false));
  }, [mealPlanId]);

  const save = async (status: "draft" | "published") => {
    if (!user) return;
    if (!title.trim()) {
      Alert.alert("Missing Title", "Add a meal plan title before saving.");
      return;
    }
    if (visibility === "assigned" && !assignedUserId) {
      Alert.alert("Choose Client", "Select a client for this assigned meal plan.");
      return;
    }

    setSaving(status);
    try {
      await saveTrainerMealPlan(
        user.id,
        {
          title,
          description,
          goal,
          duration_days: numberOrNull(durationDays),
          calories_per_day: numberOrNull(calories),
          protein: numberOrNull(protein),
          carbs: numberOrNull(carbs),
          fats: numberOrNull(fats),
          breakfast,
          lunch,
          dinner,
          snacks,
          notes,
          visibility,
          assigned_user_id: assignedUserId,
          status,
        },
        mealPlanId
      );
      Alert.alert(status === "published" ? "Published" : "Draft Saved", "Meal plan saved successfully.", [
        { text: "OK", onPress: () => router.replace("/(trainer)/meal-plans" as any) },
      ]);
    } catch (error) {
      Alert.alert("Save Failed", (error as Error).message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{mealPlanId ? "Edit Meal Plan" : "Add Meal Plan"}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 88, 112) }]}
      >
        {loading ? (
          <Text style={[styles.loading, { color: colors.mutedForeground }]}>Loading meal plan...</Text>
        ) : (
          <>
            <AppInput label="Meal Plan Title" value={title} onChangeText={setTitle} placeholder="Example: 7-day strength nutrition" />
            <AppInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Short overview for clients"
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Goal / Type</Text>
            <View style={styles.chipGrid}>
              {GOALS.map((item) => {
                const active = goal === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setGoal(item)}
                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: active ? colors.primaryForeground : colors.foreground }]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Duration</Text>
            <View style={styles.chipGrid}>
              {DURATIONS.map((item) => {
                const active = durationDays === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setDurationDays(item)}
                    style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.chipText, { color: active ? colors.primaryForeground : colors.foreground }]}>{item} days</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <AppInput label="Custom Duration Days" value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad" placeholder="7" />

            <View style={styles.twoCol}>
              <AppInput label="Calories / Day" value={calories} onChangeText={setCalories} keyboardType="number-pad" placeholder="2200" style={styles.flexInput} />
              <AppInput label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="number-pad" placeholder="160" style={styles.flexInput} />
            </View>
            <View style={styles.twoCol}>
              <AppInput label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="number-pad" placeholder="220" style={styles.flexInput} />
              <AppInput label="Fats (g)" value={fats} onChangeText={setFats} keyboardType="number-pad" placeholder="70" style={styles.flexInput} />
            </View>

            <AppInput label="Breakfast" value={breakfast} onChangeText={setBreakfast} placeholder="Breakfast guidance" multiline numberOfLines={3} />
            <AppInput label="Lunch" value={lunch} onChangeText={setLunch} placeholder="Lunch guidance" multiline numberOfLines={3} />
            <AppInput label="Dinner" value={dinner} onChangeText={setDinner} placeholder="Dinner guidance" multiline numberOfLines={3} />
            <AppInput label="Snacks" value={snacks} onChangeText={setSnacks} placeholder="Snack guidance" multiline numberOfLines={3} />
            <AppInput label="Notes / Instructions" value={notes} onChangeText={setNotes} placeholder="Hydration, prep notes, swaps..." multiline numberOfLines={4} />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Visibility</Text>
            <View style={styles.segment}>
              {[
                { label: "All users", value: "all" as const },
                { label: "Specific user", value: "assigned" as const },
              ].map((item) => {
                const active = visibility === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setVisibility(item.value)}
                    style={[styles.segmentButton, { backgroundColor: active ? colors.primary : colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.segmentText, { color: active ? colors.primaryForeground : colors.foreground }]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {visibility === "assigned" ? (
              <AppCard style={styles.clientCard}>
                <Text style={[styles.clientTitle, { color: colors.foreground }]}>Assign to Client</Text>
                {clients.length === 0 ? (
                  <Text style={[styles.clientEmpty, { color: colors.mutedForeground }]}>No clients available yet.</Text>
                ) : (
                  clients.map((client) => {
                    const active = assignedUserId === client.id;
                    return (
                      <TouchableOpacity
                        key={client.id}
                        onPress={() => setAssignedUserId(client.id)}
                        style={[styles.clientRow, { borderBottomColor: colors.border }]}
                      >
                        <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border }]}>
                          {active ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
                        </View>
                        <View style={styles.clientInfo}>
                          <Text style={[styles.clientName, { color: colors.foreground }]}>{client.full_name ?? "Client"}</Text>
                          <Text style={[styles.clientEmail, { color: colors.mutedForeground }]}>{client.email ?? ""}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </AppCard>
            ) : null}

            <View style={styles.actions}>
              <AppButton title="Save Draft" onPress={() => save("draft")} variant="outline" loading={saving === "draft"} style={styles.actionButton} />
              <AppButton title="Publish" onPress={() => save("published")} loading={saving === "published"} style={styles.actionButton} />
            </View>
          </>
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
  loading: { fontFamily: "Inter_500Medium", fontSize: 15, textAlign: "center", marginTop: 64 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 9 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  twoCol: { flexDirection: "row", gap: 10 },
  flexInput: { flex: 1 },
  segment: { flexDirection: "row", gap: 8, marginBottom: 16 },
  segmentButton: { flex: 1, borderWidth: 1, borderRadius: 100, alignItems: "center", paddingVertical: 10 },
  segmentText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  clientCard: { marginBottom: 16 },
  clientTitle: { fontFamily: "Inter_700Bold", fontSize: 15, marginBottom: 6 },
  clientEmpty: { fontFamily: "Inter_400Regular", fontSize: 13 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  clientInfo: { flex: 1 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  clientEmail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionButton: { flex: 1 },
});
