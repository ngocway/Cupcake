import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getGameTopicSeoData,
  generateGameMetadata,
} from "@/lib/seo/game-seo-generator";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const topicId =
    typeof resolvedParams.topicId === "string" ? resolvedParams.topicId : undefined;

  if (!topicId) {
    return {
      title: "Truy Tìm Kho Báu - Treasure Hunt | Dolcake",
      description:
        "Trò chơi truy tìm kho báu trắc nghiệm tiếng Anh hấp dẫn cho học sinh trên Dolcake.",
    };
  }

  const topic = await getGameTopicSeoData(topicId);
  if (!topic) {
    return {
      title: "Truy Tìm Kho Báu | Dolcake",
      description: "Trò chơi tiếng Anh tương tác cho bé trên Dolcake.",
    };
  }

  const canonicalUrl = `https://dolcake.com/student/game/treasure-hunt?topicId=${encodeURIComponent(topicId)}`;
  return generateGameMetadata(topic, canonicalUrl);
}

export default async function StudentTreasureHuntPage({
  searchParams,
}: PageProps) {
  const resolvedParams = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  redirect(`/game/treasure-grid${queryString ? `?${queryString}` : ""}`);
}
