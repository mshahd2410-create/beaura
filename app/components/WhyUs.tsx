"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Verified Makeup Artists",
    description:
      "All makeup artists are carefully reviewed with real portfolios, pricing, and availability — no surprises.",
  },
  {
    title: "Secure Booking & Payments",
    description:
      "Book confidently with secure online payments and clear refund policies that protect both sides.",
  },
  {
    title: "Guaranteed Protection",
    description:
      "Last-minute cancellations are covered — either a refund or a trusted replacement is arranged immediately.",
  },
];

export default function WhyUs() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-32">
      <h2 className="text-4xl font-light text-center mb-16">
        Why Beaura
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="p-10 border border-black/10 rounded-2xl bg-white"
          >
            <h3 className="text-xl mb-4">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
