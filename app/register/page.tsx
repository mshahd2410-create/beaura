"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffafc] px-4 pb-14 pt-20 text-[#171018] sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
      <section className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-8">
        <div className="rounded-[2rem] border border-[#eadff5] bg-white p-5 text-center shadow-sm sm:rounded-[2.5rem] sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-purple-700 sm:text-xs">
            join beaura
          </p>

          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-light leading-[0.95] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
            Choose your glow path.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#6f6077]">
            Whether you’re booking a makeup artist or growing your beauty
            business, Beaura keeps it simple, pretty, and protected.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RegisterCard
            href="/register/bride"
            label="For beauty lovers"
            title="I want to book makeup"
            text="Find verified makeup artists for bridal, engagement, soirée, shoots, and special days."
            cta="Create client account"
          />

          <RegisterCard
            href="/register/mua"
            label="For artists"
            title="I’m a makeup artist"
            text="Create your profile, upload your portfolio, list your services, and start receiving bookings."
            cta="Create artist account"
          />
        </div>

        <div className="rounded-[1.7rem] border border-[#eadff5] bg-[#f7efff] p-5 text-center sm:rounded-[2rem]">
          <p className="text-sm leading-6 text-[#6f6077]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#171018] underline">
              Sign in here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function RegisterCard({
  href,
  label,
  title,
  text,
  cta,
}: {
  href: string;
  label: string;
  title: string;
  text: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[2rem] border border-[#eadff5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-[2.3rem] sm:p-8"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171018] text-white sm:h-12 sm:w-12">
        <Sparkles size={18} />
      </div>

      <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-purple-700 sm:mt-7 sm:text-xs">
        {label}
      </p>

      <h2 className="mt-3 text-3xl font-light leading-none tracking-[-0.06em] text-[#171018] sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-sm leading-7 text-[#6f6077]">{text}</p>

      <div className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#171018] px-5 py-3 text-sm font-medium text-white transition group-hover:opacity-90 sm:mt-8 sm:w-auto">
        {cta}
        <ArrowRight size={16} />
      </div>
    </Link>
  );
}