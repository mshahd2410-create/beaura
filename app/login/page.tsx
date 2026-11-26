"use client";

import Link from "next/link";
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
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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

    const { data: admin } = await supabase
      .from("admins")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (admin) {
      router.replace("/admin");
      return;
    }

    const { data: bride } = await supabase
      .from("bride_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (bride) {
      router.replace("/bride/home");
      return;
    }

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

  const sendPasswordReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email address first, then choose Forgot password.");
      setResetMessage(null);
      return;
    }
    setError(null);
    setResetMessage(null);
    setResetLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setResetMessage("If an account exists for this email, a password reset link is on its way. Check your inbox and spam folder.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "We couldn't send the reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fffafc] px-4 py-10 text-[#171018]">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-4xl font-light tracking-[-0.08em]">
            Beaura
          </Link>

          <Link
            href="/register"
            className="rounded-full border border-[#eadff5] bg-white px-5 py-2 text-sm hover:border-purple-300"
          >
            Sign up
          </Link>
        </div>

        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-[0_25px_80px_rgba(88,28,135,0.12)] md:p-9"
        >
          <header className="mb-8 text-center">
            <p className="mx-auto mb-4 w-fit rounded-full bg-[#f7efff] px-4 py-2 text-xs uppercase tracking-[0.18em] text-purple-700">
              Your Beaura account
            </p>

            <h1 className="text-4xl font-light tracking-[-0.06em]">
              Welcome back.
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-[#6f6077]">
              Sign in to manage bookings, browse artists, or keep your Beaura
              profile glowing.
            </p>
          </header>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-[#554a5c]">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm outline-none transition focus:border-purple-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#554a5c]">
                Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 text-sm outline-none transition focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8a7d91]">Access your Beaura account.</span>

              <button
                type="button"
                onClick={sendPasswordReset}
                disabled={resetLoading}
                className="text-purple-700 hover:underline disabled:opacity-50"
              >
                {resetLoading ? "Sending link..." : "Forgot password?"}
              </button>
            </div>

            {resetMessage && <p role="status" className="rounded-2xl bg-purple-50 p-4 text-center text-sm text-purple-800">{resetMessage}</p>}

            {error && (
              <p className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-purple-600 py-4 text-sm text-white transition hover:bg-purple-700 disabled:opacity-60"
            >
              {loading ? "Signing you in..." : "Sign in"}
            </button>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 text-center text-xs">
            <Link
              href="/register/bride"
              className="rounded-2xl bg-[#fff7fb] px-4 py-3 text-[#6f6077] hover:text-purple-700"
            >
              Looking for an artist?
            </Link>

            <Link
              href="/register/mua"
              className="rounded-2xl bg-[#fff7fb] px-4 py-3 text-[#6f6077] hover:text-purple-700"
            >
              Makeup artist?
            </Link>
          </div>
        </motion.form>
      </div>
    </main>
  );
}