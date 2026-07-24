import { LearningGoalsFilter } from "./LearningGoalsFilter";
import { SubjectSelector } from "./SubjectSelector";
import { getTranslations, getLocale } from "next-intl/server";
import { getOnboardingConfig } from "@/actions/user-preferences-actions";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function SidebarContent({ searchParams, initialUserType, studySubject, studyAgeGroup }: { searchParams: any, initialUserType: string, studySubject?: string, studyAgeGroup?: string }) {
  const t = await getTranslations("home");
  const config = await getOnboardingConfig() as any;
  const locale = await getLocale();
  const session = await auth();

  const cookieStore = await cookies();
  const studyLevelRaw = cookieStore.get("study_level")?.value || "b1";
  const displayLevel = studyLevelRaw.toUpperCase().split(",")[0] || "B1";

  const userName = session?.user?.name || "Minh";

  return (
    <div className="flex flex-col gap-4 w-full">
      <style>{`
        /* Scoped redesign CSS with fixed hex colors for perfect fidelity */
        /* section label */
        .cefr-redesign-section-label {
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          color: #8C826D;
          text-transform: uppercase;
          padding: 0 2px;
        }

        /* subject pills */
        .cefr-redesign-subject-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cefr-redesign-subject-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 14px;
          text-align: left;
          transition: all 0.3s ease;
          width: 100%;
        }
        .cefr-redesign-subject-btn .material-symbols-rounded {
          font-size: 19px !important;
        }
        .cefr-redesign-subject-btn.active {
          background: #12A375 !important;
          color: #FFFFFF !important;
        }
        .cefr-redesign-subject-btn.locked {
          background: #FFFFFF !important;
          color: #8C826D !important;
        }
        .cefr-redesign-subject-btn.locked .lock {
          margin-left: auto;
          font-size: 15px !important;
        }

        /* goal chips */
        .cefr-redesign-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .cefr-redesign-chip {
          font-family: 'Baloo 2', 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #FFFFFF !important;
          color: #8C826D !important;
          border: 1.5px solid #F0E2BF !important;
          transition: all 0.3s ease;
        }
        .cefr-redesign-chip.active {
          background: #3E3524 !important;
          color: #FFFFFF !important;
          border-color: #3E3524 !important;
        }
      `}</style>

      {/* Subject Selector */}
      <SubjectSelector subjects={(config?.subjects || []).map((s: any) => ({ id: s.id, label: s.label, icon: s.icon }))} config={config} />

      {/* Learning Goals */}
      <LearningGoalsFilter config={config} activeId={searchParams.goal || searchParams.categoryId} />
    </div>
  );
}

