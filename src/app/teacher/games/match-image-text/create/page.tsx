import { HomeShell } from "@/app/_components/HomeShell";
import { MatchImageTextCreatorUI } from "./MatchImageTextCreatorUI";

export default async function MatchImageTextCreatePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const gameType = params?.type || "image-text";

  return (
    <HomeShell>
      <div className="w-full pb-20 px-4 md:px-10 max-w-[1400px] mx-auto">
        <MatchImageTextCreatorUI gameType={gameType} />
      </div>
    </HomeShell>
  );
}
