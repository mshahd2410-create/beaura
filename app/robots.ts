import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/contact", "/faqs", "/privacy", "/terms", "/bride/mua/"],
      disallow: [
        "/admin/",
        "/dashboard/",
        "/bride/home",
        "/bride/bookings",
        "/bride/booking/",
        "/bride/messages/",
        "/bride/wallet",
        "/bride/account",
        "/bride/favorites",
        "/api/",
      ],
    },
    sitemap: "https://www.beauraegypt.com/sitemap.xml",
  };
}
