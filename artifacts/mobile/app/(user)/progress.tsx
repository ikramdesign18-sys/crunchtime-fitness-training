import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import { useColors } from "@/hooks/useColors";
import { PROGRESS_DATA } from "@/lib/dummyData";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function ProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const latest = PROGRESS_DATA[PROGRESS_DATA.length - 1];
  const maxWeight = Math.max(...PROGRESS_DATA.map((p) => p.weight));
  const minWeight = Math.min(...PROGRESS_DATA.map((p) => p.weight));
  const weightLost = PROGRESS_DATA[0].weight - latest.weight;
  const totalWorkouts = PROGRESS_DATA.reduce((s, p) => s + p.workoutsCompleted, 0);
  const totalCalories = PROGRESS_DATA.reduce((s, p) => s + p.caloriesBurned, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Progress</Text>

      {/* Summary Stats */}
      <View style={styles.statsGrid}>
        <StatCard icon="trending-down-outline" iconColor={colors.success} label="Weight Lost" value={`${weightLost.toFixed(1)} kg`} style={styles.statCard} />
        <StatCard icon="barbell-outline" iconColor={colors.primary} label="Total Workouts" value={String(totalWorkouts)} style={styles.statCard} />
        <StatCard icon="flame-outline" iconColor="#EF4444" label="Calories Burned" value={`${(totalCalories / 1000).toFixed(1)}k`} style={styles.statCard} />
        <StatCard icon="body-outline" iconColor="#3B82F6" label="Current BMI" value={String(latest.bmi)} style={styles.statCard} />
      </View>

      {/* Weight Chart */}
      <SectionHeader title="Weight History" style={{ marginTop: 8 }} />
      <AppCard style={styles.chartCard}>
        <View style={styles.chartArea}>
          {PROGRESS_DATA.map((entry, i) => {
            const range = maxWeight - minWeight || 1;
            const pct = (entry.weight - minWeight) / range;
            const barHeight = 80 + pct * 60;
            return (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barVal, { color: colors.primary }]}>{entry.weight.toFixed(1)}</Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: i === PROGRESS_DATA.length - 1 ? colors.primary : colors.primaryLight,
                      borderRadius: 4,
                    },
                  ]}
                />
                <Text style={[styles.barDate, { color: colors.mutedForeground }]}>
                  {entry.date.slice(5).replace("-", "/")}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.chartLegend, { color: colors.mutedForeground }]}>Weight in kg over time</Text>
      </AppCard>

      {/* Weekly workout bars */}
      <SectionHeader title="Weekly Workouts" style={{ marginTop: 8 }} />
      <AppCard style={styles.weekCard}>
        {PROGRESS_DATA.map((entry, i) => (
          <View key={i} style={styles.weekRow}>
            <Text style={[styles.weekDate, { color: colors.mutedForeground }]}>{entry.date.slice(5).replace("-", "/")}</Text>
            <View style={[styles.weekBarBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.weekBar, { width: `${(entry.workoutsCompleted / 7) * 100}%`, backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.weekCount, { color: colors.foreground }]}>{entry.workoutsCompleted}</Text>
          </View>
        ))}
      </AppCard>

      {/* BMI History */}
      <SectionHeader title="BMI History" style={{ marginTop: 8 }} />
      <AppCard>
        {PROGRESS_DATA.map((entry, i) => {
          const bmi = entry.bmi;
          const color = bmi < 18.5 ? "#3B82F6" : bmi < 25 ? colors.success : bmi < 30 ? "#F59E0B" : "#EF4444";
          return (
            <View key={i} style={[styles.bmiRow, { borderBottomColor: colors.border, borderBottomWidth: i < PROGRESS_DATA.length - 1 ? 1 : 0 }]}>
              <Text style={[styles.bmiDate, { color: colors.mutedForeground }]}>{entry.date}</Text>
              <Text style={[styles.bmiValue, { color }]}>{bmi}</Text>
              <Text style={[styles.bmiChange, { color: i > 0 && entry.bmi < PROGRESS_DATA[i - 1].bmi ? colors.success : "#F59E0B" }]}>
                {i > 0 ? (entry.bmi - PROGRESS_DATA[i - 1].bmi).toFixed(1) : "—"}
              </Text>
            </View>
          );
        })}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47.5%" },
  chartCard: { marginBottom: 16 },
  chartArea: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 160, paddingBottom: 8, paddingTop: 16 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barVal: { fontFamily: "Inter_600SemiBold", fontSize: 9 },
  bar: { width: "70%" },
  barDate: { fontFamily: "Inter_400Regular", fontSize: 9, textAlign: "center" },
  chartLegend: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: 6 },
  weekCard: { marginBottom: 16, gap: 10 },
  weekRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  weekDate: { fontFamily: "Inter_400Regular", fontSize: 12, width: 40 },
  weekBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  weekBar: { height: 8, borderRadius: 4 },
  weekCount: { fontFamily: "Inter_600SemiBold", fontSize: 13, width: 16, textAlign: "right" },
  bmiRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  bmiDate: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  bmiValue: { fontFamily: "Inter_700Bold", fontSize: 16, width: 50, textAlign: "right" },
  bmiChange: { fontFamily: "Inter_600SemiBold", fontSize: 13, width: 40, textAlign: "right" },
});
