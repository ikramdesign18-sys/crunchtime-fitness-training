import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/ui/AppCard";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { markBookingPaymentStatus } from "@/lib/paymentApi";
import { formatPrice } from "@/lib/paymentConfig";
import {
  fetchTrainerBookings,
  updateBookingStatus,
  type Booking,
} from "@/lib/supabaseApi";

type Filter = "All" | "pending" | "accepted" | "declined";
const FILTERS: Filter[] = ["All", "pending", "accepted", "declined"];
const STATUS_LABEL = { pending: "Pending", accepted: "Accepted", declined: "Declined" };
const STATUS_COLOR = { pending: "warning", accepted: "success", declined: "error" } as const;

function isCallReadyPaymentStatus(status: Booking["payment_status"]) {
  return status === "paid" || status === "free_promo" || status === "waived";
}

function canMarkFreePromo(booking: Booking) {
  return (
    booking.status !== "declined" &&
    (booking.payment_status === "unpaid" ||
      booking.payment_status === "pending" ||
      booking.payment_status === "failed" ||
      !booking.payment_status)
  );
}

function getBookingPaymentLabel(booking: Booking) {
  if (booking.payment_status === "free_promo") return "Free Promo Booking";
  if (booking.payment_status === "waived") return "Payment Waived";
  if (booking.payment_status === "paid") {
    return `Paid${booking.amount_paid ? ` · ${formatPrice(booking.amount_paid)}` : ""}`;
  }
  if (booking.payment_status === "failed") return "Payment Failed";
  if (booking.payment_status === "refunded") return "Refunded";
  return "Unpaid";
}

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, session } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [filter, setFilter] = useState<Filter>("All");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [markingFreeId, setMarkingFreeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTrainerBookings(user.id).then(setBookings).catch(() => {});
  }, [user]);

  const filtered = filter === "All" ? bookings : bookings.filter((b) => b.status === filter);

  const updateStatus = async (booking: Booking, status: "accepted" | "declined") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBookings((prev) => prev.map((b) => b.id === booking.id ? { ...b, status } : b));
    try {
      await updateBookingStatus(booking, status);
    } catch {
      fetchTrainerBookings(booking.trainer_id).then(setBookings).catch(() => {});
    }
  };

  const markFreePromo = async (booking: Booking) => {
    if (!session?.access_token) {
      Alert.alert("Sign In Required", "Please sign in again before marking a booking free.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMarkingFreeId(booking.id);
    try {
      await markBookingPaymentStatus({
        accessToken: session.access_token,
        bookingId: booking.id,
        paymentStatus: "free_promo",
      });
      fetchTrainerBookings(booking.trainer_id).then(setBookings).catch(() => {});
    } catch (error) {
      Alert.alert("Could Not Mark Free", (error as Error).message);
    } finally {
      setMarkingFreeId(null);
    }
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
                <Avatar name={booking.clientName ?? "Client"} size={40} />
                <View style={styles.bookingInfo}>
                  <Text style={[styles.clientName, { color: colors.foreground }]}>{booking.clientName ?? "Client"}</Text>
                  <Text style={[styles.sessionType, { color: colors.primary }]}>{booking.session_type}</Text>
                </View>
                <Badge label={STATUS_LABEL[booking.status]} color={STATUS_COLOR[booking.status]} small />
              </View>
              <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{booking.session_date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{booking.session_time}</Text>
                </View>
                {booking.payment_status ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="card-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {getBookingPaymentLabel(booking)}
                    </Text>
                  </View>
                ) : null}
              </View>
              {booking.note ? (
                <Text style={[styles.note, { color: colors.mutedForeground }]}>{booking.note}</Text>
              ) : null}
              {booking.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => updateStatus(booking, "declined")}
                    style={[styles.actionBtn, { backgroundColor: "#FEE2E2", borderRadius: colors.radius }]}
                  >
                    <Ionicons name="close-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionText, { color: "#EF4444" }]}>Decline</Text>
                  </TouchableOpacity>
                  {canMarkFreePromo(booking) ? (
                    <TouchableOpacity
                      onPress={() => markFreePromo(booking)}
                      disabled={markingFreeId === booking.id}
                      style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderRadius: colors.radius, flex: 1.3 }]}
                    >
                      <Ionicons name="gift-outline" size={18} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>
                        {markingFreeId === booking.id ? "Marking" : "Mark Free"}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {isCallReadyPaymentStatus(booking.payment_status) ? (
                    <TouchableOpacity
                      onPress={() => updateStatus(booking, "accepted")}
                      style={[styles.actionBtn, { backgroundColor: "#DCFCE7", borderRadius: colors.radius, flex: 1.5 }]}
                    >
                      <Ionicons name="checkmark-outline" size={18} color="#16A34A" />
                      <Text style={[styles.actionText, { color: "#16A34A" }]}>Accept</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
              {booking.status !== "pending" && canMarkFreePromo(booking) ? (
                <TouchableOpacity
                  onPress={() => markFreePromo(booking)}
                  disabled={markingFreeId === booking.id}
                  style={[styles.joinButton, { backgroundColor: colors.primaryLight, borderRadius: colors.radius }]}
                >
                  <Ionicons name="gift-outline" size={17} color={colors.primary} />
                  <Text style={[styles.joinText, { color: colors.primary }]}>
                    {markingFreeId === booking.id ? "Marking Free" : "Mark Free Promo"}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {booking.status === "accepted" && isCallReadyPaymentStatus(booking.payment_status) ? (
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: "/(trainer)/video-call" as never,
                    params: {
                      bookingId: booking.id,
                      clientName: booking.clientName ?? "Client",
                    },
                  })}
                  style={[styles.joinButton, { backgroundColor: colors.primaryLight, borderRadius: colors.radius }]}
                >
                  <Ionicons name="videocam-outline" size={17} color={colors.primary} />
                  <Text style={[styles.joinText, { color: colors.primary }]}>Join Video Call</Text>
                </TouchableOpacity>
              ) : null}
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
  joinButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, paddingVertical: 10 },
  joinText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15 },
});
