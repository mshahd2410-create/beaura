"use client";

import { motion } from "framer-motion";

const items = [
  {
    title: "Carefully Reviewed Artists",
    text:
      "All makeup artists are carefully reviewed with real portfolios, pricing, and availability — no surprises.",
  },
  {
    title: "Secure Booking & Payments",
    text:
      "Book confidently with secure online payments and clear refund policies that protect both sides.",
  },
  {
    title: "Guaranteed Protection",
    text:
      "Last-minute cancellations are covered — either a refund or a trusted replacement is arranged immediately.",
  },
];

export default function WhyBeaura() {
  return (
    <section className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-light text-center mb-20">
          Why Beaura
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {items.map((i, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm"
            >
              <h3 className="text-xl mb-3">{i.title}</h3>
              <p className="text-gray-600 leading-relaxed">{i.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}