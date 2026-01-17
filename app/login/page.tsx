"use client";

import { useState } from "react";

export default function LoginPage() {
  const [role, setRole] = useState<"bride" | "mua">("bride");

  return (
    <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl p-10">
        <h1 className="text-3xl font-light text-center mb-8">
          Welcome back, beautiful
        </h1>

        {/* Toggle */}
        <div className="flex border border-black/10 rounded-full mb-8 overflow-hidden">
          <button
            onClick={() => setRole("bride")}
            className={`flex-1 py-2 text-sm transition ${
              role === "bride" ? "bg-black text-white" : ""
            }`}
          >
            Bride
          </button>
          <button
            onClick={() => setRole("mua")}
            className={`flex-1 py-2 text-sm transition ${
              role === "mua" ? "bg-black text-white" : ""
            }`}
          >
            Makeup Artist
          </button>
        </div>

        {/* Form */}
        <form className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-black/10 rounded-xl px-4 py-3 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-black/10 rounded-xl px-4 py-3 outline-none"
          />

          <button
            type="submit"
            className="w-full bg-black text-white rounded-full py-3 hover:opacity-90 transition"
          >
            Log in
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-500">
          Forgot password?
        </div>
      </div>
    </div>
  );
}
