import type { MetadataRoute } from "next";

const BASE = "https://scribe-sigma.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/type",
    "/plans",
    "/stats",
    "/dashboard",
    "/account",
    "/warm-up",
  ];

  return routes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/type" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
