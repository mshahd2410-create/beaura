"use client";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* HEADER */}
        <section className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            About Beaura ✨
          </h1>

          <p className="text-sm text-gray-500">
            A simpler, safer, and more beautiful way to book makeup artists.
          </p>
        </section>

        {/* STORY */}
        <section className="space-y-4 text-gray-700 leading-relaxed text-sm">
          <p>
            Beaura was created because getting ready for your big day should feel
            exciting — not stressful.
          </p>

          <p>
            We saw brides spending hours scrolling through Instagram, texting
            multiple makeup artists, asking about prices, availability, and
            still feeling unsure about who to trust.
          </p>

          <p>
            So we built Beaura — a platform that brings everything into one place:
            trusted makeup artists, clear pricing, real availability, and secure
            bookings.
          </p>
        </section>

        {/* WHAT MAKES US DIFFERENT */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Why Beaura exists 💜</h2>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              We believe every bride deserves to feel safe, confident, and
              beautiful on her special day — without the chaos of endless
              searching.
            </p>

            <p>
              For makeup artists, we also wanted something better — a way to
              get real clients, grow their reputation, and build trust through
              a fair and transparent system.
            </p>

            <p>
              Beaura is not just a booking platform. It’s a space where beauty
              professionals and brides meet with clarity, trust, and ease.
            </p>
          </div>
        </section>

        {/* PROMISE */}
        <section className="p-6 rounded-2xl bg-purple-50 border border-purple-100 space-y-3">
          <h3 className="text-lg font-semibold text-purple-700">
            Our promise ✨
          </h3>

          <p className="text-sm text-purple-600 leading-relaxed">
            We make sure every booking is secure, every artist is accountable,
            and every bride feels taken care of — from the first click to the
            final look.
          </p>
        </section>

        {/* CLOSING */}
        <section className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Beaura is just getting started — and you’re part of it.
          </p>

          <p className="text-xs text-gray-400">
            Made with love in Egypt 💜
          </p>
        </section>

      </div>
    </main>
  );
}