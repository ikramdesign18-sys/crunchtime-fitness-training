import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
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
  },
  {
    id: "2",
    icon: "trending-up-outline" as const,
    title: "Track Progress",
    subtitle: "Monitor your BMI, workouts, and calories burned with clear visual progress.",
    gradient: ["#1A1A1A", "#0F1A2A"] as [string, string],
  },
  {
    id: "3",
    icon: "restaurant-outline" as const,
    title: "Eat Better",
    subtitle: "Personalized meal plans crafted to fuel your specific fitness goals.",
    gradient: ["#1A1A1A", "#0A1A0A"] as [string, string],
  },
  {
    id: "4",
    icon: "chatbubbles-outline" as const,
    title: "Stay Connected",
    subtitle: "Book sessions, chat with your trainer, and submit videos for expert feedback.",
    gradient: ["#1A1A1A", "#1A0A1A"] as [string, string],
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const goToLogin = () => router.replace("/(auth)/login");

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      goToLogin();
    }
  };

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
            <View style={[styles.slideContent, { paddingTop: topPadding + 60 }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={56} color="#D66433" />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </LinearGradient>
        )}
      />

      <View
        style={[
          styles.bottom,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
      >
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === activeIndex ? "#D66433" : "#444",
                  width: i === activeIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
        <AppButton
          title={activeIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          style={styles.btn}
        />
        <TouchableOpacity onPress={goToLogin} style={styles.skipBtn}>
          <Text style={styles.skipText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={goToLogin}
        style={[styles.skipTop, { top: topPadding + 16 }]}
      >
        <Text style={styles.skipTopText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A" },
  slide: { flex: 1, alignItems: "center", justifyContent: "center" },
  slideContent: { alignItems: "center", paddingHorizontal: 40, flex: 1, justifyContent: "center" },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D6643320",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
    borderWidth: 1,
    borderColor: "#D6643340",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#AAAAAA",
    textAlign: "center",
    lineHeight: 26,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: "#1A1A1A",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 24 },
  dot: { height: 6, borderRadius: 3 },
  btn: {},
  skipBtn: { alignItems: "center", marginTop: 16 },
  skipText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#666" },
  skipTop: {
    position: "absolute",
    right: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF15",
  },
  skipTopText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#FFFFFF99" },
});
