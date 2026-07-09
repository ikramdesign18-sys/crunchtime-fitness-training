import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const fabScale = useRef(new Animated.Value(0.9)).current;
  const fabOpacity = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 8 }),
      Animated.timing(fabOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [fabOpacity, fabScale]);

  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const pendingVideos = videos.filter((v) => v.status === "submitted").length;
  const unreadMessages = threads.filter((thread) => !!thread.last_message).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
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
            { icon: "nutrition-outline" as const, label: "Meals", route: "/(trainer)/meal-plans", color: "#22C55E" },
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
      <Animated.View
        style={[
          styles.fabWrap,
          {
            bottom: (Platform.OS === "web" ? 84 : 64) + insets.bottom + 16,
            opacity: fabOpacity,
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActionModalVisible(true)}
          activeOpacity={0.85}
          style={[styles.fab, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={30} color={colors.primaryForeground} />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        transparent
        animationType="fade"
        visible={actionModalVisible}
        onRequestClose={() => setActionModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setActionModalVisible(false)}>
          <Pressable style={[styles.actionSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Create</Text>
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push("/(trainer)/workout-upload" as any);
              }}
              style={[styles.sheetOption, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.sheetIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.sheetText}>
                <Text style={[styles.sheetLabel, { color: colors.foreground }]}>Add Workout Video</Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>Upload a workout for clients</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setActionModalVisible(false);
                router.push("/(trainer)/meal-plan-editor" as any);
              }}
              style={styles.sheetOption}
            >
              <View style={[styles.sheetIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.sheetText}>
                <Text style={[styles.sheetLabel, { color: colors.foreground }]}>Add Meal Plan</Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>Create nutrition guidance</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  fabWrap: { position: "absolute", right: 18 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.38)", justifyContent: "flex-end", padding: 16 },
  actionSheet: { borderWidth: 1, borderRadius: 18, padding: 14, paddingTop: 10 },
  sheetHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(150,150,150,0.55)", marginBottom: 12 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 6 },
  sheetOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  sheetIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetText: { flex: 1 },
  sheetLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sheetSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
});
