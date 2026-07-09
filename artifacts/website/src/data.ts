import {
  Activity,
  BarChart3,
  Bell,
  CalendarCheck,
  Dumbbell,
  HeartPulse,
  LayoutDashboard,
  Lock,
  MessageCircle,
  NotebookTabs,
  PlaySquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Video,
  Webcam,
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/#contact" },
];

export const trustBadges = [
  "Personal Training",
  "Smart Fitness Tracking",
  "Meal Planning",
  "Live Coaching",
  "Video Feedback",
];

export const featureHighlights = [
  { title: "User signup and login", text: "Secure onboarding for clients and trainers.", icon: UserCheck },
  { title: "Fitness profile setup", text: "Capture goals, training style, and progress context.", icon: NotebookTabs },
  { title: "Workout programs", text: "Structured programs that keep every session clear.", icon: Dumbbell },
  { title: "Exercise details", text: "Step-by-step workout guidance with focused context.", icon: Activity },
  { title: "BMI calculator", text: "Track body metrics as part of a broader wellness view.", icon: HeartPulse },
  { title: "Meal plans", text: "Organized nutrition support for everyday consistency.", icon: Sparkles },
  { title: "Progress tracking", text: "Measure workouts, BMI, weight trends, and habits.", icon: BarChart3 },
  { title: "1-on-1 chat", text: "Keep coaching conversations close to the client journey.", icon: MessageCircle },
  { title: "Session booking", text: "Make coaching sessions easy to request and manage.", icon: CalendarCheck },
  { title: "Video submissions", text: "Clients can submit exercise clips for review.", icon: PlaySquare },
  { title: "Trainer feedback", text: "Trainers can respond with focused form guidance.", icon: ShieldCheck },
  { title: "Trainer dashboard", text: "A command center for clients, bookings, and reviews.", icon: LayoutDashboard },
  { title: "Live video coaching", text: "Real-time coaching sessions powered by video calls.", icon: Webcam },
  { title: "Notifications", text: "Reminders and updates help clients stay consistent.", icon: Bell },
  { title: "Profile and settings", text: "Personal preferences and account controls in one place.", icon: Lock },
];

export const phoneScreens = [
  {
    title: "Home dashboard",
    eyebrow: "Today",
    metric: "87%",
    detail: "Weekly consistency",
    rows: ["Strength session ready", "Trainer message waiting", "BMI trend updated"],
  },
  {
    title: "Workout detail",
    eyebrow: "Upper body",
    metric: "42 min",
    detail: "Guided session",
    rows: ["Warm up", "Compound lifts", "Core finisher"],
  },
  {
    title: "Meal plan",
    eyebrow: "Nutrition",
    metric: "2,150",
    detail: "Daily calories",
    rows: ["Protein focused", "Balanced macros", "Hydration reminder"],
  },
  {
    title: "BMI calculator",
    eyebrow: "Health metrics",
    metric: "23.8",
    detail: "Current BMI",
    rows: ["Weight trend", "Goal range", "Coach context"],
  },
  {
    title: "Chat",
    eyebrow: "Coach line",
    metric: "1:1",
    detail: "Private support",
    rows: ["Form question", "Meal check-in", "Session notes"],
  },
  {
    title: "Booking",
    eyebrow: "Sessions",
    metric: "Tue",
    detail: "7:30 PM slot",
    rows: ["Video coaching", "Trainer confirmed", "Reminder enabled"],
  },
  {
    title: "Trainer dashboard",
    eyebrow: "Coach view",
    metric: "24",
    detail: "Active clients",
    rows: ["Bookings to review", "Videos pending", "Messages open"],
  },
  {
    title: "Video submission",
    eyebrow: "Form review",
    metric: "HD",
    detail: "Exercise clip",
    rows: ["Upload complete", "Trainer feedback", "Technique notes"],
  },
];

export const faqItems = [
  {
    question: "Is this app for clients and trainers?",
    answer:
      "Yes. Clients get workouts, progress tools, bookings, chat, and video submissions, while trainers get dashboards for clients, messages, bookings, reviews, and feedback.",
  },
  {
    question: "Can users book sessions?",
    answer:
      "Yes. The app includes session booking so clients can request coaching time and trainers can manage appointment flow.",
  },
  {
    question: "Can users submit videos?",
    answer:
      "Yes. Clients can submit exercise videos for trainer review, helping coaching feel more specific and practical.",
  },
  {
    question: "Does the app support live video calls?",
    answer:
      "Yes. Live video coaching is supported for real-time training conversations and guided sessions.",
  },
  {
    question: "Is Play Store/App Store publishing included?",
    answer:
      "Publishing is separate from the app experience. Store submission, review, and account requirements should be handled as their own release process.",
  },
  {
    question: "Is this a medical app?",
    answer:
      "No. Crunchtime Fitness Training supports fitness coaching and wellness habits. It does not diagnose, treat, or replace advice from a qualified medical professional.",
  },
  {
    question: "Can the app be customized?",
    answer:
      "Yes. Branding, copy, coaching workflows, and feature emphasis can be adapted for a specific fitness business.",
  },
];

export const clientFeatures = [
  "Personalized dashboard",
  "Workout programs",
  "Exercise details",
  "BMI tracking",
  "Meal plans",
  "Progress history",
  "Chat",
  "Booking",
  "Video submission",
  "Live coaching",
];

export const trainerFeatures = [
  "View clients",
  "Manage bookings",
  "Respond to messages",
  "Review videos",
  "Give feedback",
  "Track progress",
  "Start live calls",
];
