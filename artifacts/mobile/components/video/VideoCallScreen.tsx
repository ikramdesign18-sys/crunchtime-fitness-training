import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AgoraCallView from "@/components/video/AgoraCallView";
import type { AgoraCallSession, AgoraCallState } from "@/components/video/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  getApiBaseUrlErrorMessage,
  getVideoCallSetupMessage,
  isVideoCallConfigured,
  requestAgoraToken,
  videoCallSetupMessage,
} from "@/lib/videoCallConfig";

function asParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, session: authSession } = useAuth();
  const params = useLocalSearchParams<{
    bookingId?: string;
    clientName?: string;
    trainerName?: string;
  }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [callSession, setCallSession] = useState<AgoraCallSession | null>(null);
  const [state, setState] = useState<AgoraCallState>("connecting");
  const [message, setMessage] = useState("Preparing call...");
  const [connecting, setConnecting] = useState(false);
  const autoStartedRef = useRef(false);

  const updateState = useCallback((nextState: AgoraCallState, nextMessage?: string) => {
    setState(nextState);
    if (nextMessage) setMessage(nextMessage);
    if (nextState === "token-error") {
      setCallSession(null);
      setConnecting(false);
    }
  }, []);

  const resolveBooking = () => {
    if (!user) throw new Error("Please sign in before starting a video call.");

    const bookingId = asParam(params.bookingId).trim();
    if (!bookingId) {
      throw new Error("Open an accepted booking to join a video call.");
    }

    return {
      bookingId,
      participantLabel: asParam(params.clientName) || asParam(params.trainerName) || "the other person",
    };
  };

  const startCall = useCallback(async () => {
    if (!user) {
      setState("setup-missing");
      setMessage("Please sign in before starting a video call.");
      return;
    }

    if (!authSession?.access_token) {
      setState("setup-missing");
      setMessage("Please sign in again before starting a video call.");
      return;
    }

    const apiBaseUrlError = getApiBaseUrlErrorMessage();
    if (apiBaseUrlError) {
      setState("setup-missing");
      setMessage(apiBaseUrlError);
      return;
    }

    const videoCallSetupError = getVideoCallSetupMessage();
    if (videoCallSetupError) {
      setState("setup-missing");
      setMessage(videoCallSetupError);
      return;
    }

    setConnecting(true);
    setState("connecting");
    setMessage("Preparing call...");

    try {
      const target = resolveBooking();
      const tokenData = await requestAgoraToken({
        bookingId: target.bookingId,
        role: "publisher",
        accessToken: authSession.access_token,
      });
      setCallSession({
        ...tokenData,
        participantLabel: target.participantLabel,
        bookingId: target.bookingId,
        accessToken: authSession.access_token,
      });
      setMessage("Connecting...");
    } catch (error) {
      setState("token-error");
      setMessage((error as Error).message || "Could not start the video call.");
    } finally {
      setConnecting(false);
    }
  }, [authSession?.access_token, params.bookingId, params.clientName, params.trainerName, user]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    startCall();
  }, [startCall]);

  if (callSession) {
    return (
      <AgoraCallView
        session={callSession}
        onEnd={() => {
          setCallSession(null);
          router.back();
        }}
        onStateChange={updateState}
      />
    );
  }

  const canStart = isVideoCallConfigured && !connecting;
  const apiBaseUrlError = getApiBaseUrlErrorMessage();
  const videoCallSetupError = getVideoCallSetupMessage();
  const setupText =
    apiBaseUrlError ||
    videoCallSetupError ||
    (state === "setup-missing" || !isVideoCallConfigured
      ? videoCallSetupMessage
      : message || "Start a secure Agora video call.");

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
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={startCall}
          disabled={!canStart}
          style={[styles.startButton, { opacity: canStart ? 1 : 0.5 }]}
        >
          <Ionicons name={connecting ? "hourglass-outline" : "call-outline"} size={24} color="#FFF" />
          <Text style={styles.startText}>{connecting ? "Connecting" : "Retry Call"}</Text>
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
    backgroundColor: "#D4AF37",
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
