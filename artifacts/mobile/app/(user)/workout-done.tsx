import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { saveWorkoutProgress } from "@/lib/supabaseApi";

export default function WorkoutDoneScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { duration, exercises, calories, workoutId, workoutTitle } = useLocalSearchParams<{
    duration: string;
    exercises: string;
    calories: string;
    workoutId?: string;
    workoutTitle?: string;
  }>();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const savedRef = useRef(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const saveProgress = useCallback(async () => {
    if (savedRef.current) return;
    savedRef.current = true;
    if (user && workoutId && workoutTitle) {
      try {
        await saveWorkoutProgress({
          user_id: user.id,
          workout_id: workoutId,
          workout_title: workoutTitle,
          duration_minutes: Number(duration ?? 0),
          calories_burned: Number(calories ?? 0),
        });
      } catch (error) {
        savedRef.current = false;
        console.warn("Workout progress save failed", (error as Error).message);
      }
    }
  }, [calories, duration, user, workoutId, workoutTitle]);

  const handleSave = async () => {
    await saveProgress();
    router.replace("/(user)/home");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Animated.View style={[styles.iconWrap, { backgroundColor: colors.success + "20", transform: [{ scale }] }]}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </Animated.View>
        <Text style={[styles.title, { color: colors.foreground }]}>Workout Complete!</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Outstanding work. Your progress has been recorded.</Text>

        <View style={styles.statsRow}>
          <AppCard style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{duration ?? "0"} min</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Duration</Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <Ionicons name="barbell-outline" size={24} color="#F59E0B" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{exercises ?? "0"}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Exercises</Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <Ionicons name="flame-outline" size={24} color="#EF4444" />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{calories ?? "0"}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Calories</Text>
          </AppCard>
        </View>

        <View style={[styles.btnGroup, { paddingBottom: botPad + 20 }]}>
          <AppButton title="Save Progress" onPress={handleSave} />
          <AppButton title="Back to Home" onPress={handleSave} variant="outline" style={{ marginTop: 10 }} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, textAlign: "center", marginBottom: 8 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 32, width: "100%" },
  statCard: { flex: 1, alignItems: "center", gap: 6 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" },
  btnGroup: { width: "100%" },
});
