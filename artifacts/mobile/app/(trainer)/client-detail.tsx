import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { CLIENTS, VIDEO_SUBMISSIONS, PROGRESS_DATA } from "@/lib/dummyData";

const STATUS_COLOR = { Excellent: "success", "On Track": "info", "Needs Attention": "warning" } as const;

export default function ClientDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const client = CLIENTS.find((c) => c.id === clientId) ?? CLIENTS[0];
  const clientVideos = VIDEO_SUBMISSIONS.filter((v) => v.clientId === clientId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Client Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <Avatar name={client.name} size={72} />
          <Text style={[styles.clientName, { color: colors.foreground }]}>{client.name}</Text>
          <Text style={[styles.clientEmail, { color: colors.mutedForeground }]}>{client.email}</Text>
          <Badge label={client.progressStatus} color={STATUS_COLOR[client.progressStatus]} style={{ marginTop: 8 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "BMI", value: String(client.bmi) },
            { label: "Videos", value: String(clientVideos.length) },
            { label: "Active", value: client.lastActive },
          ].map((s) => (
            <AppCard key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </AppCard>
          ))}
        </View>

        {/* Goal */}
        <AppCard style={styles.goalCard}>
          <View style={styles.goalRow}>
            <Ionicons name="trophy-outline" size={18} color={colors.primary} />
            <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>Fitness Goal</Text>
          </View>
          <Text style={[styles.goalValue, { color: colors.foreground }]}>{client.goal}</Text>
        </AppCard>

        {/* Actions */}
        <AppButton
          title="Message Client"
          onPress={() => router.push({ pathname: "/(trainer)/chat-detail", params: { clientId: client.id, clientName: client.name } })}
          style={{ marginBottom: 10 }}
        />
        <AppButton
          title="View Submitted Videos"
          onPress={() => router.push("/(trainer)/videos")}
          variant="outline"
          style={{ marginBottom: 20 }}
        />

        {/* Video Submissions */}
        {clientVideos.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Video Submissions</Text>
            {clientVideos.map((v) => (
              <AppCard key={v.id} style={styles.videoCard} onPress={() => router.push({ pathname: "/(trainer)/video-review", params: { videoId: v.id } })}>
                <View style={styles.videoRow}>
                  <View style={[styles.videoIcon, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="videocam-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoEx, { color: colors.foreground }]}>{v.exerciseName}</Text>
                    <Text style={[styles.videoDate, { color: colors.mutedForeground }]}>{new Date(v.submittedAt).toLocaleDateString()}</Text>
                  </View>
                  <Badge label={v.status.replace("_", " ")} color={v.status === "feedback_received" ? "success" : "warning"} small />
                </View>
              </AppCard>
            ))}
          </>
        )}

        {/* Progress */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Progress Summary</Text>
        <AppCard>
          <Text style={[styles.progressNote, { color: colors.mutedForeground }]}>
            BMI trending from {PROGRESS_DATA[0].bmi} → {PROGRESS_DATA[PROGRESS_DATA.length - 1].bmi} over 8 weeks.
            Consistent workout schedule with {PROGRESS_DATA.reduce((s, p) => s + p.workoutsCompleted, 0)} total sessions.
          </Text>
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  profileSection: { alignItems: "center", marginBottom: 20 },
  clientName: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 12 },
  clientEmail: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  goalCard: { marginBottom: 16 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  goalLabel: { fontFamily: "Inter_500Medium", fontSize: 13 },
  goalValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  videoCard: { marginBottom: 8 },
  videoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  videoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  videoInfo: { flex: 1 },
  videoEx: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  videoDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  progressNote: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
});
