import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[];
}

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
  days: [1, 2, 3, 4, 5],
};

const STORAGE_KEY = "workoutReminders";

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReminderSettings;
  } catch {}
  return DEFAULT_REMINDER;
}

export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }
  try {
    const { default: Notifications } = await import("expo-notifications");
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleWorkoutReminders(settings: ReminderSettings): Promise<void> {
  if (!settings.enabled || settings.days.length === 0) {
    await cancelAllReminders();
    return;
  }

  if (Platform.OS === "web") {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Workout Reminders Set!", {
        body: `You'll be reminded on ${settings.days.length} day(s) at ${formatTime(settings.hour, settings.minute)}`,
        icon: "/icon.png",
      });
    }
    return;
  }

  try {
    const { default: Notifications } = await import("expo-notifications");

    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const day of settings.days) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to Work Out! 💪",
          body: "Your workout reminder is here. Let's crush today's session!",
          sound: true,
          data: { type: "workout_reminder" },
        },
        trigger: {
          type: "weekly",
          weekday: day + 1,
          hour: settings.hour,
          minute: settings.minute,
          repeats: true,
        } as Parameters<typeof Notifications.scheduleNotificationAsync>[0]["trigger"],
      });
    }
  } catch (err) {
    console.warn("Failed to schedule notifications:", err);
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const { default: Notifications } = await import("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
