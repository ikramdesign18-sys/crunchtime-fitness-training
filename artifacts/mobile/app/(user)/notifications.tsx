import React, { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/supabaseApi";

const ICON_MAP = {
  workout: { name: "barbell-outline" as const, color: "#D66433" },
  meal: { name: "restaurant-outline" as const, color: "#22C55E" },
  booking: { name: "calendar-outline" as const, color: "#3B82F6" },
  message: { name: "chatbubbles-outline" as const, color: "#8B5CF6" },
  video: { name: "videocam-outline" as const, color: "#F59E0B" },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(setNotifications).catch(() => {});
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsRead(user.id).catch(() => {});
  };
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const today = notifications.filter((n) => {
    const d = new Date(n.created_at);
    return d.toDateString() === new Date().toDateString();
  });
  const earlier = notifications.filter((n) => !today.some((t) => t.id === n.id));

  const renderNotif = (notif: AppNotification) => {
    const icon = ICON_MAP[notif.type];
    return (
      <TouchableOpacity
        key={notif.id}
        onPress={() => {
          setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
          markNotificationRead(notif.id).catch(() => {});
        }}
        style={[
          styles.notifItem,
          {
            backgroundColor: notif.is_read ? colors.background : colors.primaryLight,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: icon.color + "20" }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifTitle, { color: colors.foreground }]}>{notif.title}</Text>
          <Text style={[styles.notifBody, { color: colors.mutedForeground }]} numberOfLines={2}>{notif.body}</Text>
          <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
            {new Date(notif.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {!notif.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {today.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TODAY</Text>
            {today.map(renderNotif)}
          </>
        )}
        {earlier.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EARLIER</Text>
            {earlier.map(renderNotif)}
          </>
        )}
        {notifications.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  markAll: { fontFamily: "Inter_500Medium", fontSize: 14 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 10 },
  notifItem: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 3 },
  notifBody: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  notifTime: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
