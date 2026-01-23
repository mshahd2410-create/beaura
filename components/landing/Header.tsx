"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-black/5"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="text-2xl font-semibold tracking-tight">
          Beaura
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="#how-it-works" className="hover:text-purple-600 transition">
            How it works
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full border border-black/10 hover:border-purple-500 hover:text-purple-600 transition"
          >
            Login
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}