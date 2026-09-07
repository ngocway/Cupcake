"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { getShooterQuizGameDetailsAction } from "@/actions/shooter-quiz-actions";
import { SciFiNeonShooterGame } from "@/app/_components/SciFiNeonShooterGame";
import { ChoiceShooterGame, ChoiceShooterQuestion } from "@/lib/choice-shooter-storage";

const DEFAULT_SHOOTER_QUESTIONS: ChoiceShooterQuestion[] = [
  {
    id: "demo-1",
    typeId: "quiz",
    q: "Which 2D shape usually has exactly three straight sides and three corners?",
    a: "Triangle",
    wrong: ["Square", "Circle", "Rectangle"],
  },
  {
    id: "demo-2",
    typeId: "quiz",
    q: "What color is a ripe banana?",
    a: "Yellow",
    wrong: ["Blue", "Purple", "Green"],
  },
  {
    id: "demo-3",
    typeId: "quiz",
    q: "Which planet do we live on?",
    a: "Earth",
    wrong: ["Mars", "Jupiter", "Venus"],
  },
  {
    id: "demo-4",
    typeId: "quiz",
    q: "How many days are in a week?",
    a: "7",
    wrong: ["5", "6", "8"],
  },
  {
    id: "demo-5",
    typeId: "quiz",
    q: "What sweet food do bees make?",
    a: "Honey",
    wrong: ["Milk", "Bread", "Juice"],
  },
];

function ShooterQuizGameRunner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const topicId = searchParams?.get("topicId") || null;

  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<ChoiceShooterGame | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadGameData() {
      setLoading(true);
      setErrorMessage(null);

      if (!topicId) {
        // Fallback demo game for direct testing
        setGame({
          id: "shooter-demo",
          code: "DEMO",
          title: "Bắn súng Trắc nghiệm (Bản Mẫu)",
          questionCount: DEFAULT_SHOOTER_QUESTIONS.length,
          endMode: "finish",
          selectedTypes: ["quiz"],
          questions: DEFAULT_SHOOTER_QUESTIONS,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      try {
        const res = await getShooterQuizGameDetailsAction(topicId);
        if (res.success && res.topic) {
          const flatQuestions: ChoiceShooterQuestion[] = [];

          if (res.topic.rounds && res.topic.rounds.length > 0) {
            res.topic.rounds.forEach((round) => {
              round.questions.forEach((q) => {
                const correctOpt = q.options.find((opt) => opt.isCorrect);
                const wrongOpts = q.options.filter((opt) => !opt.isCorrect);

                if (correctOpt && correctOpt.text.trim()) {
                  flatQuestions.push({
                    id: q.id,
                    typeId: "shooter-quiz",
                    q: q.question || "Chọn đáp án chính xác:",
                    a: correctOpt.text.trim(),
                    wrong: wrongOpts
                      .map((opt) => opt.text.trim())
                      .filter(Boolean),
                  });
                }
              });
            });
          }

          if (flatQuestions.length === 0) {
            setErrorMessage("Bài tập này chưa có câu hỏi nào hợp lệ để chơi!");
            setLoading(false);
            return;
          }

          setGame({
            id: res.topic.id,
            code: res.topic.id,
            title: res.topic.title || "Bắn súng Trắc nghiệm",
            questionCount: flatQuestions.length,
            endMode: "finish",
            selectedTypes: ["shooter-quiz"],
            questions: flatQuestions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          setErrorMessage(res.error || "Không tìm thấy bài tập Bắn súng Trắc nghiệm!");
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Lỗi hệ thống khi tải bài tập!");
      } finally {
        setLoading(false);
      }
    }

    loadGameData();
  }, [topicId]);

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/teacher?tab=my-quiz-games");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050510] text-white flex flex-col items-center justify-center space-y-4 select-none">
        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-sm text-cyan-400 font-bold tracking-wider">
          Đang nạp dữ liệu Bắn súng Trắc nghiệm...
        </p>
      </div>
    );
  }

  if (errorMessage || !game) {
    return (
      <div className="fixed inset-0 bg-[#050510] text-white flex flex-col items-center justify-center p-6 text-center space-y-6 font-sans select-none">
        <div className="w-20 h-20 rounded-3xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center text-4xl shadow-xl">
          ⚠️
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="font-headline font-black text-2xl text-white">Không thể tải bài tập!</h1>
          <p className="text-xs text-slate-400 font-mono">
            {errorMessage || "Dữ liệu bài tập không tồn tại hoặc đã bị xóa."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
          >
            Quay lại
          </button>
          <Link
            href="/teacher?tab=my-quiz-games"
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-cyan-500/20 transition-all"
          >
            Danh sách bài tập
          </Link>
        </div>
      </div>
    );
  }

  return <SciFiNeonShooterGame game={game} onClose={handleClose} />;
}

export default function ShooterQuizGamePage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-[#050510] text-white flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-cyan-400">Đang khởi tạo...</p>
        </div>
      }
    >
      <ShooterQuizGameRunner />
    </Suspense>
  );
}
