import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validate = () => {
    const e = { email: "", password: "" };
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return !e.email && !e.password;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      if (!user) {
        Alert.alert("Login Failed", "Unable to restore your profile. Please try again.");
        return;
      }
      if (user.role === "trainer" || user.role === "admin") {
        router.replace("/(trainer)/dashboard");
      } else if (user.profileSetupCompleted) {
        router.replace("/(user)/home");
      } else {
        router.replace("/profile-setup");
      }
    } catch (error) {
      Alert.alert("Login Failed", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.isDark ? "#2A2410" : "#FFF8E1", "transparent"]}
        style={[styles.headerGradient, { height: 260 + topPadding }]}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Sign in to continue your fitness journey
          </Text>

          <View style={styles.form}>
            <AppInput
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              keyboardType="email-address"
              error={errors.email}
              autoCapitalize="none"
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
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              style={styles.forgotRow}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
            <AppButton title="Sign In" onPress={handleLogin} loading={loading} size="lg" />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            style={styles.signupRow}
          >
            <Text style={[styles.signupText, { color: colors.mutedForeground }]}>
              Don't have an account?{" "}
            </Text>
            <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0 },
  scroll: { paddingHorizontal: 24, paddingBottom: 60 },
  logoRow: { alignItems: "center", marginBottom: 28 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: { width: 72, height: 72 },
  title: { fontFamily: "Inter_700Bold", fontSize: 26, textAlign: "center", marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center", marginBottom: 32 },
  form: { marginBottom: 4 },
  forgotRow: { alignSelf: "flex-end", marginBottom: 20, marginTop: -8 },
  forgotText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  signupRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  signupText: { fontFamily: "Inter_400Regular", fontSize: 15 },
  signupLink: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
