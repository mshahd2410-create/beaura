"use client";

import { supabase } from "@/lib/supabaseClient";

export default function BrideAccount() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl">Account</h1>

      <button
        onClick={() => supabase.auth.signOut()}
        className="border px-6 py-3 rounded-full"
      >
        Logout
      </button>
    </div>
  );
}