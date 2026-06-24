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
import { WORKOUTS } from "@/lib/dummyData";

export default function ActiveWorkoutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const workout = WORKOUTS.find((w) => w.id === workoutId) ?? WORKOUTS[0];
  const exercises = workout.exercises;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [timer, setTimer] = useState(exercises[0]?.restSeconds ?? 60);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [startTime] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const current = exercises[currentIdx];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          if (phase === "work") {
            setPhase("rest");
            return current?.restSeconds ?? 30;
          } else {
            setPhase("work");
            return 45;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, phase, current]);

  const goNext = () => {
    if (currentIdx < exercises.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentIdx(currentIdx + 1);
      setPhase("work");
      setTimer(45);
    } else {
      const elapsed = Math.round((Date.now() - startTime) / 60000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/(user)/workout-done", params: { duration: String(elapsed), exercises: String(exercises.length), calories: String(workout.calories) } });
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIdx(currentIdx - 1);
      setPhase("work");
      setTimer(45);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close-outline" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {currentIdx + 1} / {exercises.length}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ProgressBar progress={(currentIdx + 1) / exercises.length} style={styles.progress} />

      {/* Phase Label */}
      <View style={styles.phaseRow}>
        <View style={[styles.phaseChip, { backgroundColor: phase === "work" ? colors.primaryLight : colors.muted }]}>
          <Text style={[styles.phaseText, { color: phase === "work" ? colors.primary : colors.mutedForeground }]}>
            {phase === "work" ? "EXERCISE" : "REST"}
          </Text>
        </View>
      </View>

      {/* Exercise Info */}
      <View style={styles.exerciseSection}>
        <Animated.View style={[styles.iconCircle, { backgroundColor: colors.primaryLight, transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="barbell-outline" size={52} color={colors.primary} />
        </Animated.View>
        <Text style={[styles.exerciseName, { color: colors.foreground }]}>{current?.name}</Text>
        <Text style={[styles.exerciseMeta, { color: colors.mutedForeground }]}>
          {current?.sets} sets · {current?.reps} reps
        </Text>

        {/* Timer */}
        <View style={[styles.timerRing, { borderColor: phase === "work" ? colors.primary : colors.muted }]}>
          <Text style={[styles.timerText, { color: phase === "work" ? colors.primary : colors.mutedForeground }]}>
            {fmt(timer)}
          </Text>
          <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>
            {phase === "work" ? "exercise time" : "rest time"}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: botPad + 20 }]}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIdx === 0}
          style={[styles.navBtn, { backgroundColor: colors.card, opacity: currentIdx === 0 ? 0.4 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setPaused(!paused); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.pauseBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name={paused ? "play" : "pause"} size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          style={[styles.navBtn, { backgroundColor: colors.card }]}
        >
          <Ionicons name={currentIdx === exercises.length - 1 ? "checkmark" : "chevron-forward"} size={24} color={colors.foreground} />
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
