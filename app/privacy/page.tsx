import Link from "next/link";

const sections = [
  {
    title: "Information you provide",
    body: "When you create an account or use Beaura, you may provide information such as your name, email address, phone number, profile details, artist portfolio, service information, booking details and messages exchanged through the platform."
  },
  {
    title: "Booking and payment information",
    body: "We use booking details such as the selected service, date, location and booking status to help clients and makeup artists arrange and manage appointments. Payment processing is handled through the payment methods and providers presented at checkout. Do not send full card details or security codes to Beaura through messages or email."
  },
  {
    title: "How we use information",
    bullets: [
      "To create and maintain your account and profile.",
      "To display makeup artist profiles, portfolios, services and prices.",
      "To submit, manage and update bookings.",
      "To support payment processing and payment-status records.",
      "To send important booking, account and service notifications.",
      "To respond to support requests, resolve disputes and help protect the platform."
    ]
  },
  {
    title: "Information shared with others",
    body: "Some information must be shared to provide the service. For example, a client and the makeup artist handling a booking need relevant booking details to arrange the appointment. Information may also be processed by service providers that help operate Beaura, such as hosting, database, communications and payment services. We do not sell personal information."
  },
  {
    title: "Payments",
    body: "Payments are handled using the payment options made available during checkout. Payment providers process payment credentials under their own terms and privacy practices. Beaura may receive transaction references and payment-status information needed to manage a booking; do not assume Beaura stores or controls information held by an external payment provider."
  },
  {
    title: "Messages, reviews and public profiles",
    body: "Profile details, portfolio images, services and prices may be visible to visitors so they can discover makeup artists. Messages and booking details are used to support the relevant booking and platform features. Reviews submitted through Beaura may be displayed with the associated artist profile or booking context."
  },
  {
    title: "Cookies and technical information",
    body: "Beaura and its service providers may use essential cookies or similar technologies to keep the platform working, maintain sessions, protect accounts and understand technical performance. The exact technologies in use may change as the platform develops."
  },
  {
    title: "Keeping information safe",
    body: "We use access controls and technical and organisational measures intended to protect personal information. No online service can guarantee absolute security. Please use a unique password and contact us promptly if you think someone has accessed your account."
  },
  {
    title: "How long information is kept",
    body: "We retain information for as long as reasonably necessary to operate accounts and bookings, provide support, maintain business records, resolve disputes and meet applicable legal requirements. Retention periods may differ depending on the type of information."
  },
  {
    title: "Your choices and requests",
    body: "You can review and update certain account details through your account. You may also contact us to ask about access, correction or deletion of personal information. We may need to retain some records where required for legitimate operational, security or legal reasons."
  },
  {
    title: "Children",
    body: "Beaura is intended for people who are legally able to enter into the relevant booking arrangements. If you believe a child has provided personal information to Beaura, contact us so we can review the situation."
  },
  {
    title: "Changes to this policy",
    body: "We may update this Privacy Policy as Beaura's services or legal requirements change. The updated version will be published on this page with a revised date. Please check this page from time to time."
  }
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fffafc] text-[#171018]">
      <section className="bg-[#f1e5ff] px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Your information matters</p>
          <h1 className="mt-5 max-w-3xl text-6xl font-light leading-[0.94] tracking-[-0.08em] sm:text-7xl">Privacy policy.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#655968]">How Beaura handles information when you browse artists, create an account and manage bookings.</p>
          <p className="mt-6 text-xs text-[#76677f]">Last updated: 17 November 2026</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[230px_1fr]">
        <aside className="h-fit rounded-[1.5rem] border border-[#eadff5] bg-white p-6 lg:sticky lg:top-28">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-700">On this page</p>
          <nav className="mt-4 flex flex-col gap-3 text-sm text-[#6f6077]">
            {sections.map((section,index)=><a key={section.title} href={`#privacy-${index}`} className="transition hover:text-purple-700">{section.title}</a>)}
          </nav>
        </aside>
        <article className="space-y-10">
          <p className="text-sm leading-8 text-[#6f6077]">This policy explains the kinds of information that may be handled when you use Beaura, a platform that helps clients discover makeup artists and arrange beauty bookings. It is a general description of our platform practices and should be read together with our <Link href="/terms" className="text-purple-700 underline underline-offset-4">Terms & Conditions</Link>.</p>
          {sections.map((section,index)=>(
            <section id={`privacy-${index}`} key={section.title} className="scroll-mt-28 border-b border-[#eadff5] pb-9">
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700">Section {String(index+1).padStart(2,"0")}</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">{section.title}</h2>
              {"body" in section && <p className="mt-4 text-sm leading-8 text-[#6f6077]">{section.body}</p>}
              {"bullets" in section && <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[#6f6077]">{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
          <section className="rounded-[1.75rem] bg-[#f1e5ff] p-7 sm:p-9">
            <h2 className="text-2xl font-medium tracking-[-0.04em]">Questions about your information?</h2>
            <p className="mt-3 text-sm leading-7 text-[#655968]">Contact us and tell us what you would like to know or update.</p>
            <a href="mailto:beaura.eg@gmail.com" className="mt-5 inline-flex rounded-full bg-[#171018] px-6 py-3 text-sm text-white">beaura.eg@gmail.com</a>
          </section>
          <Link href="/" className="inline-block text-sm text-[#817487] hover:text-purple-700">← Back to home</Link>
        </article>
      </div>
    </main>
  );
}
