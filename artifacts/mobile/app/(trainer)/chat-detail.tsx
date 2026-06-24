import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { CHAT_MESSAGES, type ChatMessage } from "@/lib/dummyData";

export default function ChatDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clientId, clientName } = useLocalSearchParams<{ clientId: string; clientName: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [messages, setMessages] = useState<ChatMessage[]>([...CHAT_MESSAGES].reverse());
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      senderId: "t1",
      senderName: "Coach Marcus",
      text: text.trim(),
      timestamp: new Date().toISOString(),
      type: "trainer",
    };
    setMessages((prev) => [msg, ...prev]);
    setText("");
  };

  const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.clientName, { color: colors.foreground }]}>{clientName ?? "Client"}</Text>
        <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="call-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isTrainer = item.type === "trainer";
            return (
              <View style={[styles.msgWrap, isTrainer ? styles.msgRight : styles.msgLeft]}>
                <View style={[styles.bubble, { backgroundColor: isTrainer ? colors.primary : colors.card, borderRadius: 18, borderBottomRightRadius: isTrainer ? 4 : 18, borderBottomLeftRadius: isTrainer ? 18 : 4 }]}>
                  <Text style={[styles.msgText, { color: isTrainer ? "#FFF" : colors.foreground }]}>{item.text}</Text>
                </View>
                <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>{fmtTime(item.timestamp)}</Text>
              </View>
            );
          }}
        />
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 8 }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.input, color: colors.foreground }]}
            multiline
          />
          <TouchableOpacity onPress={send} style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}>
            <Ionicons name="send" size={16} color={text.trim() ? "#FFF" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 16, flex: 1 },
  callBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 12, paddingVertical: 16, gap: 10 },
  msgWrap: { maxWidth: "80%", gap: 4 },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end" },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  msgText: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  msgTime: { fontFamily: "Inter_400Regular", fontSize: 10, paddingHorizontal: 4 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
