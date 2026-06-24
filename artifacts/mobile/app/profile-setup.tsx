import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const GOALS = ["Lose Weight", "Gain Muscle", "Improve Strength", "Improve Conditioning", "General Fitness", "Athlete Training"];
const ACTIVITY = ["Beginner", "Intermediate", "Advanced", "Athlete"];
const TRAINING = ["Gym", "Home", "Outdoor", "Mixed"];
const GENDERS = ["Male", "Female", "Other"];

export default function ProfileSetupScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("General Fitness");
  const [activity, setActivity] = useState("Beginner");
  const [training, setTraining] = useState("Gym");
  const [saving, setSaving] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else handleSave();
  };

  const handleSave = async () => {
    setSaving(true);
    const profile = { name, age, gender, height, weight, goal, activity, training };
    await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
    setSaving(false);
    router.replace("/(user)/home");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 20 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>Step {step + 1} of 3</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {["Personal Info", "Measurements & Goal", "Training Style"][step]}
          </Text>
          <ProgressBar progress={(step + 1) / 3} style={{ marginTop: 12 }} />
        </View>

        {step === 0 && (
          <View>
            <AppInput label="Full Name" placeholder="Your name" value={name} onChangeText={setName} leftIcon="person-outline" autoCapitalize="words" />
            <AppInput label="Age" placeholder="25" value={age} onChangeText={setAge} leftIcon="calendar-outline" keyboardType="number-pad" />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.chip, { borderColor: gender === g ? colors.primary : colors.border, backgroundColor: gender === g ? colors.primaryLight : colors.card }]}>
                  <Text style={[styles.chipText, { color: gender === g ? colors.primary : colors.mutedForeground }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <View style={styles.row}>
              <AppInput label="Height (cm)" placeholder="175" value={height} onChangeText={setHeight} keyboardType="number-pad" style={styles.halfInput} />
              <AppInput label="Weight (kg)" placeholder="75" value={weight} onChangeText={setWeight} keyboardType="number-pad" style={styles.halfInput} />
            </View>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Fitness Goal</Text>
            <View style={styles.chipGrid}>
              {GOALS.map((g) => (
                <TouchableOpacity key={g} onPress={() => setGoal(g)} style={[styles.goalChip, { borderColor: goal === g ? colors.primary : colors.border, backgroundColor: goal === g ? colors.primaryLight : colors.card, borderRadius: colors.radius }]}>
                  <Text style={[styles.goalChipText, { color: goal === g ? colors.primary : colors.foreground }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Activity Level</Text>
            <View style={styles.chipGrid}>
              {ACTIVITY.map((a) => (
                <TouchableOpacity key={a} onPress={() => setActivity(a)} style={[styles.goalChip, { borderColor: activity === a ? colors.primary : colors.border, backgroundColor: activity === a ? colors.primaryLight : colors.card, borderRadius: colors.radius }]}>
                  <Text style={[styles.goalChipText, { color: activity === a ? colors.primary : colors.foreground }]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Training Type</Text>
            <View style={styles.chipRow}>
              {TRAINING.map((t) => (
                <TouchableOpacity key={t} onPress={() => setTraining(t)} style={[styles.chip, { borderColor: training === t ? colors.primary : colors.border, backgroundColor: training === t ? colors.primaryLight : colors.card }]}>
                  <Text style={[styles.chipText, { color: training === t ? colors.primary : colors.mutedForeground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.btnRow}>
          {step > 0 && (
            <AppButton title="Back" onPress={() => setStep(step - 1)} variant="outline" style={styles.backBtn} />
          )}
          <AppButton
            title={step === 2 ? "Complete Setup" : "Next"}
            onPress={handleNext}
            loading={saving}
            style={styles.nextBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 60 },
  header: { marginBottom: 28 },
  stepLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, letterSpacing: 0.5, marginBottom: 4 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  row: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, borderWidth: 1.5 },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  goalChip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1.5 },
  goalChipText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  backBtn: { flex: 1 },
  nextBtn: { flex: 2 },
});
