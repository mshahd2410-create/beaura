"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Browse & Choose",
    description:
      "Explore verified makeup artists by city, style, price, and availability.",
  },
  {
    step: "02",
    title: "Book Securely",
    description:
      "Select your date and service, then pay securely online to confirm your booking.",
  },
  {
    step: "03",
    title: "Get Glammed",
    description:
      "Your makeup artist arrives on time, fully prepared for your special day.",
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-32">
      <h2 className="text-4xl font-light text-center mb-20">
        How It Works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-3xl mb-4 text-black/40">
              {step.step}
            </div>
            <h3 className="text-xl mb-3">{step.title}</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
