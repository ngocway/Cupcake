import type { Metadata } from "next";
import { HomeShell } from "@/app/_components/HomeShell";
import { auth } from "@/auth";

import { TeacherDashboardClient } from "./_components/TeacherDashboardClient";

export const metadata: Metadata = {
  title: "Dolcake Teacher – Công cụ Tạo Game Học Tập & Thư viện Global Success",
  description:
    "Cổng giáo viên Dolcake: Nền tảng tạo trò chơi dạy học tương tác (Nối cặp, Lật thẻ, Bắn súng Toán, Trắc nghiệm) và kho bài tập chuẩn SGK Global Success Lớp 1–12 miễn phí.",
  keywords: [
    "công cụ tạo game học tập",
    "tạo trò chơi dạy học",
    "game tiếng anh cho học sinh",
    "bài tập tiếng anh global success",
    "bài tập tiếng anh lớp 1 đến 12",
    "phần mềm tạo trò chơi dạy học",
    "interactive classroom games",
    "flashcard match game",
    "dolcake teacher portal",
    "dolcake teacher",
  ],
  alternates: {
    canonical: "https://dolcake.com/teacher",
  },
  openGraph: {
    title: "Dolcake Teacher Portal – Công cụ Tạo Trò Chơi Dạy Học Tương Tác Miễn Phí",
    description:
      "Tạo trò chơi dạy học sinh động chỉ trong 1 phút: Nối từ, Đoàn tàu từ vựng, Đập trứng toán học, Trắc nghiệm kẹo ngọt. Tích hợp ngân hàng câu hỏi Global Success 1–12.",
    url: "https://dolcake.com/teacher",
    siteName: "Dolcake",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "https://media.dolcake.com/images/teacher-og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Dolcake Teacher Portal – Công cụ Tạo Trò Chơi Dạy Học Tương Tác Miễn Phí Cho Giáo Viên",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dolcake Teacher Portal – Công cụ Tạo Trò Chơi Dạy Học Tương Tác Miễn Phí",
    description:
      "Nền tảng tạo game học tập tương tác & kho câu hỏi Global Success 1–12 miễn phí cho giáo viên.",
    images: ["https://media.dolcake.com/images/teacher-og-banner.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dolcake Teacher Portal",
  applicationCategory: "EducationalApplication",
  operatingSystem: "All",
  url: "https://dolcake.com/teacher",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "VND",
  },
  description:
    "Nền tảng tạo trò chơi dạy học tương tác và thư viện câu hỏi chuẩn sách giáo khoa Global Success Lớp 1-12 dành cho giáo viên.",
  featureList: [
    "Tạo game Nối cặp từ vựng (Match Vocabulary)",
    "Tạo game Đoàn tàu từ vựng (Vocabulary Train)",
    "Tạo game Đập trứng toán học (Math Egg Smash)",
    "Tạo game Trắc nghiệm kẹo ngọt (Candy Quiz)",
    "Ngân hàng câu hỏi chuẩn SGK Global Success Lớp 1 đến 12",
    "Chia sẻ mã QR cho học sinh chơi ngay",
  ],
};

export default async function TeacherHomePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const initialTab = params?.tab || "match";
  const session = await auth();
  const isAuthenticated = Boolean(
    session?.user?.id && (session.user.role === "TEACHER" || session.user.role === "ADMIN")
  );

  return (
    <HomeShell initialSession={session}>
      {/* Semantic H1 for Search Engines and Screen Readers */}
      <h1 className="sr-only">
        Dolcake Teacher Portal – Công cụ Tạo Trò Chơi Dạy Học Tương Tác Miễn Phí Cho Giáo Viên
      </h1>

      {/* JSON-LD Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <TeacherDashboardClient
        initialTab={initialTab}
        isAuthenticated={isAuthenticated}
        userId={session?.user?.id ?? null}
      />
    </HomeShell>
  );
}

