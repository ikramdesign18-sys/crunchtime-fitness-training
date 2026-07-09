import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function UserTabLayout() {
  const colors = useColors();
  const { isAuthenticated, isLoading, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Redirect href="/(auth)/login" />;
  if (user.role === "trainer" || user.role === "admin") {
    return <Redirect href="/(trainer)/dashboard" />;
  }
  if (!user.profileSetupCompleted) return <Redirect href="/profile-setup" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          elevation: 0,
          height: isWeb ? 84 : 64,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginBottom: isWeb ? 8 : 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "barbell" : "barbell-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "trending-up" : "trending-up-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meals",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
      {/* Hidden screens — accessible via navigation but not shown as tabs */}
      <Tabs.Screen name="workout-detail" options={{ href: null }} />
      <Tabs.Screen name="active-workout" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="workout-done" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="exercise-detail" options={{ href: null }} />
      <Tabs.Screen name="bmi" options={{ href: null }} />
      <Tabs.Screen name="meal-detail" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="booking" options={{ href: null }} />
      <Tabs.Screen name="membership" options={{ href: null }} />
      <Tabs.Screen name="video-submit" options={{ href: null }} />
      <Tabs.Screen name="video-detail" options={{ href: null }} />
      <Tabs.Screen name="video-call" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
