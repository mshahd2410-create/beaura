"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Browse Artists",
    text: "Explore verified makeup artists by city, style, price, and availability.",
  },
  {
    step: "02",
    title: "Book Securely",
    text: "Select your date and service, then pay securely online to confirm.",
  },
  {
    step: "03",
    title: "Get Glammed",
    text: "Your makeup artist arrives on time, fully prepared for your day.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-light text-center mb-20">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.4 }}
              className="p-8 rounded-3xl bg-white border border-black/5 shadow-sm"
            >
              <span className="text-purple-600 text-sm font-medium">
                {s.step}
              </span>
              <h3 className="text-xl mt-2 mb-3">{s.title}</h3>
              <p className="text-gray-600">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}