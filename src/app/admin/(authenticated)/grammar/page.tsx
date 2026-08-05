import prisma from "@/lib/prisma";
import { CEFR_LEVELS, GRAMMAR_TOPICS, getTopicsForLevel } from "@/lib/grammar-taxonomy";
import GrammarManagerClient from "./GrammarManagerClient";

export const metadata = {
  title: "Quản lý Cây Ngữ pháp | Admin",
  description: "Quản lý và duyệt cây ngữ pháp theo trình độ, chủ đề và bài học",
};

export default async function AdminGrammarPage() {
  // 1. Fetch all grammar lessons that have non-empty instructions
  const grammarLessonsWithContent = await prisma.grammarLesson.findMany({
    where: {
      instructions: { not: null },
    },
    select: {
      id: true,
    },
  });

  const contentSet = new Set(
    grammarLessonsWithContent.map(g => g.id)
  );

  // 2. Fetch counts of public exercises per topic and lesson in a single query
  const exerciseCounts = await prisma.assignment.groupBy({
    by: ["grammarTopic", "grammarLesson"],
    where: {
      deletedAt: null,
      grammarTopic: { not: null },
      grammarLesson: { not: null },
    },
    _count: {
      id: true,
    },
  });

  // Helper map: key = `${topicId}_${lessonId}` -> count
  const countMap = new Map<string, number>();
  exerciseCounts.forEach(c => {
    if (c.grammarTopic && c.grammarLesson) {
      countMap.set(`${c.grammarTopic}_${c.grammarLesson}`, c._count.id);
    }
  });

  // 3. Format levels and topics By Level structures
  const levels = CEFR_LEVELS.map(lvl => ({
    id: lvl.id,
    label: lvl.label,
  }));

  const topicsByLevel: Record<string, any[]> = {};

  levels.forEach(level => {
    const lvlId = level.id;
    const rawTopics = getTopicsForLevel(lvlId);

    topicsByLevel[lvlId] = rawTopics.map(topic => {
      // Map lessons at this level
      const lessons = topic.lessons
        .filter(l => l.level === lvlId)
        .map(l => {
          const exerciseCount = countMap.get(`${topic.id}_${l.id}`) ?? 0;
          const hasContent = contentSet.has(l.id);

          return {
            id: l.id,
            label: l.label,
            level: l.level,
            exerciseCount,
            hasContent,
          };
        });

      return {
        id: topic.id,
        label: topic.label,
        labelVi: topic.labelVi,
        icon: topic.icon,
        lessons,
      };
    });
  });

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      {/* Page Header */}
      <div className="px-8 py-5 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/50">
        <div>
          <h1 className="text-xl font-display font-black text-white">Quản lý Ngữ pháp (Taxonomy Map)</h1>
          <p className="text-xs text-neutral-500 font-semibold mt-0.5">
            Xem phân bổ giáo trình ngữ pháp toàn hệ thống và xem trước nội dung bài học.
          </p>
        </div>
      </div>

      {/* Main interactive area */}
      <GrammarManagerClient levels={levels} topicsByLevel={topicsByLevel} />
    </div>
  );
}
