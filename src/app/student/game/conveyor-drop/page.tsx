import type { Metadata } from "next";
import {
  getGameTopicSeoData,
  generateGameMetadata,
  generateGameJsonLd,
} from "@/lib/seo/game-seo-generator";
import ConveyorDropGameClient from "./ConveyorDropGameClient";

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
      title: "Băng Chuyền Thả Chữ - Conveyor Drop | Dolcake",
      description:
        "Trò chơi băng chuyền thả từ vựng tiếng Anh tương tác nhanh nhẹn cho bé trên Dolcake.",
    };
  }

  const topic = await getGameTopicSeoData(topicId);
  if (!topic) {
    return {
      title: "Băng Chuyền Thả Chữ | Dolcake",
      description: "Trò chơi học từ vựng tiếng Anh cho học sinh trên Dolcake.",
    };
  }

  const canonicalUrl = `https://dolcake.com/student/game/conveyor-drop?topicId=${encodeURIComponent(topicId)}`;
  return generateGameMetadata(topic, canonicalUrl);
}

export default async function ConveyorDropGamePage({ searchParams }: PageProps) {
  const { topicId } = await searchParams;
  const topic = topicId ? await getGameTopicSeoData(topicId) : null;
  const canonicalUrl = topicId
    ? `https://dolcake.com/student/game/conveyor-drop?topicId=${encodeURIComponent(topicId)}`
    : "https://dolcake.com/student/game/conveyor-drop";
  const jsonLd = topic ? generateGameJsonLd(topic, canonicalUrl) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ConveyorDropGameClient />
    </>
  );
}
