import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface AvatarProps {
  name: string;
  size?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

export default function Avatar({ name, size = 40, style, backgroundColor }: AvatarProps) {
  const colors = useColors();
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor ?? colors.primary,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize: size * 0.38, color: colors.primaryForeground },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "Inter_700Bold" },
});
