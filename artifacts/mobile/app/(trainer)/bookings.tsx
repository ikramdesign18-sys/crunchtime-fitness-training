import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useColors } from "@/hooks/useColors";
import { BOOKINGS, type Booking } from "@/lib/dummyData";

type Filter = "All" | "pending" | "accepted" | "declined";
const FILTERS: Filter[] = ["All", "pending", "accepted", "declined"];
const STATUS_LABEL = { pending: "Pending", accepted: "Accepted", declined: "Declined" };
const STATUS_COLOR = { pending: "warning", accepted: "success", declined: "error" } as const;

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState<Filter>("All");
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);

  const filtered = filter === "All" ? bookings : bookings.filter((b) => b.status === filter);

  const updateStatus = (id: string, status: "accepted" | "declined") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Bookings</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, { backgroundColor: filter === f ? colors.primary : colors.card, borderRadius: 100 }]}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#FFF" : colors.mutedForeground }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No bookings</Text>
          </View>
        ) : (
          filtered.map((booking) => (
            <AppCard key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingTop}>
                <Avatar name={booking.clientName} size={40} />
                <View style={styles.bookingInfo}>
                  <Text style={[styles.clientName, { color: colors.foreground }]}>{booking.clientName}</Text>
                  <Text style={[styles.sessionType, { color: colors.primary }]}>{booking.sessionType}</Text>
                </View>
                <Badge label={STATUS_LABEL[booking.status]} color={STATUS_COLOR[booking.status]} small />
              </View>
              <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{booking.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{booking.time}</Text>
                </View>
              </View>
              {booking.note ? (
                <Text style={[styles.note, { color: colors.mutedForeground }]}>{booking.note}</Text>
              ) : null}
              {booking.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => updateStatus(booking.id, "declined")}
                    style={[styles.actionBtn, { backgroundColor: "#FEE2E2", borderRadius: colors.radius }]}
                  >
                    <Ionicons name="close-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: "#EF4444" }]}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateStatus(booking.id, "accepted")}
                    style={[styles.actionBtn, { backgroundColor: "#DCFCE7", borderRadius: colors.radius, flex: 1.5 }]}
                  >
                    <Ionicons name="checkmark-outline" size={18} color="#16A34A" />
                    <Text style={[styles.actionText, { color: "#16A34A" }]}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            </AppCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 12 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8 },
  filterText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  bookingCard: {},
  bookingTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  bookingInfo: { flex: 1 },
  clientName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sessionType: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 16, paddingTop: 10, borderTopWidth: 1, marginBottom: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  note: { fontFamily: "Inter_400Regular", fontSize: 13, fontStyle: "italic", marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 4 },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
