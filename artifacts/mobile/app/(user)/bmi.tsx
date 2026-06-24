import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppCard from "@/components/ui/AppCard";
import { useColors } from "@/hooks/useColors";

type BMICategory = { label: string; range: string; color: string; suggestion: string };

const CATEGORIES: BMICategory[] = [
  { label: "Underweight", range: "< 18.5", color: "#3B82F6", suggestion: "Consider increasing caloric intake with nutrient-dense foods and adding strength training." },
  { label: "Normal", range: "18.5–24.9", color: "#22C55E", suggestion: "Great! Maintain your current lifestyle with regular exercise and balanced nutrition." },
  { label: "Overweight", range: "25–29.9", color: "#F59E0B", suggestion: "Focus on cardio workouts and creating a moderate calorie deficit through diet." },
  { label: "Obese", range: "≥ 30", color: "#EF4444", suggestion: "Consult a healthcare professional. Start with low-impact exercise and a nutrition plan." },
];

function getBMIResult(bmi: number): BMICategory {
  if (bmi < 18.5) return CATEGORIES[0];
  if (bmi < 25) return CATEGORIES[1];
  if (bmi < 30) return CATEGORIES[2];
  return CATEGORIES[3];
}

export default function BMIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);
  const [result, setResult] = useState<BMICategory | null>(null);

  const calculate = () => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) {
      Alert.alert("Invalid Input", "Please enter valid height and weight values.");
      return;
    }
    const b = parseFloat((w / (h * h)).toFixed(1));
    setBmi(b);
    setResult(getBMIResult(b));
  };

  const saveResult = async () => {
    if (!bmi) return;
    const entry = { date: new Date().toISOString().split("T")[0], bmi, height, weight };
    const existing = await AsyncStorage.getItem("bmiHistory");
    const list = existing ? JSON.parse(existing) : [];
    list.push(entry);
    await AsyncStorage.setItem("bmiHistory", JSON.stringify(list));
    Alert.alert("Saved", "Your BMI result has been saved to your progress.");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 60 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>BMI Calculator</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Body Mass Index is a measure of body fat based on height and weight.
      </Text>

      <View style={styles.inputRow}>
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

      <AppButton title="Calculate BMI" onPress={calculate} style={{ marginBottom: 24 }} />

      {bmi !== null && result && (
        <>
          <AppCard style={[styles.resultCard, { borderTopWidth: 4, borderTopColor: result.color }]}>
            <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>Your BMI</Text>
            <Text style={[styles.bmiNumber, { color: result.color }]}>{bmi}</Text>
            <Text style={[styles.categoryLabel, { color: result.color }]}>{result.label}</Text>
          </AppCard>

          {/* BMI Scale */}
          <View style={styles.scaleContainer}>
            {CATEGORIES.map((cat, i) => (
              <View key={cat.label} style={[styles.scaleItem, { backgroundColor: cat.color + (result.label === cat.label ? "FF" : "30"), borderRadius: i === 0 ? 100 : i === 3 ? 100 : 0 }]}>
                <Text style={[styles.scaleText, { color: result.label === cat.label ? "#FFF" : cat.color }]}>{cat.label}</Text>
                <Text style={[styles.scaleRange, { color: result.label === cat.label ? "#FFF" : cat.color }]}>{cat.range}</Text>
              </View>
            ))}
          </View>

          <AppCard style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
              <Text style={[styles.suggestionTitle, { color: colors.foreground }]}>Recommendation</Text>
            </View>
            <Text style={[styles.suggestionText, { color: colors.foreground }]}>{result.suggestion}</Text>
          </AppCard>

          <AppButton title="Save Result" onPress={saveResult} variant="outline" />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, marginBottom: 24 },
  inputRow: { flexDirection: "row", gap: 12 },
  halfInput: { flex: 1 },
  resultCard: { alignItems: "center", marginBottom: 16, padding: 24 },
  resultLabel: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 4 },
  bmiNumber: { fontFamily: "Inter_700Bold", fontSize: 60, lineHeight: 68 },
  categoryLabel: { fontFamily: "Inter_700Bold", fontSize: 18, marginTop: 4 },
  scaleContainer: { flexDirection: "row", marginBottom: 16, borderRadius: 100, overflow: "hidden" },
  scaleItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  scaleText: { fontFamily: "Inter_600SemiBold", fontSize: 10, textAlign: "center" },
  scaleRange: { fontFamily: "Inter_400Regular", fontSize: 9, textAlign: "center" },
  suggestionCard: { marginBottom: 16 },
  suggestionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  suggestionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  suggestionText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
});
