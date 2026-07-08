import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/public/", "/flashcards/"],
        disallow: ["/admin/", "/api/", "/student/", "/teacher/", "/profile/"],
      },
    ],
    sitemap: "https://dolcake.com/sitemap.xml",
  };
}
