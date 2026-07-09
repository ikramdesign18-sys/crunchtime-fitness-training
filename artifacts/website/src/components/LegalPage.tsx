import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  intro: string;
  children: ReactNode;
}

export default function LegalPage({ title, intro, children }: LegalPageProps) {
  return (
    <main id="main" className="legal-main">
      <section className="legal-hero">
        <div className="container">
          <span className="eyebrow">Crunchtime Fitness Training</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </section>
      <section className="section legal-section">
        <div className="container legal-content">{children}</div>
      </section>
    </main>
  );
}
