export interface ChoiceShooterQuestion {
  id: string;
  typeId: string;
  q: string;
  a: string;
  wrong: string[];
}

export interface ChoiceShooterGame {
  id: string;
  code: string;
  title: string;
  questionCount: number;
  endMode: "finish" | "loop";
  selectedTypes: string[];
  questions: ChoiceShooterQuestion[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "dolcake_choice_shooter_games";

const DEFAULT_GAMES: ChoiceShooterGame[] = [
  {
    id: "SHOOT-2024",
    code: "SHOOT-2024",
    title: "Bài tập Bắn súng Toán học (Mẫu)",
    questionCount: 10,
    endMode: "finish",
    selectedTypes: ["add_1", "sub_1"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      { id: "q1", typeId: "add_1", q: "7 + 8 = ?", a: "15", wrong: ["14", "16", "13"] },
      { id: "q2", typeId: "sub_1", q: "9 - 4 = ?", a: "5", wrong: ["4", "6", "3"] },
      { id: "q3", typeId: "add_1", q: "6 + 6 = ?", a: "12", wrong: ["11", "13", "14"] },
      { id: "q4", typeId: "sub_1", q: "10 - 7 = ?", a: "3", wrong: ["2", "4", "5"] },
      { id: "q5", typeId: "add_1", q: "9 + 5 = ?", a: "14", wrong: ["13", "15", "16"] },
      { id: "q6", typeId: "sub_1", q: "8 - 3 = ?", a: "5", wrong: ["6", "4", "7"] },
      { id: "q7", typeId: "add_1", q: "4 + 9 = ?", a: "13", wrong: ["12", "14", "11"] },
      { id: "q8", typeId: "sub_1", q: "7 - 2 = ?", a: "5", wrong: ["6", "4", "3"] },
      { id: "q9", typeId: "add_1", q: "8 + 6 = ?", a: "14", wrong: ["13", "15", "12"] },
      { id: "q10", typeId: "sub_1", q: "9 - 6 = ?", a: "3", wrong: ["2", "4", "5"] }
    ]
  }
];

export function getChoiceShooterGames(): ChoiceShooterGame[] {
  if (typeof window === "undefined") return DEFAULT_GAMES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GAMES));
      return DEFAULT_GAMES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_GAMES;
  } catch (e) {
    console.error("Failed to read choice shooter games:", e);
    return DEFAULT_GAMES;
  }
}

export function getChoiceShooterGameById(idOrCode: string): ChoiceShooterGame | null {
  const games = getChoiceShooterGames();
  const searchKey = idOrCode.trim().toUpperCase();
  return (
    games.find(
      (g) => g.id.toUpperCase() === searchKey || g.code.toUpperCase() === searchKey
    ) || null
  );
}

export function saveChoiceShooterGame(
  gameData: Partial<ChoiceShooterGame> & { code: string; title: string; questions: ChoiceShooterQuestion[] }
): ChoiceShooterGame {
  const games = getChoiceShooterGames();
  const existingIdx = games.findIndex(
    (g) => g.id === gameData.id || g.code === gameData.code
  );

  const now = new Date().toISOString();
  let savedGame: ChoiceShooterGame;

  if (existingIdx >= 0) {
    savedGame = {
      ...games[existingIdx],
      ...gameData,
      updatedAt: now,
    };
    games[existingIdx] = savedGame;
  } else {
    savedGame = {
      id: gameData.id || gameData.code,
      code: gameData.code,
      title: gameData.title || "Bài tập Bắn súng Toán học",
      questionCount: gameData.questionCount || gameData.questions.length,
      endMode: gameData.endMode || "finish",
      selectedTypes: gameData.selectedTypes || ["add_1"],
      questions: gameData.questions,
      createdAt: now,
      updatedAt: now,
    };
    games.unshift(savedGame);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    } catch (e) {
      console.error("Failed to save choice shooter game:", e);
    }
  }

  return savedGame;
}

export function deleteChoiceShooterGame(idOrCode: string): boolean {
  const games = getChoiceShooterGames();
  const searchKey = idOrCode.trim().toUpperCase();
  const filtered = games.filter(
    (g) => g.id.toUpperCase() !== searchKey && g.code.toUpperCase() !== searchKey
  );

  if (filtered.length === games.length) return false;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to delete choice shooter game:", e);
    }
  }

  return true;
}
