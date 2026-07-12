import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppCard from "@/components/ui/AppCard";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  createBookingPaymentCheckout,
  fetchPricingConfig,
  ONLINE_PAYMENT_UNAVAILABLE_MESSAGE,
  openStripeUrl,
} from "@/lib/paymentApi";
import { formatPrice, mergePricingConfig, type PricingConfigItem } from "@/lib/paymentConfig";
import { fetchUserBookings, type Booking } from "@/lib/supabaseApi";

const SESSION_TYPES = [
  "Fitness Consultation",
  "Workout Review",
  "Meal Plan Review",
  "Personal Training Session",
  "Video Call Session",
];

const TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

function isCallReadyPaymentStatus(status: Booking["payment_status"]) {
  return status === "paid" || status === "free_promo" || status === "waived";
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

function getNextDays(n: number) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      short: d.toLocaleDateString("en-US", { weekday: "short" }),
      num: d.getDate(),
      value: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

export default function BookingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, session } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState("");
  const [note, setNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedWithPromo, setSubmittedWithPromo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pricingRows, setPricingRows] = useState<PricingConfigItem[]>([]);
  const days = getNextDays(7);
  const pricing = mergePricingConfig(pricingRows);
  const bookingPrice = pricing.booking_one_hour;

  const loadBookings = async () => {
    if (!user) return;
    try {
      setBookings(await fetchUserBookings(user.id));
    } catch {
      setBookings([]);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  useEffect(() => {
    fetchPricingConfig()
      .then(setPricingRows)
      .catch(() => setPricingRows([]));
  }, []);

  const handleSubmit = async () => {
    if (!selectedTime || !user || !session?.access_token) return;
    setLoading(true);
    try {
      const checkout = await createBookingPaymentCheckout({
        accessToken: session.access_token,
        sessionType,
        sessionDate: days[selectedDay].value,
        sessionTime: selectedTime,
        note,
        promoCode,
      });
      if (checkout.booking) {
        setSubmittedWithPromo(true);
      } else if (checkout.url) {
        setSubmittedWithPromo(false);
        await openStripeUrl(checkout.url);
      }
      await loadBookings();
      setSubmitted(true);
    } catch (error) {
      const message = (error as Error).message;
      const friendlyMessage =
        /online payment is not available yet|stripe.*(?:not configured|key)/i.test(message)
          ? ONLINE_PAYMENT_UNAVAILABLE_MESSAGE
          : message;
      Alert.alert("Booking Unavailable", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
          <Ionicons name="calendar-outline" size={52} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          {submittedWithPromo ? "Booking Requested" : "Payment Processing"}
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          {sessionType} on {days[selectedDay].label} at {selectedTime}
        </Text>
        <Text style={[styles.successNote, { color: colors.mutedForeground }]}>
          {submittedWithPromo
            ? "Your promo code was accepted and this booking is marked as free promo. Your trainer can now accept it."
            : "Stripe will confirm your payment securely. Your paid booking appears here after the webhook updates your account."}
        </Text>
        <AppButton title="Book Another Session" onPress={() => { setSubmitted(false); setSubmittedWithPromo(false); setSelectedTime(""); setNote(""); setPromoCode(""); loadBookings(); }} style={{ marginTop: 24, width: 240 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: Math.max(insets.bottom + 24, 48) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Book a Session</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Request a coaching session with your trainer</Text>

        <AppCard style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>SESSION PRICE</Text>
              <Text style={[styles.priceValue, { color: colors.foreground }]}>{formatPrice(bookingPrice.amount_cents, bookingPrice.currency)}</Text>
            </View>
            <Ionicons name="card-outline" size={24} color={colors.primary} />
          </View>
        </AppCard>

        {bookings.length > 0 ? (
          <View style={styles.bookingList}>
            {bookings.map((booking) => (
              <AppCard key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.bookingTitle, { color: colors.foreground }]}>{booking.session_type}</Text>
                    <Text style={[styles.bookingMeta, { color: colors.mutedForeground }]}>
                      {booking.session_date} at {booking.session_time}
                    </Text>
                    {booking.payment_status ? (
                      <Text style={[styles.bookingMeta, { color: colors.mutedForeground }]}>
                        Payment: {getBookingPaymentLabel(booking)}
                      </Text>
                    ) : null}
                  </View>
                  <Badge
                    label={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    color={booking.status === "accepted" ? "success" : booking.status === "declined" ? "error" : "warning"}
                    small
                  />
                </View>
                {booking.status === "accepted" && isCallReadyPaymentStatus(booking.payment_status) ? (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: "/(user)/video-call", params: { bookingId: booking.id } })}
                    style={[styles.joinButton, { backgroundColor: colors.primaryLight, borderRadius: colors.radius }]}
                  >
                    <Ionicons name="videocam-outline" size={17} color={colors.primary} />
                    <Text style={[styles.joinText, { color: colors.primary }]}>Join Video Call</Text>
                  </TouchableOpacity>
                ) : null}
              </AppCard>
            ))}
          </View>
        ) : null}

        {/* Session Type */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>SESSION TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={{ gap: 8, paddingRight: 16 }} keyboardShouldPersistTaps="handled">
          {SESSION_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setSessionType(t)}
              style={[styles.typeChip, { backgroundColor: sessionType === t ? colors.primary : colors.card, borderRadius: colors.radius, borderWidth: 1.5, borderColor: sessionType === t ? colors.primary : colors.border }]}
            >
              <Text style={[styles.typeText, { color: sessionType === t ? "#FFF" : colors.foreground }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>SELECT DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }} keyboardShouldPersistTaps="handled">
          {days.map((day, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setSelectedDay(i)}
              style={[styles.dayBtn, { backgroundColor: selectedDay === i ? colors.primary : colors.card, borderRadius: colors.radius }]}
            >
              <Text style={[styles.dayName, { color: selectedDay === i ? "rgba(255,255,255,0.8)" : colors.mutedForeground }]}>{day.short}</Text>
              <Text style={[styles.dayNum, { color: selectedDay === i ? "#FFF" : colors.foreground }]}>{day.num}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>SELECT TIME</Text>
        <View style={styles.timeGrid}>
          {TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setSelectedTime(t)}
              style={[styles.timeBtn, { backgroundColor: selectedTime === t ? colors.primary : colors.card, borderRadius: colors.radius, borderWidth: 1.5, borderColor: selectedTime === t ? colors.primary : colors.border }]}
            >
              <Text style={[styles.timeText, { color: selectedTime === t ? "#FFF" : colors.foreground }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>ADD A NOTE</Text>
        <AppInput placeholder="What would you like to focus on?" value={note} onChangeText={setNote} multiline numberOfLines={4} />

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>PROMO CODE (OPTIONAL)</Text>
        <AppInput
          placeholder="Enter promo code"
          value={promoCode}
          onChangeText={setPromoCode}
          autoCapitalize="characters"
        />

        <AppButton
          title={promoCode.trim() ? "Apply Promo & Book" : "Pay & Book"}
          onPress={handleSubmit}
          loading={loading}
          disabled={!selectedTime}
          style={{ opacity: !selectedTime ? 0.5 : 1 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 4 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 20 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  typeScroll: { marginHorizontal: -16, paddingLeft: 16, marginBottom: 4 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 10 },
  typeText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  dayBtn: { width: 52, height: 64, alignItems: "center", justifyContent: "center" },
  dayName: { fontFamily: "Inter_400Regular", fontSize: 11 },
  dayNum: { fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 2 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  timeBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  timeText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 8 },
  successSub: { fontFamily: "Inter_600SemiBold", fontSize: 15, textAlign: "center", marginBottom: 8 },
  successNote: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  priceCard: { marginBottom: 16 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  priceValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  bookingList: { gap: 10, marginBottom: 20 },
  bookingCard: {},
  bookingTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  bookingInfo: { flex: 1 },
  bookingTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  bookingMeta: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  joinButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, paddingVertical: 10 },
  joinText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
