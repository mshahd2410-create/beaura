"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-6">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-light text-center mb-12">
          Join Beaura
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bride */}
          <Link
            href="/register/bride"
            className="group border border-black/10 rounded-2xl p-10 hover:border-black transition"
          >
            <h2 className="text-2xl font-medium mb-4">
              I’m a Bride
            </h2>
            <p className="text-gray-600 mb-6">
              Find and book trusted makeup artists for your big day.
            </p>
            <span className="text-sm underline group-hover:opacity-80">
              Register as Bride →
            </span>
          </Link>

          {/* MUA */}
          <Link
            href="/register/mua"
            className="group border border-black/10 rounded-2xl p-10 hover:border-black transition"
          >
            <h2 className="text-2xl font-medium mb-4">
              I’m a Makeup Artist
            </h2>
            <p className="text-gray-600 mb-6">
              Get booked, get paid, and grow your business.
            </p>
            <span className="text-sm underline group-hover:opacity-80">
              Register as Makeup Artist →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
