import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  MessageCircle,
  PlaySquare,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import FeatureCard from "@/components/FeatureCard";
import AppLink from "@/components/Link";
import PhoneMockup from "@/components/PhoneMockup";
import Section from "@/components/Section";
import {
  clientFeatures,
  featureHighlights,
  phoneScreens,
  trainerFeatures,
  trustBadges,
} from "@/data";

const steps = [
  "Create your fitness profile",
  "Follow workouts and meal plans",
  "Track BMI and progress",
  "Book sessions, chat, submit videos, and get trainer feedback",
];

const statCards = [
  { label: "BMI", value: "23.8", sub: "Stable trend", icon: HeartPulse },
  { label: "Workouts", value: "18", sub: "This month", icon: Dumbbell },
  { label: "Meals", value: "91%", sub: "Plan adherence", icon: Sparkles },
  { label: "Progress", value: "+12%", sub: "Consistency lift", icon: BarChart3 },
];

export default function HomePage() {
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <div className="hero-device hero-device-one">
            <PhoneMockup {...phoneScreens[0]} />
          </div>
          <div className="hero-device hero-device-two">
            <PhoneMockup {...phoneScreens[6]} />
          </div>
        </div>
        <div className="container hero-content">
          <span className="eyebrow">Premium coaching app for clients and trainers</span>
          <h1>Crunchtime Fitness Training</h1>
          <p className="hero-lede">
            A polished mobile fitness platform for coaching, workouts, meal plans, BMI tracking,
            progress insights, video submissions, bookings, live coaching, and trainer feedback.
          </p>
          <div className="hero-actions">
            <AppLink className="button primary" href="#contact">
              Get Started
            </AppLink>
            <AppLink className="button secondary" href="/features">
              View Features
            </AppLink>
          </div>
          <div className="trust-badges" aria-label="Product highlights">
            {trustBadges.map((badge) => (
              <span key={badge}>
                <CheckCircle2 size={16} />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Section
        eyebrow="Feature highlights"
        title="Everything a modern coaching business needs"
        text="Crunchtime brings client habits, trainer operations, and coaching touchpoints into a single premium app experience."
      >
        <div className="feature-grid">
          {featureHighlights.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="How it works"
        title="From first profile to accountable progress"
        text="A clear four-step coaching flow keeps clients moving and trainers focused."
      >
        <div className="steps-grid">
          {steps.map((step, index) => (
            <article className="step-card" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </Section>

      <section className="section split-section">
        <div className="container split-grid">
          <div>
            <span className="eyebrow">Client app</span>
            <h2>A premium fitness companion for every client</h2>
            <p>
              Clients get a personalized dashboard for workouts, BMI tracking, meal plans, progress,
              chat, booking, video submission, and live coaching. The experience feels focused,
              structured, and built for consistency.
            </p>
            <div className="pill-list">
              {clientFeatures.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="phone-stack">
            <PhoneMockup {...phoneScreens[1]} />
            <PhoneMockup {...phoneScreens[2]} />
          </div>
        </div>
      </section>

      <section className="section split-section alt">
        <div className="container split-grid reverse">
          <div className="dashboard-preview">
            <div className="dashboard-top">
              <span>Trainer dashboard</span>
              <strong>Client intelligence</strong>
            </div>
            {trainerFeatures.map((item, index) => (
              <div className="dashboard-row" key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
                <i />
              </div>
            ))}
          </div>
          <div>
            <span className="eyebrow">Trainer side</span>
            <h2>Coach with clarity, not scattered tools</h2>
            <p>
              Trainers can view clients, manage bookings, respond to messages, review video
              submissions, give feedback, track progress, and start live calls from one refined
              operating surface.
            </p>
            <div className="icon-list">
              <span>
                <MessageCircle size={18} /> Messaging
              </span>
              <span>
                <CalendarCheck size={18} /> Bookings
              </span>
              <span>
                <Video size={18} /> Video review
              </span>
            </div>
          </div>
        </div>
      </section>

      <Section
        eyebrow="Video coaching"
        title="Feedback that turns training into coaching"
        text="Clients can submit exercise videos, trainers can review form and send feedback, and live calls support higher-touch coaching sessions."
      >
        <div className="video-panel">
          <div className="video-window">
            <div className="play-orb">
              <PlaySquare size={34} />
            </div>
          </div>
          <div className="video-copy">
            {[
              "Exercise video submissions for practical form review",
              "Trainer feedback that stays connected to the client profile",
              "Live video calls available for coaching sessions",
            ].map((item) => (
              <p key={item}>
                <ShieldCheck size={18} />
                {item}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Progress and tracking"
        title="Beautiful accountability for every training habit"
        text="Show BMI, progress, workouts, meals, and consistency in clean visual blocks clients can understand at a glance."
      >
        <div className="stats-grid">
          {statCards.map(({ label, value, sub, icon: StatIcon }) => {
            return (
              <article className="stat-card" key={label}>
                <StatIcon size={22} />
                <strong>{value}</strong>
                <span>{label}</span>
                <p>{sub}</p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section
        eyebrow="App screens"
        title="A polished preview of the mobile experience"
        text="Designed phone-style previews show how the app feels across client and trainer workflows."
      >
        <div className="mockup-grid">
          {phoneScreens.map((screen) => (
            <PhoneMockup key={screen.title} {...screen} />
          ))}
        </div>
      </Section>

      <FAQ />

      <section id="contact" className="section contact-section">
        <div className="container contact-grid">
          <div>
            <span className="eyebrow">Contact</span>
            <h2>Bring Crunchtime Fitness Training to your coaching brand</h2>
            <p>
              Use this marketing site to introduce the app, explain the client and trainer
              experience, and prepare the product for demos or launch conversations.
            </p>
          </div>
          <div className="contact-card">
            <p>For inquiries, customization, or launch planning:</p>
            <a href="mailto:hello@crunchtimefitness.example">hello@crunchtimefitness.example</a>
          </div>
        </div>
      </section>

      <CTASection />
    </main>
  );
}
