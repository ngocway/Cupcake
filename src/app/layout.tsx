import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SharedBackground } from "@/components/public/SharedBackground";
import { Providers } from "@/components/Providers";
import { getLocale, getMessages } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dolcake – Learn English with Fun Lessons & Games",
    template: "%s | Dolcake",
  },
  description:
    "Dolcake is an interactive English learning platform for kids, teens, and learners of all ages. Enjoy engaging lessons, flashcards, quizzes, and games designed to make English fun and effective.",
  keywords: [
    "dolcake",
    "dolcake.com",
    "learn english online",
    "english for kids",
    "english learning platform",
    "interactive english lessons",
    "english flashcards",
    "english quiz for kids",
    "english games for students",
    "english for kindergarten",
    "english learning app",
  ],
  authors: [{ name: "Dolcake", url: "https://dolcake.com" }],
  creator: "Dolcake",
  publisher: "Dolcake",
  metadataBase: new URL("https://dolcake.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://dolcake.com",
    siteName: "Dolcake",
    title: "Dolcake – Learn English with Fun Lessons & Games",
    description:
      "Interactive English learning for kids and teens. Explore lessons, flashcards, quizzes, and games on Dolcake.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dolcake – Interactive English Learning Platform",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dolcake – Learn English with Fun Lessons & Games",
    description:
      "Interactive English learning for kids and teens. Explore lessons, flashcards, quizzes, and games on Dolcake.",
    images: ["/images/og-image.png"],
    site: "@dolcake",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang={locale}
      className={`${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" precedence="default" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Lexend:wght@300;400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" precedence="default" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers locale={locale} messages={messages}>
          <SharedBackground />
          {children}
        </Providers>
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
      <Analytics />
    </html>
  );
}
