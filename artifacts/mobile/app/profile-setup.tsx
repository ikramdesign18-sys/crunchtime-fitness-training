import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { updateProfile } from "@/lib/supabaseApi";

const GOALS = [
  { label: "Lose Weight", icon: "trending-down-outline" as const },
  { label: "Gain Muscle", icon: "barbell-outline" as const },
  { label: "Improve Strength", icon: "flash-outline" as const },
  { label: "Improve Conditioning", icon: "heart-outline" as const },
  { label: "General Fitness", icon: "fitness-outline" as const },
  { label: "Athlete Training", icon: "medal-outline" as const },
];

const ACTIVITY = [
  { label: "Beginner", desc: "New to exercise" },
  { label: "Intermediate", desc: "1–2 years experience" },
  { label: "Advanced", desc: "3+ years experience" },
  { label: "Athlete", desc: "Competitive training" },
];

const TRAINING_TYPES = [
  "Home Workouts",
  "Gym Workouts",
  "Strength Training",
  "Cardio",
  "Conditioning",
  "Athlete Training",
  "Full Body Training",
];

const GENDERS = [
  { label: "Male", icon: "male-outline" as const },
  { label: "Female", icon: "female-outline" as const },
  { label: "Other", icon: "person-outline" as const },
];

const STEP_TITLES = ["Personal Info", "Measurements & Goal", "Activity & Training", "Review & Complete"];
const TOTAL_STEPS = 4;

export default function ProfileSetupScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(profile?.full_name ?? user?.name ?? "");
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "");
  const [gender, setGender] = useState(profile?.gender ?? "Male");
  const [height, setHeight] = useState(profile?.height ? String(profile.height) : "");
  const [weight, setWeight] = useState(profile?.weight ? String(profile.weight) : "");
  const [goal, setGoal] = useState(profile?.fitness_goal ?? "General Fitness");
  const [activity, setActivity] = useState(profile?.activity_level ?? "Beginner");
  const [trainingTypes, setTrainingTypes] = useState<string[]>(
    profile?.training_types?.length ? profile.training_types : ["Gym Workouts"]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : Math.max(insets.bottom, 8) + 12;
  const progress = (step + 1) / TOTAL_STEPS;

  const toggleTraining = (t: string) => {
    setTrainingTypes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t]
    );
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0 && age.trim().length > 0;
    if (step === 1) return height.trim().length > 0 && weight.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleSave();
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert("Session Required", "Please sign in again before saving your profile.");
      router.replace("/(auth)/login");
      return;
    }
    setSaving(true);
    try {
      const saved = await updateProfile(user.id, {
        full_name: name.trim() || user.name,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        fitness_goal: goal,
        activity_level: activity,
        training_types: trainingTypes,
        profile_setup_completed: true,
      });
      setProfile(saved);
      router.replace("/(user)/home");
    } catch (error) {
      Alert.alert("Profile Not Saved", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const infoRow = (label: string, value: string) => (
    <View style={[styles.reviewRow, { borderBottomColor: colors.border }]} key={label}>
      <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.reviewValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={[styles.stepPill, { color: colors.primary, backgroundColor: colors.primaryLight }]}>
            Step {step + 1} of {TOTAL_STEPS}
          </Text>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>{STEP_TITLES[step]}</Text>
        </View>
        {step === 0 && <View style={{ width: 40 }} />}
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 82 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: Personal Info */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <AppInput
              label="Full Name"
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
              autoCapitalize="words"
            />
            <AppInput
              label="Age"
              placeholder="25"
              value={age}
              onChangeText={setAge}
              leftIcon="calendar-outline"
              keyboardType="number-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>GENDER</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const active = gender === g.label;
                return (
                  <TouchableOpacity
                    key={g.label}
                    onPress={() => setGender(g.label)}
                    style={[
                      styles.genderBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <Ionicons name={g.icon} size={22} color={active ? "#FFF" : colors.mutedForeground} />
                    <Text style={[styles.genderLabel, { color: active ? "#FFF" : colors.foreground }]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: Measurements & Goal */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.measureRow}>
              <AppInput
                label="Height (cm)"
                placeholder="175"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                style={styles.halfInput}
                leftIcon="resize-outline"
              />
              <AppInput
                label="Weight (kg)"
                placeholder="75"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                style={styles.halfInput}
                leftIcon="scale-outline"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>FITNESS GOAL</Text>
            <View style={styles.goalGrid}>
              {GOALS.map((g) => {
                const active = goal === g.label;
                return (
                  <TouchableOpacity
                    key={g.label}
                    onPress={() => setGoal(g.label)}
                    style={[
                      styles.goalChip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <Ionicons name={g.icon} size={16} color={active ? "#FFF" : colors.mutedForeground} style={{ marginRight: 6 }} />
                    <Text style={[styles.goalChipText, { color: active ? "#FFF" : colors.foreground }]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3: Activity & Training Type */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ACTIVITY LEVEL</Text>
            <View style={styles.activityList}>
              {ACTIVITY.map((a) => {
                const active = activity === a.label;
                return (
                  <TouchableOpacity
                    key={a.label}
                    onPress={() => setActivity(a.label)}
                    style={[
                      styles.activityItem,
                      {
                        backgroundColor: active ? colors.primaryLight : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <View style={styles.activityItemLeft}>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: active ? colors.primary : colors.border },
                        ]}
                      >
                        {active && (
                          <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.activityLabel, { color: colors.foreground }]}>{a.label}</Text>
                        <Text style={[styles.activityDesc, { color: colors.mutedForeground }]}>{a.desc}</Text>
                      </View>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
              PREFERRED TRAINING TYPE
            </Text>
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>Select all that apply</Text>
            <View style={styles.trainingGrid}>
              {TRAINING_TYPES.map((t) => {
                const active = trainingTypes.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleTraining(t)}
                    style={[
                      styles.trainingChip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                        borderRadius: 100,
                      },
                    ]}
                  >
                    {active && (
                      <Ionicons name="checkmark" size={12} color="#FFF" style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.trainingChipText, { color: active ? "#FFF" : colors.foreground }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 4: Review & Complete */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={[styles.reviewCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <View style={[styles.reviewSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>PERSONAL INFO</Text>
                {infoRow("Name", name || user?.name || "—")}
                {infoRow("Age", age ? `${age} years` : "—")}
                {infoRow("Gender", gender)}
              </View>
              <View style={[styles.reviewSection, { borderBottomColor: colors.border }]}>
                <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>MEASUREMENTS</Text>
                {infoRow("Height", height ? `${height} cm` : "—")}
                {infoRow("Weight", weight ? `${weight} kg` : "—")}
                {infoRow("Fitness Goal", goal)}
              </View>
              <View style={styles.reviewSection}>
                <Text style={[styles.reviewSectionTitle, { color: colors.primary }]}>TRAINING</Text>
                {infoRow("Activity Level", activity)}
                {infoRow("Training Types", trainingTypes.join(", "))}
              </View>
            </View>

            <View style={[styles.completeNote, { backgroundColor: colors.primaryLight, borderRadius: colors.radius }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.completeNoteText, { color: colors.primary }]}>
                You can always update this in your profile settings.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad,
          },
        ]}
      >
        {step < TOTAL_STEPS - 1 ? (
          <AppButton
            title="Continue"
            onPress={handleNext}
            size="lg"
            disabled={!canProceed()}
          />
        ) : (
          <AppButton
            title="Complete Setup"
            onPress={handleSave}
            loading={saving}
            size="lg"
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  stepPill: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginBottom: 6,
    overflow: "hidden",
  },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22 },
  progressTrack: { height: 4, marginHorizontal: 16, borderRadius: 2, marginBottom: 8, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 16 },
  stepContent: { paddingTop: 16 },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  fieldHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: -6, marginBottom: 10 },
  measureRow: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  genderRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  genderBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
  },
  genderLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  goalChipText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  activityList: { gap: 10 },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  activityItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  activityLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  activityDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  trainingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  trainingChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
  },
  trainingChipText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  reviewCard: { overflow: "hidden", marginBottom: 14 },
  reviewSection: { borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  reviewSectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  reviewLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  reviewValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, maxWidth: "60%", textAlign: "right" },
  completeNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  completeNoteText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
});
