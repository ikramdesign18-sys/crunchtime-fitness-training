interface PhoneMockupProps {
  title: string;
  eyebrow: string;
  metric: string;
  detail: string;
  rows: string[];
}

export default function PhoneMockup({ title, eyebrow, metric, detail, rows }: PhoneMockupProps) {
  return (
    <article className="phone-mockup" aria-label={`${title} app preview`}>
      <div className="phone-speaker" />
      <div className="phone-screen">
        <div className="mock-header">
          <span>{eyebrow}</span>
          <strong>{title}</strong>
        </div>
        <div className="mock-metric">
          <strong>{metric}</strong>
          <span>{detail}</span>
        </div>
        <div className="mock-chart">
          <i style={{ height: "42%" }} />
          <i style={{ height: "68%" }} />
          <i style={{ height: "54%" }} />
          <i style={{ height: "82%" }} />
          <i style={{ height: "74%" }} />
        </div>
        <div className="mock-list">
          {rows.map((row) => (
            <div key={row}>
              <span />
              <p>{row}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
