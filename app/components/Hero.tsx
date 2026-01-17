import Link from "next/link";

export default function Hero() {
  return (
    <section className="px-6 py-32 bg-[#faf7f2]">
      <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-light leading-tight mb-8">
          Book Your Perfect <br className="hidden sm:block" />
          Makeup Artist
        </h1>

        {/* Subtext */}
        <p className="text-gray-600 mb-14 max-w-xl mx-auto">
          Trusted makeup artists for weddings, engagements,
          and unforgettable moments — curated for modern brides.
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-20">
          <input
            type="text"
            placeholder="Search by city or artist name"
            className="w-full bg-white border border-black/10 rounded-full px-6 py-4 text-sm outline-none focus:border-black transition"
          />
        </div>

        {/* Role selection */}
        <div className="flex justify-center gap-20 text-sm tracking-wide">
          <Link href="/register/bride" className="group text-center">
            <p className="mb-2">I’m a Bride</p>
            <span className="block h-[1px] w-10 bg-black mx-auto transition-all duration-300 group-hover:w-20" />
          </Link>

          <Link href="/register/mua" className="group text-center">
            <p className="mb-2">I’m a Makeup Artist</p>
            <span className="block h-[1px] w-10 bg-black mx-auto transition-all duration-300 group-hover:w-20" />
          </Link>
        </div>
      </div>
    </section>
  );
}
