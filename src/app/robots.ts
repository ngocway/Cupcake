import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/public", "/flashcards", "/teacher", "/guides", "/classes", "/grammar", "/exercises"],
        disallow: ["/admin", "/api", "/student", "/profile"],
      },
    ],
    sitemap: "https://dolcake.com/sitemap.xml",
  };
}
