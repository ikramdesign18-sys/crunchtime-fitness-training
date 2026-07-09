import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import { useColors } from "@/hooks/useColors";
import { fetchWorkoutVideoById, type TrainerWorkoutVideo } from "@/lib/supabaseApi";

export default function ExerciseDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ exerciseId: string; workoutId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [workout, setWorkout] = useState<TrainerWorkoutVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workoutId) {
      setLoading(false);
      return;
    }
    fetchWorkoutVideoById(workoutId)
      .then((row) => setWorkout(row?.published ? row : null))
      .catch(() => setWorkout(null))
      .finally(() => setLoading(false));
  }, [workoutId]);

  const hasInstructions = !!workout?.instructions?.trim();
  const hasTips = !!workout?.tips?.trim();
  const hasCommonMistakes = !!workout?.common_mistakes?.trim();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={["#1A1A1A", "#2A2410"]} style={[styles.hero, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <View style={styles.heroIcon}>
              <Ionicons name="barbell-outline" size={52} color="#D4AF37" />
            </View>
            <Text style={styles.heroTitle}>{workout?.title ?? (loading ? "Loading workout" : "Workout unavailable")}</Text>
          </View>
        </LinearGradient>

        {workout ? (
          <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
            {[
              { label: "Duration", value: `${workout.duration}m` },
              { label: "Calories", value: String(workout.calories) },
              { label: "Exercises", value: String(workout.exercises) },
            ].map((s) => (
              <View key={s.label} style={[styles.statItem, { borderRightColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.body}>
          {hasInstructions ? (
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Instructions</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>{workout?.instructions}</Text>
            </AppCard>
          ) : null}

          {hasTips ? (
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tips</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>{workout?.tips}</Text>
            </AppCard>
          ) : null}

          {hasCommonMistakes ? (
            <AppCard style={[styles.section, { borderLeftWidth: 3, borderLeftColor: colors.destructive }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={18} color={colors.destructive} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Common Mistakes</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>{workout?.common_mistakes}</Text>
            </AppCard>
          ) : null}

          {!loading && workout && !hasInstructions && !hasTips && !hasCommonMistakes ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No trainer notes are available for this workout.</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroCenter: { alignItems: "center" },
  heroIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(214,100,51,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFF", textAlign: "center" },
  statsBar: { flexDirection: "row", marginHorizontal: 16, marginTop: -20, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, overflow: "hidden" },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 16, borderRightWidth: 1 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  body: { padding: 16, gap: 12 },
  section: {},
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sectionText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, opacity: 0.85 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});
