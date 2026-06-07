"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-4xl mx-auto space-y-14">

        {/* HEADER */}
        <section className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>

          <p className="text-sm text-gray-500">
            Last updated: 1 January 2026
          </p>

          <p className="text-sm text-gray-700 leading-relaxed">
            At Beaura, we respect your privacy and are committed to protecting
            your personal data. This Privacy Policy explains what information
            we collect, how we use it, and your rights as a user of our platform.
          </p>
        </section>

        {/* SECTION 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            We collect information you provide directly when you create an account,
            book a service, or communicate on the platform.
          </p>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>Full name and profile information</li>
            <li>Email address and phone number</li>
            <li>Booking details (date, location, service)</li>
            <li>Messages between brides and MUAs</li>
            <li>Payment transaction metadata (we do NOT store card details)</li>
          </ul>
        </section>

        {/* SECTION 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. How We Use Your Data</h2>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>To create and manage your account</li>
            <li>To process bookings and payments</li>
            <li>To match brides with makeup artists</li>
            <li>To send booking confirmations and updates</li>
            <li>To improve platform safety and experience</li>
            <li>To handle disputes and support requests</li>
          </ul>
        </section>

        {/* SECTION 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Payments & Security</h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            All payments are processed securely through third-party providers
            (such as Paymob). Beaura does not store or have access to your
            credit/debit card information.
          </p>
        </section>

        {/* SECTION 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Data Sharing</h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            We do not sell your personal data. We only share information when
            necessary to:
          </p>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>Complete bookings between brides and MUAs</li>
            <li>Process payments via trusted providers</li>
            <li>Comply with legal obligations if required</li>
          </ul>
        </section>

        {/* SECTION 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Data Protection</h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            We use industry-standard security measures to protect your data.
            However, no system is 100% secure, so we continuously work to improve
            safety and protection.
          </p>
        </section>

        {/* SECTION 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Your Rights</h2>

          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>Access your personal data</li>
            <li>Update or correct your information</li>
            <li>Request account deletion</li>
            <li>Request data export</li>
          </ul>
        </section>

        {/* SECTION 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Cookies & Analytics</h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            We may use cookies and analytics tools to improve user experience,
            understand platform usage, and enhance performance.
          </p>
        </section>

        {/* SECTION 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Data Retention</h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            We keep your data only as long as your account is active or as needed
            to provide services and comply with legal obligations.
          </p>
        </section>

        {/* SECTION 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>

          <p className="text-sm text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. Continued use
            of Beaura means you accept the updated version.
          </p>
        </section>

        {/* CONTACT */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Contact Us</h2>

          <p className="text-sm text-gray-700">
            If you have any questions about this Privacy Policy, contact us at:
          </p>

          <a
            href="mailto:beaura.eg@gmail.com"
            className="text-purple-600 text-sm hover:underline"
          >
            beaura.eg@gmail.com
          </a>
        </section>

        {/* BACK */}
        <div className="pt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-black">
            ← Back to home
          </Link>
        </div>

      </div>
    </main>
  );
}