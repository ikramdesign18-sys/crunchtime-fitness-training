import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fetchTrainerVideos, type VideoSubmission } from "@/lib/supabaseApi";

const STATUS_COLOR = { submitted: "warning", reviewed: "info", feedback_received: "success" } as const;
const STATUS_LABEL = { submitted: "Needs Review", reviewed: "Reviewed", feedback_received: "Feedback Sent" };

export default function VideosScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [videos, setVideos] = useState<VideoSubmission[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchTrainerVideos(user.id).then(setVideos).catch(() => {});
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Video Reviews</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {videos.filter((v) => v.status === "submitted").length} pending review
        </Text>
      </View>
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {videos.map((video) => (
          <AppCard
            key={video.id}
            onPress={() => router.push({ pathname: "/(trainer)/video-review", params: { videoId: video.id } })}
            style={styles.videoCard}
          >
            <View style={styles.videoRow}>
              <Avatar name={video.clientName ?? "Client"} size={44} />
              <View style={styles.videoInfo}>
                <Text style={[styles.clientName, { color: colors.foreground }]}>{video.clientName ?? "Client"}</Text>
                <Text style={[styles.exerciseName, { color: colors.primary }]}>{video.exercise_name}</Text>
                <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                  {new Date(video.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statusWrap}>
                <Badge label={STATUS_LABEL[video.status]} color={STATUS_COLOR[video.status]} small />
                {video.status === "submitted" && (
                  <View style={[styles.actionDot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </View>
          </AppCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 2 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 4 },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  videoCard: {},
  videoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  videoInfo: { flex: 1 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  exerciseName: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 },
  dateText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  statusWrap: { alignItems: "flex-end", gap: 6 },
  actionDot: { width: 8, height: 8, borderRadius: 4 },
});
