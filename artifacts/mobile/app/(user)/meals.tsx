import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { MEAL_PLANS } from "@/lib/dummyData";

const PLAN_GRADIENTS: [string, string][] = [
  ["#D66433", "#B5522A"],
  ["#22C55E", "#16A34A"],
  ["#3B82F6", "#1D4ED8"],
  ["#8B5CF6", "#7C3AED"],
];

export default function MealsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Meal Plans</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Expert-designed nutrition programs for your goals
      </Text>

      {MEAL_PLANS.map((plan, i) => (
        <Pressable
          key={plan.id}
          onPress={() => router.push({ pathname: "/(user)/meal-detail", params: { mealId: plan.id } })}
          style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
        >
          <LinearGradient colors={PLAN_GRADIENTS[i]} style={[styles.gradient, { borderRadius: colors.radius }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.planCategory}>{plan.category.toUpperCase()}</Text>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDesc}>{plan.description}</Text>
              </View>
              <View style={styles.calorieCircle}>
                <Text style={styles.calorieNum}>{plan.calories}</Text>
                <Text style={styles.calorieLbl}>cal/day</Text>
              </View>
            </View>
            <View style={styles.macroRow}>
              {[
                { label: "Protein", value: `${plan.protein}g` },
                { label: "Carbs", value: `${plan.carbs}g` },
                { label: "Fat", value: `${plan.fat}g` },
              ].map((m) => (
                <View key={m.label} style={styles.macroItem}>
                  <Text style={styles.macroValue}>{m.value}</Text>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>Tap to view full meal plan</Text>
              <Ionicons name="arrow-forward-circle" size={20} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 20 },
  card: { marginBottom: 14 },
  gradient: { padding: 20 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  planCategory: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1.2, marginBottom: 4 },
  planTitle: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 6 },
  planDesc: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, maxWidth: "70%" },
  calorieCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  calorieNum: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 18 },
  calorieLbl: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 10 },
  macroRow: { flexDirection: "row", gap: 0, marginBottom: 16, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 10, padding: 12 },
  macroItem: { flex: 1, alignItems: "center" },
  macroValue: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 },
  macroLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium", fontSize: 13 },
});
