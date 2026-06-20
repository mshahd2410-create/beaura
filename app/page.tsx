import Link from "next/link";
import { Menu } from "lucide-react";

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
    <main className="min-h-screen overflow-x-hidden bg-[#fffafc] text-[#171018]">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 24s linear infinite;
        }
      `}</style>

      <div className="overflow-hidden bg-[#171018] py-2.5 text-[10px] uppercase tracking-[0.18em] text-white sm:text-xs">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-8">
              <Link href="/register/bride">Book your bridal artist</Link>
              <span>Soft glam girls, this way</span>
              <Link href="/register/mua">MUAs, join Beaura</Link>
              <span>Pretty bookings only</span>
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#eadff5] bg-[#fffafc]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
          <nav className="hidden items-center gap-7 text-xs uppercase tracking-[0.18em] text-[#6f6077] lg:flex">
            <a href="#occasions">Occasions</a>
            <a href="#styles">Styles</a>
            <a href="#edits">Edits</a>
          </nav>

          <Link
            href="/"
            className="text-3xl font-light tracking-[-0.08em] text-[#171018] sm:text-4xl"
          >
            Beaura
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full border border-[#eadff5] bg-white px-4 py-2 text-sm text-[#171018] sm:block"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[#171018] px-4 py-2 text-sm text-white sm:px-5 sm:py-2.5"
            >
              Sign up
            </Link>
          </div>
        </div>

        <div className="border-t border-[#eadff5] bg-white/70">
          <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#7a6b82] sm:justify-center sm:text-xs">
            <a href="#occasions">Bridal</a>
            <a href="#occasions">Engagement</a>
            <a href="#occasions">Soirée</a>
            <a href="#styles">Glam styles</a>
            <a href="#artists">Artists</a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="mb-5 w-fit rounded-full border border-[#eadff5] bg-white px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-purple-700 sm:text-xs">
              Beauty booking, but make it cute
            </p>

            <h1 className="max-w-4xl text-5xl font-light leading-[0.9] tracking-[-0.08em] sm:text-7xl lg:text-[7.5rem]">
              Find the makeup artist you’ll obsess over.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-[#655968] sm:text-lg sm:leading-8">
              Beaura helps you discover bridal, engagement, and event MUAs
              without living inside screenshots, DMs, and endless scrolling.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register/bride"
                className="rounded-full bg-purple-600 px-7 py-4 text-center text-sm text-white"
              >
                Find my artist
              </Link>

              <Link
                href="/register/mua"
                className="rounded-full border border-[#d9cbe6] bg-white px-7 py-4 text-center text-sm"
              >
                I’m an artist
              </Link>
            </div>
          </div>

          <div className="relative min-h-[480px] sm:min-h-[600px]">
            <div className="absolute right-0 top-0 h-[430px] w-[88%] rounded-t-full rounded-b-[3rem] bg-[#f1e5ff] shadow-[0_30px_90px_rgba(88,28,135,0.14)] sm:h-[560px]" />

            <div className="absolute left-0 top-8 w-[78%] rounded-[2.5rem] border border-white bg-white p-4 shadow-2xl sm:w-[68%] sm:p-6">
              <img
                src="/Landing/hero-bride.jpg"
                alt="Bridal makeup look"
                className="h-56 w-full rounded-t-full rounded-b-[2rem] object-cover sm:h-72"
              />

              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-purple-700 sm:text-xs">
                  Soft glam request
                </p>
                <h2 className="mt-2 text-2xl font-light tracking-[-0.05em] sm:text-3xl">
                  Wedding morning, handled
                </h2>
              </div>
            </div>

            <div className="absolute bottom-20 right-0 w-[70%] rotate-2 rounded-[2rem] border border-[#eadff5] bg-white p-4 shadow-xl sm:w-[60%] sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a8ca2] sm:text-xs">
                what’s your vibe?
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Soft glam", "Clean", "Bronze", "Full glam"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#faf2ff] px-3 py-2 text-[11px] text-[#5f4d68]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-4 max-w-[230px] -rotate-3 rounded-[2rem] bg-[#171018] p-5 text-white shadow-xl sm:left-10 sm:max-w-xs">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 sm:text-xs">
                for MUAs
              </p>
              <p className="mt-3 text-xl font-light leading-tight sm:text-2xl">
                Your portfolio deserves better than a random DM.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="occasions" className="px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center sm:mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700 sm:text-sm">
              choose your moment
            </p>
            <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-light leading-none tracking-[-0.08em] sm:text-6xl">
              Every plan has a different kind of glam.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {occasions.map((item, index) => (
              <Link
                href="/register/bride"
                key={item.title}
                className={`group rounded-[2.2rem] border border-[#eadff5] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[3rem] sm:p-5 ${
                  index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`w-full rounded-t-full rounded-b-[2rem] object-cover ${
                      index === 0 ? "h-64 sm:h-80" : "h-56 lg:h-44"
                    }`}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-purple-700 shadow sm:text-xs">
                    {item.label}
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="mt-4 text-3xl font-light tracking-[-0.05em]">
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

      <section id="styles" className="bg-white px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700 sm:text-sm">
                glam menu
              </p>
              <h2 className="mt-4 text-4xl font-light leading-none tracking-[-0.08em] sm:text-6xl">
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
                  className="rounded-[2rem] bg-[#fffafc] p-6 shadow-sm transition hover:bg-[#f6edff] sm:rounded-[2.5rem] sm:p-7"
                >
                  <div className="mb-8 h-2 w-16 rounded-full bg-purple-600 sm:mb-12 sm:w-20" />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-purple-700 sm:text-xs">
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

      <section id="edits" className="px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end sm:mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700 sm:text-sm">
                beaura edits
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-light leading-none tracking-[-0.08em] sm:text-6xl">
                Made for the girls who need options.
              </h2>
            </div>

            <Link
              href="/register"
              className="w-full rounded-full bg-[#171018] px-7 py-3.5 text-center text-sm text-white sm:w-fit"
            >
              Start browsing
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {edits.map((edit) => (
              <Link
                href={edit.href}
                key={edit.title}
                className="rounded-[2.4rem] border border-[#eadff5] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-[3rem] sm:p-5"
              >
                <img
                  src={edit.image}
                  alt={edit.title}
                  className="mb-6 h-56 w-full rounded-t-full rounded-b-[2rem] object-cover sm:mb-8 sm:h-64"
                />
                <div className="p-3">
                  <h3 className="text-3xl font-light leading-none tracking-[-0.06em] sm:text-4xl">
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

      <section id="how" className="bg-[#171018] px-4 py-14 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center sm:mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45 sm:text-sm">
              how it works
            </p>
            <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-light leading-none tracking-[-0.08em] sm:text-6xl">
              From “who should I book?” to booked.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Discover", "Browse by city, service, and style."],
              ["Save", "Keep favorite artists in one place."],
              ["Request", "Send your booking details clearly."],
              ["Confirm", "Wait for artist confirmation and support."],
            ].map(([title, text], index) => (
              <div key={title} className="rounded-[2rem] bg-white/[0.07] p-6 sm:rounded-[2.5rem] sm:p-7">
                <p className="text-sm text-white/35">0{index + 1}</p>
                <h3 className="mt-10 text-3xl font-light tracking-[-0.05em] sm:mt-16">
                  {title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="artists" className="px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div className="rounded-[2.5rem] bg-white p-7 shadow-sm sm:rounded-[3.5rem] sm:p-10 md:p-14">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-700 sm:text-sm">
              for beauty lovers
            </p>
            <h2 className="mt-5 text-4xl font-light leading-none tracking-[-0.08em] sm:text-6xl">
              Less searching. Better screenshots.
            </h2>
            <p className="mt-6 text-sm leading-7 text-[#6f6077]">
              Browse artists, compare styles, send requests, and keep your
              booking details organized without losing the vibe.
            </p>

            <Link
              href="/register/bride"
              className="mt-8 inline-block w-full rounded-full bg-purple-600 px-8 py-4 text-center text-sm text-white sm:w-auto"
            >
              Register as client
            </Link>
          </div>

          <div className="overflow-hidden rounded-[2.5rem] bg-[#f1e5ff] sm:rounded-[3.5rem]">
            <img
              src="/Landing/artist.jpg"
              alt="Makeup artist"
              className="h-64 w-full object-cover sm:h-72"
            />
            <div className="p-7 sm:p-10 md:p-14">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-700 sm:text-sm">
                for artists
              </p>
              <h2 className="mt-5 text-4xl font-light leading-none tracking-[-0.08em] sm:text-6xl">
                Your work deserves to be discovered.
              </h2>
              <p className="mt-6 text-sm leading-7 text-[#6f6077]">
                Showcase your services, prices, cities, and portfolio inside a
                platform designed for beauty bookings.
              </p>

              <Link
                href="/register/mua"
                className="mt-8 inline-block w-full rounded-full bg-[#171018] px-8 py-4 text-center text-sm text-white sm:w-auto"
              >
                Join as artist
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-white p-7 text-center shadow-sm sm:rounded-[4rem] sm:p-10 md:p-20">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-700 sm:text-sm">
            start beaura
          </p>
          <h2 className="mx-auto mt-5 max-w-5xl text-4xl font-light leading-[0.95] tracking-[-0.08em] sm:text-7xl">
            Your glam era deserves a better booking experience.
          </h2>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row">
            <Link
              href="/register/bride"
              className="rounded-full bg-purple-600 px-8 py-4 text-sm text-white"
            >
              Sign up as client
            </Link>
            <Link
              href="/register/mua"
              className="rounded-full border border-[#d9cbe6] px-8 py-4 text-sm"
            >
              Sign up as artist
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#eadff5] bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-[#6f6077] md:flex-row">
          <p>© 2026 Beaura</p>

          <div className="flex flex-wrap gap-5">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faqs">FAQ</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}