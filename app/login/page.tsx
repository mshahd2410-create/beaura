"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    /**
     * IMPORTANT FIX:
     * Use maybeSingle() to avoid Supabase throwing + stalling
     */

    // Check bride
    const { data: bride } = await supabase
      .from("bride_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (bride) {
      router.replace("/bride/home");
      return;
    }

    // Check MUA
    const { data: mua } = await supabase
      .from("mua_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (mua) {
      router.replace("/dashboard/mua");
      return;
    }

    setError("Account exists but profile is not set up yet.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="w-full max-w-md"
      >
        {/* HERO */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Beaura
          </p>

          <h1 className="mt-4 text-4xl font-light tracking-tight text-black">
            Welcome back, beautiful
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            We’re so happy to see you again.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6"
        >
          <div className="space-y-1">
            <label className="text-sm text-gray-600">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-300 px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-300 px-4 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* ✅ FORGOT PASSWORD (UI ONLY) */}
          <div className="text-right">
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-purple-600 transition"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-purple-600 text-white text-sm
            hover:bg-purple-700 transition disabled:opacity-60"
            >
            {loading ? "Signing you in…" : "Continue"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}