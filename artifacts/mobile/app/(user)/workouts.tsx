import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { WORKOUTS } from "@/lib/dummyData";

const CATEGORIES = [
  { label: "All", icon: "grid-outline" as const },
  { label: "Strength", icon: "barbell-outline" as const },
  { label: "Cardio", icon: "heart-outline" as const },
  { label: "Full Body", icon: "body-outline" as const },
  { label: "Weight Loss", icon: "flame-outline" as const },
  { label: "Muscle Gain", icon: "fitness-outline" as const },
  { label: "Athlete", icon: "trophy-outline" as const },
  { label: "Beginner", icon: "star-outline" as const },
  { label: "Home", icon: "home-outline" as const },
];

const DIFF_COLOR = { Beginner: "success", Intermediate: "warning", Advanced: "error" } as const;

export default function WorkoutsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = WORKOUTS.filter((w) => {
    const matchSearch = w.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || w.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Workouts</Text>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.label}
              onPress={() => setActiveCategory(cat.label)}
              style={[
                styles.catChip,
                {
                  backgroundColor: activeCategory === cat.label ? colors.primary : colors.card,
                  borderRadius: 100,
                },
              ]}
            >
              <Ionicons name={cat.icon} size={14} color={activeCategory === cat.label ? "#FFF" : colors.mutedForeground} />
              <Text style={[styles.catText, { color: activeCategory === cat.label ? "#FFF" : colors.mutedForeground }]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No workouts found</Text>
          </View>
        ) : (
          filtered.map((workout) => (
            <Pressable
              key={workout.id}
              onPress={() => router.push({ pathname: "/(user)/workout-detail", params: { workoutId: workout.id } })}
              style={({ pressed }) => [
                styles.workoutItem,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
            >
              <View style={[styles.workoutIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="barbell-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={[styles.workoutName, { color: colors.foreground }]}>{workout.title}</Text>
                <View style={styles.workoutMeta}>
                  <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{workout.duration}m</Text>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>·</Text>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{workout.exercises.length} exercises</Text>
                </View>
                <View style={styles.badgeRow}>
                  <Badge label={workout.difficulty} color={DIFF_COLOR[workout.difficulty]} small />
                  <Badge label={workout.category} color="muted" small style={{ marginLeft: 6 }} />
                </View>
              </View>
              <View style={styles.calBox}>
                <Text style={[styles.calValue, { color: colors.primary }]}>{workout.calories}</Text>
                <Text style={[styles.calLabel, { color: colors.mutedForeground }]}>cal</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15 },
  catScroll: { marginHorizontal: -16, paddingLeft: 16 },
  catChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  catText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  workoutItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  workoutIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  workoutInfo: { flex: 1 },
  workoutName: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 4 },
  workoutMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  badgeRow: { flexDirection: "row" },
  calBox: { alignItems: "center" },
  calValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  calLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
