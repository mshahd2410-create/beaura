import Link from "next/link";

const occasions = [
  {
    title: "Bridal era",
    label: "For the big day",
    text: "Wedding day glam, trials, and long-wear looks that still feel like you.",
    image: "/Landing/bridal.jpg",
  },
  {
    title: "Engagement glow",
    label: "For the announcement",
    text: "Soft, romantic glam for engagement celebrations and family photos.",
    image: "/Landing/engagement.jpg",
  },
  {
    title: "Soirée mood",
    label: "For the night out",
    text: "Evening makeup for dinners, parties, and every dressed-up moment.",
    image: "/Landing/soiree.jpg",
  },
  {
    title: "Camera ready",
    label: "For shoots",
    text: "Polished looks for photoshoots, content days, and beauty moments.",
    image: "/Landing/photoshoot.jpg",
  },
];

const glamStyles = [
  "Soft glam",
  "Clean bridal",
  "Bronze glow",
  "Full glam",
  "Classic bride",
  "Engagement glow",
  "Natural glam",
  "Evening glam",
];

const edits = [
  {
    title: "For the girls who saved 500 makeup looks",
    text: "Browse by vibe, city, and occasion instead of getting lost in screenshots.",
    href: "/register/bride",
    image: "/Landing/bridal.jpg",
  },
  {
    title: "For brides who overthink every detail",
    text: "Save your favorites, compare styles, and keep your booking process calmer.",
    href: "/register/bride",
    image: "/Landing/engagement.jpg",
  },
  {
    title: "For artists who deserve a prettier profile",
    text: "Show your portfolio, cities, services, and prices in one polished place.",
    href: "/register/mua",
    image: "/Landing/artist.jpg",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffafc] text-[#171018]">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-14px) rotate(1deg); }
        }

        @keyframes floatSoft {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-10px) rotate(-2deg); }
        }

        .marquee-track {
          animation: marquee 24s linear infinite;
        }

        .float-slow {
          animation: floatSlow 5s ease-in-out infinite;
        }

        .float-soft {
          animation: floatSoft 6s ease-in-out infinite;
        }
      `}</style>

      <div className="overflow-hidden bg-[#171018] py-2.5 text-xs uppercase tracking-[0.22em] text-white">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-10">
              <Link href="/register/bride" className="hover:text-purple-200">
                Book your bridal artist
              </Link>
              <span>Soft glam girls, this way</span>
              <Link href="/register/bride" className="hover:text-purple-200">
                Start your glam search
              </Link>
              <span>Engagement glow without the chaos</span>
              <Link href="/register/mua" className="hover:text-purple-200">
                MUAs, join the beauty edit
              </Link>
              <span>Pretty bookings only</span>
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#eadff5] bg-[#fffafc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <nav className="hidden items-center gap-7 text-xs uppercase tracking-[0.18em] text-[#6f6077] md:flex">
            <a href="#occasions" className="hover:text-purple-700">
              Occasions
            </a>
            <a href="#styles" className="hover:text-purple-700">
              Styles
            </a>
            <a href="#edits" className="hover:text-purple-700">
              Edits
            </a>
          </nav>

          <Link
            href="/"
            className="text-4xl font-light tracking-[-0.08em] text-[#171018]"
          >
            Beaura
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-[#eadff5] bg-white px-5 py-2.5 text-sm text-[#171018] hover:border-purple-300"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[#171018] px-5 py-2.5 text-sm text-white hover:bg-purple-700"
            >
              Sign up
            </Link>
          </div>
        </div>

        <div className="border-t border-[#eadff5] bg-white/70">
          <div className="mx-auto flex max-w-7xl justify-center gap-8 overflow-x-auto px-6 py-3 text-xs uppercase tracking-[0.2em] text-[#7a6b82]">
            <a href="#occasions">Bridal</a>
            <a href="#occasions">Engagement</a>
            <a href="#occasions">Soirée</a>
            <a href="#styles">Glam styles</a>
            <a href="#artists">Artists</a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute left-[-120px] top-20 h-[420px] w-[420px] rounded-full bg-[#ead7ff] blur-3xl" />
        <div className="absolute right-[-100px] top-40 h-[360px] w-[360px] rounded-full bg-[#ffe3ef] blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="mb-5 w-fit rounded-full border border-[#eadff5] bg-white px-5 py-2 text-xs uppercase tracking-[0.22em] text-purple-700">
              Beauty booking, but make it cute
            </p>

            <h1 className="max-w-4xl text-[4.2rem] font-light leading-[0.84] tracking-[-0.09em] md:text-[7.5rem]">
              Find the makeup artist you’ll obsess over.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-[#655968]">
              Beaura helps you discover bridal, engagement, and event MUAs
              without living inside screenshots, DMs, and endless scrolling.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register/bride"
                className="rounded-full bg-purple-600 px-8 py-4 text-center text-sm text-white hover:bg-purple-700"
              >
                Find my artist
              </Link>

              <Link
                href="/register/mua"
                className="rounded-full border border-[#d9cbe6] bg-white px-8 py-4 text-center text-sm hover:border-purple-400 hover:text-purple-700"
              >
                I’m an artist
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-[#7a6b82]">
              <span className="rounded-full bg-white px-4 py-2">
                Save favorites
              </span>
              <span className="rounded-full bg-white px-4 py-2">
                Compare styles
              </span>
              <span className="rounded-full bg-white px-4 py-2">
                Book calmer
              </span>
            </div>
          </div>

          <div className="relative min-h-[650px]">
            <div className="absolute right-0 top-0 h-[560px] w-[82%] rounded-t-full rounded-b-[4rem] bg-[#f1e5ff] shadow-[0_40px_130px_rgba(88,28,135,0.18)]" />

            <div className="float-soft absolute right-4 top-4 z-10 rounded-full bg-white px-5 py-3 text-xs uppercase tracking-[0.18em] text-purple-700 shadow-xl">
              bridal era
            </div>

            <div className="float-slow absolute left-0 top-12 w-[68%] rounded-[3rem] border border-white bg-white p-6 shadow-2xl">
              <img
                src="/Landing/hero-bride.jpg"
                alt="Bridal makeup look"
                className="h-72 w-full rounded-t-full rounded-b-[2.5rem] object-cover"
              />

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                  Soft glam request
                </p>
                <h2 className="mt-2 text-3xl font-light tracking-[-0.05em]">
                  Wedding morning, handled
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[#fff7fb] p-4">Cairo</div>
                  <div className="rounded-2xl bg-[#fff7fb] p-4">Pending</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-24 right-0 w-[60%] rotate-2 rounded-[2.5rem] border border-[#eadff5] bg-white p-5 shadow-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9a8ca2]">
                what’s your vibe?
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Soft glam", "Clean", "Bronze", "Full glam"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#faf2ff] px-4 py-2 text-xs text-[#5f4d68]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-10 -rotate-3 rounded-[2.5rem] bg-[#171018] p-6 text-white shadow-xl md:w-64">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                for MUAs
              </p>
              <p className="mt-3 text-2xl font-light leading-tight">
                Your portfolio deserves better than a random DM.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#f1e5ff] py-4 text-sm uppercase tracking-[0.18em] text-[#4d4054]">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              <Link href="/register/bride" className="hover:text-purple-700">
                Find your wedding-day face
              </Link>
              <span>For the girls who saved 500 makeup looks</span>
              <Link href="/register/bride" className="hover:text-purple-700">
                Browse soft glam MUAs
              </Link>
              <span>Main character makeup energy</span>
              <Link href="/register/mua" className="hover:text-purple-700">
                Artists, get discovered
              </Link>
              <span>DM chaos ends here</span>
            </div>
          ))}
        </div>
      </section>

      <section id="occasions" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-purple-700">
              choose your moment
            </p>
            <h2 className="mx-auto mt-4 max-w-4xl text-6xl font-light leading-none tracking-[-0.08em]">
              Every plan has a different kind of glam.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {occasions.map((item, index) => (
              <Link
                href="/register/bride"
                key={item.title}
                className={`group rounded-[3rem] border border-[#eadff5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  index === 0 ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`w-full rounded-t-full rounded-b-[2rem] object-cover ${
                      index === 0 ? "h-80" : "h-44"
                    }`}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-purple-700 shadow">
                    {item.label}
                  </span>
                </div>

                <div className="p-3">
                  <p className="mt-5 text-xs uppercase tracking-[0.2em] text-purple-700">
                    0{index + 1}
                  </p>
                  <h3 className="mt-3 text-3xl font-light tracking-[-0.05em]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#6f6077]">
                    {item.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="styles" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-purple-700">
                glam menu
              </p>
              <h2 className="mt-4 text-6xl font-light leading-none tracking-[-0.08em]">
                Search by the look in your camera roll.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#6f6077]">
                Soft glam, clean bridal, bronze glow, full glam — Beaura lets
                you think in beauty moods, not boring filters.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {glamStyles.map((style, index) => (
                <Link
                  href="/register/bride"
                  key={style}
                  className={`rounded-[2.5rem] bg-[#fffafc] p-7 shadow-sm transition hover:bg-[#f6edff] ${
                    index % 2 === 0 ? "sm:translate-y-8" : ""
                  }`}
                >
                  <div className="mb-12 h-2 w-20 rounded-full bg-purple-600" />
                  <p className="text-xs uppercase tracking-[0.2em] text-purple-700">
                    saved look {index + 1}
                  </p>
                  <h3 className="mt-4 text-3xl font-light tracking-[-0.05em]">
                    {style}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="edits" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-purple-700">
                beaura edits
              </p>
              <h2 className="mt-4 max-w-3xl text-6xl font-light leading-none tracking-[-0.08em]">
                Made for the girls who need options.
              </h2>
            </div>

            <Link
              href="/register"
              className="w-fit rounded-full bg-[#171018] px-7 py-3.5 text-sm text-white hover:bg-purple-700"
            >
              Start browsing
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {edits.map((edit) => (
              <Link
                href={edit.href}
                key={edit.title}
                className="rounded-[3rem] border border-[#eadff5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={edit.image}
                  alt={edit.title}
                  className="mb-8 h-64 w-full rounded-t-full rounded-b-[2rem] object-cover"
                />
                <div className="p-3">
                  <h3 className="text-4xl font-light leading-none tracking-[-0.06em]">
                    {edit.title}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-[#6f6077]">
                    {edit.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-[#171018] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-white/45">
              how it works
            </p>
            <h2 className="mx-auto mt-4 max-w-4xl text-6xl font-light leading-none tracking-[-0.08em]">
              From “who should I book?” to booked.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Discover", "Browse by city, service, and style."],
              ["Save", "Keep favorite artists in one place."],
              ["Request", "Send your booking details clearly."],
              ["Confirm", "Wait for artist confirmation and support."],
            ].map(([title, text], index) => (
              <div key={title} className="rounded-[2.5rem] bg-white/[0.07] p-7">
                <p className="text-sm text-white/35">0{index + 1}</p>
                <h3 className="mt-16 text-3xl font-light tracking-[-0.05em]">
                  {title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="artists" className="px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div className="rounded-[3.5rem] bg-white p-10 shadow-sm md:p-14">
            <p className="text-sm uppercase tracking-[0.2em] text-purple-700">
              for brides
            </p>
            <h2 className="mt-5 text-6xl font-light leading-none tracking-[-0.08em]">
              Less searching. Better screenshots.
            </h2>
            <p className="mt-6 text-sm leading-7 text-[#6f6077]">
              Browse artists, compare styles, send requests, and keep your
              booking details organized without losing the vibe.
            </p>

            <Link
              href="/register/bride"
              className="mt-9 inline-block rounded-full bg-purple-600 px-8 py-4 text-sm text-white hover:bg-purple-700"
            >
              Register as bride
            </Link>
          </div>

          <div className="overflow-hidden rounded-[3.5rem] bg-[#f1e5ff]">
            <img
              src="/Landing/artist.jpg"
              alt="Makeup artist"
              className="h-72 w-full object-cover"
            />
            <div className="p-10 md:p-14">
              <p className="text-sm uppercase tracking-[0.2em] text-purple-700">
                for artists
              </p>
              <h2 className="mt-5 text-6xl font-light leading-none tracking-[-0.08em]">
                Your work deserves to be discovered.
              </h2>
              <p className="mt-6 text-sm leading-7 text-[#6f6077]">
                Showcase your services, prices, cities, and portfolio inside a
                platform designed for beauty bookings.
              </p>

              <Link
                href="/register/mua"
                className="mt-9 inline-block rounded-full bg-[#171018] px-8 py-4 text-sm text-white hover:bg-purple-700"
              >
                Join as artist
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#f1e5ff] py-5 text-xl font-light tracking-[-0.04em] text-[#171018]">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-10">
              <Link href="/register/bride" className="hover:text-purple-700">
                Find your bridal artist
              </Link>
              <span>soft glam approved</span>
              <Link href="/register/bride" className="hover:text-purple-700">
                Browse engagement looks
              </Link>
              <span>clean bridal makeup</span>
              <Link href="/register/mua" className="hover:text-purple-700">
                artists, join Beaura
              </Link>
              <span>evening glam without the stress</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl rounded-[4rem] bg-white p-10 text-center shadow-sm md:p-20">
          <p className="text-sm uppercase tracking-[0.2em] text-purple-700">
            start beaura
          </p>
          <h2 className="mx-auto mt-5 max-w-5xl text-7xl font-light leading-[0.9] tracking-[-0.09em]">
            Your glam era deserves a better booking experience.
          </h2>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register/bride"
              className="rounded-full bg-purple-600 px-8 py-4 text-sm text-white hover:bg-purple-700"
            >
              Sign up as bride
            </Link>
            <Link
              href="/register/mua"
              className="rounded-full border border-[#d9cbe6] px-8 py-4 text-sm hover:border-purple-400 hover:text-purple-700"
            >
              Sign up as artist
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#eadff5] bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-[#6f6077] md:flex-row">
          <p>© 2026 Beaura</p>

          <div className="flex flex-wrap gap-5">
            <Link href="/about" className="hover:text-purple-700">
              About
            </Link>
            <Link href="/contact" className="hover:text-purple-700">
              Contact
            </Link>
            <Link href="/faqs" className="hover:text-purple-700">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-purple-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-purple-700">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}