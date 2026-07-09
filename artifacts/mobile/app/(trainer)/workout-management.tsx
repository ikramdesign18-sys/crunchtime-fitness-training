import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  deleteTrainerWorkoutVideo,
  fetchTrainerWorkoutVideos,
  updateTrainerWorkoutPublished,
  type TrainerWorkoutVideo,
  type WorkoutCategory,
} from "@/lib/supabaseApi";

const CATEGORIES: Array<WorkoutCategory | "All"> = ["All", "Strength", "Cardio", "Full Body", "Weight Loss", "Muscle Gain", "Yoga"];
const STATUSES = [
  { label: "All", value: "all" as const },
  { label: "Published", value: "published" as const },
  { label: "Draft", value: "draft" as const },
];
const DIFF_COLOR = { Beginner: "success", Intermediate: "warning", Advanced: "error" } as const;

export default function TrainerWorkoutManagementScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<WorkoutCategory | "All">("All");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [workouts, setWorkouts] = useState<TrainerWorkoutVideo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadWorkouts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await fetchTrainerWorkoutVideos(user.id, { search, category, status, limit: 50 });
      setWorkouts(rows);
    } catch {
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, status, user]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const filteredWorkouts = useMemo(() => workouts, [workouts]);

  const confirmDelete = (workout: TrainerWorkoutVideo) => {
    Alert.alert("Delete Workout", `Delete "${workout.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTrainerWorkoutVideo(workout.id)
            .then(() => setWorkouts((prev) => prev.filter((item) => item.id !== workout.id)))
            .catch((error) => Alert.alert("Delete Failed", (error as Error).message));
        },
      },
    ]);
  };

  const togglePublished = (workout: TrainerWorkoutVideo) => {
    if (!workout.published && (!workout.title.trim() || !workout.video_url)) {
      Alert.alert("Missing Details", "Add a workout title and video before publishing.");
      return;
    }

    updateTrainerWorkoutPublished(workout.id, !workout.published)
      .then((updated) => setWorkouts((prev) => prev.map((item) => item.id === updated.id ? updated : item)))
      .catch((error) => Alert.alert("Update Failed", (error as Error).message));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Workout Videos</Text>
        <TouchableOpacity onPress={() => router.push("/(trainer)/workout-upload" as any)} style={[styles.iconButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 88, 112) }]}
      >
        <View style={[styles.searchBox, { backgroundColor: colors.input, borderRadius: colors.radius }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search workouts..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORIES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.filterChip, { backgroundColor: category === item ? colors.primary : colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.filterText, { color: category === item ? colors.primaryForeground : colors.mutedForeground }]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.statusRow}>
          {STATUSES.map((item) => (
            <Pressable
              key={item.value}
              onPress={() => setStatus(item.value)}
              style={[styles.statusChip, { backgroundColor: status === item.value ? colors.primary : colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.filterText, { color: status === item.value ? colors.primaryForeground : colors.mutedForeground }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading workouts...</Text>
          </View>
        ) : filteredWorkouts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="videocam-outline" size={42} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No workout videos found</Text>
          </View>
        ) : (
          filteredWorkouts.map((workout) => (
            <AppCard key={workout.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.workoutTitle, { color: colors.foreground }]}>{workout.title}</Text>
                  <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>
                    {workout.duration} min · {workout.calories} cal · {workout.exercises} exercises
                  </Text>
                  <View style={styles.badges}>
                    <Badge label={workout.published ? "Published" : "Draft"} color={workout.published ? "success" : "warning"} small />
                    <Badge label={workout.is_paid ? "Paid" : "Free"} color={workout.is_paid ? "warning" : "muted"} small style={{ marginLeft: 6 }} />
                    <Badge label={workout.difficulty} color={DIFF_COLOR[workout.difficulty]} small style={{ marginLeft: 6 }} />
                    <Badge label={workout.category} color="muted" small style={{ marginLeft: 6 }} />
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/(trainer)/workout-upload" as any, params: { workoutId: workout.id } })}
                    style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(workout)}
                    style={[styles.actionButton, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => togglePublished(workout)}
                style={[styles.publishButton, { backgroundColor: workout.published ? colors.muted : colors.primaryLight }]}
              >
                <Text style={[styles.publishText, { color: workout.published ? colors.mutedForeground : colors.primary }]}>
                  {workout.published ? "Unpublish" : "Publish"}
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
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  filterRow: { gap: 8, paddingRight: 16, marginBottom: 12 },
  filterChip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statusChip: { flex: 1, borderWidth: 1, borderRadius: 100, paddingVertical: 8, alignItems: "center" },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  card: { marginBottom: 10 },
  cardTop: { flexDirection: "row", gap: 12 },
  cardInfo: { flex: 1 },
  workoutTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 4 },
  workoutMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 8 },
  badges: { flexDirection: "row", flexWrap: "wrap" },
  actions: { flexDirection: "row", gap: 8 },
  actionButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  publishButton: { alignItems: "center", borderRadius: 8, marginTop: 12, paddingVertical: 10 },
  publishText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 72, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
