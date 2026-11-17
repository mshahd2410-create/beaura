"use client";

import { useState } from "react";
import Link from "next/link";

const groups = [
  {
    title: "For clients",
    intro: "Everything you need to know before, during and after your makeup booking.",
    items: [
      ["How do I book a makeup artist?", "Browse artist profiles, compare their portfolios and services, choose the service and date you want, then send a booking request. Follow the booking status in your Beaura account."],
      ["When is my booking confirmed?", "Your booking is confirmed when the makeup artist accepts your request and the required payment step is completed. Check your booking page for its current status."],
      ["How do I know what a service costs?", "Each makeup artist sets their own service prices. Review the service details and the booking total before you submit or pay."],
      ["What payment methods can I use?", "Available payment methods are shown during checkout. If you choose a bank transfer, follow the instructions in your booking and upload the requested proof of payment."],
      ["Does Beaura store my card details?", "Card payments are handled by the payment provider. Beaura does not ask you to send your full card number or security code in messages."],
      ["Can I message an artist before booking?", "Where messaging is available, you can use Beaura to ask questions and discuss the service before you make a booking."],
      ["Can I change my booking date or service?", "A change is not automatic. Contact the makeup artist through Beaura and wait for confirmation that the change can be accommodated."],
      ["Can I cancel a booking?", "Cancellation options and any applicable refund or compensation depend on the booking status and how close the event date is. Review the cancellation details shown in your booking and contact Beaura support if you need help."],
      ["What happens if the makeup artist cancels?", "You will be notified about the cancellation. Contact Beaura support through the details below for help with the next steps and any payment due back under the applicable cancellation policy."],
      ["When can I leave a review?", "You can leave a review after the service has taken place and you confirm that you received it through your booking. Reviews should describe your genuine experience."],
      ["Can I edit or remove a review?", "If you believe a review contains an error or violates the platform rules, contact Beaura support and include the booking details. Reviews may be reviewed under our platform policies."],
      ["How do I contact Beaura?", "Email beaura.eg@gmail.com and include the email address on your account and relevant booking reference. Never include your password or full payment card details."]
    ]
  },
  {
    title: "For makeup artists",
    intro: "How to set up your profile and manage bookings on Beaura.",
    items: [
      ["How do I join Beaura as a makeup artist?", "Create a makeup artist account and complete your profile. Add accurate details about your work, service area, portfolio, services and prices."],
      ["How do I receive bookings?", "Clients can discover your profile and send booking requests. Keep your availability and service information up to date, and check your Beaura account for new requests."],
      ["Can I set my own prices?", "Yes. You are responsible for setting clear prices and describing what each service includes. Make sure the information on your profile is accurate."],
      ["How do payments and the platform fee work?", "The platform fee and payment breakdown are shown during the booking and payment process. Review the amount and payout information displayed in your account before accepting or completing a booking."],
      ["What should I do if I cannot attend a booking?", "Contact the client through Beaura as soon as possible and follow the cancellation process in your account. Do not leave a confirmed booking unattended."],
      ["Can I change my services or availability?", "You can manage the information and availability offered in your artist account. Keep it current so clients can make informed booking requests."],
      ["How do client reviews work?", "Clients may submit a review after the service has taken place and they confirm receipt. Reviews should relate to a genuine booking and experience."],
      ["Can I take a Beaura client off the platform?", "Keep booking arrangements and payments on Beaura. Taking a booking off-platform can leave both parties without the platform's booking record and support process."],
      ["What if I need help with a booking or payment?", "Contact Beaura at beaura.eg@gmail.com and include the booking reference and a short description of the issue."]
    ]
  }
];

function Accordion({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-[#eadff5]">
      {items.map(([question, answer], index) => (
        <div key={question}>
          <button
            type="button"
            aria-expanded={open === index}
            onClick={() => setOpen(open === index ? null : index)}
            className="flex w-full items-center justify-between gap-5 py-5 text-left"
          >
            <span className="text-[15px] font-medium text-[#251a2b]">{question}</span>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${open === index ? "bg-[#171018] text-white" : "bg-[#f1e5ff] text-purple-700"}`}>{open === index ? "−" : "+"}</span>
          </button>
          {open === index && <p className="max-w-3xl pb-5 pr-10 text-sm leading-7 text-[#6f6077]">{answer}</p>}
        </div>
      ))}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-[#fffafc] text-[#171018]">
      <section className="relative overflow-hidden bg-[#f1e5ff] px-6 py-20 sm:py-28">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#ffe3ef] blur-3xl"/>
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Beaura help centre</p>
          <h1 className="mt-5 max-w-3xl text-6xl font-light leading-[0.94] tracking-[-0.08em] sm:text-7xl">Good to know.</h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#655968]">Clear answers about finding an artist, making a booking, payments and using Beaura.</p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="mb-10 flex flex-wrap gap-3">
          {groups.map((group,index)=><a key={group.title} href={index===0?"#clients":"#artists"} className="rounded-full border border-[#eadff5] bg-white px-5 py-3 text-sm text-[#6f6077] transition hover:border-purple-400 hover:text-purple-700">{group.title}</a>)}
        </div>
        <div className="space-y-12">
          {groups.map((group,index)=>(
            <section id={index===0?"clients":"artists"} key={group.title} className="scroll-mt-24 rounded-[2rem] border border-[#eadff5] bg-white p-6 shadow-sm sm:p-9">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700">0{index+1} / Help & answers</p>
              <h2 className="mt-3 text-3xl font-light tracking-[-0.06em] sm:text-4xl">{group.title}</h2>
              <p className="mt-2 mb-5 text-sm leading-6 text-[#6f6077]">{group.intro}</p>
              <Accordion items={group.items as [string,string][]}/>
            </section>
          ))}
        </div>
        <section className="mt-12 rounded-[2rem] bg-[#171018] p-8 text-white sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d8b9f5]">Still need help?</p>
          <h2 className="mt-3 text-3xl font-light tracking-[-0.05em]">Talk to the Beaura team.</h2>
          <p className="mt-3 text-sm leading-7 text-white/65">Send us your question and include your booking reference if you have one.</p>
          <a href="mailto:beaura.eg@gmail.com" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm text-[#171018]">Email Beaura support</a>
        </section>
        <div className="mt-8 flex flex-wrap gap-5 text-sm text-[#817487]"><Link href="/" className="hover:text-purple-700">← Back to home</Link><Link href="/privacy" className="hover:text-purple-700">Privacy policy</Link><Link href="/terms" className="hover:text-purple-700">Terms & conditions</Link></div>
      </div>
    </main>
  );
}
