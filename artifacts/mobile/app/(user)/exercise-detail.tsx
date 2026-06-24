import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import { useColors } from "@/hooks/useColors";
import { WORKOUTS } from "@/lib/dummyData";

export default function ExerciseDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { exerciseId, workoutId } = useLocalSearchParams<{ exerciseId: string; workoutId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const workout = WORKOUTS.find((w) => w.id === workoutId) ?? WORKOUTS[0];
  const exercise = workout.exercises.find((e) => e.id === exerciseId) ?? workout.exercises[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={["#1A1A1A", "#2A1208"]} style={[styles.hero, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroCenter}>
            <View style={styles.heroIcon}>
              <Ionicons name="barbell-outline" size={52} color="#D66433" />
            </View>
            <Text style={styles.heroTitle}>{exercise.name}</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsBar}>
          {[
            { label: "Sets", value: String(exercise.sets) },
            { label: "Reps", value: String(exercise.reps) },
            { label: "Rest", value: `${exercise.restSeconds}s` },
          ].map((s) => (
            <View key={s.label} style={[styles.statItem, { borderRightColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.body}>
          <AppCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Instructions</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>
              1. Set up with the appropriate weight and get into the starting position.{"\n"}
              2. Perform the movement with controlled form throughout the range of motion.{"\n"}
              3. Complete all reps, rest for the designated time, then repeat for all sets.{"\n"}
              4. Focus on the target muscle group and maintain tension throughout.
            </Text>
          </AppCard>

          <AppCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tips</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{exercise.tips}</Text>
          </AppCard>

          <AppCard style={[styles.section, { borderLeftWidth: 3, borderLeftColor: colors.destructive }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning-outline" size={18} color={colors.destructive} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Common Mistakes</Text>
            </View>
            <Text style={[styles.sectionText, { color: colors.foreground }]}>{exercise.commonMistakes}</Text>
          </AppCard>
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
  statsBar: { flexDirection: "row", marginHorizontal: 16, marginTop: -20, borderRadius: 12, backgroundColor: "#FFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, overflow: "hidden" },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 16, borderRightWidth: 1 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  body: { padding: 16, gap: 12 },
  section: {},
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sectionText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, opacity: 0.85 },
});
