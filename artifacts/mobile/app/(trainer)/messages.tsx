import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/ui/Avatar";
import { useColors } from "@/hooks/useColors";
import { CLIENTS, CHAT_MESSAGES } from "@/lib/dummyData";

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const lastMsg = CHAT_MESSAGES[CHAT_MESSAGES.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {CLIENTS.map((client, i) => (
          <TouchableOpacity
            key={client.id}
            onPress={() => router.push({ pathname: "/(trainer)/chat-detail", params: { clientId: client.id, clientName: client.name } })}
            style={[styles.convoItem, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
          >
            <View style={styles.avatarWrap}>
              <Avatar name={client.name} size={48} />
              {i === 0 && <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />}
            </View>
            <View style={styles.convoContent}>
              <View style={styles.convoTop}>
                <Text style={[styles.convoName, { color: colors.foreground }]}>{client.name}</Text>
                <Text style={[styles.convoTime, { color: colors.mutedForeground }]}>
                  {i === 0 ? "10m ago" : `${i + 1}h ago`}
                </Text>
              </View>
              <View style={styles.convoBottom}>
                <Text style={[styles.convoLast, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {i === 0 ? lastMsg.text : `Last message from ${client.name.split(" ")[0]}`}
                </Text>
                {i === 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.unreadText}>1</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26 },
  list: {},
  convoItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  avatarWrap: { position: "relative" },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#FFF" },
  convoContent: { flex: 1 },
  convoTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  convoName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  convoTime: { fontFamily: "Inter_400Regular", fontSize: 12 },
  convoBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoLast: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  unreadText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 11 },
});
