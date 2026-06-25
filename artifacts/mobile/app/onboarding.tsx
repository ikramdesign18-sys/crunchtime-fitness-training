import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppButton from "@/components/ui/AppButton";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "barbell-outline" as const,
    title: "Train Smarter",
    subtitle: "Guided workout programs for every fitness level — from beginner to elite athlete.",
    gradient: ["#1A1A1A", "#2A1208"] as [string, string],
    accent: "#D66433",
  },
  {
    id: "2",
    icon: "trending-up-outline" as const,
    title: "Track Progress",
    subtitle: "Monitor your BMI, workouts, and calories burned with clear visual progress.",
    gradient: ["#1A1A1A", "#0F1A2A"] as [string, string],
    accent: "#3B82F6",
  },
  {
    id: "3",
    icon: "restaurant-outline" as const,
    title: "Eat Better",
    subtitle: "Expert-designed meal plans crafted to fuel your specific fitness goals.",
    gradient: ["#1A1A1A", "#0A1A0A"] as [string, string],
    accent: "#22C55E",
  },
  {
    id: "4",
    icon: "chatbubbles-outline" as const,
    title: "Expert Support",
    subtitle: "Book sessions, chat with your trainer, and submit form videos for expert feedback.",
    gradient: ["#1A1A1A", "#1A0A1A"] as [string, string],
    accent: "#8B5CF6",
  },
];

async function markOnboardingComplete() {
  await AsyncStorage.setItem("onboardingComplete", "true");
}

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const dotAnim = useRef(new Animated.Value(0)).current;
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const goToLogin = async () => {
    await markOnboardingComplete();
    router.replace("/(auth)/login");
  };

  const handleNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      await goToLogin();
    }
  };

  const currentSlide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LinearGradient colors={item.gradient} style={[styles.slide, { width }]}>
            <View style={[styles.slideContent, { paddingTop: topPadding + 80 }]}>
              <View style={[styles.iconCircle, { backgroundColor: item.accent + "20", borderColor: item.accent + "40" }]}>
                <Ionicons name={item.icon} size={60} color={item.accent} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </LinearGradient>
        )}
      />

      {/* Skip button top right */}
      <TouchableOpacity
        onPress={goToLogin}
        style={[styles.skipTop, { top: topPadding + 16 }]}
      >
        <Text style={styles.skipTopText}>Skip</Text>
      </TouchableOpacity>

      {/* Bottom panel */}
      <View style={[styles.bottom, { paddingBottom: bottomPad }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? currentSlide.accent : "#333",
                  width: i === activeIndex ? 22 : 6,
                },
              ]}
            />
          ))}
        </View>

        <AppButton
          title={activeIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          size="lg"
        />

        <TouchableOpacity onPress={goToLogin} style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <Text style={[styles.signinLink, { color: currentSlide.accent }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A" },
  slide: { flex: 1, alignItems: "center", justifyContent: "center" },
  slideContent: {
    alignItems: "center",
    paddingHorizontal: 40,
    flex: 1,
    justifyContent: "center",
    paddingBottom: 60,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    borderWidth: 1.5,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 320,
  },
  skipTop: {
    position: "absolute",
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  skipTopText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#FFFFFF99" },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 28,
    backgroundColor: "#111111",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 28 },
  dot: { height: 6, borderRadius: 3 },
  signinRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  signinText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#666" },
  signinLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
