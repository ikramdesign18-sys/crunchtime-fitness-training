import { useRouter } from "expo-router";
import React from "react";
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
    ]);
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
        <TouchableOpacity onPress={() => router.push("/profile-setup")} style={[styles.row, { borderBottomColor: colors.border }]}>
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
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>PREFERENCES</Text>
      <AppCard style={styles.section} padding={0}>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={18} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Dark Theme</Text>
          <Switch value={isDark} onValueChange={toggleTheme} thumbColor={isDark ? colors.primary : "#FFF"} trackColor={{ false: colors.muted, true: colors.primaryLight }} />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Ionicons name="notifications-outline" size={18} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Notifications</Text>
          <Switch value={true} thumbColor={colors.primary} trackColor={{ false: colors.muted, true: colors.primaryLight }} />
        </View>
      </AppCard>

      {/* About */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>ABOUT</Text>
      <AppCard style={styles.section} padding={0}>
        <TouchableOpacity onPress={() => showAlert("Privacy Policy", "Your data is stored securely and never shared with third parties without your consent.")} style={[styles.row, { borderBottomColor: colors.border }]}>
          <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Privacy Policy</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => showAlert("Terms of Service", "By using Crunchtime Fitness Training, you agree to our terms of service and community guidelines.")} style={[styles.row, { borderBottomColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Terms of Service</Text>
          <Ionicons name="chevron-forward-outline" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>App Version</Text>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>1.0.0</Text>
        </View>
      </AppCard>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderRadius: colors.radius, marginTop: 24 }]}>
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
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  section: {},
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  rowLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
  rowValue: { fontFamily: "Inter_400Regular", fontSize: 14 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
