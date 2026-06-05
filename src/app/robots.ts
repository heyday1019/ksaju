import type { MetadataRoute } from "next";

/** Allow all crawlers (soft launch is indexable) and advertise the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://ksaju.me/sitemap.xml",
  };
}
