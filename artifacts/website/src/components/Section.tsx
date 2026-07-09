import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  text?: string;
  children: ReactNode;
  className?: string;
}

export default function Section({ id, eyebrow, title, text, children, className = "" }: SectionProps) {
  return (
    <section id={id} className={`section ${className}`}>
      <div className="container">
        <div className="section-heading">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
