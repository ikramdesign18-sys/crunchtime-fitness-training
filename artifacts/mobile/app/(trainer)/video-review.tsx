import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { VIDEO_SUBMISSIONS } from "@/lib/dummyData";

export default function VideoReviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const video = VIDEO_SUBMISSIONS.find((v) => v.id === videoId) ?? VIDEO_SUBMISSIONS[0];
  const [feedback, setFeedback] = useState(video.feedback ?? "");
  const [submitted, setSubmitted] = useState(video.status === "feedback_received");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!feedback.trim()) {
      Alert.alert("Feedback Required", "Please add feedback before sending.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
    Alert.alert("Feedback Sent", "Your feedback has been sent to the client.");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Review Video</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Client Info */}
        <AppCard style={styles.clientCard}>
          <View style={styles.clientRow}>
            <Avatar name={video.clientName} size={44} />
            <View style={styles.clientInfo}>
              <Text style={[styles.clientName, { color: colors.foreground }]}>{video.clientName}</Text>
              <Text style={[styles.exerciseName, { color: colors.primary }]}>{video.exerciseName}</Text>
              <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                Submitted {new Date(video.submittedAt).toLocaleDateString()}
              </Text>
            </View>
            <Badge
              label={submitted ? "Reviewed" : "Needs Review"}
              color={submitted ? "success" : "warning"}
              small
            />
          </View>
        </AppCard>

        {/* Video Placeholder */}
        <View style={[styles.videoPlayer, { backgroundColor: "#1A1A1A", borderRadius: colors.radius }]}>
          <Ionicons name="play-circle-outline" size={60} color="rgba(255,255,255,0.5)" />
          <Text style={styles.videoPlayerText}>{video.exerciseName}</Text>
          <Text style={styles.videoPlayerSub}>Video playback requires device integration</Text>
        </View>

        {/* Client Note */}
        <AppCard style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>Client Note</Text>
          </View>
          <Text style={[styles.noteText, { color: colors.foreground }]}>{video.note}</Text>
        </AppCard>

        {/* Feedback */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Feedback</Text>
        <AppInput
          placeholder="Write detailed feedback for the client. Include form cues, corrections, and encouragement..."
          value={feedback}
          onChangeText={setFeedback}
          multiline
          numberOfLines={6}
          editable={!submitted}
          style={{ marginBottom: 16 }}
        />

        {!submitted ? (
          <View style={styles.btnRow}>
            <AppButton
              title="Mark as Reviewed"
              onPress={() => setSubmitted(true)}
              variant="outline"
              style={{ flex: 1 }}
            />
            <AppButton
              title="Send Feedback"
              onPress={handleSend}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <View style={[styles.successCard, { backgroundColor: colors.success + "15", borderRadius: colors.radius }]}>
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>Feedback sent to client</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },
  clientCard: { marginBottom: 12 },
  clientRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  clientInfo: { flex: 1 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  exerciseName: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 2 },
  dateText: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  videoPlayer: { height: 200, alignItems: "center", justifyContent: "center", marginBottom: 14, gap: 8 },
  videoPlayerText: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  videoPlayerSub: { color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", fontSize: 12 },
  noteCard: { marginBottom: 16 },
  noteHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  noteLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
  noteText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 10 },
  btnRow: { flexDirection: "row", gap: 10 },
  successCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  successText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
