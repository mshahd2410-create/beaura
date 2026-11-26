"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setHasRecoverySession(true);
        setError(null);
      } else if (session) {
        setHasRecoverySession(true);
      }
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (data.session) {
        setHasRecoverySession(true);
      } else if (sessionError) {
        setError("We couldn't verify this reset link. Request a new one from the sign-in page.");
      } else {
        setError("This password reset link is invalid or has expired. Request a new link from the sign-in page.");
      }
      setReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError(null);

    if (!hasRecoverySession) {
      setError("Your reset link is invalid or has expired. Request a new one from the sign-in page.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      window.setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffafc] px-5 py-16 text-[#171018]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-3xl font-light tracking-[-0.08em]">Beaura</Link>
        <p className="mt-10 text-xs uppercase tracking-[0.2em] text-purple-700">Account security</p>
        <h1 className="mt-3 text-4xl font-light tracking-[-0.06em]">Set a new password.</h1>
        <p className="mt-3 text-sm leading-7 text-[#6f6077]">Choose a new password for your Beaura account.</p>
        {!ready ? (
          <p className="mt-8 text-sm text-[#6f6077]">Checking your reset link...</p>
        ) : success ? (
          <div role="status" className="mt-8 rounded-2xl bg-purple-50 p-5 text-sm leading-6 text-purple-800">Your password has been updated. Taking you to sign in...</div>
        ) : !hasRecoverySession ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm leading-6 text-red-700">
            {error ?? "This password reset link is invalid or has expired."}
            <Link href="/login" className="mt-3 block font-medium underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              New password
              <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 outline-none focus:border-purple-500" />
            </label>
            <label className="block text-sm">
              Confirm new password
              <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#eadff5] bg-[#fffafc] px-4 py-3 outline-none focus:border-purple-500" />
            </label>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={saving || !ready} className="w-full rounded-full bg-[#171018] px-6 py-4 text-sm text-white disabled:opacity-50">
              {saving ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
