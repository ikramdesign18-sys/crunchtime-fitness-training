import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";

export default function VideoCallScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [inCall, setInCall] = useState(false);

  return (
    <View style={styles.container}>
      {/* Trainer video area */}
      <View style={styles.trainerVideo}>
        <View style={styles.trainerAvatar}>
          <Ionicons name="person-circle-outline" size={80} color="rgba(255,255,255,0.3)" />
          <Text style={styles.trainerLabel}>Coach Marcus</Text>
        </View>
        <Text style={styles.callStatus}>{inCall ? "In Call" : "Connecting..."}</Text>
      </View>

      {/* Self preview */}
      <View style={[styles.selfPreview, { top: topPad + 20 }]}>
        {cameraOff ? (
          <View style={styles.selfOff}>
            <Ionicons name="videocam-off-outline" size={20} color="rgba(255,255,255,0.5)" />
          </View>
        ) : (
          <View style={styles.selfCamera}>
            <Ionicons name="person-outline" size={28} color="rgba(255,255,255,0.4)" />
          </View>
        )}
      </View>

      {/* Notice */}
      <View style={[styles.notice, { backgroundColor: "rgba(0,0,0,0.6)", bottom: botPad + 110 }]}>
        <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
        <Text style={styles.noticeText}>
          Live video requires Agora / Stream SDK integration
        </Text>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: botPad + 24 }]}>
        <TouchableOpacity
          onPress={() => setMuted(!muted)}
          style={[styles.controlBtn, { backgroundColor: muted ? "#EF4444" : "rgba(255,255,255,0.15)" }]}
        >
          <Ionicons name={muted ? "mic-off" : "mic-outline"} size={22} color="#FFF" />
        </TouchableOpacity>

        {inCall ? (
          <TouchableOpacity
            onPress={() => { setInCall(false); router.back(); }}
            style={styles.endCallBtn}
          >
            <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: "135deg" }] }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setInCall(true)}
            style={styles.startCallBtn}
          >
            <Ionicons name="call-outline" size={28} color="#FFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setCameraOff(!cameraOff)}
          style={[styles.controlBtn, { backgroundColor: cameraOff ? "#EF4444" : "rgba(255,255,255,0.15)" }]}
        >
          <Ionicons name={cameraOff ? "videocam-off-outline" : "videocam-outline"} size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { top: topPad + 16 }]}
      >
        <Ionicons name="chevron-back" size={22} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  trainerVideo: { flex: 1, alignItems: "center", justifyContent: "center" },
  trainerAvatar: { alignItems: "center", gap: 10 },
  trainerLabel: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium", fontSize: 16 },
  callStatus: { color: "rgba(255,255,255,0.4)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8 },
  selfPreview: { position: "absolute", right: 16, width: 90, height: 130, borderRadius: 14, backgroundColor: "#2A2A2A", overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },
  selfOff: { alignItems: "center", justifyContent: "center" },
  selfCamera: { alignItems: "center", justifyContent: "center" },
  notice: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  noticeText: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", fontSize: 11, flex: 1 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingTop: 20, backgroundColor: "rgba(0,0,0,0.5)" },
  controlBtn: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  endCallBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
  startCallBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
});
