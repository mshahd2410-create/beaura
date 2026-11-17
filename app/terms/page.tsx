import Link from "next/link";

const sections = [
  {
    title: "Using Beaura",
    body: "Beaura is an online platform that helps clients discover makeup artists and request beauty bookings. By creating an account or using the platform, you agree to follow these Terms & Conditions and any policies shown during a booking. If you do not agree, please do not use Beaura."
  },
  {
    title: "Accounts and eligibility",
    bullets: [
      "You must provide accurate, current information and keep your login details secure.",
      "You are responsible for activity carried out through your account.",
      "You must be legally able to enter into the arrangements you make through Beaura. If you are not legally able to do so, you must not make a booking yourself.",
      "Do not create an account using another person's identity or provide misleading profile information."
    ]
  },
  {
    title: "For clients",
    bullets: [
      "Review the artist's profile, portfolio, service description, price, date and location details before requesting a booking.",
      "A booking request is not a confirmed appointment until its status in Beaura shows that it has been accepted and the required payment step has been completed.",
      "Provide accurate event and contact details and respond to reasonable booking communications.",
      "Use the booking and cancellation controls provided in your account. A requested change or cancellation is not effective until it is reflected in the booking status.",
      "Only submit a review for a service you actually received. Reviews must be honest and must not contain threats, harassment, private information or unlawful content."
    ]
  },
  {
    title: "For makeup artists",
    bullets: [
      "Keep your profile, portfolio, service descriptions, prices, service area and availability accurate and up to date.",
      "You are responsible for the services you offer, your professional conduct, hygiene, punctuality, tools and compliance with laws that apply to your work.",
      "Review booking requests promptly and keep clients informed about any issue that may affect an appointment.",
      "Do not accept a booking if you are unavailable or unable to provide the listed service.",
      "Do not use Beaura to post misleading images, impersonate another artist, harass clients or request unlawful payments."
    ]
  },
  {
    title: "Prices, fees and payments",
    body: "Artists set the prices for their services. Any platform fee, taxes, deposit, balance or other amount applicable to a booking should be shown in the booking or checkout breakdown. Review that breakdown before paying. Payments are processed using the payment methods and providers made available through Beaura. Payment-provider terms may also apply."
  },
  {
    title: "Cancellations, refunds and disputes",
    body: "Cancellation and refund outcomes depend on the booking status, timing, payment status and the cancellation terms presented for the booking. Please review the cancellation information in your account before submitting a cancellation request. If an artist cancels or a service does not take place as agreed, contact Beaura support with the booking reference. Beaura may review the booking record and relevant communications to help resolve a dispute. Any refund or compensation will be handled according to the applicable booking policy and payment-provider process."
  },
  {
    title: "Reviews and user content",
    body: "You retain responsibility for the photos, text and other content you submit. You must have the rights and permissions needed to share it. By submitting content, you allow Beaura to host and display it as needed to operate the platform, including displaying artist portfolios and booking reviews. We may remove content that appears misleading, abusive, unlawful or inconsistent with these terms."
  },
  {
    title: "Communication and platform use",
    bullets: [
      "Use Beaura's booking and communication features honestly and respectfully.",
      "Do not attempt to bypass platform payment or booking processes in a way that misuses Beaura or misleads another user.",
      "Do not interfere with the platform, access another user's account, upload malicious code or misuse personal information.",
      "Do not post content that is unlawful, discriminatory, threatening, deceptive or infringes another person's rights."
    ]
  },
  {
    title: "Beaura's role",
    body: "Beaura provides the platform through which clients and independent makeup artists can find each other and manage booking requests. Unless expressly stated otherwise in a separate agreement, makeup artists are independent service providers and are not employees of Beaura. Beaura does not provide the makeup service itself. We work to keep platform information useful and reliable, but we cannot guarantee that every profile, portfolio image, availability entry or user statement is complete or current."
  },
  {
    title: "Suspension and account closure",
    body: "We may restrict, suspend or close an account where we reasonably believe that a user has breached these terms, created a safety concern, misused the platform or engaged in fraudulent or unlawful activity. Where appropriate, we may ask for information to review a concern. Closing an account does not remove obligations or payment matters that arose before closure."
  },
  {
    title: "Privacy",
    body: "Our handling of personal information is explained in the Beaura Privacy Policy. By using the platform, you acknowledge that information is handled as described there."
  },
  {
    title: "Changes and availability",
    body: "We may update these terms as Beaura changes. The latest version will appear on this page with its updated date. We may also update, suspend or discontinue parts of the platform. We will not use this section to remove rights that cannot legally be excluded."
  },
  {
    title: "Contact",
    body: "For questions about these Terms & Conditions, a booking or a platform issue, email beaura.eg@gmail.com. Include your booking reference where relevant, but never send your password or full payment card details."
  }
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fffafc] text-[#171018]">
      <section className="bg-[#f1e5ff] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">The important details</p>
          <h1 className="mt-5 max-w-3xl text-6xl font-light leading-[0.94] tracking-[-0.08em] sm:text-7xl">Terms & conditions.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#655968]">The guidelines for using Beaura, requesting bookings and working with makeup artists.</p>
          <p className="mt-6 text-xs text-[#76677f]">Last updated: 17 November 2026</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-[1.5rem] border border-[#eadff5] bg-white p-6 lg:sticky lg:top-28">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-700">On this page</p>
          <nav className="mt-4 flex flex-col gap-3 text-sm text-[#6f6077]">
            {sections.map((section,index)=><a key={section.title} href={`#terms-${index}`} className="transition hover:text-purple-700">{section.title}</a>)}
          </nav>
        </aside>
        <article className="space-y-10">
          <p className="text-sm leading-8 text-[#6f6077]">Please read these terms before using Beaura. They explain the basic responsibilities of clients, makeup artists and the platform.</p>
          {sections.map((section,index)=>(
            <section id={`terms-${index}`} key={section.title} className="scroll-mt-28 border-b border-[#eadff5] pb-9">
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700">Section {String(index+1).padStart(2,"0")}</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">{section.title}</h2>
              {"body" in section && <p className="mt-4 text-sm leading-8 text-[#6f6077]">{section.body}</p>}
              {"bullets" in section && <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[#6f6077]">{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
          <section className="rounded-[1.75rem] bg-[#f1e5ff] p-7 sm:p-9">
            <h2 className="text-2xl font-medium tracking-[-0.04em]">Need help?</h2>
            <p className="mt-3 text-sm leading-7 text-[#655968]">If you have a question about these terms or a booking, contact the Beaura team.</p>
            <a href="mailto:beaura.eg@gmail.com" className="mt-5 inline-flex rounded-full bg-[#171018] px-6 py-3 text-sm text-white">Contact Beaura</a>
          </section>
          <Link href="/" className="inline-block text-sm text-[#817487] hover:text-purple-700">← Back to home</Link>
        </article>
      </div>
    </main>
  );
}
