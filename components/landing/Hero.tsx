"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="pt-40 pb-32">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-5xl md:text-6xl font-light tracking-tight"
        >
          Where your glam begins
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto"
        >
          Discover makeup artists you genuinely love and book with ease.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Bride */}
          <Link href="/register/bride">
            <button className="px-8 py-4 rounded-full bg-purple-600 text-white text-sm tracking-wide hover:bg-purple-700 transition">
              Let’s get you glammed
            </button>
          </Link>

          {/* MUA */}
          <Link href="/register/mua">
            <button className="px-8 py-4 rounded-full border border-black/20 text-sm tracking-wide hover:bg-black hover:text-white transition">
              Let’s get you clients
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}