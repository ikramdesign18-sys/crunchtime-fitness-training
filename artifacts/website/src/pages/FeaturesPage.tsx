import {
  BarChart3,
  CalendarCheck,
  Dumbbell,
  Lock,
  MessageCircle,
  ShieldCheck,
  UserRound,
  Video,
} from "lucide-react";
import CTASection from "@/components/CTASection";
import FeatureCard from "@/components/FeatureCard";
import Section from "@/components/Section";

const groups = [
  {
    title: "For Clients",
    text: "A polished daily training experience that keeps goals, workouts, meals, coaching, and progress within reach.",
    items: [
      ["Personal dashboard", "See workouts, messages, booking status, and progress signals in one place.", UserRound],
      ["Workout programs", "Follow structured training plans with clear exercise context.", Dumbbell],
      ["Meal plan support", "Stay consistent with nutrition guidance designed around fitness goals.", ShieldCheck],
    ],
  },
  {
    title: "For Trainers",
    text: "Give coaches a focused operating center for managing relationships and high-value feedback.",
    items: [
      ["Trainer dashboard", "View clients, activity, bookings, video reviews, and messages.", BarChart3],
      ["Booking management", "Accept, decline, and organize session requests with less friction.", CalendarCheck],
      ["Feedback workflows", "Review submitted videos and send coaching notes that clients can act on.", Video],
    ],
  },
  {
    title: "Fitness Tracking",
    text: "Progress becomes easier to understand when workout, BMI, meal, and consistency signals are presented together.",
    items: [
      ["BMI calculator", "Track BMI as part of a broader fitness and wellness picture.", BarChart3],
      ["Workout history", "Measure completed sessions and training consistency over time.", Dumbbell],
      ["Progress views", "Give clients visual feedback that encourages steady habits.", ShieldCheck],
    ],
  },
  {
    title: "Communication",
    text: "Keep coaching conversations connected to the training journey instead of scattered across separate tools.",
    items: [
      ["1-on-1 chat", "Private client-trainer messaging keeps support close to the workout plan.", MessageCircle],
      ["Notifications", "Helpful reminders and updates keep clients aware and accountable.", ShieldCheck],
      ["Session context", "Bookings, messages, and progress create a clearer coaching picture.", CalendarCheck],
    ],
  },
  {
    title: "Video Coaching",
    text: "Video turns remote coaching into a more practical, trust-building experience.",
    items: [
      ["Video submissions", "Clients can upload exercise clips for trainer review.", Video],
      ["Trainer review", "Coaches can respond with focused technique and form feedback.", ShieldCheck],
      ["Live coaching", "Video calls support real-time coaching sessions when needed.", MessageCircle],
    ],
  },
  {
    title: "Security & Account",
    text: "The app is structured around secure sign-in, user profiles, and clear account boundaries.",
    items: [
      ["Secure accounts", "Authentication supports distinct client and trainer experiences.", Lock],
      ["Profile controls", "Users can manage preferences and personal training context.", UserRound],
      ["Service boundaries", "Public app keys stay separate from backend-only secrets.", ShieldCheck],
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main id="main">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Features</span>
          <h1>Premium tools for clients, trainers, and measurable progress</h1>
          <p>
            Crunchtime Fitness Training combines client-facing coaching tools with trainer workflow
            support, making the app feel complete from first sign-in to long-term accountability.
          </p>
        </div>
      </section>

      {groups.map((group) => (
        <Section key={group.title} title={group.title} text={group.text}>
          <div className="feature-grid three">
            {group.items.map(([title, text, icon]) => (
              <FeatureCard
                key={title as string}
                title={title as string}
                text={text as string}
                icon={icon as typeof ShieldCheck}
              />
            ))}
          </div>
        </Section>
      ))}

      <CTASection />
    </main>
  );
}
