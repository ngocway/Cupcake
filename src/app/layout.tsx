import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SharedBackground } from "@/components/public/SharedBackground";
import { Providers } from "@/components/Providers";
import { getLocale, getMessages } from "next-intl/server";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dolcake - Student Portal",
  description: "Dolcake - Interactive English Learning Portal for Students.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

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
    </html>
  );
}
