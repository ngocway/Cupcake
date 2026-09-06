import { HomeShell } from "@/app/_components/HomeShell";
import { TreasureHuntCreatorUI } from "./TreasureHuntCreatorUI";

export default function TreasureHuntCreatePage() {
  return (
    <HomeShell>
      <div className="w-full pb-20 px-4 md:px-10 max-w-[1680px] mx-auto">
        <TreasureHuntCreatorUI />
      </div>
    </HomeShell>
  );
}
