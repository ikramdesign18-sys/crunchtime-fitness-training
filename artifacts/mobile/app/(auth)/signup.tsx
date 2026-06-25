import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { useColors } from "@/hooks/useColors";

export default function SignupScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", password: "", confirm: "" });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const validate = () => {
    const e = { name: "", email: "", password: "", confirm: "" };
    if (!name.trim()) e.name = "Full name is required";
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password || password.length < 6) e.password = "Password must be at least 6 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return !e.name && !e.email && !e.password && !e.confirm;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    // In production, create the user in Supabase and then navigate.
    // Here we go directly to profile setup (demo flow).
    router.replace("/profile-setup");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
            <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Join Crunchtime Fitness Training
          </Text>

          <View style={styles.form}>
            <AppInput
              label="Full Name"
              placeholder="Alex Johnson"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
              error={errors.name}
              autoCapitalize="words"
            />
            <AppInput
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              keyboardType="email-address"
              error={errors.email}
            />
            <AppInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.password}
            />
            <AppInput
              label="Confirm Password"
              placeholder="••••••••"
              value={confirm}
              onChangeText={setConfirm}
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.confirm}
            />
            <AppButton title="Create Account" onPress={handleSignup} loading={loading} size="lg" />
          </View>

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
            </Text>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 60 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 28, gap: 4 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 15 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, marginBottom: 32 },
  form: { marginBottom: 4 },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  loginText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  loginLink: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
