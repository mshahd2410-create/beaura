import Link from "next/link";
import { notFound } from "next/navigation";
import { getMoodboardCategory, moodboardCategories } from "@/lib/moodboards";

export function generateStaticParams() { return moodboardCategories.map((item) => ({ occasion: item.slug })); }

export default async function MoodboardOccasionPage({ params }: { params: Promise<{ occasion: string }> }) {
  const { occasion } = await params;
  const category = getMoodboardCategory(occasion);
  if (!category) notFound();

  return <main className="min-h-screen bg-[#fffafc] text-[#171018]">
    <header className="border-b border-[#eadff5] bg-white"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5"><Link href="/" className="text-4xl font-light tracking-[-0.09em]">Beaura<span className="text-purple-600">.</span></Link><Link href="/moodboards" className="text-sm text-[#6f6077]">All occasions</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-14"><Link href="/moodboards" className="text-xs uppercase tracking-widest text-purple-700">← All occasions</Link><p className="mt-8 text-xs uppercase tracking-[0.24em] text-purple-700">The Beaura inspiration edit · {category.number} / 08</p><h1 className="mt-4 text-6xl font-light tracking-[-0.08em] md:text-8xl">{category.title}<span className="text-purple-600">.</span></h1><p className="mt-6 max-w-2xl text-base leading-8 text-[#6f6077]">{category.subtitle} Explore every detail and collect ideas for your complete look.</p></section>
    <section className="mx-auto max-w-7xl px-5 pb-24"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{category.sections.map((section, index) => <article key={section.slug} className="group relative min-h-[260px] overflow-hidden rounded-[2rem] border border-[#eadff5] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`absolute -right-8 -top-8 h-40 w-40 rounded-full ${index % 2 === 0 ? "bg-[#f1e5ff]" : "bg-[#ffe8f0]"} transition duration-500 group-hover:scale-125`}/><div className="relative flex h-full flex-col"><span className="text-[10px] uppercase tracking-[0.2em] text-purple-700">Inspiration {String(index + 1).padStart(2, "0")}</span><h2 className="mt-9 text-3xl font-light tracking-[-0.05em]">{section.title}</h2><p className="mt-3 max-w-sm text-sm leading-6 text-[#6f6077]">{section.description}</p><div className="mt-auto flex flex-wrap gap-2 pt-6">{section.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-[#faf4ff] px-3 py-1.5 text-[10px] text-[#725b82]">{keyword}</span>)}</div></div></article>)}</div>
    <div className="mt-12 rounded-[2rem] bg-[#f1e5ff] p-8"><p className="text-xs uppercase tracking-widest text-purple-700">Found your mood?</p><h2 className="mt-3 text-4xl font-light">Let’s bring this look to life.</h2><p className="mt-3 text-sm text-[#655968]">Explore Beaura makeup artists and find someone who can create the look you have in mind.</p><Link href="/bride/home" className="mt-6 inline-flex rounded-full bg-[#171018] px-7 py-3.5 text-sm text-white">Find your artist ↗</Link></div></section>
  </main>;
}
