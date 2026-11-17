import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fffafc] text-[#171018]">
      <section className="bg-[#f1e5ff] px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Contact Beaura</p>
          <h1 className="mt-5 max-w-3xl text-6xl font-light leading-[0.94] tracking-[-0.08em] sm:text-7xl">We’re here to help.</h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#655968]">Have a question about a booking, your account, or using Beaura? Get in touch and our team will help you find the right next step.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-20 md:grid-cols-2">
        <a href="mailto:beaura.eg@gmail.com" className="group rounded-[2rem] border border-[#eadff5] bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#f1e5ff] text-xl text-purple-700">@</span>
          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-purple-700">Email</p>
          <h2 className="mt-2 text-3xl font-light tracking-[-0.05em]">Send us an email</h2>
          <p className="mt-3 text-sm text-[#6f6077]">beaura.eg@gmail.com</p>
          <span className="mt-7 inline-block text-sm text-purple-700">Contact support ↗</span>
        </a>
        <a href="https://instagram.com/beaura.eg" target="_blank" rel="noreferrer" className="group rounded-[2rem] border border-[#eadff5] bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ffe8f0] text-xl text-[#a44c78]">◎</span>
          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-purple-700">Instagram</p>
          <h2 className="mt-2 text-3xl font-light tracking-[-0.05em]">Follow Beaura</h2>
          <p className="mt-3 text-sm text-[#6f6077]">@beaura.eg</p>
          <span className="mt-7 inline-block text-sm text-purple-700">Visit our Instagram ↗</span>
        </a>
      </section>
      <div className="mx-auto max-w-6xl px-6 pb-20"><div className="rounded-[2rem] bg-[#171018] p-8 text-white sm:p-12"><p className="text-xs uppercase tracking-[0.2em] text-white/55">Need help with a booking?</p><h2 className="mt-4 max-w-2xl text-4xl font-light tracking-[-0.06em]">Sign in to view your booking details and updates.</h2><Link href="/login" className="mt-7 inline-flex rounded-full bg-white px-7 py-3.5 text-sm text-[#171018]">Go to my account</Link></div></div>
    </main>
  );
}
