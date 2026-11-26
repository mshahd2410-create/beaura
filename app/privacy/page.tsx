import Link from "next/link";

const sections = [
  {
    title: "Information you provide",
    body: "When you create an account or use Beaura, you may provide your name, email address, phone number, profile details, artist portfolio photographs, service information, booking details, reviews and messages exchanged through the platform. For a booking, you may also provide the appointment address, location notes and map coordinates or place identifiers so the makeup artist can assess the location and provide a travel quote."
  },
  {
    title: "Booking and payment information",
    body: "We process the selected service, appointment date and time, address and location data, travel quote, booking status, cancellation details and completion or dispute records to arrange and manage appointments. If you pay through InstaPay or a mobile wallet, we may receive and retain the payment reference and the receipt image you upload for verification. Beaura Wallet activity and payment status may also be recorded. Do not send passwords, one-time passcodes, full card details or card security codes through messages or email."
  },
  {
    title: "How we use information",
    bullets: [
      "To create and maintain your account and profile.",
      "To display makeup artist profiles, portfolios, services and prices.",
      "To submit, manage and update bookings.",
      "To support payment processing and payment-status records.",
      "To send booking notifications and updates, including new requests, quote decisions, booking acceptance or decline, cancellations, deposit-proof status, completion confirmations, disputes and support updates.",
      "To respond to support requests, resolve disputes and help protect the platform."
    ]
  },
  {
    title: "Information shared with others",
    body: "Some information must be shared to provide the service. The makeup artist handling a booking receives the relevant service, date, time, address, location notes and contact details needed to assess and perform the appointment. Beaura may share or make information available to hosting, database, map/location, communications, customer-support, security and payment service providers where needed to operate the platform. We do not sell personal information. We do not permit service providers to use booking information for unrelated purposes except as allowed by law or the relevant service arrangement."
  },
  {
    title: "Payments",
    body: "Payment options shown in a booking may include Beaura Wallet or InstaPay/mobile-wallet payment. For InstaPay or mobile-wallet payments, Beaura receives the proof image and related transaction details submitted by the client so the deposit can be reviewed and matched to the booking. External payment and wallet providers process information under their own terms and privacy practices. Beaura may receive transaction references and payment-status information needed to manage the booking; Beaura does not control information held independently by an external provider."
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
    body: "We use access controls and technical and organisational measures intended to protect personal information and limit access to people and providers who need it for platform operations. No online service can guarantee absolute security. If we become aware of a personal-data incident, we will assess and handle it, including any notices to the competent authority or affected individuals required by applicable Egyptian law. Please use a unique password and contact us promptly if you think someone has accessed your account."
  },
  {
    title: "How long information is kept",
    body: "We retain personal information only for as long as reasonably necessary for the purposes described in this policy, including operating accounts and bookings, verifying payments, providing support, maintaining required business records, preventing fraud and resolving disputes, or for a longer period where the law requires or permits it. When information is no longer needed, it will be securely deleted, anonymised or otherwise handled as required by law and our retention procedures."
  },
  {
    title: "Your choices and requests",
    body: "Subject to applicable law and any lawful exceptions, you may request information about personal data held about you, access or obtain a copy, correct or update inaccurate information, request erasure, ask for processing to be restricted, withdraw consent where processing relies on consent, or object to processing in circumstances provided by law. You may also request information about a personal-data incident affecting you. Contact beaura.eg@gmail.com and describe your request; we may need to verify your identity. Some records may need to be retained where required or permitted for legal, accounting, security, fraud-prevention or dispute purposes. Requests will be handled within the timeframes and conditions required by applicable Egyptian law."
  },
  {
    title: "Children",
    body: "Beaura is intended for adults who are legally able to enter into the relevant booking arrangements. We do not knowingly invite children to create accounts or submit personal information. If you believe a child has provided personal information to Beaura, contact us so we can review and take appropriate steps. Where processing of a child’s data is legally permitted, any required guardian consent and safeguards will apply."
  },
  {
    title: "Egyptian data protection",
    body: "Beaura aims to handle personal data in accordance with applicable Egyptian data-protection requirements, including Personal Data Protection Law No. 151 of 2020 and its Executive Regulations, where applicable. Personal data is collected for specified platform purposes and should be accurate, appropriately secured and retained only as long as necessary. Certain categories of information may be treated as sensitive under Egyptian law and may require additional safeguards, written explicit consent or regulatory authorisation. We do not ask users to submit sensitive personal data unless it is necessary for a lawful platform purpose."
  },
  {
    title: "International service providers and data transfers",
    body: "Some technology providers that support hosting, databases, maps, email, messaging or payment functions may process or store information outside Egypt. Cross-border transfers or access are subject to applicable Egyptian legal requirements, including any required adequacy assessment, licence, permit, safeguards or consent. Beaura will update this notice if the providers or relevant transfer arrangements materially change."
  },
  {
    title: "Contact and privacy requests",
    body: "For privacy questions, access or correction requests, deletion requests, consent withdrawal or concerns about personal information, contact beaura.eg@gmail.com. Please include enough information for us to identify the relevant account or booking, but never send your password, one-time passcode or full payment-card details."
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
          <p className="mt-6 text-xs text-[#76677f]">Last updated: 18 November 2026</p>
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
          <p className="text-sm leading-8 text-[#6f6077]">This policy explains the personal information Beaura handles to provide artist discovery, booking, travel-quote, payment-verification and notification features. It should be read together with our <Link href="/terms" className="text-purple-700 underline underline-offset-4">Terms & Conditions</Link>.</p>
          {sections.map((section,index)=>(
            <section id={`privacy-${index}`} key={section.title} className="scroll-mt-28 border-b border-[#eadff5] pb-9">
              <p className="text-xs uppercase tracking-[0.18em] text-purple-700">Section {String(index+1).padStart(2,"0")}</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em]">{section.title}</h2>
              {"body" in section && <p className="mt-4 text-sm leading-8 text-[#6f6077]">{section.body}</p>}
              {Array.isArray(section.bullets) && <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[#6f6077]">{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}
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
