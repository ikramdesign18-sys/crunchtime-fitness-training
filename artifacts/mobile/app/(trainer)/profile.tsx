import { useRouter } from "expo-router";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { CLIENTS } from "@/lib/dummyData";

export default function TrainerProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile */}
      <View style={styles.profileSection}>
        <Avatar name={user?.name ?? "Coach"} size={80} />
        <Text style={[styles.name, { color: colors.foreground }]}>Coach {user?.name?.split(" ")[1] ?? "Marcus"}</Text>
        <Text style={[styles.biz, { color: colors.primary }]}>Crunchtime Fitness Training</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
      </View>

      {/* Info Cards */}
      <View style={styles.statsRow}>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{CLIENTS.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Clients</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>5+</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Years Exp.</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>NASM</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Certified</Text>
        </AppCard>
      </View>

      {/* Specializations */}
      <AppCard style={styles.infoCard}>
        <Text style={[styles.infoSectionLabel, { color: colors.mutedForeground }]}>SPECIALIZATION</Text>
        {["Strength & Conditioning", "Sports Performance", "Fat Loss & Nutrition", "Athletic Development"].map((spec, i, arr) => (
          <View key={spec} style={[styles.specRow, { borderBottomColor: colors.border, borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
            <View style={[styles.specDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.specText, { color: colors.foreground }]}>{spec}</Text>
          </View>
        ))}
      </AppCard>

      {/* Settings */}
      <AppCard style={styles.settingsCard} padding={0}>
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={18} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.foreground }]}>Dark Theme</Text>
          <Switch value={isDark} onValueChange={toggleTheme} thumbColor={isDark ? colors.primary : "#FFF"} trackColor={{ false: colors.muted, true: colors.primaryLight }} />
        </View>
        <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="notifications-outline" size={18} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.foreground }]}>Notifications</Text>
          <Switch value={true} thumbColor={colors.primary} trackColor={{ false: colors.muted, true: colors.primaryLight }} />
        </View>
      </AppCard>

      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderRadius: colors.radius }]}
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
  profileSection: { alignItems: "center", marginBottom: 20 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 12 },
  biz: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginTop: 2 },
  email: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  infoCard: { marginBottom: 16 },
  infoSectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, marginBottom: 12 },
  specRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 },
  specDot: { width: 6, height: 6, borderRadius: 3 },
  specText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  settingsCard: { marginBottom: 16 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  settingLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
