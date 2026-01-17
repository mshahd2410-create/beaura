"use client";

const faqs = [
  {
    q: "How do payments work?",
    a: "You pay securely online. The price includes the makeup service plus a 10% Beaura platform fee.",
  },
  {
    q: "What if the makeup artist cancels?",
    a: "You receive a full refund or we immediately arrange a replacement with the same requirements.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Cancellation rules depend on how close the event date is.",
  },
  {
    q: "Is Beaura safe to use?",
    a: "Yes. All makeup artists are verified and payments are processed securely.",
  },
];

export default function FAQ() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-32">
      <h2 className="text-4xl font-light text-center mb-16">
        Questions, Answered
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-black/10 rounded-2xl p-8 bg-white hover:border-black/30 transition"
          >
            <h3 className="text-lg mb-3">{faq.q}</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
