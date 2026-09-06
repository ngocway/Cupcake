import { HomeShell } from "@/app/_components/HomeShell";
import { CandyQuizCreatorUI } from "./CandyQuizCreatorUI";

export default function CandyQuizCreatePage() {
  return (
    <HomeShell>
      <div className="w-full pb-20 px-4 md:px-10 max-w-[1680px] mx-auto">
        <CandyQuizCreatorUI />
      </div>
    </HomeShell>
  );
}
