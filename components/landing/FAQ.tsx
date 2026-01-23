"use client";

const faqs = [
  {
    q: "How do payments work?",
    a: "You pay securely online. The price includes the makeup service plus a 10% Beaura platform fee.",
  },
  {
    q: "What if the makeup artist cancels?",
    a: "You receive a full refund or an immediate replacement with the same requirements.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes. Cancellation rules depend on how close it is to your event date.",
  },
  {
    q: "Is Beaura safe?",
    a: "Yes. All artists are verified and payments are processed securely.",
  },
];

export default function FAQ() {
  return (
    <section className="py-32">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-light text-center mb-16">
          Questions, answered
        </h2>

        <div className="space-y-6">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-black/5"
            >
              <h3 className="mb-2">{f.q}</h3>
              <p className="text-gray-600">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}