import type { MetadataRoute } from "next";

/** Static sitemap: the public routes (home, inyeon, and the trust pages). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ksaju.me";
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified },
    { url: `${base}/inyeon`, lastModified },
    { url: `${base}/about`, lastModified },
    { url: `${base}/faq`, lastModified },
    { url: `${base}/privacy`, lastModified },
    { url: `${base}/terms`, lastModified },
  ];
}
