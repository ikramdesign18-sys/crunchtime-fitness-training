import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  type IRtcEngine,
  type IRtcEngineEventHandler,
  RenderModeType,
  RtcSurfaceView,
  VideoSourceType,
} from "react-native-agora";

import type { AgoraCallViewProps } from "@/components/video/types";
import { requestAgoraToken } from "@/lib/videoCallConfig";

async function requestMediaPermissions() {
  if (Platform.OS !== "android") return true;

  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);

  return (
    results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
    results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
  );
}

export default function AgoraCallView({ session, onEnd, onStateChange }: AgoraCallViewProps) {
  const engineRef = useRef<IRtcEngine | null>(null);
  const eventHandlerRef = useRef<IRtcEngineEventHandler | null>(null);
  const [localJoined, setLocalJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const [statusText, setStatusText] = useState("Connecting...");

  const endCall = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.leaveChannel();
      engine.stopPreview();
      if (eventHandlerRef.current) {
        engine.unregisterEventHandler(eventHandlerRef.current);
        eventHandlerRef.current = null;
      }
      engine.release();
      engineRef.current = null;
    }
    setLocalJoined(false);
    setRemoteUsers([]);
    onStateChange("ended", "Call ended.");
    onEnd();
  }, [onEnd, onStateChange]);

  useEffect(() => {
    let mounted = true;

    async function startCall() {
      onStateChange("connecting", "Connecting to Agora...");
      setStatusText("Connecting...");

      const permissionsGranted = await requestMediaPermissions();
      if (!permissionsGranted) {
        if (!mounted) return;
        setStatusText("Camera and microphone permissions are required.");
        onStateChange("permission-denied", "Camera and microphone permissions are required.");
        return;
      }

      const engine = createAgoraRtcEngine();
      engineRef.current = engine;
      engine.initialize({
        appId: session.appId,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      const eventHandler: IRtcEngineEventHandler = {
        onJoinChannelSuccess: () => {
          if (!mounted) return;
          setLocalJoined(true);
          setStatusText("Waiting for the other person...");
          onStateChange("waiting", "Waiting for the other person...");
        },
        onUserJoined: (_connection, remoteUid) => {
          if (!mounted) return;
          setRemoteUsers((prev) => (prev.includes(remoteUid) ? prev : [...prev, remoteUid]));
          setStatusText("Connected");
          onStateChange("connected", "Connected");
        },
        onUserOffline: (_connection, remoteUid) => {
          if (!mounted) return;
          setRemoteUsers((prev) => {
            const next = prev.filter((uid) => uid !== remoteUid);
            setStatusText(next.length ? "Connected" : "Waiting for the other person...");
            onStateChange(
              next.length ? "connected" : "waiting",
              next.length ? "Connected" : "Waiting for the other person...",
            );
            return next;
          });
        },
        onError: (err, msg) => {
          if (!mounted) return;
          const message = msg || `Agora error ${err}`;
          setStatusText(message);
          onStateChange("token-error", message);
        },
        onTokenPrivilegeWillExpire: async () => {
          const currentEngine = engineRef.current;
          if (!currentEngine) return;
          try {
            const nextToken = await requestAgoraToken({
              channelName: session.channelName,
              uid: session.uid,
              role: "publisher",
            });
            currentEngine.renewToken(nextToken.token);
          } catch (error) {
            onStateChange(
              "token-error",
              (error as Error).message || "Could not renew the Agora token.",
            );
          }
        },
      };
      eventHandlerRef.current = eventHandler;
      engine.registerEventHandler(eventHandler);

      engine.enableVideo();
      engine.startPreview();
      const joinResult = engine.joinChannel(session.token, session.channelName, session.uid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      if (joinResult < 0) {
        setStatusText(`Could not join Agora channel (${joinResult}).`);
        onStateChange("token-error", `Could not join Agora channel (${joinResult}).`);
      }
    }

    startCall().catch((error: unknown) => {
      if (!mounted) return;
      const message = (error as Error).message || "Could not start the Agora call.";
      setStatusText(message);
      onStateChange("token-error", message);
    });

    return () => {
      mounted = false;
      const engine = engineRef.current;
      if (engine) {
        engine.leaveChannel();
        engine.stopPreview();
        if (eventHandlerRef.current) {
          engine.unregisterEventHandler(eventHandlerRef.current);
          eventHandlerRef.current = null;
        }
        engine.release();
        engineRef.current = null;
      }
    };
  }, [onStateChange, session.appId, session.channelName, session.token, session.uid]);

  const toggleMute = () => {
    const next = !muted;
    engineRef.current?.muteLocalAudioStream(next);
    setMuted(next);
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    engineRef.current?.muteLocalVideoStream(next);
    engineRef.current?.enableLocalVideo(!next);
    setCameraOff(next);
  };

  const switchCamera = () => {
    engineRef.current?.switchCamera();
    setFrontCamera((current) => !current);
  };

  const primaryRemoteUid = remoteUsers[0];

  return (
    <View style={styles.container}>
      <View style={styles.remoteVideo}>
        {primaryRemoteUid ? (
          <RtcSurfaceView
            style={styles.videoSurface}
            canvas={{
              uid: primaryRemoteUid,
              renderMode: RenderModeType.RenderModeHidden,
            }}
          />
        ) : (
          <View style={styles.waiting}>
            <Ionicons name="person-circle-outline" size={88} color="rgba(255,255,255,0.26)" />
            <Text style={styles.waitingTitle}>Waiting for {session.participantLabel}</Text>
            <Text style={styles.waitingText}>Both people must join {session.channelName}</Text>
          </View>
        )}
      </View>

      <View style={styles.statusPill}>
        <View style={[styles.statusDot, { backgroundColor: remoteUsers.length ? "#22C55E" : "#F59E0B" }]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <View style={styles.localPreview}>
        {localJoined && !cameraOff ? (
          <RtcSurfaceView
            zOrderMediaOverlay
            style={styles.videoSurface}
            canvas={{
              uid: 0,
              sourceType: VideoSourceType.VideoSourceCameraPrimary,
              renderMode: RenderModeType.RenderModeHidden,
            }}
          />
        ) : (
          <View style={styles.cameraOff}>
            <Ionicons name="videocam-off-outline" size={24} color="rgba(255,255,255,0.65)" />
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          accessibilityLabel={muted ? "Unmute microphone" : "Mute microphone"}
          onPress={toggleMute}
          style={[styles.controlButton, muted && styles.activeDanger]}
        >
          <Ionicons name={muted ? "mic-off" : "mic-outline"} size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={cameraOff ? "Turn camera on" : "Turn camera off"}
          onPress={toggleCamera}
          style={[styles.controlButton, cameraOff && styles.activeDanger]}
        >
          <Ionicons name={cameraOff ? "videocam-off-outline" : "videocam-outline"} size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={frontCamera ? "Switch to back camera" : "Switch to front camera"}
          onPress={switchCamera}
          style={styles.controlButton}
        >
          <Ionicons name="camera-reverse-outline" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="End call" onPress={endCall} style={styles.endButton}>
          <Ionicons name="call" size={28} color="#FFF" style={styles.endIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  remoteVideo: { flex: 1, backgroundColor: "#111" },
  videoSurface: { width: "100%", height: "100%" },
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  waitingTitle: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    marginTop: 10,
    textAlign: "center",
  },
  waitingText: {
    color: "rgba(255,255,255,0.58)",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  statusPill: {
    position: "absolute",
    left: 16,
    top: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  localPreview: {
    position: "absolute",
    right: 16,
    top: 58,
    width: 108,
    height: 152,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cameraOff: { flex: 1, alignItems: "center", justifyContent: "center" },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingTop: 18,
    paddingBottom: 32,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  activeDanger: { backgroundColor: "#EF4444" },
  endButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  endIcon: { transform: [{ rotate: "135deg" }] },
});
