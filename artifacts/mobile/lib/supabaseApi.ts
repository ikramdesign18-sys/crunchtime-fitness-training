import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { assertSupabaseConfigured, supabase } from "@/lib/supabase";

export type UserRole = "user" | "trainer" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  age: number | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  fitness_goal: string | null;
  activity_level: string | null;
  training_types: string[] | null;
  profile_setup_completed: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BmiRecord {
  id: string;
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
  created_at: string;
}

export interface WorkoutProgress {
  id: string;
  user_id: string;
  workout_id: string | null;
  workout_title: string | null;
  completed_at: string;
  duration_minutes: number | null;
  calories_burned: number | null;
}

export interface ChatThread {
  id: string;
  user_id: string;
  trainer_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  clientName?: string;
  clientEmail?: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface Booking {
  id: string;
  user_id: string;
  trainer_id: string;
  session_type: string;
  session_date: string;
  session_time: string;
  note: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  clientName?: string;
}

export interface VideoSubmission {
  id: string;
  user_id: string;
  trainer_id: string;
  exercise_name: string;
  video_url: string;
  note: string | null;
  status: "submitted" | "reviewed" | "feedback_received";
  trainer_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  clientName?: string;
  clientEmail?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: "workout" | "meal" | "booking" | "message" | "video";
  is_read: boolean;
  created_at: string;
}

export function friendlyAuthError(message?: string) {
  const text = (message ?? "").toLowerCase();
  if (text.includes("invalid login")) return "Invalid email or password.";
  if (text.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (text.includes("already registered") || text.includes("already exists")) {
    return "An account already exists for this email.";
  }
  if (text.includes("password")) return "Please use a stronger password.";
  if (text.includes("not configured")) return message ?? "Supabase is not configured.";
  return message || "Something went wrong. Please try again.";
}

export async function getProfile(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function ensureProfile(userId: string, email: string | null, fullName?: string) {
  assertSupabaseConfigured();
  const existing = await getProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      full_name: fullName ?? email?.split("@")[0] ?? "Athlete",
      role: "user",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, values: Partial<Profile>) {
  assertSupabaseConfigured();
  const { role, id, created_at, updated_at, ...safeValues } = values;
  void role;
  void id;
  void created_at;
  void updated_at;

  const { data, error } = await supabase
    .from("profiles")
    .update(safeValues)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function findTrainerProfile() {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["trainer", "admin"])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("No trainer account is available yet. Create one in Supabase and set role = trainer.");
  }
  return data as Profile;
}

export async function fetchBmiRecords(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("bmi_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BmiRecord[];
}

export async function saveBmiRecord(values: {
  user_id: string;
  height: number;
  weight: number;
  bmi: number;
  category: string;
}) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("bmi_records")
    .insert(values)
    .select("*")
    .single();
  if (error) throw error;
  return data as BmiRecord;
}

export async function fetchWorkoutProgress(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("workout_progress")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkoutProgress[];
}

export async function saveWorkoutProgress(values: {
  user_id: string;
  workout_id?: string | null;
  workout_title?: string | null;
  duration_minutes: number;
  calories_burned: number;
}) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("workout_progress")
    .insert(values)
    .select("*")
    .single();
  if (error) throw error;
  return data as WorkoutProgress;
}

export async function getOrCreateThread(userId: string, trainerId?: string) {
  assertSupabaseConfigured();
  const trainer = trainerId ? ({ id: trainerId } as Profile) : await findTrainerProfile();
  const { data: existing, error: findError } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("trainer_id", trainer.id)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing as ChatThread;

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId, trainer_id: trainer.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as ChatThread;
}

export async function fetchTrainerThreads(trainerId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;

  const threads = (data ?? []) as ChatThread[];
  const profiles = await fetchProfilesByIds(threads.map((thread) => thread.user_id));
  return threads.map((thread) => ({
    ...thread,
    clientName: profiles.get(thread.user_id)?.full_name ?? "Client",
    clientEmail: profiles.get(thread.user_id)?.email ?? "",
  }));
}

export async function fetchThreadMessages(threadId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendThreadMessage(thread: ChatThread, senderId: string, message: string) {
  assertSupabaseConfigured();
  const receiverId = senderId === thread.user_id ? thread.trainer_id : thread.user_id;
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: thread.id,
      sender_id: senderId,
      receiver_id: receiverId,
      message,
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase
    .from("chat_threads")
    .update({ last_message: message, last_message_at: new Date().toISOString() })
    .eq("id", thread.id);

  if (senderId === thread.trainer_id) {
    await createNotification({
      user_id: thread.user_id,
      title: "New Trainer Message",
      body: message,
      type: "message",
    });
  }

  return data as ChatMessage;
}

export async function createBooking(values: {
  user_id: string;
  session_type: string;
  session_date: string;
  session_time: string;
  note?: string | null;
}) {
  assertSupabaseConfigured();
  const trainer = await findTrainerProfile();
  const { data, error } = await supabase
    .from("bookings")
    .insert({ ...values, trainer_id: trainer.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as Booking;
}

export async function fetchUserBookings(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function fetchTrainerBookings(trainerId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const bookings = (data ?? []) as Booking[];
  const profiles = await fetchProfilesByIds(bookings.map((booking) => booking.user_id));
  return bookings.map((booking) => ({
    ...booking,
    clientName: profiles.get(booking.user_id)?.full_name ?? "Client",
  }));
}

export async function updateBookingStatus(booking: Booking, status: "accepted" | "declined") {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", booking.id)
    .select("*")
    .single();
  if (error) throw error;

  await createNotification({
    user_id: booking.user_id,
    title: status === "accepted" ? "Booking Accepted" : "Booking Declined",
    body: `${booking.session_type} on ${booking.session_date} at ${booking.session_time} was ${status}.`,
    type: "booking",
  });

  return data as Booking;
}

export async function fetchNotifications(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(notificationId: string) {
  assertSupabaseConfigured();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  assertSupabaseConfigured();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

async function createNotification(values: {
  user_id: string;
  title: string;
  body: string;
  type: AppNotification["type"];
}) {
  const { error } = await supabase.from("notifications").insert(values);
  if (error) console.warn("Notification insert failed", error.message);
}

export async function fetchUserVideos(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("video_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VideoSubmission[];
}

export async function fetchTrainerVideos(trainerId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("video_submissions")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const videos = (data ?? []) as VideoSubmission[];
  const profiles = await fetchProfilesByIds(videos.map((video) => video.user_id));
  return videos.map((video) => ({
    ...video,
    clientName: profiles.get(video.user_id)?.full_name ?? "Client",
    clientEmail: profiles.get(video.user_id)?.email ?? "",
  }));
}

export async function fetchVideoById(videoId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("video_submissions")
    .select("*")
    .eq("id", videoId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const profiles = await fetchProfilesByIds([(data as VideoSubmission).user_id]);
  return {
    ...(data as VideoSubmission),
    clientName: profiles.get((data as VideoSubmission).user_id)?.full_name ?? "Client",
  };
}

export async function submitVideo(values: {
  user_id: string;
  exercise_name: string;
  note?: string | null;
  uri: string;
}) {
  assertSupabaseConfigured();
  const trainer = await findTrainerProfile();
  const video_url = await uploadVideo(values.user_id, values.uri);
  const { data, error } = await supabase
    .from("video_submissions")
    .insert({
      user_id: values.user_id,
      trainer_id: trainer.id,
      exercise_name: values.exercise_name,
      note: values.note ?? null,
      video_url,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as VideoSubmission;
}

export async function updateVideoFeedback(video: VideoSubmission, feedback: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("video_submissions")
    .update({
      trainer_feedback: feedback,
      status: "feedback_received",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", video.id)
    .select("*")
    .single();
  if (error) throw error;

  await createNotification({
    user_id: video.user_id,
    title: "Video Feedback Ready",
    body: `Your trainer reviewed your ${video.exercise_name} video.`,
    type: "video",
  });

  return data as VideoSubmission;
}

export async function markVideoReviewed(video: VideoSubmission) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("video_submissions")
    .update({ status: "reviewed", reviewed_at: new Date().toISOString() })
    .eq("id", video.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as VideoSubmission;
}

export async function fetchClientProfiles() {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "user")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

async function fetchProfilesByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, Profile>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", unique);
  if (error) throw error;
  for (const profile of (data ?? []) as Profile[]) {
    map.set(profile.id, profile);
  }
  return map;
}

async function uploadVideo(userId: string, uri: string) {
  const ext = getFileExtension(uri) || "mp4";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const contentType = ext === "mov" ? "video/quicktime" : `video/${ext === "m4v" ? "mp4" : ext}`;

  let body: Blob | ArrayBuffer;
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    body = await response.blob();
  } else {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    body = base64ToArrayBuffer(base64);
  }

  const { error } = await supabase.storage
    .from("video-submissions")
    .upload(path, body, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from("video-submissions").getPublicUrl(path);
  return data.publicUrl;
}

function getFileExtension(uri: string) {
  const clean = uri.split("?")[0] ?? uri;
  return clean.includes(".") ? clean.split(".").pop()?.toLowerCase() : undefined;
}

function base64ToArrayBuffer(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
