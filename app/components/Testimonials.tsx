"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Mariam",
    role: "Bride",
    text: "Honestly, booking a makeup artist here was way easier than DMing on Instagram 😭",
  },
  {
    name: "Nour",
    role: "Makeup Artist",
    text: "The cancellation protection is a game changer. Finally a platform that respects our time.",
  },
  {
    name: "Salma",
    role: "Bride",
    text: "I loved that I could see prices and availability clearly. No awkward conversations.",
  },
  {
    name: "Aya",
    role: "Makeup Artist",
    text: "Beaura feels modern and fair. I’d rather take bookings here than WhatsApp.",
  },
];

export default function Testimonials() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-32">
      <h2 className="text-4xl font-light text-center mb-16">
        Real People. Real Experiences.
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {testimonials.map((t, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            viewport={{ once: true }}
            className="bg-white border border-black/10 rounded-2xl p-6 flex flex-col justify-between"
          >
            <p className="text-gray-700 text-sm mb-6 leading-relaxed">
              “{t.text}”
            </p>

            <div className="text-xs text-gray-500">
              <span className="font-medium text-black">{t.name}</span> · {t.role}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
