import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AgoraCallViewProps } from "@/components/video/types";

export default function AgoraCallView({ onEnd }: AgoraCallViewProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="phone-portrait-outline" size={64} color="rgba(255,255,255,0.35)" />
      <Text style={styles.title}>Development build required</Text>
      <Text style={styles.text}>
        Native Agora video calls cannot run in Expo Go or the web preview. Use an Expo
        Development Build, APK, or EAS build to test live camera and microphone video.
      </Text>
      <TouchableOpacity onPress={onEnd} style={styles.endButton}>
        <Ionicons name="call" size={24} color="#FFF" style={styles.endIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F0F0F",
    paddingHorizontal: 28,
  },
  title: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginTop: 18,
    textAlign: "center",
  },
  text: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: "center",
  },
  endButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    marginTop: 28,
  },
  endIcon: { transform: [{ rotate: "135deg" }] },
});
