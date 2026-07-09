import { faqItems } from "@/data";

export default function FAQ() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Questions clients ask</span>
          <h2>Practical answers before you launch</h2>
        </div>
        <div className="faq-grid">
          {faqItems.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
