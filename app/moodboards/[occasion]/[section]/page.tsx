import Link from "next/link";
import { notFound } from "next/navigation";
import { getMoodboardCategory } from "@/lib/moodboards";
import PinterestInspiration from "@/components/PinterestInspiration";

const pinsBySection: Record<string, { url: string; title: string }[]> = {
  makeup: [
    { url: "https://es.pinterest.com/pin/4574037117042238/", title: "Bridal makeup inspiration" },
    { url: "https://www.pinterest.com/pin/348677196143005861/", title: "Evening glam makeup ideas" },
  ],
  dresses: [],
  hairstyles: [],
  outfits: [],
  hijab: [],
  venues: [],
  shoes: [],
  accessories: [],
};

export function generateStaticParams() {
  return (["wedding","engagement","birthday","party","night-out","soiree","photoshoot","graduation"]).flatMap((occasion) => {
    const category = getMoodboardCategory(occasion);
    return category ? category.sections.map((section) => ({ occasion, section: section.slug })) : [];
  });
}

export default async function InspirationSectionPage({ params }: { params: Promise<{ occasion: string; section: string }> }) {
  const { occasion, section } = await params;
  const category = getMoodboardCategory(occasion);
  const item = category?.sections.find((entry) => entry.slug === section);
  if (!category || !item) notFound();
  const query = encodeURIComponent(`${category.title} ${item.title} inspiration`);
  const searchUrl = `https://www.pinterest.com/search/pins/?q=${query}`;
  const pins = pinsBySection[section] ?? [];

  return <main className="min-h-screen bg-[#fffafc] text-[#171018]">
    <header className="border-b border-[#eadff5] bg-white"><div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5"><Link href="/" className="text-4xl font-light tracking-[-0.09em]">Beaura<span className="text-purple-600">.</span></Link><Link href={`/moodboards/${category.slug}`} className="text-sm text-[#6f6077]">← {category.title} inspiration</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 pb-8 pt-14"><p className="text-xs uppercase tracking-[0.2em] text-purple-700">Beaura inspiration · {category.title}</p><h1 className="mt-4 text-5xl font-light tracking-[-0.07em] md:text-7xl">{item.title}<span className="text-purple-600">.</span></h1><p className="mt-5 max-w-2xl text-base leading-8 text-[#6f6077]">{item.description}</p><div className="mt-6 flex flex-wrap gap-2">{item.keywords.map((word) => <span key={word} className="rounded-full bg-[#f1e5ff] px-4 py-2 text-xs text-[#725b82]">{word}</span>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 pb-24"><PinterestInspiration pins={pins} searchUrl={searchUrl}/></section>
  </main>;
}
