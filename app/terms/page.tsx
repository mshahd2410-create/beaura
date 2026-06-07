"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-4xl mx-auto space-y-16">

        {/* HEADER */}
        <section>
          <h1 className="text-4xl font-bold tracking-tight">
            Terms & Policies
          </h1>
          <p className="text-sm text-gray-500 mt-3">
            Last updated: 1 January 2026
          </p>

          <p className="text-sm text-gray-600 mt-6 leading-relaxed">
            Welcome to Beaura — a beauty marketplace that connects brides with professional makeup artists across Egypt.
            By using Beaura, you agree to the terms below. Please read them carefully.
          </p>
        </section>

        {/* BRIDES TERMS */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">1. Terms for Brides</h2>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">

            <p>
              <strong>Eligibility:</strong> You must be 18+ or supervised by a guardian.
            </p>

            <p>
              <strong>Bookings:</strong> A booking is only confirmed after payment and acceptance by the makeup artist.
            </p>

            <p>
              <strong>Payments:</strong> You are charged the service price + 10% platform fee.
              Payments are securely processed via third-party providers (e.g. Paymob).
            </p>

            <p>
              <strong>Refunds:</strong><br />
              • Cancel more than 7 days before event → partial refund (platform fee non-refundable)<br />
              • Cancel within 7 days → 25% goes to MUA, remainder refunded<br />
              • Same-day cancellation / no-show → no refund<br />
              • MUA cancellation → full refund or replacement artist if available
            </p>

            <p>
              <strong>Communication:</strong> All communication must remain on Beaura. Off-platform arrangements are not protected.
            </p>

            <p>
              <strong>Reviews:</strong> You may leave honest reviews after service. Fake or abusive reviews are prohibited.
            </p>

            <p>
              <strong>Disclaimer:</strong> Beaura is not responsible for service quality, delays, or allergic reactions.
            </p>
          </div>
        </section>

        {/* MUAS TERMS */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">2. Terms for Makeup Artists</h2>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">

            <p>
              <strong>Eligibility:</strong> Must be 18+, provide accurate information, and operate legally.
            </p>

            <p>
              <strong>Status:</strong> You are an independent contractor, not an employee of Beaura.
            </p>

            <p>
              <strong>Payments:</strong> MUAs receive 90% of the service price. Payments are processed after completion via Paymob within 1–5 business days.
            </p>

            <p>
              <strong>Cancellations:</strong><br />
              • Bride cancels within 7 days → MUA receives 25% compensation<br />
              • MUA cancels → full refund to bride + possible penalties<br />
              • Repeated cancellations → account suspension
            </p>

            <p>
              <strong>Conduct:</strong> You must maintain professionalism, hygiene, punctuality, and respectful communication at all times.
            </p>

            <p>
              <strong>Platform rules:</strong> Taking clients off-platform, bypassing payments, or sharing personal contact details for external booking is strictly prohibited.
            </p>

            <p>
              <strong>Verification:</strong> Beaura may request ID or portfolio verification at any time.
            </p>
          </div>
        </section>

        {/* PLATFORM POLICY */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">3. Platform Policy</h2>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">

            <p>
              <strong>Payments:</strong> All payments are securely processed. Beaura charges a 10% platform fee.
            </p>

            <p>
              <strong>Safety:</strong> Harassment, discrimination, or unsafe behavior results in immediate removal.
            </p>

            <p>
              <strong>Disputes:</strong> Must be reported within 48–72 hours after the event. Final decisions are made by Beaura.
            </p>

            <p>
              <strong>Substitutions:</strong> If a MUA cancels, Beaura may provide an alternative artist of similar price and style.
            </p>

            <p>
              <strong>Data:</strong> We protect user data and do not sell personal information.
            </p>

            <p>
              <strong>Policy updates:</strong> We may update these terms. Continued use means acceptance.
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">4. Contact</h2>

          <p className="text-sm text-gray-700">
            For questions or support, contact us at:
          </p>

          <a
            href="mailto:support@beaura.co"
            className="text-purple-600 text-sm hover:underline"
          >
            support@beaura.co
          </a>
        </section>

        {/* BACK */}
        <div className="pt-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← Back to home
          </Link>
        </div>

      </div>
    </main>
  );
}