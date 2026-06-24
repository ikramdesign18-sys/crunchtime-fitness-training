import React, { useRef, useState } from "react";
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

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [messages, setMessages] = useState<ChatMessage[]>([...CHAT_MESSAGES].reverse());
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      senderId: "u1",
      senderName: "You",
      text: text.trim(),
      timestamp: new Date().toISOString(),
      type: "user",
    };
    setMessages((prev) => [msg, ...prev]);
    setText("");
  };

  const fmtTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.type === "user";
    const showName = !isUser && (index === messages.length - 1 || messages[index + 1]?.type === "user");
    return (
      <View style={[styles.msgWrap, isUser ? styles.msgRight : styles.msgLeft]}>
        {!isUser && showName && (
          <Text style={[styles.senderName, { color: colors.mutedForeground }]}>{item.senderName}</Text>
        )}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser ? colors.primary : colors.card,
              borderRadius: 18,
              borderBottomRightRadius: isUser ? 4 : 18,
              borderBottomLeftRadius: isUser ? 18 : 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        >
          <Text style={[styles.msgText, { color: isUser ? "#FFF" : colors.foreground }]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>{fmtTime(item.timestamp)}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.trainerInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>CM</Text>
          </View>
          <View>
            <Text style={[styles.trainerName, { color: colors.foreground }]}>Coach Marcus</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.mutedForeground }]}>Online</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}} style={[styles.callBtn, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="call-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        <View
          style={[
            styles.inputBar,
            { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 8 },
          ]}
        >
          <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="attach-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message your trainer..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.input, color: colors.foreground }]}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={send}
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          >
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  trainerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  trainerName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  callBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 12, paddingVertical: 16, gap: 12 },
  msgWrap: { maxWidth: "80%", gap: 4 },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end" },
  senderName: { fontFamily: "Inter_500Medium", fontSize: 11, marginBottom: 2, paddingLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10 },
  msgText: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 },
  msgTime: { fontFamily: "Inter_400Regular", fontSize: 10, paddingHorizontal: 4 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  attachBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Inter_400Regular", fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
