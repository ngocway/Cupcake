import { HomeShell } from "@/app/_components/HomeShell";
import { FlipImageImageCreatorUI } from "./FlipImageImageCreatorUI";
import { FlipImageTextCreatorUI } from "./FlipImageTextCreatorUI";

export default async function FlipGameCreatePage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const gameType = params?.type || "image-text";

  return (
    <HomeShell>
      <div className="w-full pb-20 px-4 md:px-10 max-w-[1400px] mx-auto">
        {gameType === "image-image" ? (
          <FlipImageImageCreatorUI />
        ) : (
          <FlipImageTextCreatorUI gameType={gameType} />
        )}
      </div>
    </HomeShell>
  );
}
