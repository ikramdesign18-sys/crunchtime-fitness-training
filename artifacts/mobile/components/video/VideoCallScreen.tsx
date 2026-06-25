import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AgoraCallView from "@/components/video/AgoraCallView";
import type { AgoraCallSession, AgoraCallState } from "@/components/video/types";
import { useAuth } from "@/contexts/AuthContext";
import { findTrainerProfile } from "@/lib/supabaseApi";
import {
  isVideoCallConfigured,
  requestAgoraToken,
  VIDEO_CALL_PROVIDER,
  videoCallSetupMessage,
} from "@/lib/videoCallConfig";

function uidFromUserId(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return Math.max(1, hash);
}

function asParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    bookingId?: string;
    clientId?: string;
    clientName?: string;
    trainerId?: string;
    trainerName?: string;
  }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [session, setSession] = useState<AgoraCallSession | null>(null);
  const [state, setState] = useState<AgoraCallState>("connecting");
  const [message, setMessage] = useState("");
  const [connecting, setConnecting] = useState(false);

  const updateState = useCallback((nextState: AgoraCallState, nextMessage?: string) => {
    setState(nextState);
    if (nextMessage) setMessage(nextMessage);
  }, []);

  const resolveChannel = async () => {
    if (!user) throw new Error("Please sign in before starting a video call.");

    const bookingId = asParam(params.bookingId).trim();
    if (bookingId) {
      return {
        channelName: `booking-${bookingId}`,
        participantLabel: asParam(params.clientName) || asParam(params.trainerName) || "the other person",
      };
    }

    if (user.role === "trainer" || user.role === "admin") {
      const clientId = asParam(params.clientId).trim();
      if (!clientId) {
        throw new Error("Open a client chat or booking first so the trainer joins the same call channel.");
      }
      return {
        channelName: `call-${clientId}-${user.id}`,
        participantLabel: asParam(params.clientName) || "client",
      };
    }

    const trainerId = asParam(params.trainerId).trim();
    if (trainerId) {
      return {
        channelName: `call-${user.id}-${trainerId}`,
        participantLabel: asParam(params.trainerName) || "trainer",
      };
    }

    const trainer = await findTrainerProfile();
    return {
      channelName: `call-${user.id}-${trainer.id}`,
      participantLabel: trainer.full_name || "trainer",
    };
  };

  const startCall = async () => {
    if (!user) {
      setState("setup-missing");
      setMessage("Please sign in before starting a video call.");
      return;
    }

    if (!isVideoCallConfigured) {
      setState("setup-missing");
      setMessage(videoCallSetupMessage);
      return;
    }

    setConnecting(true);
    setState("connecting");
    setMessage("Requesting secure Agora token...");

    try {
      const target = await resolveChannel();
      const tokenData = await requestAgoraToken({
        channelName: target.channelName,
        uid: uidFromUserId(user.id),
        role: "publisher",
      });
      setSession({
        ...tokenData,
        participantLabel: target.participantLabel,
      });
      setMessage("Token ready. Joining call...");
    } catch (error) {
      setState("token-error");
      setMessage((error as Error).message || "Could not start the video call.");
    } finally {
      setConnecting(false);
    }
  };

  if (session) {
    return (
      <AgoraCallView
        session={session}
        onEnd={() => {
          setSession(null);
          router.back();
        }}
        onStateChange={updateState}
      />
    );
  }

  const canStart = isVideoCallConfigured && !connecting;
  const setupText =
    state === "setup-missing" || !isVideoCallConfigured
      ? videoCallSetupMessage
      : message || "Start a secure Agora video call.";

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { top: topPad + 16 }]}>
        <Ionicons name="chevron-back" size={22} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="videocam-outline" size={42} color="#FFF" />
        </View>
        <Text style={styles.title}>Video Call</Text>
        <Text style={styles.subtitle}>{setupText}</Text>
        <View style={styles.metaPanel}>
          <Text style={styles.metaLabel}>Provider</Text>
          <Text style={styles.metaValue}>{VIDEO_CALL_PROVIDER || "Not configured"}</Text>
          <Text style={styles.metaLabel}>Channel</Text>
          <Text style={styles.metaValue}>
            Direct calls use call-user-trainer. Booking calls use booking-bookingId.
          </Text>
        </View>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={startCall}
          disabled={!canStart}
          style={[styles.startButton, { opacity: canStart ? 1 : 0.5 }]}
        >
          <Ionicons name={connecting ? "hourglass-outline" : "call-outline"} size={24} color="#FFF" />
          <Text style={styles.startText}>{connecting ? "Connecting" : "Start Call"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D66433",
  },
  title: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    marginTop: 22,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: "center",
  },
  metaPanel: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
    marginTop: 22,
    gap: 5,
  },
  metaLabel: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
  },
  metaValue: {
    color: "rgba(255,255,255,0.86)",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  errorText: {
    color: "#FCA5A5",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 14,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#22C55E",
  },
  startText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 16 },
});
