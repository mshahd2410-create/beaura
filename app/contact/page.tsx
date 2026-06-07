"use client";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-sm text-gray-500 mt-2">
            We’re here to help you with bookings, support, or questions.
          </p>
        </div>

        {/* INSTAGRAM */}
        <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50 space-y-2">
          <p className="text-sm text-gray-500">Instagram</p>

          <a
            href="https://instagram.com/beaura.eg"
            target="_blank"
            className="text-purple-600 font-medium hover:underline"
          >
            @beaura.eg
          </a>
        </div>

        {/* EMAIL */}
        <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50 space-y-2">
          <p className="text-sm text-gray-500">Email</p>

          <a
            href="mailto:beaura.eg@gmail.com"
            className="text-purple-600 font-medium hover:underline"
          >
            beaura.eg@gmail.com
          </a>
        </div>

      </div>
    </main>
  );
}