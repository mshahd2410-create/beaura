"use client";

import { useState } from "react";

const brideFaqs = [
  {
    q: "How do I book a makeup artist?",
    a: "Choose an artist, select your date and service, then complete payment. The booking is confirmed once the MUA accepts.",
  },
  {
    q: "Is my booking guaranteed?",
    a: "Yes, once payment is made and the MUA accepts your booking, it is secured.",
  },
  {
    q: "What happens if the MUA cancels?",
    a: "You will receive a full refund or a replacement MUA with similar style and price if available.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes, cancellation depends on timing. Refund rules apply based on how close the event is.",
  },
  {
    q: "How do refunds work?",
    a: "Refunds depend on cancellation timing. Platform fee is non-refundable in most cases.",
  },
  {
    q: "Can I trust the makeup artists?",
    a: "All MUAs have profiles, reviews, and portfolio images to help you choose safely.",
  },
  {
    q: "Can I message the artist before booking?",
    a: "Yes, you can message MUAs through the platform before confirming your booking.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Payments are processed securely through our payment provider (Paymob).",
  },
  {
    q: "Do you store my card details?",
    a: "No, Beaura does not store any card information.",
  },
  {
    q: "Can I change my booking date?",
    a: "Yes, but only if the MUA approves the new date.",
  },
  {
    q: "What if I’m late or change plans?",
    a: "You should contact the MUA through the platform as soon as possible.",
  },
  {
    q: "Are prices fixed?",
    a: "Each MUA sets their own prices, which are clearly displayed.",
  },
  {
    q: "Why is there a platform fee?",
    a: "The 10% fee supports secure payments, platform safety, and customer protection.",
  },
  {
    q: "Can I leave a review?",
    a: "Yes, after your service is completed you can leave a review.",
  },
  {
    q: "Can I remove a review later?",
    a: "Reviews cannot be removed unless they violate platform rules.",
  },
];

const muaFaqs = [
  {
    q: "How do I get paid?",
    a: "Payments are processed via Paymob and released within 1–5 business days after completion.",
  },
  {
    q: "How much do I earn?",
    a: "You receive 90% of the service price. Beaura keeps a 10% platform fee.",
  },
  {
    q: "What happens if the bride cancels?",
    a: "Depending on timing, you may receive compensation (up to 25% of service price).",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes, but cancellations may affect your account rating and future visibility.",
  },
  {
    q: "Can I choose my own prices?",
    a: "Yes, you fully control your pricing.",
  },
  {
    q: "How do I get more clients?",
    a: "Better ratings, availability, and profile quality increase your visibility.",
  },
  {
    q: "Do I need to be verified?",
    a: "Beaura may request verification to ensure trust and safety.",
  },
  {
    q: "Can I work in multiple cities?",
    a: "Yes, you can select all cities you are available in.",
  },
  {
    q: "What if I don’t show up?",
    a: "No-shows may result in penalties or account suspension.",
  },
  {
    q: "Can I talk to clients outside Beaura?",
    a: "No, all communication must stay inside the platform.",
  },
  {
    q: "How do reviews work?",
    a: "Brides leave reviews after completion which affect your rating.",
  },
  {
    q: "Can I delete bad reviews?",
    a: "No, only false or abusive reviews can be reported.",
  },
  {
    q: "What is the MUA tier system?",
    a: "It’s a trust system that unlocks faster payouts as you complete more bookings.",
  },
  {
    q: "What happens if I get suspended?",
    a: "You may lose access to bookings and payouts depending on the violation.",
  },
  {
    q: "How do I improve my ranking?",
    a: "Keep high ratings, avoid cancellations, and maintain active availability.",
  },
];

function Accordion({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-100 rounded-2xl overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex justify-between items-center p-4 text-left"
          >
            <span className="text-sm font-medium">{item.q}</span>
            <span className="text-gray-400">
              {open === i ? "−" : "+"}
            </span>
          </button>

          {open === i && (
            <div className="px-4 pb-4 text-sm text-gray-600">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-4xl mx-auto space-y-16">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">FAQs</h1>
          <p className="text-sm text-gray-500">
            Everything you need to know about Beaura
          </p>
        </div>

        {/* BRIDES */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">For Brides 💍</h2>
          <Accordion items={brideFaqs} />
        </section>

        {/* MUAs */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">For Makeup Artists 💄</h2>
          <Accordion items={muaFaqs} />
        </section>

      </div>
    </main>
  );
}