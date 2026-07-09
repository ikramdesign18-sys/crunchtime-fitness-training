import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchBmiRecords,
  fetchMealProgressRange,
  fetchUserBookings,
  fetchUserVideos,
  fetchWorkoutProgress,
  type BmiRecord,
  type Booking,
  type MealProgress,
  type VideoSubmission,
  type WorkoutProgress,
} from "@/lib/supabaseApi";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dateString(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mealCounts(entry: MealProgress | null | undefined) {
  if (!entry) return { completed: 0, total: 0 };
  const completed =
    entry.completed_count ??
    [
      entry.breakfast_completed,
      entry.lunch_completed,
      entry.dinner_completed,
      entry.snacks_completed,
    ].filter(Boolean).length;
  return { completed, total: entry.total_count ?? 0 };
}

export default function ProgressScreen() {
  const colors = useColors();
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [bmiRecords, setBmiRecords] = useState<BmiRecord[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutProgress[]>([]);
  const [mealProgress, setMealProgress] = useState<MealProgress[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [videos, setVideos] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      fetchBmiRecords(user.id),
      fetchWorkoutProgress(user.id),
      fetchMealProgressRange(user.id, dateString(6), dateString()),
      fetchUserBookings(user.id),
      fetchUserVideos(user.id),
    ])
      .then(([bmi, progress, mealRows, bookingRows, videoRows]) => {
        setBmiRecords(bmi);
        setWorkouts(progress);
        setMealProgress(mealRows);
        setBookings(bookingRows);
        setVideos(videoRows);
      })
      .catch(() => {
        setBmiRecords([]);
        setWorkouts([]);
        setMealProgress([]);
        setBookings([]);
        setVideos([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const summary = useMemo(() => {
    const latestBmi = bmiRecords[bmiRecords.length - 1] ?? null;
    const firstBmi = bmiRecords[0] ?? null;
    const totalCalories = workouts.reduce((sum, item) => sum + (item.calories_burned ?? 0), 0);
    const completedSessions = bookings.filter((booking) => booking.status === "accepted").length;
    const latestDates = [
      latestBmi?.created_at,
      workouts[workouts.length - 1]?.completed_at,
      mealProgress[0]?.updated_at,
      bookings[0]?.created_at,
      videos[0]?.created_at,
    ].filter((date): date is string => !!date);
    const lastUpdated = latestDates.length
      ? new Date(Math.max(...latestDates.map((date) => new Date(date).getTime()))).toLocaleDateString()
      : null;

    return {
      latestBmi,
      currentWeight: latestBmi ? Number(latestBmi.weight) : profile?.weight ? Number(profile.weight) : null,
      weightChange: latestBmi && firstBmi && bmiRecords.length > 1 ? Number(latestBmi.weight) - Number(firstBmi.weight) : null,
      totalCalories,
      completedSessions,
      submittedVideos: videos.length,
      lastUpdated,
    };
  }, [bmiRecords, bookings, mealProgress, profile?.weight, videos, workouts]);

  const todayMealProgress = mealProgress.find((entry) => entry.progress_date === dateString()) ?? null;
  const todayMealCounts = mealCounts(todayMealProgress);
  const weeklyMealCounts = mealProgress.reduce(
    (totals, entry) => {
      const counts = mealCounts(entry);
      return {
        completed: totals.completed + counts.completed,
        total: totals.total + counts.total,
      };
    },
    { completed: 0, total: 0 }
  );
  const todayMealPercent = todayMealCounts.total > 0 ? Math.round((todayMealCounts.completed / todayMealCounts.total) * 100) : 0;

  const hasProgressData =
    bmiRecords.length > 0 ||
    workouts.length > 0 ||
    mealProgress.length > 0 ||
    bookings.length > 0 ||
    videos.length > 0 ||
    !!profile?.weight;

  const maxWeight = bmiRecords.length > 0 ? Math.max(...bmiRecords.map((p) => Number(p.weight))) : 0;
  const minWeight = bmiRecords.length > 0 ? Math.min(...bmiRecords.map((p) => Number(p.weight))) : 0;

  const shareProgress = async () => {
    if (!hasProgressData) {
      Alert.alert("No Progress Yet", "Complete workouts or update your measurements before sharing progress.");
      return;
    }

    const lines = ["My CrunchTime Fitness Progress:"];
    if (workouts.length > 0) lines.push(`Workouts Completed: ${workouts.length}`);
    if (todayMealCounts.total > 0) lines.push(`Today's Meals Completed: ${todayMealCounts.completed}/${todayMealCounts.total}`);
    if (summary.latestBmi) lines.push(`Current BMI: ${Number(summary.latestBmi.bmi).toFixed(1)}`);
    if (summary.currentWeight) lines.push(`Current Weight: ${summary.currentWeight.toFixed(1)}kg`);
    if (summary.lastUpdated) lines.push(`Last Updated: ${summary.lastUpdated}`);
    lines.push("");
    lines.push("Keep pushing forward!");

    await Share.share({ message: lines.join("\n") });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Progress</Text>
        <TouchableOpacity
          onPress={shareProgress}
          style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="share-outline" size={18} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading progress...</Text>
        </View>
      ) : !hasProgressData ? (
        <View style={styles.empty}>
          <Ionicons name="trending-up-outline" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No workout progress yet. Complete a workout to track your progress.
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No meal progress yet. Complete meals from your meal plan to track your progress.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              icon="scale-outline"
              iconColor={colors.success}
              label={summary.weightChange === null ? "Current Weight" : "Weight Change"}
              value={
                summary.weightChange === null
                  ? summary.currentWeight
                    ? `${summary.currentWeight.toFixed(1)} kg`
                    : "—"
                  : `${summary.weightChange >= 0 ? "+" : ""}${summary.weightChange.toFixed(1)} kg`
              }
              style={styles.statCard}
            />
            <StatCard icon="barbell-outline" iconColor={colors.primary} label="Workouts" value={String(workouts.length)} style={styles.statCard} />
            <StatCard
              icon="restaurant-outline"
              iconColor="#22C55E"
              label="Meals Today"
              value={todayMealCounts.total > 0 ? `${todayMealCounts.completed}/${todayMealCounts.total}` : "—"}
              style={styles.statCard}
            />
            <StatCard
              icon="body-outline"
              iconColor="#8B5CF6"
              label="Current BMI"
              value={summary.latestBmi ? Number(summary.latestBmi.bmi).toFixed(1) : "—"}
              style={styles.statCard}
            />
          </View>

          {summary.totalCalories > 0 || videos.length > 0 ? (
            <View style={styles.statsGrid}>
              <StatCard icon="flame-outline" iconColor="#EF4444" label="Calories Burned" value={`${summary.totalCalories}`} style={styles.statCard} />
              <StatCard icon="videocam-outline" iconColor="#F59E0B" label="Videos Submitted" value={String(summary.submittedVideos)} style={styles.statCard} />
            </View>
          ) : null}

          <SectionHeader title="Meal Progress" style={{ marginTop: 8 }} />
          {mealProgress.length > 0 ? (
            <AppCard style={styles.latestCard}>
              <Text style={[styles.latestValue, { color: colors.foreground }]}>
                Today: {todayMealCounts.completed}/{todayMealCounts.total || 0} meals completed
              </Text>
              <Text style={[styles.latestSub, { color: colors.mutedForeground }]}>
                {todayMealPercent}% complete today
                {weeklyMealCounts.total > 0 ? ` · This week: ${weeklyMealCounts.completed}/${weeklyMealCounts.total}` : ""}
              </Text>
            </AppCard>
          ) : (
            <AppCard style={styles.latestCard}>
              <Text style={[styles.latestSub, { color: colors.mutedForeground }]}>
                No meal progress yet. Complete meals from your meal plan to track your progress.
              </Text>
            </AppCard>
          )}

          {bmiRecords.length > 1 ? (
            <>
              <SectionHeader title="Weight History" style={{ marginTop: 8 }} />
              <AppCard style={styles.chartCard}>
                <View style={styles.chartArea}>
                  {bmiRecords.map((entry) => {
                    const weight = Number(entry.weight);
                    const range = maxWeight - minWeight || 1;
                    const pct = (weight - minWeight) / range;
                    const barHeight = 48 + pct * 72;
                    return (
                      <View key={entry.id} style={styles.barCol}>
                        <Text style={[styles.barVal, { color: colors.primary }]}>{weight.toFixed(1)}</Text>
                        <View style={[styles.bar, { height: barHeight, backgroundColor: colors.primary, borderRadius: 4 }]} />
                        <Text style={[styles.barDate, { color: colors.mutedForeground }]}>{formatShortDate(entry.created_at)}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={[styles.chartLegend, { color: colors.mutedForeground }]}>Weight in kg from saved BMI records</Text>
              </AppCard>
            </>
          ) : summary.latestBmi ? (
            <>
              <SectionHeader title="Latest Measurement" style={{ marginTop: 8 }} />
              <AppCard style={styles.latestCard}>
                <Text style={[styles.latestValue, { color: colors.foreground }]}>
                  {Number(summary.latestBmi.weight).toFixed(1)} kg · BMI {Number(summary.latestBmi.bmi).toFixed(1)}
                </Text>
                <Text style={[styles.latestSub, { color: colors.mutedForeground }]}>
                  Saved {new Date(summary.latestBmi.created_at).toLocaleDateString()}
                </Text>
              </AppCard>
            </>
          ) : null}

          <SectionHeader title="Workout Progress" style={{ marginTop: 8 }} />
          {workouts.length > 0 ? (
            <>
              <AppCard style={styles.listCard}>
                {workouts.slice(-5).reverse().map((workout, index, arr) => (
                  <View key={workout.id} style={[styles.listRow, { borderBottomColor: colors.border, borderBottomWidth: index < arr.length - 1 ? 1 : 0 }]}>
                    <View style={styles.listInfo}>
                      <Text style={[styles.listTitle, { color: colors.foreground }]}>{workout.workout_title ?? "Workout"}</Text>
                      <Text style={[styles.listSub, { color: colors.mutedForeground }]}>{new Date(workout.completed_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={[styles.listValue, { color: colors.primary }]}>
                      {workout.calories_burned ? `${workout.calories_burned} cal` : ""}
                    </Text>
                  </View>
                ))}
              </AppCard>
            </>
          ) : (
            <AppCard style={styles.latestCard}>
              <Text style={[styles.latestSub, { color: colors.mutedForeground }]}>
                No workout progress yet. Complete a workout to track your progress.
              </Text>
            </AppCard>
          )}

          {bmiRecords.length > 0 ? (
            <>
              <SectionHeader title="BMI History" style={{ marginTop: 8 }} />
              <AppCard>
                {bmiRecords.map((entry, i) => {
                  const bmi = Number(entry.bmi);
                  const color = bmi < 18.5 ? "#3B82F6" : bmi < 25 ? colors.success : bmi < 30 ? "#F59E0B" : "#EF4444";
                  return (
                    <View key={entry.id} style={[styles.bmiRow, { borderBottomColor: colors.border, borderBottomWidth: i < bmiRecords.length - 1 ? 1 : 0 }]}>
                      <Text style={[styles.bmiDate, { color: colors.mutedForeground }]}>{new Date(entry.created_at).toLocaleDateString()}</Text>
                      <Text style={[styles.bmiValue, { color }]}>{bmi.toFixed(1)}</Text>
                      <Text style={[styles.bmiChange, { color: colors.mutedForeground }]}>{entry.category}</Text>
                    </View>
                  );
                })}
              </AppCard>
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  shareButton: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8 },
  shareText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47.5%" },
  chartCard: { marginBottom: 16 },
  chartArea: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", minHeight: 148, paddingBottom: 8, paddingTop: 16 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barVal: { fontFamily: "Inter_600SemiBold", fontSize: 9 },
  bar: { width: "70%" },
  barDate: { fontFamily: "Inter_400Regular", fontSize: 9, textAlign: "center" },
  chartLegend: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: 6 },
  latestCard: { marginBottom: 16 },
  latestValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  latestSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 4 },
  listCard: { marginBottom: 16 },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  listInfo: { flex: 1 },
  listTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  listSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  listValue: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  bmiRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  bmiDate: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  bmiValue: { fontFamily: "Inter_700Bold", fontSize: 16, width: 50, textAlign: "right" },
  bmiChange: { fontFamily: "Inter_600SemiBold", fontSize: 13, width: 110, textAlign: "right" },
  empty: { alignItems: "center", paddingTop: 96, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, lineHeight: 22, textAlign: "center" },
});
