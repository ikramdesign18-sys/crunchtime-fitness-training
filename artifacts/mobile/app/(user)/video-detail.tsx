import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { fetchVideoById, type VideoSubmission } from "@/lib/supabaseApi";

const STATUS_COLOR = { submitted: "warning", reviewed: "info", feedback_received: "success" } as const;
const STATUS_LABEL = { submitted: "Submitted", reviewed: "Under Review", feedback_received: "Feedback Ready" };

export default function VideoDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [video, setVideo] = useState<VideoSubmission | null>(null);

  useEffect(() => {
    if (!videoId) return;
    fetchVideoById(videoId).then(setVideo).catch(() => {});
  }, [videoId]);

  if (!video) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Video Review</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Video Placeholder */}
        <View style={[styles.videoArea, { backgroundColor: "#1A1A1A", borderRadius: colors.radius }]}>
          <View style={styles.playIcon}>
            <Ionicons name="play-circle-outline" size={60} color="rgba(255,255,255,0.6)" />
          </View>
          <Text style={styles.videoLabel}>{video.exercise_name}</Text>
        </View>

        {/* Info */}
        <AppCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Exercise</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{video.exercise_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Submitted</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{new Date(video.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Status</Text>
            <Badge label={STATUS_LABEL[video.status]} color={STATUS_COLOR[video.status]} small />
          </View>
        </AppCard>

        {/* User Note */}
        <AppCard style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>Your Note</Text>
          </View>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{video.note ?? "No note provided."}</Text>
        </AppCard>

        {/* Trainer Feedback */}
        {video.trainer_feedback ? (
          <AppCard style={[styles.feedbackCard, { borderLeftWidth: 4, borderLeftColor: colors.success }]}>
            <View style={styles.noteHeader}>
              <Ionicons name="chatbubbles-outline" size={16} color={colors.success} />
              <Text style={[styles.noteLabel, { color: colors.success }]}>Trainer Feedback</Text>
            </View>
            <Text style={[styles.noteText, { color: colors.foreground }]}>{video.trainer_feedback}</Text>
          </AppCard>
        ) : (
          <AppCard style={styles.pendingCard}>
            <View style={styles.pendingContent}>
              <Ionicons name="time-outline" size={28} color={colors.mutedForeground} />
              <Text style={[styles.pendingText, { color: colors.mutedForeground }]}>
                Awaiting trainer review. You'll be notified when feedback is ready.
              </Text>
            </View>
          </AppCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  videoArea: { height: 200, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  playIcon: {},
  videoLabel: { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8 },
  infoCard: { marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  noteCard: { marginBottom: 12 },
  feedbackCard: { marginBottom: 12 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  noteLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  pendingCard: { marginBottom: 12 },
  pendingContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  pendingText: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1, lineHeight: 20 },
});
