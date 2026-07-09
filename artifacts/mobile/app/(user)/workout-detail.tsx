import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import AppCard from "@/components/ui/AppCard";
import InlineVideoPlayer from "@/components/video/InlineVideoPlayer";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  createWorkoutVideoCheckout,
  fetchPricingConfig,
  fetchWorkoutVideoContent,
  openStripeUrl,
  type ContentAccessStatus,
} from "@/lib/paymentApi";
import { formatPrice, mergePricingConfig, type PricingConfigItem } from "@/lib/paymentConfig";
import { fetchWorkoutVideoById } from "@/lib/supabaseApi";
import { type CatalogWorkout, workoutVideoToCatalogWorkout } from "@/lib/workoutCatalog";

export default function WorkoutDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [workout, setWorkout] = useState<CatalogWorkout | null>(null);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [contentAccess, setContentAccess] = useState<ContentAccessStatus | null>(null);
  const [pricingRows, setPricingRows] = useState<PricingConfigItem[]>([]);
  const [unlocking, setUnlocking] = useState(false);
  const pricing = mergePricingConfig(pricingRows);

  const loadWorkout = async () => {
    if (!workoutId) return;
    setThumbnailFailed(false);

    if (session?.access_token) {
      try {
        const result = await fetchWorkoutVideoContent({
          accessToken: session.access_token,
          workoutVideoId: workoutId,
        });
        setWorkout(result.workout?.published ? workoutVideoToCatalogWorkout(result.workout) : null);
        setContentAccess(result.contentAccess ?? null);
        return;
      } catch {
        setContentAccess(null);
      }
    }

    fetchWorkoutVideoById(workoutId)
      .then((row) => setWorkout(row?.published ? workoutVideoToCatalogWorkout(row) : null))
      .catch(() => setWorkout(null));
  };

  useEffect(() => {
    loadWorkout();
  }, [session?.access_token, workoutId]);

  useEffect(() => {
    fetchPricingConfig()
      .then(setPricingRows)
      .catch(() => setPricingRows([]));
  }, []);

  const startWorkout = () => {
    if (!workout) return;
    if (workout.isPaid && !contentAccess?.hasAccess) {
      Alert.alert("Video Locked", "Unlock this premium workout video before starting.");
      return;
    }
    router.push({ pathname: "/(user)/active-workout", params: { workoutId: workout.id } });
  };

  const unlockVideo = async () => {
    if (!workout || !session?.access_token) {
      Alert.alert("Sign In Required", "Please sign in before unlocking this video.");
      return;
    }
    setUnlocking(true);
    try {
      const checkout = await createWorkoutVideoCheckout({
        accessToken: session.access_token,
        workoutVideoId: workout.id,
      });
      await openStripeUrl(checkout.url!);
      await loadWorkout();
      Alert.alert("Unlock Processing", "Stripe will confirm the video unlock shortly.");
    } catch (error) {
      Alert.alert("Unlock Failed", (error as Error).message);
    } finally {
      setUnlocking(false);
    }
  };

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={["#D4AF37", "#6F5614"]} style={[styles.hero, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.empty}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Workout not found</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>This workout is not available.</Text>
        </View>
      </View>
    );
  }

  const hasVideoAccess = !workout.isPaid || !!contentAccess?.hasAccess;
  const videoPriceCents = workout.priceCents ?? pricing.premium_workout_video.amount_cents;
  const videoCurrency = pricing.premium_workout_video.currency;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <LinearGradient colors={["#D4AF37", "#6F5614"]} style={[styles.hero, { paddingTop: topPad + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              {workout.thumbnailUrl && !thumbnailFailed ? (
                <Image source={{ uri: workout.thumbnailUrl }} style={styles.heroImage} contentFit="cover" onError={() => setThumbnailFailed(true)} />
              ) : (
                <Ionicons name="barbell-outline" size={48} color="rgba(255,255,255,0.9)" />
              )}
            </View>
            <Text style={styles.heroTitle}>{workout.title}</Text>
            <Text style={styles.heroGoal}>{workout.goal}</Text>
          </View>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadgeItem}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{workout.duration} min</Text>
            </View>
            <View style={styles.heroBadgeItem}>
              <Ionicons name="flame-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{workout.calories} cal</Text>
            </View>
            <View style={styles.heroBadgeItem}>
              <Ionicons name="fitness-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{workout.difficulty}</Text>
            </View>
            <View style={styles.heroBadgeItem}>
              <Ionicons name="list-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBadgeText}>{workout.exerciseCount} exercises</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {workout.description.trim() ? (
            <Text style={[styles.description, { color: colors.foreground }]}>{workout.description}</Text>
          ) : null}

          {workout.videoUrl && hasVideoAccess ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Workout Video</Text>
              <InlineVideoPlayer videoUrl={workout.videoUrl} title={workout.title} style={styles.video} />
            </>
          ) : workout.isPaid && !hasVideoAccess ? (
            <AppCard style={styles.lockedCard}>
              <View style={styles.lockedHeader}>
                <View style={[styles.lockIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.lockCopy}>
                  <Text style={[styles.lockTitle, { color: colors.foreground }]}>Premium workout video</Text>
                  <Text style={[styles.lockText, { color: colors.mutedForeground }]}>
                    Unlock this video separately for {formatPrice(videoPriceCents, videoCurrency)}.
                  </Text>
                </View>
              </View>
              <AppButton title="Unlock Video" onPress={unlockVideo} loading={unlocking} style={styles.unlockButton} />
            </AppCard>
          ) : null}

          {workout.instructions?.trim() ? (
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Instructions</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>{workout.instructions}</Text>
            </AppCard>
          ) : null}

          {workout.tips?.trim() ? (
            <AppCard style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tips</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>{workout.tips}</Text>
            </AppCard>
          ) : null}

          {workout.commonMistakes?.trim() ? (
            <AppCard style={[styles.section, { borderLeftWidth: 3, borderLeftColor: colors.destructive }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={18} color={colors.destructive} />
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Common Mistakes</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>{workout.commonMistakes}</Text>
            </AppCard>
          ) : null}
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
        <AppButton
          title={workout.isPaid && !hasVideoAccess ? "Unlock Video" : "Start Workout"}
          onPress={workout.isPaid && !hasVideoAccess ? unlockVideo : startWorkout}
          loading={unlocking}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 28 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroContent: { alignItems: "center", marginBottom: 20 },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFF", textAlign: "center" },
  heroGoal: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  heroBadges: { flexDirection: "row", justifyContent: "center", gap: 16, flexWrap: "wrap" },
  heroBadgeItem: { alignItems: "center", gap: 4 },
  heroBadgeText: { color: "rgba(255,255,255,0.9)", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  body: { padding: 16 },
  description: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 24, marginBottom: 18, opacity: 0.8 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 12 },
  video: { marginBottom: 16 },
  lockedCard: { marginBottom: 16 },
  lockedHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  lockIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lockCopy: { flex: 1 },
  lockTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  lockText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 2 },
  unlockButton: { marginTop: 14 },
  section: { marginBottom: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, opacity: 0.85 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exNumber: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  exNumText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  exInfo: { flex: 1 },
  exName: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginBottom: 2 },
  exMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  empty: { padding: 16, alignItems: "center", gap: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
});
