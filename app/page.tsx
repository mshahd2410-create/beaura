import Link from "next/link";
import TopBookedArtists from "@/components/TopBookedArtists";

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

      <header className="sticky top-0 z-50 border-b border-[#eadff5] bg-[#fffafc]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-4xl font-light tracking-[-0.09em] text-[#171018]">Beaura<span className="text-purple-600">.</span></Link>
          <nav className="hidden items-center gap-8 text-sm text-[#6f6077] md:flex">
            <a href="#artists" className="transition hover:text-purple-700">Makeup artists</a>
            <a href="#occasions" className="transition hover:text-purple-700">Services</a>
            <a href="#how-it-works" className="transition hover:text-purple-700">How it works</a>
            <Link href="/about" className="transition hover:text-purple-700">About Beaura</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-full px-4 py-2.5 text-sm text-[#171018] transition hover:bg-[#f1e5ff]">Log in</Link>
            <Link href="/register" className="rounded-full bg-[#171018] px-5 py-2.5 text-sm text-white transition hover:bg-purple-700">Create account</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute left-[-120px] top-20 h-[420px] w-[420px] rounded-full bg-[#ead7ff] blur-3xl" />
        <div className="absolute right-[-100px] top-40 h-[360px] w-[360px] rounded-full bg-[#ffe3ef] blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="mb-5 w-fit rounded-full border border-[#eadff5] bg-white px-5 py-2 text-xs uppercase tracking-[0.22em] text-purple-700">
              A softer way to find your artist
            </p>

            <h1 className="max-w-4xl text-[4.2rem] font-light leading-[0.84] tracking-[-0.09em] md:text-[7.5rem]">
              Your next glam crush is closer than you think.
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

      <section className="border-y border-[#eadff5] bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 text-center sm:grid-cols-3 sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f1e5ff] text-lg text-purple-700">01</span>
            <div><p className="text-sm font-medium text-[#171018]">Browse artist portfolios</p><p className="mt-1 text-xs text-[#827587]">See real makeup work and services</p></div>
          </div>
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#ffe8f0] text-lg text-[#a44c78]">02</span>
            <div><p className="text-sm font-medium text-[#171018]">Check prices and details</p><p className="mt-1 text-xs text-[#827587]">Know what each service includes</p></div>
          </div>
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f1e5ff] text-lg text-purple-700">03</span>
            <div><p className="text-sm font-medium text-[#171018]">Send a booking request</p><p className="mt-1 text-xs text-[#827587]">Keep your booking in one place</p></div>
          </div>
        </div>
      </section>

      <section id="artists" className="scroll-mt-28 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Find your makeup artist</p>
              <h2 className="mt-4 max-w-3xl text-5xl font-light leading-[0.95] tracking-[-0.075em] md:text-7xl">Meet artists. See their work. Find your match.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6f6077]">Explore makeup artists in Egypt, view their portfolios, compare services and prices, and choose who feels right for your occasion.</p>
            </div>
            <Link href="/bride/home" className="inline-flex w-fit items-center gap-3 rounded-full bg-[#171018] px-6 py-3.5 text-sm text-white transition hover:bg-purple-700">Browse all artists <span aria-hidden="true">↗</span></Link>
          </div>
          <TopBookedArtists />
        </div>
      </section>

      <section id="occasions" className="scroll-mt-28 bg-[#f1e5ff] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Makeup for every occasion</p>
            <h2 className="mt-4 text-5xl font-light leading-[0.95] tracking-[-0.075em] md:text-6xl">What are you getting ready for?</h2>
            <p className="mt-5 text-sm leading-7 text-[#655968]">Choose the occasion and explore artists who offer the service you need.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {title:"Bridal makeup",desc:"For your wedding day and bridal trials.",image:"/Landing/bridal.jpg"},
              {title:"Engagement makeup",desc:"For your engagement and katb ketab.",image:"/Landing/engagement.jpg"},
              {title:"Soirée makeup",desc:"For parties, dinners and celebrations.",image:"/Landing/soiree.jpg"},
              {title:"Photoshoot makeup",desc:"For professional photos and special shoots.",image:"/Landing/photoshoot.jpg"}
            ].map((item,index)=>(
              <Link key={item.title} href="/bride/home" className="group overflow-hidden rounded-[2rem] border border-white/80 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="relative overflow-hidden rounded-[1.5rem]">
                  <img src={item.image} alt={item.title} className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"/>
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-purple-700">0{index+1}</span>
                </div>
                <div className="px-3 pb-4 pt-5">
                  <h3 className="text-2xl font-light tracking-[-0.045em] text-[#171018]">{item.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[#6f6077]">{item.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-purple-700">Explore artists <span aria-hidden="true">↗</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-28 px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Simple from start to finish</p>
            <h2 className="mt-4 text-5xl font-light leading-[0.95] tracking-[-0.075em] md:text-6xl">Booking your makeup artist should be easy.</h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-[#6f6077]">Everything you need to choose an artist and send your request is organised in one place.</p>
            <Link href="/bride/home" className="mt-8 inline-flex rounded-full border border-[#d9cbe6] bg-white px-6 py-3.5 text-sm text-[#171018] transition hover:border-purple-400 hover:text-purple-700">Start exploring</Link>
          </div>
          <div className="space-y-3">
            {[
              ["01","Choose your artist","Browse portfolios, locations, services and prices."],
              ["02","Choose your service and date","Review the details and send your booking request."],
              ["03","Track your booking","See updates, communicate with your artist and follow your booking status."]
            ].map(([number,title,desc])=>(
              <div key={number} className="flex gap-5 rounded-[1.75rem] border border-[#eadff5] bg-white p-6 sm:p-7">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f1e5ff] text-sm text-purple-700">{number}</span>
                <div><h3 className="text-xl font-medium tracking-[-0.03em]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6f6077]">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#171018] text-white md:grid-cols-[1fr_0.8fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="text-xs uppercase tracking-[0.22em] text-[#d8b9f5]">For makeup artists</p>
            <h2 className="mt-5 max-w-xl text-5xl font-light leading-[0.95] tracking-[-0.07em] md:text-6xl">Showcase your work. Reach new clients.</h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/65">Create your Beaura profile, add your portfolio and services, set your prices, and manage booking requests in one place.</p>
            <Link href="/register/mua" className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm text-[#171018] transition hover:bg-[#f1e5ff]">Join Beaura as an artist</Link>
          </div>
          <div className="relative min-h-[320px]">
            <img src="/Landing/artist.jpg" alt="Makeup artist at work" className="absolute inset-0 h-full w-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-[#171018]/50 to-transparent"/>
            <div className="absolute bottom-6 left-6 rounded-2xl border border-white/30 bg-white/90 px-5 py-4 text-[#171018] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.16em] text-purple-700">Your artist profile</p>
              <p className="mt-1 text-lg">Portfolio · Services · Bookings</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 rounded-[2rem] bg-[#f1e5ff] px-7 py-12 text-center md:flex-row md:text-left lg:px-14">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-purple-700">Your next step</p>
            <h2 className="mt-3 text-4xl font-light tracking-[-0.06em] md:text-5xl">Ready to find your makeup artist?</h2>
            <p className="mt-3 text-sm leading-6 text-[#655968]">Browse artists and choose the one who fits your style, occasion and budget.</p>
          </div>
          <Link href="/bride/home" className="shrink-0 rounded-full bg-[#171018] px-8 py-4 text-sm text-white transition hover:bg-purple-700">Find an artist</Link>
        </div>
      </section>

      <footer className="border-t border-[#eadff5] bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
            <div><Link href="/" className="text-4xl font-light tracking-[-0.09em]">Beaura<span className="text-purple-600">.</span></Link><p className="mt-4 max-w-sm text-sm leading-7 text-[#6f6077]">A simpler way to discover makeup artists and organise your beauty bookings.</p></div>
            <div><p className="text-xs uppercase tracking-[0.18em] text-purple-700">Explore</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#6f6077]"><a href="#artists" className="hover:text-purple-700">Makeup artists</a><a href="#occasions" className="hover:text-purple-700">Services</a><a href="#how-it-works" className="hover:text-purple-700">How it works</a><Link href="/register/mua" className="hover:text-purple-700">Join as an artist</Link></div></div>
            <div><p className="text-xs uppercase tracking-[0.18em] text-purple-700">Beaura</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#6f6077]"><Link href="/about" className="hover:text-purple-700">About us</Link><Link href="/contact" className="hover:text-purple-700">Contact</Link><Link href="/faqs" className="hover:text-purple-700">FAQs</Link><Link href="/privacy" className="hover:text-purple-700">Privacy</Link><Link href="/terms" className="hover:text-purple-700">Terms</Link></div></div>
          </div>
          <div className="mt-10 border-t border-[#eadff5] pt-6 text-xs text-[#8a7d91]">© {new Date().getFullYear()} Beaura Egypt. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
