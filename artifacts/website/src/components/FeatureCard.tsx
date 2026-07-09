import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  text: string;
  icon: LucideIcon;
}

export default function FeatureCard({ title, text, icon: Icon }: FeatureCardProps) {
  return (
    <article className="feature-card">
      <div className="feature-icon">
        <Icon size={22} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
