"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function MuaApprovalBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovalState();
  }, []);

  async function loadApprovalState() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("mua_profiles")
      .select("verified")
      .eq("id", user.id)
      .single();

    setShow(data?.verified === false);
    setLoading(false);
  }

  if (loading || !show) return null;

  return (
    <div className="mb-6 rounded-3xl border border-black/10 bg-gradient-to-r from-[#fff7fb] to-[#faf7ff] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white text-lg">
          ✦
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-[0.02em] text-black">
            Your account is pending approval
          </h3>
          <p className="text-sm leading-6 text-gray-600">
            We’re currently reviewing your profile, portfolio, and details.
            Approval usually takes <span className="font-semibold text-black">2–3 business days</span>.
            You can still explore your dashboard and update your profile while you wait.
          </p>
        </div>
      </div>
    </div>
  );
}