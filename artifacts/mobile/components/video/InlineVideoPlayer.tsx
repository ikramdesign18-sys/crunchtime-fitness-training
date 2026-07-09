import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface InlineVideoPlayerProps {
  videoUrl?: string | null;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export default function InlineVideoPlayer({ videoUrl, title, style }: InlineVideoPlayerProps) {
  const colors = useColors();
  const source = useMemo(() => (videoUrl ? { uri: videoUrl } : null), [videoUrl]);
  const player = useVideoPlayer(source, (nextPlayer) => {
    nextPlayer.loop = false;
    nextPlayer.allowsExternalPlayback = false;
    nextPlayer.staysActiveInBackground = false;
  });
  const statusChange = useEvent(player, "statusChange", { status: player.status });
  const status = statusChange?.status ?? player.status;
  const errorMessage = statusChange && "error" in statusChange ? statusChange.error?.message : undefined;

  if (!videoUrl) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.muted, borderRadius: colors.radius }, style]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Video unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000", borderRadius: colors.radius }, style]}>
      <VideoView
        player={player}
        nativeControls
        allowsFullscreen
        allowsPictureInPicture={false}
        contentFit="contain"
        style={styles.video}
      />
      {status === "loading" || status === "idle" ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color="#FFF" />
          <Text style={styles.overlayText}>{title ? `Loading ${title}` : "Loading video"}</Text>
        </View>
      ) : null}
      {status === "error" ? (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>{errorMessage ?? "This video could not be played."}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", aspectRatio: 16 / 9, overflow: "hidden" },
  video: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 16,
  },
  overlayText: { color: "rgba(255,255,255,0.78)", fontFamily: "Inter_500Medium", fontSize: 13 },
  errorText: { color: "#FFF", fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" },
  empty: { width: "100%", aspectRatio: 16 / 9, alignItems: "center", justifyContent: "center", padding: 16 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 13 },
});
