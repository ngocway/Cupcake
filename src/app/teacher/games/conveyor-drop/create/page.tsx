import { HomeShell } from "@/app/_components/HomeShell";
import { ConveyorDropCreatorUI } from "./ConveyorDropCreatorUI";

export default async function ConveyorDropCreatePage() {
  return (
    <HomeShell>
      <div className="w-full pb-20 px-4 md:px-10 max-w-[1400px] mx-auto">
        <ConveyorDropCreatorUI />
      </div>
    </HomeShell>
  );
}
