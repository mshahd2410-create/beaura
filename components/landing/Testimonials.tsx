"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    text:
      "Honestly, booking a makeup artist here was way easier than DMing on Instagram.",
    name: "Mariam",
    role: "Bride",
  },
  {
    text:
      "The cancellation protection is a game changer. Finally, a platform that respects our time.",
    name: "Noor",
    role: "Makeup Artist",
  },
  {
    text:
      "Everything was clear from pricing to timing. No awkward conversations.",
    name: "Salma",
    role: "Bride",
  },
];

export default function Testimonials() {
  return (
    <section className="py-32">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-light text-center mb-16">
          Real people, real experiences
        </h2>

        <div className="flex gap-6 overflow-x-auto pb-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="min-w-[320px] p-8 rounded-3xl bg-white border border-black/5 shadow-sm"
            >
              <p className="mb-6 text-gray-700">“{t.text}”</p>
              <div className="text-sm">
                <strong>{t.name}</strong> — {t.role}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}