import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppCard from "@/components/ui/AppCard";
import AppInput from "@/components/ui/AppInput";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchWorkoutVideoById,
  saveTrainerWorkoutVideo,
  uploadWorkoutMedia,
  type TrainerWorkoutVideo,
  type WorkoutCategory,
  type WorkoutDifficulty,
} from "@/lib/supabaseApi";

const CATEGORIES: WorkoutCategory[] = ["Strength", "Cardio", "Full Body", "Weight Loss", "Muscle Gain", "Yoga"];
const DIFFICULTIES: WorkoutDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

type SaveMode = "draft" | "publish";

export default function TrainerWorkoutUploadScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const cancelRequested = useRef(false);

  const [existing, setExisting] = useState<TrainerWorkoutVideo | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tips, setTips] = useState("");
  const [commonMistakes, setCommonMistakes] = useState("");
  const [category, setCategory] = useState<WorkoutCategory>("Strength");
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty>("Beginner");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [exercises, setExercises] = useState("");
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [priceDollars, setPriceDollars] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastMode, setLastMode] = useState<SaveMode | null>(null);

  useEffect(() => {
    const id = typeof workoutId === "string" ? workoutId : "";
    if (!id) return;
    fetchWorkoutVideoById(id)
      .then((row) => {
        if (!row) return;
        setExisting(row);
        setTitle(row.title);
        setDescription(row.description);
        setInstructions(row.instructions ?? "");
        setTips(row.tips ?? "");
        setCommonMistakes(row.common_mistakes ?? "");
        setCategory(row.category);
        setDifficulty(row.difficulty);
        setDuration(String(row.duration));
        setCalories(String(row.calories));
        setExercises(String(row.exercises));
        setThumbnailUrl(row.thumbnail_url);
        setVideoUrl(row.video_url);
        setIsPaid(!!row.is_paid);
        setPriceDollars(row.price_cents ? String(Math.round(row.price_cents / 100)) : "");
      })
      .catch((error) => Alert.alert("Workout Load Failed", (error as Error).message));
  }, [workoutId]);

  const pickThumbnail = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Allow access to your media library to choose a thumbnail.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.78,
    });
    if (!result.canceled && result.assets.length > 0) {
      setThumbnailUri(result.assets[0].uri);
      setThumbnailUrl(null);
    }
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Allow access to your media library to choose a workout video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
      setVideoUrl(null);
    }
  };

  const validate = (mode: SaveMode) => {
    if (mode === "publish") {
      if (!title.trim()) return "Workout title is required.";
      if (!videoUri && !videoUrl) return "Pick a video before publishing.";
    }
    if (duration.trim() && Number(duration) < 0) return "Duration must be 0 or greater.";
    if (calories.trim() && Number(calories) < 0) return "Calories must be 0 or greater.";
    if (exercises.trim() && Number(exercises) < 0) return "Exercise count must be 0 or greater.";
    if (isPaid && (!priceDollars.trim() || Number(priceDollars) <= 0)) return "Add a price before marking this video as paid.";
    return null;
  };

  const ensureNotCanceled = () => {
    if (cancelRequested.current) {
      throw new Error("Upload canceled.");
    }
  };

  const save = async (mode: SaveMode) => {
    if (!user) return;
    const validationError = validate(mode);
    if (validationError) {
      Alert.alert("Missing Details", validationError);
      return;
    }

    cancelRequested.current = false;
    setLastMode(mode);
    setSaving(true);
    setUploadProgress(0.08);
    setStatusText("Preparing upload...");

    try {
      let nextThumbnailUrl = thumbnailUrl;
      let nextVideoUrl = videoUrl;

      if (thumbnailUri) {
        setStatusText("Uploading thumbnail...");
        setUploadProgress(0.3);
        nextThumbnailUrl = await uploadWorkoutMedia({ trainerId: user.id, uri: thumbnailUri, kind: "thumbnail" });
        ensureNotCanceled();
        setThumbnailUrl(nextThumbnailUrl);
        setThumbnailUri(null);
      }

      if (videoUri) {
        setStatusText("Uploading video...");
        setUploadProgress(0.68);
        nextVideoUrl = await uploadWorkoutMedia({ trainerId: user.id, uri: videoUri, kind: "video" });
        ensureNotCanceled();
        setVideoUrl(nextVideoUrl);
        setVideoUri(null);
      }

      setStatusText(mode === "publish" ? "Publishing workout..." : "Saving draft...");
      setUploadProgress(0.9);
      const saved = await saveTrainerWorkoutVideo(
        user.id,
        {
          title,
          description,
          instructions,
          tips,
          common_mistakes: commonMistakes,
          category,
          difficulty,
          duration: Number(duration) || 0,
          calories: Number(calories) || 0,
          exercises: Number(exercises) || 0,
          thumbnail_url: nextThumbnailUrl,
          video_url: nextVideoUrl,
          is_paid: isPaid,
          price_cents: isPaid ? Math.round(Number(priceDollars) * 100) : null,
          access_type: isPaid ? "paid" : "free",
          published: mode === "publish",
        },
        existing?.id ?? null
      );
      ensureNotCanceled();
      setExisting(saved);
      setUploadProgress(1);
      setStatusText(mode === "publish" ? "Workout published." : "Draft saved.");
      Alert.alert(mode === "publish" ? "Workout Published" : "Draft Saved", "Your workout video has been saved.");
    } catch (error) {
      setStatusText(`Upload failed. ${(error as Error).message || "Please try again."}`);
      Alert.alert("Save Failed", (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const cancelUpload = () => {
    cancelRequested.current = true;
    setSaving(false);
    setStatusText("Upload canceled.");
  };

  const retry = () => {
    if (lastMode) save(lastMode);
  };

  const thumbnailPreview = thumbnailUri ?? thumbnailUrl;
  const hasFailed = !!statusText && !saving && statusText.toLowerCase().includes("failed");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{existing ? "Edit Workout" : "Upload Workout"}</Text>
        <TouchableOpacity onPress={() => router.push("/(trainer)/workout-management" as any)} style={[styles.iconButton, { backgroundColor: colors.card }]}>
          <Ionicons name="list-outline" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 56) }]}
        >
          <AppInput label="Workout Title" value={title} onChangeText={setTitle} placeholder="Full Body Strength" autoCapitalize="words" />
          <AppInput label="Description" value={description} onChangeText={setDescription} placeholder="Describe the workout focus..." multiline numberOfLines={4} autoCapitalize="sentences" />
          <AppInput label="Instructions" value={instructions} onChangeText={setInstructions} placeholder="Add trainer instructions..." multiline numberOfLines={5} autoCapitalize="sentences" />
          <AppInput label="Tips" value={tips} onChangeText={setTips} placeholder="Add form tips..." multiline numberOfLines={4} autoCapitalize="sentences" />
          <AppInput label="Common Mistakes" value={commonMistakes} onChangeText={setCommonMistakes} placeholder="Add mistakes to avoid..." multiline numberOfLines={4} autoCapitalize="sentences" />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.chipWrap}>
            {CATEGORIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.chip, { backgroundColor: category === item ? colors.primary : colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.chipText, { color: category === item ? colors.primaryForeground : colors.mutedForeground }]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Difficulty</Text>
          <View style={styles.chipWrap}>
            {DIFFICULTIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => setDifficulty(item)}
                style={[styles.chip, { backgroundColor: difficulty === item ? colors.primary : colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.chipText, { color: difficulty === item ? colors.primaryForeground : colors.mutedForeground }]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.numberRow}>
            <AppInput label="Duration" value={duration} onChangeText={setDuration} placeholder="45" keyboardType="number-pad" style={styles.numberInput} />
            <AppInput label="Calories" value={calories} onChangeText={setCalories} placeholder="350" keyboardType="number-pad" style={styles.numberInput} />
            <AppInput label="Exercises" value={exercises} onChangeText={setExercises} placeholder="5" keyboardType="number-pad" style={styles.numberInput} />
          </View>

          <AppCard style={styles.mediaCard}>
            <View style={styles.mediaHeader}>
              <View style={styles.paidTextWrap}>
                <Text style={[styles.mediaTitle, { color: colors.foreground }]}>Video Pricing</Text>
                <Text style={[styles.mediaHint, { color: colors.mutedForeground }]}>Paid videos require purchase before viewing</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPaid((value) => !value)}
                style={[styles.mediaButton, { backgroundColor: isPaid ? colors.primaryLight : colors.muted }]}
              >
                <Ionicons
                  name={isPaid ? "lock-closed-outline" : "lock-open-outline"}
                  size={18}
                  color={isPaid ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.mediaButtonText, { color: isPaid ? colors.primary : colors.mutedForeground }]}>
                  {isPaid ? "Paid" : "Free"}
                </Text>
              </TouchableOpacity>
            </View>
            {isPaid ? (
              <AppInput
                label="Price"
                value={priceDollars}
                onChangeText={setPriceDollars}
                placeholder="8"
                keyboardType="number-pad"
                style={styles.priceInput}
              />
            ) : null}
          </AppCard>

          <AppCard style={styles.mediaCard}>
            <View style={styles.mediaHeader}>
              <View>
                <Text style={[styles.mediaTitle, { color: colors.foreground }]}>Thumbnail</Text>
                <Text style={[styles.mediaHint, { color: colors.mutedForeground }]}>16:9 image recommended</Text>
              </View>
              <TouchableOpacity onPress={pickThumbnail} style={[styles.mediaButton, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={[styles.mediaButtonText, { color: colors.primary }]}>{thumbnailPreview ? "Replace" : "Pick"}</Text>
              </TouchableOpacity>
            </View>
            {thumbnailPreview ? (
              <Image source={{ uri: thumbnailPreview }} style={[styles.thumbnail, { borderRadius: colors.radius }]} contentFit="cover" />
            ) : null}
          </AppCard>

          <AppCard style={styles.mediaCard}>
            <View style={styles.mediaHeader}>
              <View>
                <Text style={[styles.mediaTitle, { color: colors.foreground }]}>Workout Video</Text>
                <Text style={[styles.mediaHint, { color: colors.mutedForeground }]}>Required before publishing</Text>
              </View>
              <TouchableOpacity onPress={pickVideo} style={[styles.mediaButton, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="videocam-outline" size={18} color={colors.primary} />
                <Text style={[styles.mediaButtonText, { color: colors.primary }]}>{videoUri || videoUrl ? "Replace" : "Pick"}</Text>
              </TouchableOpacity>
            </View>
            {videoUri || videoUrl ? (
              <View style={[styles.videoSelected, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
                <Text style={[styles.videoSelectedText, { color: colors.foreground }]}>Video selected</Text>
              </View>
            ) : null}
          </AppCard>

          {saving || statusText ? (
            <AppCard style={styles.progressCard}>
              <Text style={[styles.statusText, { color: colors.foreground }]}>{statusText}</Text>
              <ProgressBar progress={uploadProgress} style={styles.progress} />
              <View style={styles.progressActions}>
                {saving ? (
                  <TouchableOpacity onPress={cancelUpload}>
                    <Text style={[styles.cancelText, { color: colors.destructive }]}>Cancel Upload</Text>
                  </TouchableOpacity>
                ) : hasFailed && lastMode ? (
                  <TouchableOpacity onPress={retry}>
                    <Text style={[styles.retryText, { color: colors.primary }]}>Retry Failed Upload</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </AppCard>
          ) : null}

          <View style={styles.buttonRow}>
            <AppButton title="Save Draft" onPress={() => save("draft")} variant="outline" loading={saving && lastMode === "draft"} disabled={saving} style={styles.button} />
            <AppButton title="Publish Workout" onPress={() => save("publish")} loading={saving && lastMode === "publish"} disabled={saving} style={styles.button} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 22 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  numberRow: { flexDirection: "row", gap: 8 },
  numberInput: { flex: 1 },
  mediaCard: { marginBottom: 12 },
  mediaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  mediaTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  mediaHint: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  paidTextWrap: { flex: 1 },
  mediaButton: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  mediaButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  priceInput: { marginTop: 14, marginBottom: 0 },
  thumbnail: { width: "100%", aspectRatio: 16 / 9, marginTop: 12 },
  videoSelected: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginTop: 12 },
  videoSelectedText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  progressCard: { marginBottom: 12 },
  statusText: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 10 },
  progress: { marginBottom: 8 },
  progressActions: { minHeight: 20 },
  cancelText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  retryText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  buttonRow: { flexDirection: "row", gap: 10 },
  button: { flex: 1 },
});
