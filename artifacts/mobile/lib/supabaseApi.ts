import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { assertSupabaseConfigured, supabase } from "@/lib/supabase";
import { API_BASE_URL, getApiBaseUrlErrorMessage } from "@/lib/videoCallConfig";

export type UserRole = "user" | "trainer" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  trainer_id?: string | null;
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

export type WorkoutCategory =
  | "Strength"
  | "Cardio"
  | "Full Body"
  | "Weight Loss"
  | "Muscle Gain"
  | "Yoga";

export type WorkoutDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface TrainerWorkoutVideo {
  id: string;
  trainer_id: string;
  title: string;
  description: string;
  category: WorkoutCategory;
  difficulty: WorkoutDifficulty;
  duration: number;
  calories: number;
  exercises: number;
  thumbnail_url: string | null;
  video_url: string | null;
  instructions: string | null;
  tips: string | null;
  common_mistakes: string | null;
  is_paid: boolean;
  price_cents: number | null;
  access_type: "free" | "paid" | "membership";
  stripe_price_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutVideoInput {
  title: string;
  description: string;
  category: WorkoutCategory;
  difficulty: WorkoutDifficulty;
  duration: number;
  calories: number;
  exercises: number;
  thumbnail_url?: string | null;
  video_url?: string | null;
  instructions?: string | null;
  tips?: string | null;
  common_mistakes?: string | null;
  is_paid?: boolean;
  price_cents?: number | null;
  access_type?: "free" | "paid" | "membership";
  stripe_price_id?: string | null;
  published: boolean;
}

export type MealPlanVisibility = "all" | "assigned";
export type MealPlanStatus = "draft" | "published";

export interface MealPlan {
  id: string;
  trainer_id: string;
  assigned_user_id: string | null;
  title: string;
  description: string;
  goal: string | null;
  duration_days: number | null;
  calories_per_day: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  snacks: string | null;
  notes: string | null;
  visibility: MealPlanVisibility;
  status: MealPlanStatus;
  requires_purchase: boolean;
  price_cents: number | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
  assignedUserName?: string;
}

export interface MealPlanInput {
  title: string;
  description: string;
  goal?: string | null;
  duration_days?: number | null;
  calories_per_day?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  breakfast?: string | null;
  lunch?: string | null;
  dinner?: string | null;
  snacks?: string | null;
  notes?: string | null;
  visibility: MealPlanVisibility;
  assigned_user_id?: string | null;
  status: MealPlanStatus;
  requires_purchase?: boolean;
  price_cents?: number | null;
  stripe_price_id?: string | null;
}

export type MealProgressKey =
  | "breakfast_completed"
  | "lunch_completed"
  | "dinner_completed"
  | "snacks_completed";

export interface MealProgress {
  id: string;
  user_id: string;
  meal_plan_id: string;
  progress_date: string;
  breakfast_completed: boolean;
  lunch_completed: boolean;
  dinner_completed: boolean;
  snacks_completed: boolean;
  completed_count: number | null;
  total_count: number | null;
  created_at: string;
  updated_at: string;
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
  payment_status?: "unpaid" | "pending" | "paid" | "failed" | "refunded" | "free_promo" | "waived" | null;
  payment_id?: string | null;
  amount_paid?: number | null;
  promo_code_used?: string | null;
  created_at: string;
  updated_at: string;
  clientName?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  booking_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  amount: number;
  currency: string;
  payment_type: "booking" | "subscription" | "membership" | "access_fee" | "meal_plan" | "workout_video";
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ContentPurchase {
  id: string;
  user_id: string;
  content_type: "workout_video" | "meal_plan" | "booking" | "membership";
  content_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "cancelled";
  created_at: string;
  updated_at: string;
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
  thread_id?: string | null;
  sender_id?: string | null;
  receiver_id?: string | null;
  related_id?: string | null;
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

export async function getDefaultTrainer(userId?: string | null) {
  assertSupabaseConfigured();

  if (userId) {
    const profile = await getProfile(userId);
    const assignedTrainerId = profile?.trainer_id;
    if (assignedTrainerId) {
      const { data: assignedTrainer, error: assignedError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", assignedTrainerId)
        .in("role", ["trainer", "admin"])
        .maybeSingle();
      if (assignedError) throw assignedError;
      if (assignedTrainer) return assignedTrainer as Profile;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["trainer", "admin"])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "No trainer account is available yet. Confirm a profile exists with role = trainer or admin, and run the latest Supabase profile read policy."
    );
  }
  return data as Profile;
}

export async function findTrainerProfile(userId?: string | null) {
  return getDefaultTrainer(userId);
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

export async function fetchPublishedWorkoutVideos() {
  assertSupabaseConfigured();
  const apiRows = await fetchPublishedWorkoutVideosFromApi();
  if (apiRows) return apiRows;

  const { data, error } = await supabase
    .from("workout_videos")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainerWorkoutVideo[];
}

async function fetchPublishedWorkoutVideosFromApi() {
  const apiError = getApiBaseUrlErrorMessage();
  if (apiError) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/api/content/workout-videos`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await response.json().catch(() => null)) as { workouts?: TrainerWorkoutVideo[] } | null;
    if (!response.ok || !data?.workouts) return null;
    return data.workouts;
  } catch {
    return null;
  }
}

export async function fetchWorkoutVideoById(workoutId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("workout_videos")
    .select("*")
    .eq("id", workoutId)
    .maybeSingle();
  if (error) throw error;
  return data as TrainerWorkoutVideo | null;
}

export async function fetchTrainerWorkoutVideos(trainerId: string, filters?: {
  search?: string;
  category?: WorkoutCategory | "All";
  status?: "all" | "published" | "draft";
  limit?: number;
}) {
  assertSupabaseConfigured();
  let query = supabase
    .from("workout_videos")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("updated_at", { ascending: false })
    .limit(filters?.limit ?? 50);

  if (filters?.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }

  if (filters?.status === "published") {
    query = query.eq("published", true);
  } else if (filters?.status === "draft") {
    query = query.eq("published", false);
  }

  if (filters?.search?.trim()) {
    query = query.ilike("title", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TrainerWorkoutVideo[];
}

export async function saveTrainerWorkoutVideo(
  trainerId: string,
  values: WorkoutVideoInput,
  workoutId?: string | null
) {
  assertSupabaseConfigured();
  const payload = {
    trainer_id: trainerId,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    difficulty: values.difficulty,
    duration: values.duration,
    calories: values.calories,
    exercises: values.exercises,
    thumbnail_url: values.thumbnail_url ?? null,
    video_url: values.video_url ?? null,
    instructions: values.instructions?.trim() || null,
    tips: values.tips?.trim() || null,
    common_mistakes: values.common_mistakes?.trim() || null,
    is_paid: values.is_paid ?? false,
    price_cents: values.is_paid ? values.price_cents ?? null : null,
    access_type: values.is_paid ? values.access_type ?? "paid" : "free",
    stripe_price_id: values.stripe_price_id?.trim() || null,
    published: values.published,
  };

  const query = workoutId
    ? supabase.from("workout_videos").update(payload).eq("id", workoutId)
    : supabase.from("workout_videos").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data as TrainerWorkoutVideo;
}

export async function updateTrainerWorkoutPublished(workoutId: string, published: boolean) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("workout_videos")
    .update({ published })
    .eq("id", workoutId)
    .select("*")
    .single();
  if (error) throw error;
  return data as TrainerWorkoutVideo;
}

export async function deleteTrainerWorkoutVideo(workoutId: string) {
  assertSupabaseConfigured();
  const { error } = await supabase
    .from("workout_videos")
    .delete()
    .eq("id", workoutId);
  if (error) throw error;
}

export async function fetchPublishedMealPlans(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("status", "published")
    .or(`visibility.eq.all,and(visibility.eq.assigned,assigned_user_id.eq.${userId})`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MealPlan[];
}

export async function fetchMealPlanById(mealPlanId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", mealPlanId)
    .maybeSingle();
  if (error) throw error;
  return data as MealPlan | null;
}

export async function fetchTrainerMealPlans(trainerId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const plans = (data ?? []) as MealPlan[];
  const profiles = await fetchProfilesByIds(plans.map((plan) => plan.assigned_user_id ?? ""));
  return plans.map((plan) => ({
    ...plan,
    assignedUserName: plan.assigned_user_id ? profiles.get(plan.assigned_user_id)?.full_name ?? "Client" : undefined,
  }));
}

export async function saveTrainerMealPlan(
  trainerId: string,
  values: MealPlanInput,
  mealPlanId?: string | null
) {
  assertSupabaseConfigured();
  const payload = {
    trainer_id: trainerId,
    assigned_user_id: values.visibility === "assigned" ? values.assigned_user_id ?? null : null,
    title: values.title.trim(),
    description: values.description.trim(),
    goal: values.goal?.trim() || null,
    duration_days: values.duration_days ?? null,
    calories_per_day: values.calories_per_day ?? null,
    protein: values.protein ?? null,
    carbs: values.carbs ?? null,
    fats: values.fats ?? null,
    breakfast: values.breakfast?.trim() || null,
    lunch: values.lunch?.trim() || null,
    dinner: values.dinner?.trim() || null,
    snacks: values.snacks?.trim() || null,
    notes: values.notes?.trim() || null,
    visibility: values.visibility,
    status: values.status,
    requires_purchase: values.requires_purchase ?? false,
    price_cents: values.requires_purchase ? values.price_cents ?? null : null,
    stripe_price_id: values.stripe_price_id?.trim() || null,
  };

  const query = mealPlanId
    ? supabase.from("meal_plans").update(payload).eq("id", mealPlanId)
    : supabase.from("meal_plans").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data as MealPlan;
}

export async function deleteTrainerMealPlan(mealPlanId: string) {
  assertSupabaseConfigured();
  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", mealPlanId);
  if (error) throw error;
}

export async function fetchMealProgressForDate(userId: string, mealPlanId: string, progressDate: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("meal_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("meal_plan_id", mealPlanId)
    .eq("progress_date", progressDate)
    .maybeSingle();
  if (error) throw error;
  return data as MealProgress | null;
}

export async function fetchMealProgressRange(userId: string, startDate: string, endDate: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("meal_progress")
    .select("*")
    .eq("user_id", userId)
    .gte("progress_date", startDate)
    .lte("progress_date", endDate)
    .order("progress_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MealProgress[];
}

export async function saveMealProgress(values: {
  user_id: string;
  meal_plan_id: string;
  progress_date: string;
  breakfast_completed: boolean;
  lunch_completed: boolean;
  dinner_completed: boolean;
  snacks_completed: boolean;
  completed_count: number;
  total_count: number;
}) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("meal_progress")
    .upsert(values, { onConflict: "user_id,meal_plan_id,progress_date" })
    .select("*")
    .single();
  if (error) throw error;
  return data as MealProgress;
}

export async function uploadWorkoutMedia(values: {
  trainerId: string;
  uri: string;
  kind: "video" | "thumbnail";
}) {
  assertSupabaseConfigured();
  const ext = getFileExtension(values.uri) || (values.kind === "video" ? "mp4" : "jpg");
  const bucket = values.kind === "video" ? "workout-videos" : "workout-thumbnails";
  const filename = `${values.trainerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const contentType =
    values.kind === "video"
      ? ext === "mov"
        ? "video/quicktime"
        : `video/${ext === "m4v" ? "mp4" : ext}`
      : ext === "png"
        ? "image/png"
        : "image/jpeg";

  let body: Blob | ArrayBuffer;
  if (Platform.OS === "web") {
    const response = await fetch(values.uri);
    body = await response.blob();
  } else {
    const base64 = await FileSystem.readAsStringAsync(values.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    body = base64ToArrayBuffer(base64);
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, body, { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

export async function getOrCreateThread(userId: string, trainerId?: string) {
  assertSupabaseConfigured();
  const trainer = trainerId ? ({ id: trainerId } as Profile) : await getDefaultTrainer(userId);
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

export async function fetchThreadById(threadId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw error;
  return data as ChatThread | null;
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

  await createNotification({
    user_id: receiverId,
    thread_id: thread.id,
    sender_id: senderId,
    receiver_id: receiverId,
    related_id: thread.id,
    title: senderId === thread.trainer_id ? "New Trainer Message" : "New Client Message",
    body: message,
    type: "message",
  });

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
  const trainer = await getDefaultTrainer(values.user_id);
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
    sender_id: booking.trainer_id,
    receiver_id: booking.user_id,
    related_id: booking.id,
    title: status === "accepted" ? "Booking Accepted" : "Booking Declined",
    body: `${booking.session_type} on ${booking.session_date} at ${booking.session_time} was ${status}.`,
    type: "booking",
  });

  return data as Booking;
}

export async function fetchUserSubscriptions(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserSubscription[];
}

export async function fetchUserPayments(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentRecord[];
}

export async function fetchUserContentPurchases(userId: string) {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("content_purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContentPurchase[];
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
  thread_id?: string | null;
  sender_id?: string | null;
  receiver_id?: string | null;
  related_id?: string | null;
  title: string;
  body: string;
  type: AppNotification["type"];
}) {
  const { error } = await supabase.from("notifications").insert(values);
  if (
    error &&
    ["thread_id", "sender_id", "receiver_id", "related_id"].some((column) =>
      error.message.toLowerCase().includes(column)
    )
  ) {
    const { thread_id, sender_id, receiver_id, related_id, ...legacyValues } = values;
    void thread_id;
    void sender_id;
    void receiver_id;
    void related_id;
    const { error: legacyError } = await supabase.from("notifications").insert(legacyValues);
    if (legacyError) console.warn("Notification insert failed", legacyError.message);
    return;
  }
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
  const trainer = await getDefaultTrainer(values.user_id);
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
    sender_id: video.trainer_id,
    receiver_id: video.user_id,
    related_id: video.id,
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
