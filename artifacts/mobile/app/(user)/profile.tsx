import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/ui/Avatar";
import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { PROGRESS_DATA } from "@/lib/dummyData";

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [profile, setProfile] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userProfile").then((v) => {
      if (v) setProfile(JSON.parse(v));
    });
  }, []);

  const latest = PROGRESS_DATA[PROGRESS_DATA.length - 1];

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
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
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Avatar name={user?.name ?? "User"} size={80} />
        <Text style={[styles.name, { color: colors.foreground }]}>{user?.name ?? "Athlete"}</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user?.email}</Text>
        <Badge label={profile?.goal ?? "General Fitness"} color="primary" style={{ marginTop: 8 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Height", value: profile?.height ? `${profile.height} cm` : "—" },
          { label: "Weight", value: profile?.weight ? `${profile.weight} kg` : "—" },
          { label: "BMI", value: String(latest.bmi) },
        ].map((s) => (
          <AppCard key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </AppCard>
        ))}
      </View>

      {/* Info */}
      {profile && (
        <AppCard style={styles.infoCard}>
          {[
            { label: "Age", value: profile.age ?? "—", icon: "calendar-outline" as const },
            { label: "Gender", value: profile.gender ?? "—", icon: "person-outline" as const },
            { label: "Activity Level", value: profile.activity ?? "—", icon: "trending-up-outline" as const },
            { label: "Training Style", value: profile.training ?? "—", icon: "barbell-outline" as const },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }]}>
              <View style={styles.infoLeft}>
                <Ionicons name={item.icon} size={16} color={colors.mutedForeground} />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </AppCard>
      )}

      {/* Actions */}
      <AppCard style={styles.actionsCard} padding={0}>
        {[
          { icon: "create-outline" as const, label: "Edit Profile", onPress: () => router.push("/profile-setup") },
          { icon: "settings-outline" as const, label: "Settings", onPress: () => router.push("/(user)/settings") },
          { icon: "notifications-outline" as const, label: "Notifications", onPress: () => router.push("/(user)/notifications") },
        ].map((action, i) => (
          <TouchableOpacity
            key={action.label}
            onPress={action.onPress}
            style={[styles.actionRow, { borderBottomColor: colors.border, borderBottomWidth: i < 2 ? 1 : 0 }]}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={action.icon} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
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
  avatarSection: { alignItems: "center", marginBottom: 24 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 12 },
  email: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  infoCard: { marginBottom: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  actionsCard: { marginBottom: 16 },
  actionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  actionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
