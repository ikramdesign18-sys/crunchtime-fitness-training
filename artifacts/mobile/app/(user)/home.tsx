import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { PROGRESS_DATA, WORKOUTS } from "@/lib/dummyData";
import {
  fetchBmiRecords,
  fetchNotifications,
  fetchWorkoutProgress,
  type AppNotification,
  type BmiRecord,
  type WorkoutProgress,
} from "@/lib/supabaseApi";

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "info" as const };
  if (bmi < 25) return { label: "Normal", color: "success" as const };
  if (bmi < 30) return { label: "Overweight", color: "warning" as const };
  return { label: "Obese", color: "error" as const };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const todayWorkout = WORKOUTS[0];
  const [bmiRecords, setBmiRecords] = useState<BmiRecord[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutProgress[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchBmiRecords(user.id),
      fetchWorkoutProgress(user.id),
      fetchNotifications(user.id),
    ])
      .then(([bmi, progress, notifs]) => {
        setBmiRecords(bmi);
        setWorkouts(progress);
        setNotifications(notifs);
      })
      .catch(() => {});
  }, [user]);

  const latestProgress = useMemo(() => {
    const fallback = PROGRESS_DATA[PROGRESS_DATA.length - 1];
    const latestBmi = bmiRecords[bmiRecords.length - 1];
    if (!latestBmi) return fallback;
    return {
      ...fallback,
      weight: Number(latestBmi.weight),
      bmi: Number(latestBmi.bmi),
      workoutsCompleted: workouts.length,
      caloriesBurned: workouts.reduce((sum, item) => sum + (item.calories_burned ?? 0), 0),
    };
  }, [bmiRecords, workouts]);
  const bmiCat = getBMICategory(latestProgress.bmi);
  const unread = notifications.filter((n) => !n.is_read).length;
  const weekWorkouts = workouts.length || PROGRESS_DATA.slice(-1)[0].workoutsCompleted;
  const totalCalories =
    workouts.reduce((s, p) => s + (p.calories_burned ?? 0), 0) ||
    PROGRESS_DATA.reduce((s, p) => s + p.caloriesBurned, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? "Athlete"}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(user)/notifications")}
          style={[styles.notifBtn, { backgroundColor: colors.card }]}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
          {unread > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Today's Workout */}
      <SectionHeader title="Today's Workout" rightLabel="All" onRightPress={() => router.push("/(user)/workouts")} style={{ marginTop: 24 }} />
      <Pressable onPress={() => router.push({ pathname: "/(user)/workout-detail", params: { workoutId: todayWorkout.id } })}>
        <LinearGradient colors={["#D66433", "#B5522A"]} style={[styles.workoutCard, { borderRadius: colors.radius }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.workoutContent}>
            <View>
              <Text style={styles.workoutLabel}>RECOMMENDED</Text>
              <Text style={styles.workoutTitle}>{todayWorkout.title}</Text>
              <View style={styles.workoutMeta}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.workoutMetaText}>{todayWorkout.duration} min</Text>
                <Text style={styles.workoutMetaDot}>·</Text>
                <Text style={styles.workoutMetaText}>{todayWorkout.calories} cal</Text>
              </View>
            </View>
            <View style={styles.startBtn}>
              <Ionicons name="play" size={18} color="#D66433" />
            </View>
          </View>
          <View style={styles.workoutBadgeRow}>
            <Badge label={todayWorkout.difficulty} color="muted" small />
            <Badge label={todayWorkout.category} color="muted" small style={{ marginLeft: 6 }} />
          </View>
        </LinearGradient>
      </Pressable>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <AppCard style={styles.statCard}>
          <Ionicons name="flame-outline" size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{weekWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>This Week</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Ionicons name="flash-outline" size={20} color="#F59E0B" />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{(totalCalories / 1000).toFixed(1)}k</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cal Burned</Text>
        </AppCard>
        <AppCard onPress={() => router.push("/(user)/bmi")} style={styles.statCard}>
          <Ionicons name="body-outline" size={20} color={colors.success} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{latestProgress.bmi}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>BMI</Text>
        </AppCard>
      </View>

      {/* BMI Status */}
      <AppCard onPress={() => router.push("/(user)/bmi")} style={styles.bmiCard}>
        <View style={styles.bmiRow}>
          <View>
            <Text style={[styles.bmiTitle, { color: colors.foreground }]}>BMI Status</Text>
            <Text style={[styles.bmiValue, { color: colors.primary }]}>{latestProgress.bmi}</Text>
          </View>
          <Badge label={bmiCat.label} color={bmiCat.color} />
        </View>
        <Text style={[styles.bmiSub, { color: colors.mutedForeground }]}>Tap to calculate or update your BMI</Text>
      </AppCard>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" style={{ marginTop: 24 }} />
      <View style={styles.actionsRow}>
        {[
          { icon: "chatbubbles-outline" as const, label: "Chat", route: "/(user)/chat" },
          { icon: "calendar-outline" as const, label: "Book", route: "/(user)/booking" },
          { icon: "videocam-outline" as const, label: "Submit Video", route: "/(user)/video-submit" },
          { icon: "call-outline" as const, label: "Video Call", route: "/(user)/video-call" },
        ].map((action) => (
          <AppCard
            key={action.label}
            onPress={() => router.push(action.route as any)}
            style={styles.actionCard}
            padding={12}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={action.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
          </AppCard>
        ))}
      </View>

      {/* Meal Plan Teaser */}
      <SectionHeader title="Meal Plan" rightLabel="View All" onRightPress={() => router.push("/(user)/meals")} style={{ marginTop: 24 }} />
      <AppCard onPress={() => router.push({ pathname: "/(user)/meal-detail", params: { mealId: "m2" } })}>
        <View style={styles.mealRow}>
          <View style={[styles.mealIcon, { backgroundColor: "#22C55E20" }]}>
            <Ionicons name="restaurant-outline" size={24} color="#22C55E" />
          </View>
          <View style={styles.mealInfo}>
            <Text style={[styles.mealTitle, { color: colors.foreground }]}>Muscle Gain Plan</Text>
            <Text style={[styles.mealSub, { color: colors.mutedForeground }]}>3,000 cal · 220g protein · 320g carbs</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
        </View>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14 },
  userName: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 2 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 6, right: 6, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFF", fontSize: 9, fontFamily: "Inter_700Bold" },
  workoutCard: { padding: 18, marginBottom: 16 },
  workoutContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  workoutLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1.2, marginBottom: 4 },
  workoutTitle: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 20 },
  workoutMeta: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  workoutMetaText: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 13 },
  workoutMetaDot: { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", fontSize: 13 },
  startBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center" },
  workoutBadgeRow: { flexDirection: "row" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  bmiCard: { marginBottom: 4 },
  bmiRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  bmiTitle: { fontFamily: "Inter_500Medium", fontSize: 14, marginBottom: 2 },
  bmiValue: { fontFamily: "Inter_700Bold", fontSize: 28 },
  bmiSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  actionsRow: { flexDirection: "row", gap: 10 },
  actionCard: { flex: 1, alignItems: "center" },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontFamily: "Inter_500Medium", fontSize: 11, textAlign: "center" },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  mealIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mealInfo: { flex: 1 },
  mealTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  mealSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});
