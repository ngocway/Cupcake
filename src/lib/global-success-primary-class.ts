import prisma from "@/lib/prisma";
import { fetchWithRedis } from "@/lib/cached-queries";

export interface GlobalSuccessUnitData {
  grade: number;
  unit: number;
  title: string;
  vocabTopicId: string | null;
  enViTopicId: string | null;
  convTopicId: string | null;
  quizTopicId: string | null;
}

export type GlobalSuccessPrimaryUnitsByGrade = Record<number, GlobalSuccessUnitData[]>;

export const GLOBAL_SUCCESS_PRIMARY_CLASS_ID = "global-success-primary";
export const GLOBAL_SUCCESS_GRADE_COOKIE = "gs_primary_grade";

export function getProgressSettingKey(userId: string): string {
  return `gs_primary_progress:${userId}`;
}

export interface GlobalSuccessProgressData {
  grade: number | null;
  completedStations: Record<
    string,
    {
      completedAt: string;
      score?: number | null;
    }
  >;
}

export async function getUserGlobalSuccessProgress(
  userId: string
): Promise<GlobalSuccessProgressData> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: getProgressSettingKey(userId) },
    });
    if (setting && setting.value && typeof setting.value === "object") {
      const val = setting.value as any;
      const grade =
        typeof val.grade === "number" && val.grade >= 1 && val.grade <= 5
          ? val.grade
          : null;
      const completedStations =
        val.completedStations && typeof val.completedStations === "object"
          ? val.completedStations
          : {};
      return { grade, completedStations };
    }
  } catch (err) {
    console.error("Failed to read gs_primary_progress:", err);
  }
  return { grade: null, completedStations: {} };
}

/**
 * Fetches all official Global Success Primary (Grades 1–5) units by grouping
 * the shared MatchWordTopic library records (Vocabulary, English - Vietnamese,
 * Conversations, Practice Quiz). Cached in Redis for 1 hour.
 */
export async function getGlobalSuccessPrimaryUnits(): Promise<GlobalSuccessPrimaryUnitsByGrade> {
  return fetchWithRedis("gs:primary:units:v1", 3600, async () => {
    const rows = await prisma.matchWordTopic.findMany({
      where: {
        ageGroup: "primary-1-5",
        gameMode: { startsWith: "library-" },
        name: { startsWith: "Grade " },
      },
      select: {
        id: true,
        name: true,
        gameMode: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const unitMap = new Map<string, GlobalSuccessUnitData>();

    for (const row of rows) {
      if (row.name.includes("(Copy")) continue;
      const match = row.name.match(
        /^Grade\s+([1-5])\s*-\s*Unit\s+(\d+):\s*(.+?)\s*\(([^)]+)\)\s*$/i
      );
      if (!match) continue;

      const grade = Number(match[1]);
      const unit = Number(match[2]);
      const title = match[3].trim();
      const setType = match[4].trim().toLowerCase();

      const key = `${grade}-${unit}`;
      let entry = unitMap.get(key);
      if (!entry) {
        entry = {
          grade,
          unit,
          title,
          vocabTopicId: null,
          enViTopicId: null,
          convTopicId: null,
          quizTopicId: null,
        };
        unitMap.set(key, entry);
      }

      if (setType === "vocabulary" && !entry.vocabTopicId) {
        entry.vocabTopicId = row.id;
      } else if (setType.includes("english") && setType.includes("vietnamese") && !entry.enViTopicId) {
        entry.enViTopicId = row.id;
      } else if (setType.includes("conversation") && !entry.convTopicId) {
        entry.convTopicId = row.id;
      } else if (setType.includes("practice quiz") && !entry.quizTopicId) {
        entry.quizTopicId = row.id;
      }
    }

    const byGrade: GlobalSuccessPrimaryUnitsByGrade = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    for (const entry of unitMap.values()) {
      if (byGrade[entry.grade]) {
        byGrade[entry.grade].push(entry);
      }
    }

    for (const g of [1, 2, 3, 4, 5]) {
      byGrade[g].sort((a, b) => a.unit - b.unit);
    }

    return byGrade;
  });
}
