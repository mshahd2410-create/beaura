"use client";

import Link from "next/link";

const boards = [
  { title: "Wedding", subtitle: "Your forever kind of glam", images: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&auto=format&fit=crop&q=85"], moods: ["Timeless bride", "Rooted romance", "Ethereal shimmer"], colors: ["#ead8d0", "#b68b78", "#f5edf0"], query: "bridal makeup moodboard soft glam romantic wedding beauty" },
  { title: "Engagement", subtitle: "A little extra sparkle", images: ["https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=900&auto=format&fit=crop&q=85"], moods: ["Golden hour", "Modern romance", "Soft sculpt"], colors: ["#e8c8bd", "#b98c73", "#f5e6d9"], query: "engagement party makeup moodboard golden hour glam" },
  { title: "Soirée", subtitle: "Dress up. Show up. Glow.", images: ["https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=85"], moods: ["Bronzed goddess", "Statement eyes", "Rose glow"], colors: ["#6d3e42", "#c58d77", "#e8c5b7"], query: "soiree evening party makeup moodboard glam" },
  { title: "Birthday", subtitle: "Main-character energy", images: ["https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=900&auto=format&fit=crop&q=85"], moods: ["Coquette pink", "Disco glow", "Birthday glam"], colors: ["#edb9cc", "#b77c9a", "#f6dfe8"], query: "birthday makeup moodboard pink glam party" },
  { title: "Bridesmaids", subtitle: "The girls, all glowing", images: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=85"], moods: ["Soft coordinated", "Champagne glow", "Romantic waves"], colors: ["#d9b9b2", "#b99a87", "#f0e4dd"], query: "bridesmaids makeup moodboard soft glam bridal party" },
  { title: "Graduation", subtitle: "Your big moment, your look", images: ["https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=85"], moods: ["Fresh faced", "Polished glam", "Camera ready"], colors: ["#c9b6a3", "#8e7565", "#eee3d9"], query: "graduation makeup moodboard natural glam portrait" },
  { title: "Night out", subtitle: "A little bolder after dark", images: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=85"], moods: ["Smokey liner", "Glossy lips", "Midnight glam"], colors: ["#30232e", "#916176", "#d6a6b7"], query: "night out makeup moodboard smokey eyes glossy lips" },
  { title: "Photoshoot", subtitle: "Made for the close-up", images: ["https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=900&auto=format&fit=crop&q=85", "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=85"], moods: ["Editorial skin", "Monochrome", "High fashion"], colors: ["#d7c8c1", "#8b7772", "#eee9e4"], query: "editorial photoshoot makeup moodboard beauty portrait" },
];

export default function LandingMoodboards() {
  return (
    <section id="moodboards" className="scroll-mt-28 bg-[#fffafc] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-purple-700">The Beaura mood edit</p>
          <h2 className="mt-4 text-5xl font-light leading-[0.94] tracking-[-0.075em] md:text-7xl">Every occasion has a mood. Find yours.</h2>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#6f6077]">Wedding mornings, engagement nights, birthdays and everything in between. Explore curated beauty moods, collect the details you love and discover a look that feels like you. All the inspiration stays right here on Beaura.</p>
        </div>
        <div className="mb-8 flex flex-wrap gap-2">
          {["Romantic", "Soft glam", "Clean girl", "Golden hour", "Classic elegance", "Full glam", "Editorial", "Playful", "Old Hollywood", "Glowy skin"].map((mood) => <span key={mood} className="rounded-full border border-[#eadff5] bg-white px-4 py-2 text-xs text-[#6f6077]">{mood}</span>)}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {boards.map((board, i) => (
            <article key={board.title} className="group overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-[1.5rem]">
                {board.images.map((src, imageIndex) => <img key={src + imageIndex} src={src} alt={board.title + " inspiration " + (imageIndex + 1)} loading="lazy" className={imageIndex === 0 ? "row-span-2 h-64 w-full object-cover transition duration-700 group-hover:scale-[1.02]" : "h-[7.95rem] w-full object-cover"} />)}
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-purple-700">0{i + 1} / moodboard</span>
              </div>
              <div className="px-3 pb-3 pt-5">
                <h3 className="text-2xl font-light tracking-[-0.045em] text-[#171018]">{board.title}</h3>
                <p className="mt-1 text-xs text-[#8a7d91]">{board.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">{board.moods.map((mood) => <span key={mood} className="rounded-full bg-[#faf2ff] px-3 py-1.5 text-[11px] text-[#695675]">{mood}</span>)}</div>
                <div className="mt-4 flex items-center gap-2">{board.colors.map((color) => <span key={color} className="h-4 w-4 rounded-full ring-1 ring-black/5" style={{ backgroundColor: color }} />)}<span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-[#9a8ca2]">Colour story</span></div>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-purple-700">Curated inspiration · 3 looks</span>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-[2rem] bg-[#f1e5ff] p-7 sm:flex-row sm:items-center sm:p-9">
          <div><p className="text-xs uppercase tracking-[0.2em] text-purple-700">Your look, your story</p><h3 className="mt-2 text-3xl font-light tracking-[-0.055em] text-[#171018]">Collect the moods. Find the artist.</h3><p className="mt-2 max-w-xl text-sm leading-6 text-[#655968]">Explore the inspiration, then browse Beaura artists and find someone who can bring your vision to life.</p></div>
          <Link href="/bride/home" className="shrink-0 rounded-full bg-[#171018] px-7 py-3.5 text-sm text-white transition hover:bg-purple-700">Find your artist ↗</Link>
        </div>
      </div>
    </section>
  );
}
