import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppCard from "@/components/ui/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { createBooking } from "@/lib/supabaseApi";

const SESSION_TYPES = [
  "Fitness Consultation",
  "Workout Review",
  "Meal Plan Review",
  "Personal Training Session",
  "Video Call Session",
];

const TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

function getNextDays(n: number) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      short: d.toLocaleDateString("en-US", { weekday: "short" }),
      num: d.getDate(),
      value: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

export default function BookingScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const days = getNextDays(7);

  const handleSubmit = async () => {
    if (!selectedTime || !user) return;
    setLoading(true);
    try {
      await createBooking({
        user_id: user.id,
        session_type: sessionType,
        session_date: days[selectedDay].value,
        session_time: selectedTime,
        note,
      });
      setSubmitted(true);
    } catch (error) {
      Alert.alert("Booking Failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
          <Ionicons name="calendar-outline" size={52} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Booking Requested!</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          {sessionType} on {days[selectedDay].label} at {selectedTime}
        </Text>
        <Text style={[styles.successNote, { color: colors.mutedForeground }]}>
          Your trainer will confirm the session shortly.
        </Text>
        <AppButton title="Book Another Session" onPress={() => { setSubmitted(false); setSelectedTime(""); setNote(""); }} style={{ marginTop: 24, width: 240 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Book a Session</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Request a coaching session with your trainer</Text>

      {/* Session Type */}
      <Text style={[styles.label, { color: colors.mutedForeground }]}>SESSION TYPE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
        {SESSION_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setSessionType(t)}
            style={[styles.typeChip, { backgroundColor: sessionType === t ? colors.primary : colors.card, borderRadius: colors.radius, borderWidth: 1.5, borderColor: sessionType === t ? colors.primary : colors.border }]}
          >
            <Text style={[styles.typeText, { color: sessionType === t ? "#FFF" : colors.foreground }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date */}
      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>SELECT DATE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
        {days.map((day, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelectedDay(i)}
            style={[styles.dayBtn, { backgroundColor: selectedDay === i ? colors.primary : colors.card, borderRadius: colors.radius }]}
          >
            <Text style={[styles.dayName, { color: selectedDay === i ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>{day.short}</Text>
            <Text style={[styles.dayNum, { color: selectedDay === i ? "#FFF" : colors.foreground }]}>{day.num}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time */}
      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>SELECT TIME</Text>
      <View style={styles.timeGrid}>
        {TIMES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setSelectedTime(t)}
            style={[styles.timeBtn, { backgroundColor: selectedTime === t ? colors.primary : colors.card, borderRadius: colors.radius, borderWidth: 1.5, borderColor: selectedTime === t ? colors.primary : colors.border }]}
          >
            <Text style={[styles.timeText, { color: selectedTime === t ? "#FFF" : colors.foreground }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Note */}
      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>ADD A NOTE</Text>
      <AppInput placeholder="What would you like to focus on?" value={note} onChangeText={setNote} multiline numberOfLines={4} />

      <AppButton
        title="Request Booking"
        onPress={handleSubmit}
        loading={loading}
        disabled={!selectedTime}
        style={{ opacity: !selectedTime ? 0.5 : 1 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 20 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  typeScroll: { marginHorizontal: -16, paddingLeft: 16, marginBottom: 4 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 10 },
  typeText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  dayBtn: { width: 52, height: 64, alignItems: "center", justifyContent: "center" },
  dayName: { fontFamily: "Inter_400Regular", fontSize: 11 },
  dayNum: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 2 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  timeBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  timeText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 8 },
  successSub: { fontFamily: "Inter_600SemiBold", fontSize: 15, textAlign: "center", marginBottom: 8 },
  successNote: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});
