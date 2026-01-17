"use client";

import { motion } from "framer-motion";

export default function Guarantee() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-32">
      <h2 className="text-4xl font-light text-center mb-20">
        The Beaura Guarantee
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Makeup Artists */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="p-10 border border-black/10 rounded-2xl bg-white"
        >
          <h3 className="text-2xl mb-4">For Makeup Artists</h3>
          <p className="text-gray-600 leading-relaxed">
            If a bride cancels within <strong>7 days</strong> before the event
            or doesn’t show up, you receive
            <strong> 25% of your quoted service price</strong>.
            <br /><br />
            Your time is respected and protected no last-minute losses.
          </p>
        </motion.div>

        {/* Brides */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="p-10 border border-black/10 rounded-2xl bg-white"
        >
          <h3 className="text-2xl mb-4">For Brides</h3>
          <p className="text-gray-600 leading-relaxed">
            If your makeup artist cancels within <strong>7 days</strong>
             or doesn’t show up, you receive a
            <strong> full refund</strong>.
            <br /><br />
            Or we immediately arrange a
            <strong> replacement artist</strong> with the same
            city, style, and budget.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
