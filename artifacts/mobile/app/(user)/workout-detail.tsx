import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { WORKOUTS } from "@/lib/dummyData";

const DIFF_COLOR = { Beginner: "success", Intermediate: "warning", Advanced: "error" } as const;

export default function WorkoutDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const workout = WORKOUTS.find((w) => w.id === workoutId) ?? WORKOUTS[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <LinearGradient colors={["#D66433", "#7A2E0A"]} style={[styles.hero, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Ionicons name="barbell-outline" size={48} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.heroTitle}>{workout.title}</Text>
            <Text style={styles.heroGoal}>{workout.goal}</Text>
          </View>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadgeItem}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{workout.duration} min</Text>
            </View>
            <View style={styles.heroBadgeItem}>
              <Ionicons name="flame-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{workout.calories} cal</Text>
            </View>
            <View style={styles.heroBadgeItem}>
              <Ionicons name="fitness-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{workout.difficulty}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Description */}
          <Text style={[styles.description, { color: colors.foreground }]}>{workout.description}</Text>

          {/* Exercises */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exercises ({workout.exercises.length})</Text>
          {workout.exercises.map((ex, i) => (
            <Pressable
              key={ex.id}
              onPress={() => router.push({ pathname: "/(user)/exercise-detail", params: { exerciseId: ex.id, workoutId: workout.id } })}
              style={[styles.exerciseRow, { backgroundColor: colors.card, borderRadius: colors.radius }]}
            >
              <View style={[styles.exNumber, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.exNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <View style={styles.exInfo}>
                <Text style={[styles.exName, { color: colors.foreground }]}>{ex.name}</Text>
                <Text style={[styles.exMeta, { color: colors.mutedForeground }]}>
                  {ex.sets} sets · {ex.reps} reps · {ex.restSeconds}s rest
                </Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
        <AppButton
          title="Start Workout"
          onPress={() => router.push({ pathname: "/(user)/active-workout", params: { workoutId: workout.id } })}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 28 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroContent: { alignItems: "center", marginBottom: 20 },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFF", textAlign: "center" },
  heroGoal: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  heroBadges: { flexDirection: "row", justifyContent: "center", gap: 20 },
  heroBadgeItem: { alignItems: "center", gap: 4 },
  heroBadgeText: { color: "rgba(255,255,255,0.9)", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  body: { padding: 16 },
  description: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 24, marginBottom: 24, opacity: 0.8 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exNumber: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  exNumText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  exInfo: { flex: 1 },
  exName: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  exMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});
