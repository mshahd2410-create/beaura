"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function BrideAccount() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setEmail(user.email || "");
    setFirstName(user.user_metadata?.first_name || "");
    setLastName(user.user_metadata?.last_name || "");

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/");
  }

  async function saveProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile updated ✨");
  }

  async function resetPassword() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return;

    const { error } = await supabase.auth.resetPasswordForEmail(
      user.email,
      {
        redirectTo: "http://localhost:3000/reset-password",
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password reset email sent ✨");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">
          Loading account…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-32">
      {/* HERO */}
      <section className="max-w-4xl mx-auto pt-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-purple-400">
            Your space
          </p>

          <h1 className="mt-3 text-5xl font-extrabold tracking-tight">
            Account ✨
          </h1>

          <p className="mt-3 text-sm text-gray-500 max-w-md">
            Manage your personal information, payments,
            and account preferences.
          </p>
        </motion.div>
      </section>

      {/* PERSONAL INFO */}
      <section className="max-w-4xl mx-auto mt-14">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Personal Information
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Update your profile details.
              </p>
            </div>

            <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">
              💜
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* FIRST NAME */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">
                First name
              </label>

              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm
                focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* LAST NAME */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">
                Last name
              </label>

              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-12 rounded-2xl border border-gray-200 px-4 text-sm
                focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-gray-600">
                Email address
              </label>

              <input
                value={email}
                disabled
                className="w-full h-12 rounded-2xl border border-gray-100 bg-gray-50 px-4 text-sm text-gray-400"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            className="mt-8 h-12 px-6 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-700 transition"
          >
            Save Changes
          </button>
        </div>
      </section>

      {/* PAYMENT METHODS */}
      <section className="max-w-4xl mx-auto mt-8">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Payment Methods
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Securely manage your saved cards.
              </p>
            </div>

            <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">
              💳
            </div>
          </div>

          <div
            className="rounded-3xl border border-dashed border-gray-200
            p-10 text-center bg-gray-50"
          >
            <p className="text-lg font-medium">
              No payment methods yet
            </p>

            <p className="text-sm text-gray-500 mt-2">
              Payment methods will appear here once
              payment integration is live.
            </p>

            <button
              className="mt-6 h-11 px-5 rounded-full border border-gray-300
              text-sm hover:border-purple-600 hover:text-purple-600 transition"
            >
              Add Payment Method
            </button>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="max-w-4xl mx-auto mt-8">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Security
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Keep your account secure.
              </p>
            </div>

            <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">
              🔒
            </div>
          </div>

          <div className="space-y-4">
            {/* CHANGE PASSWORD */}
            <button
              onClick={resetPassword}
              className="w-full h-14 rounded-2xl border border-gray-200
              px-5 flex items-center justify-between text-sm
              hover:border-purple-500 transition"
            >
              <span>Change Password</span>
              <span>→</span>
            </button>

            {/* PRIVACY */}
            <Link
              href="/policy"
              className="w-full h-14 rounded-2xl border border-gray-200
              px-5 flex items-center justify-between text-sm
              hover:border-purple-500 transition"
            >
              <span>Privacy Settings</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="max-w-4xl mx-auto mt-8">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Support & Policies
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Need help? We're here for you.
              </p>
            </div>

            <div className="h-14 w-14 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">
              ✨
            </div>
          </div>

          <div className="space-y-4">
            {/* TERMS */}
            <Link
              href="/terms"
              className="w-full h-14 rounded-2xl border border-gray-200
              px-5 flex items-center justify-between text-sm
              hover:border-purple-500 transition"
            >
              <span>Terms & Conditions</span>
              <span>→</span>
            </Link>

            {/* POLICY */}
            <Link
              href="/policy"
              className="w-full h-14 rounded-2xl border border-gray-200
              px-5 flex items-center justify-between text-sm
              hover:border-purple-500 transition"
            >
              <span>Refund Policy</span>
              <span>→</span>
            </Link>

            {/* CONTACT */}
            <a
              href="mailto:support@beaura.co"
              className="w-full h-14 rounded-2xl border border-gray-200
              px-5 flex items-center justify-between text-sm
              hover:border-purple-500 transition flex"
            >
              <span>Contact Support</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* LOGOUT */}
      <section className="max-w-4xl mx-auto mt-8">
        <button
          onClick={handleLogout}
          className="w-full h-14 rounded-full bg-black text-white text-sm hover:opacity-90 transition"
        >
          Logout
        </button>
      </section>
    </main>
  );
}