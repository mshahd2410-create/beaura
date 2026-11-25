export type InspirationSection = { slug: string; title: string; description: string; keywords: string[] };
export type MoodboardCategory = { slug: string; title: string; subtitle: string; number: string; sections: InspirationSection[] };

const everydaySections: InspirationSection[] = [
  { slug: "makeup", title: "Makeup looks", description: "From barely-there beauty to statement glam.", keywords: ["Soft glam", "Full glam", "Natural makeup", "Editorial makeup"] },
  { slug: "hairstyles", title: "Hairstyles", description: "Find the hair mood that completes your look.", keywords: ["Sleek bun", "Soft waves", "Hollywood curls", "Braids", "Updos"] },
  { slug: "outfits", title: "Dresses & outfits", description: "Silhouettes, fabrics, colours and outfit details.", keywords: ["Dresses", "Evening looks", "Two-piece sets", "Modest looks"] },
  { slug: "hijab", title: "Hijab inspiration", description: "Hijab styling, fabrics, draping and occasion looks.", keywords: ["Elegant draping", "Turban styles", "Bridal hijab", "Hijab accessories"] },
  { slug: "shoes", title: "Shoes", description: "The finishing touch, from delicate heels to statement pairs.", keywords: ["Heels", "Flats", "Satin shoes", "Embellished shoes"] },
  { slug: "accessories", title: "Accessories", description: "Jewellery, bags and the little details that pull it all together.", keywords: ["Jewellery", "Bags", "Hair accessories", "Details"] },
];

const weddingSections: InspirationSection[] = [
  { slug: "makeup", title: "Bridal makeup", description: "Explore bridal beauty from soft romantic looks to timeless full glam.", keywords: ["Soft bridal glam", "Classic bride", "Glowy bridal makeup", "Full glam bride"] },
  { slug: "hairstyles", title: "Bridal hairstyles", description: "Veils, buns, waves and elegant bridal hair details.", keywords: ["Low bun", "Hollywood waves", "Veil hairstyles", "Bridal updo"] },
  { slug: "dresses", title: "Wedding dresses", description: "Discover silhouettes, lace, details and modern bridal designs.", keywords: ["Minimal gowns", "Lace dresses", "Princess gowns", "Modern bridal"] },
  { slug: "outfits", title: "Outfit inspiration", description: "Looks for the henna, katb ketab, reception and every wedding event.", keywords: ["Katb ketab", "Henna night", "Reception look", "After party"] },
  { slug: "hijab", title: "Bridal hijab", description: "Beautiful draping, fabrics and accessories for the bridal look.", keywords: ["Bridal hijab styles", "Hijab with veil", "Pearl details", "Elegant draping"] },
  { slug: "venues", title: "Wedding venues", description: "Find the atmosphere: gardens, ballrooms, rooftops and destination settings.", keywords: ["Garden wedding", "Ballroom", "Rooftop wedding", "Beach wedding", "Greenhouse"] },
  { slug: "shoes", title: "Bridal shoes", description: "The perfect pair for the ceremony, photos and dancing.", keywords: ["Satin heels", "Pearl heels", "Classic bridal shoes"] },
  { slug: "accessories", title: "Bridal accessories", description: "Veils, jewellery, bags and finishing touches.", keywords: ["Veils", "Tiaras", "Jewellery", "Hair pieces"] },
];

const engagementSections: InspirationSection[] = [
  { slug: "makeup", title: "Engagement makeup", description: "From soft romantic glam to polished statement beauty.", keywords: ["Engagement soft glam", "Glowy makeup", "Full glam"] },
  { slug: "hairstyles", title: "Hairstyles", description: "Hair inspiration to match your engagement look.", keywords: ["Soft waves", "Sleek bun", "Half-up hair", "Hollywood curls"] },
  { slug: "dresses", title: "Engagement dresses", description: "Explore elegant white looks, colour and statement silhouettes.", keywords: ["White engagement dress", "Evening gown", "Minimal dress", "Embellished dress"] },
  { slug: "outfits", title: "Outfit inspiration", description: "Looks for the engagement, katb ketab and celebration.", keywords: ["Engagement outfit", "Katb ketab outfit", "Modern modest look"] },
  { slug: "hijab", title: "Hijab inspiration", description: "Draping, textures and accessories for your engagement look.", keywords: ["Elegant hijab", "Satin hijab", "Turban styling"] },
  { slug: "venues", title: "Engagement venues", description: "Intimate dinners, rooftops, gardens and glamorous celebration spaces.", keywords: ["Garden engagement", "Rooftop dinner", "Hotel ballroom", "Intimate venue"] },
  { slug: "shoes", title: "Shoes", description: "Find the shoes that finish your outfit.", keywords: ["Strappy heels", "Pointed heels", "Embellished shoes"] },
  { slug: "accessories", title: "Accessories", description: "Jewellery, bags and hair details for the occasion.", keywords: ["Statement earrings", "Clutch bags", "Hair accessories"] },
];

const category = (slug: string, title: string, subtitle: string, number: string, sections = everydaySections): MoodboardCategory => ({ slug, title, subtitle, number, sections });

export const moodboardCategories: MoodboardCategory[] = [
  category("wedding", "Wedding", "Your wedding vision, from the first detail to the final look.", "01", weddingSections),
  category("engagement", "Engagement", "Plan the full engagement mood, from beauty to the venue.", "02", engagementSections),
  category("birthday", "Birthday", "Your birthday, your aesthetic, your main-character moment.", "03"),
  category("party", "Party", "Find the look for every celebration and special night.", "04"),
  category("night-out", "Night Out", "After-dark beauty, outfits and finishing touches.", "05"),
  category("soiree", "Soirée", "Elegant evening inspiration, from polished glam to statement style.", "06"),
  category("photoshoot", "Photoshoot", "Build a complete visual direction for your next shoot.", "07"),
  category("graduation", "Graduation", "Celebrate your milestone with a look that feels like you.", "08"),
];

export function getMoodboardCategory(slug: string) {
  return moodboardCategories.find((item) => item.slug === slug);
}
