import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProgressBar from "@/components/ui/ProgressBar";
import { useColors } from "@/hooks/useColors";
import { fetchWorkoutVideoById, type TrainerWorkoutVideo } from "@/lib/supabaseApi";

export default function ActiveWorkoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  const [workout, setWorkout] = useState<TrainerWorkoutVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [timer, setTimer] = useState(60);
  const [startTime] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const totalSeconds = Math.max(60, (workout?.duration ?? 1) * 60);
  const exerciseCount = Math.max(0, workout?.exercises ?? 0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!workoutId) {
      setLoading(false);
      return;
    }

    fetchWorkoutVideoById(workoutId)
      .then((row) => {
        setWorkout(row?.published ? row : null);
        setTimer(Math.max(60, (row?.duration ?? 1) * 60));
      })
      .catch(() => setWorkout(null))
      .finally(() => setLoading(false));
  }, [workoutId]);

  const finishWorkout = () => {
    if (finishedRef.current || !workout) return;
    finishedRef.current = true;
    const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({
      pathname: "/(user)/workout-done",
      params: {
        duration: String(elapsed),
        exercises: String(exerciseCount),
        calories: String(workout.calories),
        workoutId: workout.id,
        workoutTitle: workout.title,
      },
    });
  };

  useEffect(() => {
    if (paused || loading || !workout) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          finishWorkout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, loading, workout]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (!loading && !workout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close-outline" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Workout unavailable</Text>
          <View style={{ width: 28 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {loading ? "Loading" : "Workout"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ProgressBar progress={workout ? (totalSeconds - timer) / totalSeconds : 0} style={styles.progress} />

      {/* Phase Label */}
      <View style={styles.phaseRow}>
        <View style={[styles.phaseChip, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.phaseText, { color: colors.primary }]}>
            WORKOUT
          </Text>
        </View>
      </View>

      {/* Exercise Info */}
      <View style={styles.exerciseSection}>
        <Animated.View style={[styles.iconCircle, { backgroundColor: colors.primaryLight, transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="barbell-outline" size={52} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.exerciseName, { color: colors.foreground }]}>{workout?.title ?? "Loading workout"}</Text>
        <Text style={[styles.exerciseMeta, { color: colors.mutedForeground }]}>
          {workout ? `${workout.category} · ${workout.difficulty} · ${exerciseCount} exercises` : "Preparing workout"}
        </Text>

        {/* Timer */}
        <View style={[styles.timerRing, { borderColor: colors.primary }]}>
          <Text style={[styles.timerText, { color: colors.primary }]}>
            {fmt(timer)}
          </Text>
          <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>
            remaining
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: botPad + 20 }]}>
        <TouchableOpacity
          onPress={() => {
            setTimer(totalSeconds);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          disabled={!workout}
          style={[styles.navBtn, { backgroundColor: colors.card, opacity: workout ? 1 : 0.4 }]}
        >
          <Ionicons name="refresh-outline" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setPaused(!paused); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.pauseBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name={paused ? "play" : "pause"} size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={finishWorkout}
          disabled={!workout}
          style={[styles.navBtn, { backgroundColor: colors.card }]}
        >
          <Ionicons name="checkmark" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  progress: { marginHorizontal: 20, marginBottom: 20 },
  phaseRow: { alignItems: "center", marginBottom: 20 },
  phaseChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100 },
  phaseText: { fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1.5 },
  exerciseSection: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  exerciseName: { fontFamily: "Inter_700Bold", fontSize: 26, textAlign: "center", marginBottom: 6 },
  exerciseMeta: { fontFamily: "Inter_400Regular", fontSize: 16, marginBottom: 28 },
  timerRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, alignItems: "center", justifyContent: "center" },
  timerText: { fontFamily: "Inter_700Bold", fontSize: 40 },
  timerLabel: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, paddingHorizontal: 40, paddingTop: 20 },
  navBtn: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  pauseBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
});
