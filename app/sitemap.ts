import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.beauraegypt.com";
  const routes = ["/", "/about", "/contact", "/faqs", "/privacy", "/terms"];

  return routes.map((route) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.5,
  }));
}
