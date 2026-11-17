"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fffafc] text-[#171018]">
      <section className="relative overflow-hidden bg-[#f1e5ff] px-6 py-24 sm:py-32">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#ffe3ef] blur-3xl"/>
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">About Beaura</p>
          <h1 className="mt-6 max-w-4xl text-6xl font-light leading-[0.92] tracking-[-0.08em] sm:text-8xl">A better way to find your makeup artist.</h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-[#655968]">Beaura brings makeup artists and the people looking to book them together. Explore portfolios, compare services and prices, and manage your booking in one place.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[0.8fr_1.2fr]">
        <div><p className="text-xs uppercase tracking-[0.2em] text-purple-700">Why we built it</p><h2 className="mt-4 text-4xl font-light leading-tight tracking-[-0.06em]">Finding the right artist should feel exciting, not complicated.</h2></div>
        <div className="space-y-5 text-sm leading-8 text-[#6f6077]">
          <p>Finding a makeup artist often means searching through social media, sending messages to ask about prices, and trying to keep track of dates and replies.</p>
          <p>Beaura gives clients one place to discover makeup artists, view their work, check the services they offer, and send booking requests.</p>
          <p>For makeup artists, Beaura provides a profile to present their portfolio, list services and prices, and manage booking requests.</p>
        </div>
      </section>
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[
            ["Discover","Browse artist portfolios and find makeup services for your occasion."],
            ["Compare","Review locations, service details and prices before you request a booking."],
            ["Manage","Keep booking information and updates together in your Beaura account."]
          ].map(([title,text],i)=><div key={title} className="rounded-[2rem] border border-[#eadff5] bg-[#fffafc] p-7"><span className="text-sm text-purple-700">0{i+1}</span><h3 className="mt-10 text-3xl font-light tracking-[-0.05em]">{title}</h3><p className="mt-4 text-sm leading-7 text-[#6f6077]">{text}</p></div>)}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-700">Made in Egypt</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-5xl font-light tracking-[-0.07em]">Beauty bookings, with more clarity from the start.</h2>
        <Link href="/register" className="mt-8 inline-flex rounded-full bg-[#171018] px-8 py-4 text-sm text-white transition hover:bg-purple-700">Get started with Beaura</Link>
      </section>
    </main>
  );
}
