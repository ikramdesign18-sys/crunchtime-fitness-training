import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "outline" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: AppButtonProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const heights: Record<Size, number> = { sm: 40, md: 52, lg: 60 };
  const fontSizes: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

  const bgColors: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: "transparent",
    destructive: colors.destructive,
    ghost: "transparent",
  };

  const textColors: Record<Variant, string> = {
    primary: colors.primaryForeground,
    secondary: colors.secondaryForeground,
    outline: colors.primary,
    destructive: colors.destructiveForeground,
    ghost: colors.primary,
  };

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          {
            height: heights[size],
            backgroundColor: bgColors[variant],
            borderRadius: colors.radius,
            opacity: disabled ? 0.5 : 1,
            borderWidth: variant === "outline" ? 1.5 : 0,
            borderColor: variant === "outline" ? colors.primary : "transparent",
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColors[variant]} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              { color: textColors[variant], fontSize: fontSizes[size] },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
