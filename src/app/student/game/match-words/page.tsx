import type { Metadata } from "next";
import {
  getGameTopicSeoData,
  generateGameMetadata,
  generateGameJsonLd,
} from "@/lib/seo/game-seo-generator";
import MatchWordsGameClient from "./MatchWordsGameClient";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  searchParams: Promise<{ topicId?: string; gameId?: string; age?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { topicId } = await searchParams;
  if (!topicId) {
    return {
      title: "Nối Từ Vựng Tiếng Anh - Match the Words | Dolcake",
      description:
        "Trò chơi nối từ vựng tiếng Anh tương tác sinh động theo chủ đề cho học sinh trên Dolcake.",
    };
  }

  const topic = await getGameTopicSeoData(topicId);
  if (!topic) {
    return {
      title: "Nối Từ Vựng Tiếng Anh | Dolcake",
      description: "Trò chơi học từ vựng tiếng Anh tương tác trên Dolcake.",
    };
  }

  const canonicalUrl = `https://dolcake.com/student/game/match-words?topicId=${encodeURIComponent(topicId)}`;
  return generateGameMetadata(topic, canonicalUrl);
}

export default async function MatchWordsGamePage({ searchParams }: PageProps) {
  const { topicId } = await searchParams;
  const topic = topicId ? await getGameTopicSeoData(topicId) : null;
  const canonicalUrl = topicId
    ? `https://dolcake.com/student/game/match-words?topicId=${encodeURIComponent(topicId)}`
    : "https://dolcake.com/student/game/match-words";
  const jsonLd = topic ? generateGameJsonLd(topic, canonicalUrl) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MatchWordsGameClient />
    </>
  );
}
