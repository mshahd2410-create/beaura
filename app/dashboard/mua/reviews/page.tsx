"use client";

import { Star, Sparkles } from "lucide-react";

export default function ReviewsPage() {
  return (
    <main className="space-y-6">
      {/* HERO */}
      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(17,16,24,0.05)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-500">
          reviews
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#171018]">
          Client reviews
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6476]">
          This is where your Beaura feedback will live — from sweet bridal notes
          to glowing photoshoot reviews.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard title="Average rating" value="—" subtitle="Will appear once reviews come in" />
        <StatCard title="Total reviews" value="0" subtitle="No published reviews yet" />
        <StatCard title="Repeat clients" value="—" subtitle="Track returning bookings later" />
      </div>

      {/* EMPTY STATE */}
      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(17,16,24,0.05)] sm:p-8">
        <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#FCFBFF] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEFF] text-violet-600">
            <Star size={20} />
          </div>

          <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-[#171018]">
            No reviews yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B6476]">
            Once clients leave feedback after completed bookings, their reviews
            will appear here.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#171018] border border-gray-100">
            <Sparkles size={14} />
            Tip: great communication and punctuality usually help reviews a lot
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-[0_14px_40px_rgba(17,16,24,0.05)]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#7B7388]">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#171018]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#6B6476]">{subtitle}</p>
    </div>
  );
}