import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private workspace surfaces should never be indexed.
        disallow: ["/dashboard", "/dashboard/"],
      },
    ],
    sitemap: "https://naturalwrite.app/sitemap.xml",
  };
}
