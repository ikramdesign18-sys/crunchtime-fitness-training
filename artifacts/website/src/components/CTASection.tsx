import AppLink from "./Link";

export default function CTASection() {
  return (
    <section className="final-cta">
      <div className="container cta-panel">
        <span className="eyebrow">Ready for a smarter coaching experience?</span>
        <h2>Start your fitness journey with smarter coaching</h2>
        <p>
          Bring workouts, meal planning, tracking, bookings, trainer feedback, and live coaching into
          one polished experience.
        </p>
        <AppLink className="button primary" href="/#contact">
          Get Started
        </AppLink>
      </div>
    </section>
  );
}
