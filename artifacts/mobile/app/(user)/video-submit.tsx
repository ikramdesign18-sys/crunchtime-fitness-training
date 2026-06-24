import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { VIDEO_SUBMISSIONS } from "@/lib/dummyData";

const EXERCISES = ["Barbell Squat", "Deadlift", "Bench Press", "Pull-Ups", "Overhead Press", "Romanian Deadlift", "Box Jumps", "Lunges"];

const STATUS_COLOR = { submitted: "warning", reviewed: "info", feedback_received: "success" } as const;
const STATUS_LABEL = { submitted: "Submitted", reviewed: "Reviewed", feedback_received: "Feedback Ready" };

export default function VideoSubmitScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showExPicker, setShowExPicker] = useState(false);

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Allow access to your media library to upload videos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!videoUri && Platform.OS !== "web") {
      Alert.alert("No Video Selected", "Please select a video before submitting.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
    setVideoUri(null);
    setNote("");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Video Submissions</Text>

      {/* Past Submissions */}
      <SectionHeader title="Your Submissions" style={{ marginTop: 4 }} />
      {VIDEO_SUBMISSIONS.filter((v) => v.clientId === "u1").map((v) => (
        <AppCard key={v.id} style={styles.subCard}>
          <View style={styles.subRow}>
            <View style={[styles.subIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="videocam-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.subInfo}>
              <Text style={[styles.subExercise, { color: colors.foreground }]}>{v.exerciseName}</Text>
              <Text style={[styles.subDate, { color: colors.mutedForeground }]}>{new Date(v.submittedAt).toLocaleDateString()}</Text>
            </View>
            <Badge label={STATUS_LABEL[v.status]} color={STATUS_COLOR[v.status]} small />
          </View>
          {v.feedback && (
            <View style={[styles.feedbackBox, { backgroundColor: colors.muted, borderRadius: 8, marginTop: 10 }]}>
              <Text style={[styles.feedbackLabel, { color: colors.mutedForeground }]}>Trainer Feedback</Text>
              <Text style={[styles.feedbackText, { color: colors.foreground }]} numberOfLines={2}>{v.feedback}</Text>
            </View>
          )}
        </AppCard>
      ))}

      {submitted && (
        <AppCard style={[styles.successCard, { backgroundColor: colors.success + "15" }]}>
          <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
          <Text style={[styles.successText, { color: colors.success }]}>Video submitted! Your trainer will review it soon.</Text>
        </AppCard>
      )}

      {/* Submit New */}
      <SectionHeader title="Submit New Video" style={{ marginTop: 16 }} />

      <TouchableOpacity
        onPress={pickVideo}
        style={[styles.videoPicker, { backgroundColor: colors.card, borderColor: videoUri ? colors.primary : colors.border, borderRadius: colors.radius }]}
      >
        {videoUri ? (
          <View style={styles.videoSelected}>
            <Ionicons name="videocam" size={32} color={colors.primary} />
            <Text style={[styles.videoName, { color: colors.primary }]}>Video Selected</Text>
            <Text style={[styles.videoSub, { color: colors.mutedForeground }]}>Tap to change</Text>
          </View>
        ) : (
          <View style={styles.videoPrompt}>
            <Ionicons name="cloud-upload-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.videoPromptText, { color: colors.foreground }]}>Select Video</Text>
            <Text style={[styles.videoPromptSub, { color: colors.mutedForeground }]}>
              {Platform.OS === "web" ? "Video upload works on device" : "Tap to choose from your library"}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Exercise Picker */}
      <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>EXERCISE</Text>
      <TouchableOpacity
        onPress={() => setShowExPicker(!showExPicker)}
        style={[styles.exPicker, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}
      >
        <Text style={[styles.exPickerText, { color: colors.foreground }]}>{exercise}</Text>
        <Ionicons name={showExPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
      {showExPicker && (
        <AppCard style={styles.exDropdown} padding={0}>
          {EXERCISES.map((ex) => (
            <TouchableOpacity
              key={ex}
              onPress={() => { setExercise(ex); setShowExPicker(false); }}
              style={[styles.exOption, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.exOptionText, { color: exercise === ex ? colors.primary : colors.foreground }]}>{ex}</Text>
              {exercise === ex && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </AppCard>
      )}

      <AppInput label="Note for Trainer" placeholder="What should the trainer focus on?" value={note} onChangeText={setNote} multiline numberOfLines={3} style={{ marginTop: 16 }} />

      <AppButton title="Submit for Review" onPress={handleSubmit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 16 },
  subCard: { marginBottom: 10 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  subIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  subInfo: { flex: 1 },
  subExercise: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  subDate: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  feedbackBox: { padding: 10 },
  feedbackLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginBottom: 4 },
  feedbackText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  successCard: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  successText: { fontFamily: "Inter_500Medium", fontSize: 14, flex: 1 },
  videoPicker: { height: 140, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  videoSelected: { alignItems: "center", gap: 6 },
  videoName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  videoSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  videoPrompt: { alignItems: "center", gap: 6 },
  videoPromptText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  videoPromptSub: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  exPicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, height: 50, borderWidth: 1 },
  exPickerText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  exDropdown: { marginBottom: 4 },
  exOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  exOptionText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
