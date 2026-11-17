import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.beauraegypt.com";
  const routes = [
    "",
    "/about",
    "/contact",
    "/faqs",
    "/privacy",
    "/terms",
    "/register",
    "/register/bride",
    "/register/mua",
    "/login",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/register") ? 0.7 : 0.5,
  }));
}
