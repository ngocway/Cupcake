import { getMatchWordGames } from "@/actions/admin-match-words";
import { MatchWordsSelectClient } from "./MatchWordsSelectClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ age?: string }>;
}

export default async function MatchWordsSelectPage({ searchParams }: Props) {
  const { age = "2-5" } = await searchParams;

  const res = await getMatchWordGames(age);
  const games = (res.success && res.games ? res.games : []) as {
    id: string;
    name: string;
    level: number;
    thumbnailUrl?: string | null;
    topics?: any[];
  }[];

  return <MatchWordsSelectClient games={games} age={age} />;
}
