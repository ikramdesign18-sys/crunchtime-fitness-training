import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";
import StatCard from "@/components/ui/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchClientProfiles,
  fetchTrainerBookings,
  fetchTrainerThreads,
  fetchTrainerVideos,
  type Booking,
  type ChatThread,
  type Profile,
  type VideoSubmission,
} from "@/lib/supabaseApi";

export default function TrainerDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [clients, setClients] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [videos, setVideos] = useState<VideoSubmission[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchClientProfiles(),
      fetchTrainerBookings(user.id),
      fetchTrainerVideos(user.id),
      fetchTrainerThreads(user.id),
    ])
      .then(([clientRows, bookingRows, videoRows, threadRows]) => {
        setClients(clientRows);
        setBookings(bookingRows);
        setVideos(videoRows);
        setThreads(threadRows);
      })
      .catch(() => {});
  }, [user]);

  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const pendingVideos = videos.filter((v) => v.status === "submitted").length;
  const unreadMessages = threads.filter((thread) => !!thread.last_message).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>Coach {user?.name?.split(" ")[1] ?? "Marcus"}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>CM</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard icon="people-outline" iconColor={colors.primary} label="Total Clients" value={clients.length} style={styles.statCard} />
        <StatCard icon="chatbubbles-outline" iconColor="#8B5CF6" label="New Messages" value={unreadMessages} style={styles.statCard} />
        <StatCard icon="calendar-outline" iconColor="#3B82F6" label="Pending Bookings" value={pendingBookings} style={styles.statCard} />
        <StatCard icon="videocam-outline" iconColor="#F59E0B" label="Video Reviews" value={pendingVideos} style={styles.statCard} />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" style={{ marginTop: 8 }} />
      <View style={styles.actionsRow}>
        {[
          { icon: "people-outline" as const, label: "Clients", route: "/(trainer)/clients", color: colors.primary },
          { icon: "calendar-outline" as const, label: "Bookings", route: "/(trainer)/bookings", color: "#3B82F6" },
          { icon: "videocam-outline" as const, label: "Videos", route: "/(trainer)/videos", color: "#F59E0B" },
        ].map((a) => (
          <AppCard
            key={a.label}
            onPress={() => router.push(a.route as any)}
            style={styles.actionCard}
            padding={12}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.color + "20" }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
          </AppCard>
        ))}
      </View>

      {/* Recent Clients */}
      <SectionHeader title="Recent Clients" rightLabel="All" onRightPress={() => router.push("/(trainer)/clients")} style={{ marginTop: 20 }} />
      {clients.slice(0, 5).map((client) => (
        <AppCard
          key={client.id}
          onPress={() => router.push({ pathname: "/(trainer)/client-detail", params: { clientId: client.id } })}
          style={styles.clientCard}
        >
          <View style={styles.clientRow}>
            <Avatar name={client.full_name ?? "Client"} size={42} />
            <View style={styles.clientInfo}>
              <Text style={[styles.clientName, { color: colors.foreground }]}>{client.full_name ?? "Client"}</Text>
              <Text style={[styles.clientGoal, { color: colors.mutedForeground }]}>{client.fitness_goal ?? "General Fitness"}</Text>
            </View>
            <Badge label={client.profile_setup_completed ? "Active" : "Setup Needed"} color={client.profile_setup_completed ? "success" : "warning"} small />
          </View>
        </AppCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 15 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47.5%" },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  actionCard: { flex: 1, alignItems: "center" },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textAlign: "center" },
  clientCard: { marginBottom: 8 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  clientInfo: { flex: 1 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  clientGoal: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});
