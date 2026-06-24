import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

type BadgeColor = "success" | "warning" | "error" | "primary" | "muted" | "info";

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  style?: ViewStyle;
  small?: boolean;
}

export default function Badge({ label, color = "primary", style, small = false }: BadgeProps) {
  const colors = useColors();

  const bgMap: Record<BadgeColor, string> = {
    success: "#DCFCE7",
    warning: "#FEF9C3",
    error: "#FEE2E2",
    primary: colors.primaryLight,
    muted: colors.muted,
    info: "#DBEAFE",
  };

  const textMap: Record<BadgeColor, string> = {
    success: "#16A34A",
    warning: "#B45309",
    error: "#DC2626",
    primary: colors.primary,
    muted: colors.mutedForeground,
    info: "#1D4ED8",
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bgMap[color],
          paddingHorizontal: small ? 8 : 10,
          paddingVertical: small ? 2 : 4,
          borderRadius: 100,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: textMap[color], fontSize: small ? 11 : 12 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start" },
  text: { fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
});
