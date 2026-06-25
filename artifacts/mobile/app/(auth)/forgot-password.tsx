import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const { resetPassword } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleSend = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 20 }]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
              <Ionicons name="checkmark-circle-outline" size={56} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Check Your Email</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              We've sent a password reset link to{"\n"}{email}
            </Text>
            <AppButton title="Back to Login" onPress={() => router.replace("/(auth)/login")} style={{ marginTop: 32 }} />
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            <AppInput label="Email Address" placeholder="your@email.com" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" error={error} />
            <AppButton title="Send Reset Link" onPress={handleSend} loading={loading} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 60 },
  back: { marginBottom: 28 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 8 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 24, marginBottom: 32 },
  successContent: { alignItems: "center", paddingTop: 60 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 12 },
  successSub: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", lineHeight: 24 },
});
