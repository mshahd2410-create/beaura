"use client";

const faqs = [
  {
    q: "How do payments work?",
    a: "Available payment methods and the full price breakdown are shown during checkout. Review the service price, any platform fee, taxes and deposit before you submit your booking.",
  },
  {
    q: "What if the makeup artist cancels?",
    a: "You will receive a cancellation update. Any refund is handled according to the booking cancellation terms and payment method. Contact Beaura support if you need help.",
  },
  {
    q: "Can I cancel my booking?",
    a: "You can request cancellation from your booking page when the option is available. Any refund or cancellation amount depends on the booking terms and timing.",
  },
  {
    q: "Is Beaura safe?",
    a: "Artist profiles are reviewed before they are listed as verified. Review an artist’s profile and booking details, and use the payment methods shown inside Beaura.",
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