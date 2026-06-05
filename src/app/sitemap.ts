import type { MetadataRoute } from "next";

/** Static sitemap: the two public routes. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ksaju.me";
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified },
    { url: `${base}/inyeon`, lastModified },
  ];
}
