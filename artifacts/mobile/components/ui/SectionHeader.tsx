import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SectionHeaderProps {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  style?: ViewStyle;
}

export default function SectionHeader({ title, rightLabel, onRightPress, style }: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>
        {title.toUpperCase()}
      </Text>
      {rightLabel ? (
        <TouchableOpacity onPress={onRightPress}>
          <Text style={[styles.right, { color: colors.primary }]}>{rightLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.2,
  },
  right: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
