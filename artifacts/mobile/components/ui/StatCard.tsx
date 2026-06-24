import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import AppCard from "./AppCard";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string | number;
  subtitle?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function StatCard({ icon, iconColor, label, value, subtitle, style, onPress }: StatCardProps) {
  const colors = useColors();

  return (
    <AppCard style={[styles.card, style]} onPress={onPress}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: (iconColor ?? colors.primary) + "20" },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "flex-start" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
});
