import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";

export default function SplashScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(async () => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        async () => {
          if (isAuthenticated && user) {
            if (user.role === "trainer" || user.role === "admin") {
              router.replace("/(trainer)/dashboard");
            } else if (user.profileSetupCompleted) {
              router.replace("/(user)/home");
            } else {
              router.replace("/profile-setup");
            }
          } else {
            const onboarded = await AsyncStorage.getItem("onboardingComplete");
            if (onboarded) {
              router.replace("/(auth)/login");
            } else {
              router.replace("/onboarding");
            }
          }
        }
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>CRUNCHTIME</Text>
        <Text style={styles.appSub}>FITNESS TRAINING</Text>
        <Text style={styles.tagline}>Train Hard. Train Smart.</Text>
      </Animated.View>
      <Text style={styles.footer}>Powered by Expert Coaching</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { alignItems: "center" },
  logoWrap: {
    width: 110,
    height: 110,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 28,
    shadowColor: "#D66433",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: { width: 110, height: 110 },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: "#FFFFFF",
    letterSpacing: 5,
  },
  appSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#D66433",
    letterSpacing: 4,
    marginTop: 4,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#888888",
    marginTop: 16,
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#444",
    letterSpacing: 0.5,
  },
});
