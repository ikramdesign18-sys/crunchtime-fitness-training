import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, ColorSchemeName, useColorScheme } from "react-native";

interface ThemeContextValue {
  colorScheme: "light" | "dark";
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "light",
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [manual, setManual] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("theme").then((v) => {
      if (v === "light" || v === "dark") setManual(v);
    });
  }, []);

  const colorScheme: "light" | "dark" = manual ?? system ?? "light";

  const toggleTheme = () => {
    const next = colorScheme === "light" ? "dark" : "light";
    setManual(next);
    AsyncStorage.setItem("theme", next);
  };

  const value = useMemo(
    () => ({ colorScheme, isDark: colorScheme === "dark", toggleTheme }),
    [colorScheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
