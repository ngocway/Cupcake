import type { Metadata } from "next";
import {
  getGameTopicSeoData,
  generateGameMetadata,
  generateGameJsonLd,
} from "@/lib/seo/game-seo-generator";
import ShooterQuizGameClient from "./ShooterQuizGameClient";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  searchParams: Promise<{ topicId?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { topicId } = await searchParams;
  if (!topicId) {
    return {
      title: "Bắn Súng Trắc Nghiệm - Shooter Quiz | Dolcake",
      description:
        "Trò chơi bắn súng trắc nghiệm tiếng Anh khoa học viễn tưởng neon cực chất cho học sinh trên Dolcake.",
    };
  }

  const topic = await getGameTopicSeoData(topicId);
  if (!topic) {
    return {
      title: "Bắn Súng Trắc Nghiệm | Dolcake",
      description: "Trò chơi trắc nghiệm tiếng Anh cho bé trên Dolcake.",
    };
  }

  const canonicalUrl = `https://dolcake.com/game/shooter-quiz?topicId=${encodeURIComponent(topicId)}`;
  return generateGameMetadata(topic, canonicalUrl);
}

export default async function ShooterQuizGamePage({ searchParams }: PageProps) {
  const { topicId } = await searchParams;
  const topic = topicId ? await getGameTopicSeoData(topicId) : null;
  const canonicalUrl = topicId
    ? `https://dolcake.com/game/shooter-quiz?topicId=${encodeURIComponent(topicId)}`
    : "https://dolcake.com/game/shooter-quiz";
  const jsonLd = topic ? generateGameJsonLd(topic, canonicalUrl) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ShooterQuizGameClient />
    </>
  );
}
