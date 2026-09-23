import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getGameTopicSeoData,
  generateGameMetadata,
  generateGameJsonLd,
  generateGameFaqItems,
  getGameHowToPlay,
  getRelatedGameTopics,
  getGamePlayUrl,
} from "@/lib/seo/game-seo-generator";
import { PublicGameView } from "./PublicGameView";

export const revalidate = 3600;
export const dynamicParams = true;

interface PublicGamePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PublicGamePageProps): Promise<Metadata> {
  const { id } = await params;
  const topic = await getGameTopicSeoData(id);

  if (!topic) {
    return {
      title: "Trò chơi giáo dục | Dolcake",
      description: "Trò chơi học tiếng Anh tương tác trên Dolcake.",
    };
  }

  const canonicalUrl = `https://dolcake.com/public/games/${topic.slug ?? topic.id}`;
  return generateGameMetadata(topic, canonicalUrl);
}

export default async function PublicGamePage({ params }: PublicGamePageProps) {
  const { id } = await params;
  const topic = await getGameTopicSeoData(id);

  if (!topic) {
    notFound();
  }

  const canonicalUrl = `https://dolcake.com/public/games/${topic.slug ?? topic.id}`;
  const jsonLd = generateGameJsonLd(topic, canonicalUrl);
  const playUrl = getGamePlayUrl(topic);
  const howToPlay = getGameHowToPlay(topic.gameMode);
  const faqList = generateGameFaqItems(topic);
  const relatedGames = await getRelatedGameTopics(topic.id, topic.ageGroup, 4);

  return (
    <>
      {/* Schema.org Structured Data (FAQPage + LearningResource / Quiz) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Public Educational Landing Page View with In-Page Fullscreen Runner */}
      <PublicGameView
        topic={topic}
        canonicalUrl={canonicalUrl}
        playUrl={playUrl}
        howToPlay={howToPlay}
        faqList={faqList}
        relatedGames={relatedGames}
      />
    </>
  );
}
