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
    body: "Artists set their service prices. Before a booking becomes payable, the artist reviews the client’s selected location and, for off-studio appointments, submits a travel-fee quote for that specific booking. The client must accept that quote before the final total and deposit are calculated. A studio appointment does not require a travel quote. The booking breakdown shows the service price, any eligible promotion, travel fee and Beaura platform fee. A promotional discount applies to the makeup service price only, not to travel. The client deposit is 50% of the discounted service price plus the full quoted travel fee and the client-side Beaura platform fee. The remaining discounted service balance is paid directly to the makeup artist after the appointment. The makeup artist platform fee is deducted from the artist’s entitlement in accordance with the artist terms. Applicable taxes or other charges, if any, must be displayed before payment. The available payment options include Beaura Wallet and payment by InstaPay or mobile wallet to the payment details shown in the booking. For InstaPay or mobile-wallet payments, the client must upload proof and wait for Beaura review. Do not send cash or payment to an artist outside the stated booking instructions unless Beaura expressly says otherwise."
  },
  {
    title: "Cancellations, refunds and disputes",
    body: "A client who requests cancellation at least seven days before the appointment submits a cancellation request. Where Beaura has already transferred the deposit to the makeup artist, the artist has 48 hours to return the transferred deposit; if it is not returned within that period, the amount may be recorded as an amount owed to Beaura and recovered from future artist earnings. A client cancellation less than seven days before the appointment is not eligible for a deposit refund under the standard booking policy. If the makeup artist cancels more than seven days before the appointment, the client receives the deposit less the Beaura fees applicable to that booking. If the makeup artist cancels seven days or fewer before the appointment, the client receives the full deposit, including Beaura fees. A declined travel quote cancels the booking before payment is taken and therefore does not create a payment refund. Refund timing may depend on the payment channel and processing provider. These standard terms do not limit any non-waivable rights under Egyptian law. Contact Beaura with the booking reference if the booking record does not reflect the applicable outcome."
  },
  {
    title: "Egyptian consumer rights and complaints",
    body: "Beaura aims to present material service information, the identity and contact details available for the relevant provider, booking prices and applicable fees clearly before a client pays. Clients should keep their booking confirmation and payment evidence. Nothing in these Terms limits rights or remedies available under Egyptian Consumer Protection Law No. 181 of 2018 or other mandatory law. Clients may contact Beaura at beaura.eg@gmail.com with a complaint and should include the booking reference."
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
    body: "Our handling of personal information is explained in the Beaura Privacy Policy. Beaura intends to handle personal data in accordance with applicable Egyptian requirements, including Personal Data Protection Law No. 151 of 2020 and its Executive Regulations, where applicable. Nothing in these Terms removes rights that cannot lawfully be waived."
  },
  {
    title: "Changes and availability",
    body: "We may update these terms as Beaura changes. The latest version will appear on this page with its updated date. We may also update, suspend or discontinue parts of the platform. Material changes will be reflected in the published terms. We will not use this section to remove rights that cannot legally be excluded."
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
          <p className="mt-6 text-xs text-[#76677f]">Last updated: 18 November 2026</p>
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
          <p className="text-sm leading-8 text-[#6f6077]">Please read these terms before using Beaura. They explain the responsibilities of clients, independent makeup artists and the platform. They are intended to be read with the booking-specific price, deposit, travel-quote and cancellation information displayed in your account.</p>
          {sections.map((section,index)=>(
            <section id={`terms-${index}`} key={section.title} className="scroll-mt-28 border-b border-[#eadff5] pb-9">
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700">Section {String(index+1).padStart(2,"0")}</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">{section.title}</h2>
              {"body" in section && <p className="mt-4 text-sm leading-8 text-[#6f6077]">{section.body}</p>}
              {"bullets" in section && section.bullets && <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[#6f6077]">{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}
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
