import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  DAY_LABELS,
  DEFAULT_REMINDER,
  ReminderSettings,
  cancelAllReminders,
  formatTime,
  loadReminderSettings,
  requestNotificationPermission,
  saveReminderSettings,
  scheduleWorkoutReminders,
} from "@/lib/notifications";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadReminderSettings().then(setReminders);
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const toggleReminders = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive workout reminders."
        );
        return;
      }
    }
    const updated = { ...reminders, enabled: value };
    setReminders(updated);
    await saveReminderSettings(updated);
    if (value) {
      await scheduleWorkoutReminders(updated);
    } else {
      await cancelAllReminders();
    }
  };

  const toggleDay = async (day: number) => {
    const days = reminders.days.includes(day)
      ? reminders.days.filter((d) => d !== day)
      : [...reminders.days, day].sort();
    const updated = { ...reminders, days };
    setReminders(updated);
    await saveReminderSettings(updated);
    if (reminders.enabled) await scheduleWorkoutReminders(updated);
  };

  const setHour = async (hour: number) => {
    const updated = { ...reminders, hour };
    setReminders(updated);
    await saveReminderSettings(updated);
    if (reminders.enabled) await scheduleWorkoutReminders(updated);
    setShowTimePicker(false);
  };

  const showAlert = (title: string, msg: string) => Alert.alert(title, msg);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

      {/* Account */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
      <AppCard style={styles.section} padding={0}>
        <TouchableOpacity
          onPress={() => router.push("/profile-setup")}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <Ionicons name="person-outline" size={18} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Edit Profile</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}} style={[styles.row, { borderBottomWidth: 0 }]}>
          <Ionicons name="trophy-outline" size={18} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Change Fitness Goal</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </AppCard>

      {/* Preferences */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
        PREFERENCES
      </Text>
      <AppCard style={styles.section} padding={0}>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Ionicons
            name={isDark ? "moon-outline" : "sunny-outline"}
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Dark Theme</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? colors.primary : "#FFF"}
            trackColor={{ false: colors.muted, true: colors.primaryLight }}
          />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Ionicons name="notifications-outline" size={18} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Push Notifications</Text>
          <Switch
            value={reminders.enabled}
            onValueChange={toggleReminders}
            thumbColor={reminders.enabled ? colors.primary : "#FFF"}
            trackColor={{ false: colors.muted, true: colors.primaryLight }}
          />
        </View>
      </AppCard>

      {/* Workout Reminders */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
        WORKOUT REMINDERS
      </Text>
      <AppCard padding={16}>
        <View style={styles.reminderHeader}>
          <View style={[styles.reminderIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="alarm-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderTitle, { color: colors.foreground }]}>
              Scheduled Reminders
            </Text>
            <Text style={[styles.reminderSub, { color: colors.mutedForeground }]}>
              {reminders.enabled
                ? `Active · ${reminders.days.length} day(s) at ${formatTime(reminders.hour, reminders.minute)}`
                : "Enable to set workout reminders"}
            </Text>
          </View>
          <Switch
            value={reminders.enabled}
            onValueChange={toggleReminders}
            thumbColor={reminders.enabled ? colors.primary : "#FFF"}
            trackColor={{ false: colors.muted, true: colors.primaryLight }}
          />
        </View>

        {reminders.enabled && (
          <>
            {/* Day selector */}
            <Text style={[styles.reminderLabel, { color: colors.mutedForeground }]}>DAYS</Text>
            <View style={styles.dayRow}>
              {DAY_LABELS.map((label, idx) => {
                const active = reminders.days.includes(idx);
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => toggleDay(idx)}
                    style={[
                      styles.dayBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.muted,
                        borderRadius: 20,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayBtnText,
                        { color: active ? "#FFF" : colors.mutedForeground },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time selector */}
            <Text style={[styles.reminderLabel, { color: colors.mutedForeground, marginTop: 14 }]}>
              TIME
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(!showTimePicker)}
              style={[
                styles.timePicker,
                {
                  backgroundColor: colors.muted,
                  borderRadius: colors.radius,
                  borderColor: showTimePicker ? colors.primary : "transparent",
                  borderWidth: 1.5,
                },
              ]}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.timeText, { color: colors.foreground }]}>
                {formatTime(reminders.hour, reminders.minute)}
              </Text>
              <Ionicons
                name={showTimePicker ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            {showTimePicker && (
              <View
                style={[
                  styles.hourGrid,
                  { backgroundColor: colors.card, borderRadius: colors.radius },
                ]}
              >
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setHour(h)}
                    style={[
                      styles.hourBtn,
                      {
                        backgroundColor:
                          reminders.hour === h ? colors.primary : colors.muted,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.hourText,
                        { color: reminders.hour === h ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {formatTime(h, 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View
              style={[
                styles.reminderNote,
                { backgroundColor: colors.primaryLight, borderRadius: 8, marginTop: 12 },
              ]}
            >
              <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
              <Text style={[styles.reminderNoteText, { color: colors.primary }]}>
                Reminders are scheduled locally on your device and fire even when the app is closed.
              </Text>
            </View>
          </>
        )}
      </AppCard>

      {/* About */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
        ABOUT
      </Text>
      <AppCard style={styles.section} padding={0}>
        <TouchableOpacity
          onPress={() =>
            showAlert(
              "Privacy Policy",
              "Your data is stored securely and never shared with third parties without your consent."
            )
          }
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Privacy Policy</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            showAlert(
              "Terms of Service",
              "By using Crunchtime Fitness Training, you agree to our terms of service and community guidelines."
            )
          }
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <Ionicons name="document-text-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Terms of Service</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.mutedForeground}
          />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>App Version</Text>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>1.0.0</Text>
        </View>
      </AppCard>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[
          styles.logoutBtn,
          {
            backgroundColor: colors.destructive + "15",
            borderRadius: colors.radius,
            marginTop: 24,
          },
        ]}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 20 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  section: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
  rowValue: { fontFamily: "Inter_400Regular", fontSize: 14 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  reminderHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  reminderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  reminderSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  reminderLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  dayRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  dayBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  dayBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  timeText: { fontFamily: "Inter_600SemiBold", fontSize: 16, flex: 1 },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
    marginTop: 6,
  },
  hourBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  hourText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  reminderNote: { flexDirection: "row", alignItems: "flex-start", padding: 10, gap: 6 },
  reminderNoteText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },
});
