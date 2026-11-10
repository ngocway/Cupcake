"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Gamepad2,
  Eye,
  Layers,
  Search,
  Sparkles,
  X,
  Edit3,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
  GraduationCap,
  Clock,
  ChevronDown,
  Check,
  RotateCcw,
  Copy,
  Share2,
} from "lucide-react";
import {
  MatchGameShareModal,
  ShareableGameOption,
} from "./MatchGameShareModal";
import {
  getGlobalSuccessLibrarySetsAction,
  getTeacherLibrarySetByIdAction,
  duplicateTeacherLibrarySetAction,
  LibrarySetItem,
  LibrarySubType,
} from "@/actions/teacher-library-actions";
import { useTeacherLocale, withLangParam } from "@/i18n/teacher-locale";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface CompatibleGameOption {
  id: string;
  titleVi: string;
  titleEn: string;
  badgeVi: string;
  badgeEn: string;
  badgeColor: string;
  descVi: string;
  descEn: string;
  buildHref: (setId: string) => string;
}

function getShareableGameOptionsForSubType(subType: LibrarySubType): ShareableGameOption[] {
  if (subType === "image-text") {
    return [
      {
        id: "train-vocab",
        labelVi: "🚂 Đoàn Tàu",
        labelEn: "🚂 Vocabulary Train",
        gamePath: "/student/game/train",
      },
      {
        id: "conveyor-drop",
        labelVi: "📦 Băng Chuyền",
        labelEn: "📦 Conveyor",
        gamePath: "/student/game/conveyor-drop",
      },
    ];
  }

  if (subType === "quiz") {
    return [
      {
        id: "candy-quiz",
        labelVi: "🍬 Kẹo Ngọt",
        labelEn: "🍬 Candy Quiz",
        gamePath: "/student/game/candy-quiz",
      },
      {
        id: "treasure-hunt",
        labelVi: "🏴‍☠️ Kho Báu",
        labelEn: "🏴‍☠️ Treasure Hunt",
        gamePath: "/game/treasure-grid",
      },
      {
        id: "shooter-quiz",
        labelVi: "🚀 Bắn Súng",
        labelEn: "🚀 Space Shooter",
        gamePath: "/game/shooter-quiz",
      },
    ];
  }

  return [
    {
      id: "match-text-text",
      labelVi: "🔤 Nối Chữ - Chữ",
      labelEn: "🔤 Match Word - Word",
      gamePath: "/student/game/match-text-text",
    },
  ];
}

function getCompatibleGamesForSubType(subType: LibrarySubType): CompatibleGameOption[] {
  if (subType === "image-text") {
    return [
      {
        id: "match-image-text",
        titleVi: "Nối Cặp Ảnh - Chữ (Thẻ bài)",
        titleEn: "Match Image - Word (Cards)",
        badgeVi: "Nối cặp",
        badgeEn: "Matching",
        badgeColor: "bg-orange-500",
        descVi: "Học sinh lật/chọn ghép thẻ hình ảnh với từ vựng tương ứng.",
        descEn: "Students pair illustration cards with matching words.",
        buildHref: (id) =>
          `/teacher/games/match-image-text/create?type=image-text&gameMode=match&librarySetId=${id}&returnTab=lib-global`,
      },
      {
        id: "line-image-text",
        titleVi: "Nối Dây Ảnh - Chữ",
        titleEn: "Line Match Image - Word",
        badgeVi: "Nối dây",
        badgeEn: "Line Match",
        badgeColor: "bg-violet-500",
        descVi: "Học sinh kẻ dây nối từ hình ảnh sang từ vựng tương ứng.",
        descEn: "Students draw lines connecting images to matching words.",
        buildHref: (id) =>
          `/teacher/games/match-image-text/create?type=image-text&gameMode=line&librarySetId=${id}&returnTab=lib-global`,
      },
      {
        id: "cut-rope-image-text",
        titleVi: "Cắt Dây Ảnh - Chữ",
        titleEn: "Cut the Rope Image - Word",
        badgeVi: "Cắt dây",
        badgeEn: "Cut Rope",
        badgeColor: "bg-rose-500",
        descVi: "Học sinh chém đứt dây thừng để thả ảnh rơi trúng từ vựng.",
        descEn: "Students slice ropes to drop images onto matching words.",
        buildHref: (id) =>
          `/teacher/games/match-image-text/create?type=image-text&gameMode=cut-rope&librarySetId=${id}&returnTab=lib-global`,
      },
      {
        id: "train-vocab",
        titleVi: "Đoàn Tàu Từ Vựng",
        titleEn: "Vocabulary Train",
        badgeVi: "Đoàn tàu",
        badgeEn: "Train",
        badgeColor: "bg-amber-500",
        descVi: "Học sinh kéo thả từ vựng lên đúng toa tàu mang hình ảnh.",
        descEn: "Students load vocabulary cards onto matching train carriages.",
        buildHref: (id) =>
          `/teacher/games/match-image-text/create?type=image-text&gameMode=train&librarySetId=${id}&returnTab=lib-global`,
      },
      {
        id: "conveyor-drop",
        titleVi: "Băng Chuyền Thả Khối",
        titleEn: "Conveyor Drop",
        badgeVi: "Băng chuyền",
        badgeEn: "Conveyor",
        badgeColor: "bg-cyan-500",
        descVi: "Học sinh thả khối hình rơi xuống đúng ô trên băng chuyền đang chạy.",
        descEn: "Students drop blocks onto matching slots along a moving conveyor belt.",
        buildHref: (id) =>
          `/teacher/games/conveyor-drop/create?librarySetId=${id}&returnTab=lib-global`,
      },
      {
        id: "flip-image-text",
        titleVi: "Lật Ảnh - Chữ (Memory Flip)",
        titleEn: "Flip Image - Word (Memory)",
        badgeVi: "Lật ảnh",
        badgeEn: "Flip Cards",
        badgeColor: "bg-pink-500",
        descVi: "Học sinh lật mở các ô thẻ úp để tìm cặp Hình ảnh và Từ vựng trùng khớp.",
        descEn: "Students flip memory cards to pair illustrations with words.",
        buildHref: (id) =>
          `/teacher/games/flip/create?type=FLIP_IMAGE_TEXT&gameMode=flip-image-text&librarySetId=${id}&returnTab=lib-global`,
      },
    ];
  }

  if (subType === "text-text") {
    return [
      {
        id: "match-text-text",
        titleVi: "Nối Cặp Chữ - Chữ (Từ vựng / Định nghĩa)",
        titleEn: "Match Word - Word (Pairs)",
        badgeVi: "Chữ - Chữ",
        badgeEn: "Word - Word",
        badgeColor: "bg-indigo-500",
        descVi: "Học sinh ghép cặp từ vựng tiếng Anh với nghĩa hoặc câu hội thoại tương ứng.",
        descEn: "Students match words with definitions, translations, or conversation replies.",
        buildHref: (id) =>
          `/teacher/games/match-image-text/create?type=text-text&librarySetId=${id}&returnTab=lib-global`,
      },
    ];
  }

  if (subType === "quiz") {
    return [
      {
        id: "candy-quiz",
        titleVi: "Trắc nghiệm Xứ Sở Kẹo Ngọt",
        titleEn: "Candy World Quiz",
        badgeVi: "Kẹo ngọt",
        badgeEn: "Candy World",
        badgeColor: "bg-pink-500",
        descVi: "Trả lời câu hỏi trắc nghiệm 4 đáp án trên bản đồ Kẹo Ngọt vui nhộn.",
        descEn: "Answer 4-option multiple choice questions in a lively Candy World.",
        buildHref: (id) =>
          `/teacher/games/candy-quiz/create?librarySetId=${id}&returnTab=lib-global`,
      },
      {
        id: "treasure-hunt",
        titleVi: "Truy Tìm Kho Báu Hải Tặc",
        titleEn: "Mystery Treasure Hunt",
        badgeVi: "Kho báu",
        badgeEn: "Treasure Hunt",
        badgeColor: "bg-amber-500",
        descVi: "Trả lời câu hỏi trắc nghiệm để lật mở bản đồ kho báu và săn rương vàng.",
        descEn: "Answer multiple-choice questions to unlock pirate treasure chests.",
        buildHref: (id) =>
          `/teacher/games/treasure-hunt/create?librarySetId=${id}&returnTab=lib-global`,
      },
      {
        id: "shooter-quiz",
        titleVi: "Bắn Súng Không Gian (Trắc nghiệm)",
        titleEn: "Space Shooter Quiz",
        badgeVi: "Bắn súng",
        badgeEn: "Space Shooter",
        badgeColor: "bg-purple-600",
        descVi: "Điều khiển tàu vũ trụ bắn tia laser vào đáp án đúng đang bay.",
        descEn: "Pilot a space cannon and shoot the orb carrying the correct answer.",
        buildHref: (id) =>
          `/teacher/games/shooter-quiz/create?librarySetId=${id}&returnTab=lib-global`,
      },
    ];
  }

  return [];
}

export interface ParsedGlobalSet {
  raw: LibrarySetItem;
  grade: number;
  unitNumber: number;
  unitKey: string;
  unitHeader: string;
  shortTitle: string;
}

export function parseGlobalSuccessSet(item: LibrarySetItem): ParsedGlobalSet {
  // Expected format: "Grade 3 - Unit 1: Hello (Vocabulary)"
  const gradeMatch = item.name.match(/Grade\s+(\d+)/i);
  const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 3;

  const unitMatch = item.name.match(/(Unit\s+(\d+)\s*:\s*[^(]+?)(?:\s*\((.+)\))?$/i);
  if (unitMatch) {
    const unitHeader = unitMatch[1].trim();
    const unitNumber = parseInt(unitMatch[2], 10) || 1;
    const shortTitle = (unitMatch[3] || item.name).trim();
    return {
      raw: item,
      grade,
      unitNumber,
      unitKey: `g${grade}-u${unitNumber}`,
      unitHeader,
      shortTitle,
    };
  }

  return {
    raw: item,
    grade,
    unitNumber: 1,
    unitKey: `g${grade}-u1`,
    unitHeader: "Unit 1",
    shortTitle: item.name,
  };
}

const CACHE_KEY = "cached_global_success_sets_v10";
const UI_STATE_KEY = "global_success_ui_state_v2";
let memoryCachedGlobalSets: LibrarySetItem[] | null = null;

function readInitialCachedSets(): LibrarySetItem[] {
  if (memoryCachedGlobalSets && memoryCachedGlobalSets.length > 0) {
    return memoryCachedGlobalSets;
  }
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(CACHE_KEY) || sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCachedGlobalSets = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function GlobalSuccessLibraryList() {
  const { t, locale } = useTeacherLocale();
  const router = useRouter();

  const [sets, setSets] = useState<LibrarySetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedUnitKey, setSelectedUnitKey] = useState<string>("all");
  const [subTypeFilter, setSubTypeFilter] = useState<LibrarySubType | "all">("all");

  // Modals & action states
  const [pickerSet, setPickerSet] = useState<LibrarySetItem | null>(null);
  const [viewingSet, setViewingSet] = useState<LibrarySetItem | null>(null);
  const [sharingSet, setSharingSet] = useState<LibrarySetItem | null>(null);
  const hasRestoredUiRef = useRef(false);
  const pendingShareIdRef = useRef<string | null>(null);
  const [loadingViewId, setLoadingViewId] = useState<string | null>(null);
  const [customizingId, setCustomizingId] = useState<string | null>(null);
  const [transitionModal, setTransitionModal] = useState<{
    mode: "cloning" | "cloned_redirecting" | "create_game_redirecting";
    setName: string;
    gameTitle?: string;
  } | null>(null);

  // Dropdown states
  const [gradeMenuOpen, setGradeMenuOpen] = useState(false);
  const [unitMenuOpen, setUnitMenuOpen] = useState(false);
  const gradeDropdownRef = useRef<HTMLDivElement>(null);
  const unitDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        gradeDropdownRef.current &&
        !gradeDropdownRef.current.contains(e.target as Node)
      ) {
        setGradeMenuOpen(false);
      }
      if (
        unitDropdownRef.current &&
        !unitDropdownRef.current.contains(e.target as Node)
      ) {
        setUnitMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setGradeMenuOpen(false);
        setUnitMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const cached = readInitialCachedSets();

    // Hydrate saved Grade/Unit/Filter/Share modal strictly inside useEffect (post-hydration)
    try {
      const rawUi = sessionStorage.getItem(UI_STATE_KEY);
      if (rawUi) {
        const parsedUi = JSON.parse(rawUi);
        if (typeof parsedUi.selectedGrade === "number") {
          setSelectedGrade(parsedUi.selectedGrade);
        }
        if (typeof parsedUi.selectedUnitKey === "string") {
          setSelectedUnitKey(parsedUi.selectedUnitKey);
        }
        if (
          parsedUi.subTypeFilter === "image-text" ||
          parsedUi.subTypeFilter === "text-text" ||
          parsedUi.subTypeFilter === "quiz" ||
          parsedUi.subTypeFilter === "all"
        ) {
          setSubTypeFilter(parsedUi.subTypeFilter);
        }
        if (typeof parsedUi.sharingSetId === "string" && parsedUi.sharingSetId) {
          pendingShareIdRef.current = parsedUi.sharingSetId;
          if (cached.length > 0) {
            const matched = cached.find((s) => s.id === parsedUi.sharingSetId);
            if (matched) setSharingSet(matched);
          }
        }
      }
    } catch {}
    hasRestoredUiRef.current = true;

    if (cached.length > 0) {
      setSets(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    getGlobalSuccessLibrarySetsAction().then((res) => {
      if (!active) return;
      if (res.success && Array.isArray(res.sets)) {
        memoryCachedGlobalSets = res.sets;
        setSets(res.sets);
        if (pendingShareIdRef.current) {
          const matched = res.sets.find((s) => s.id === pendingShareIdRef.current);
          if (matched) setSharingSet(matched);
        }
        if (typeof window !== "undefined") {
          try {
            const serialized = JSON.stringify(res.sets);
            localStorage.setItem(CACHE_KEY, serialized);
            sessionStorage.setItem(CACHE_KEY, serialized);
          } catch {}
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasRestoredUiRef.current || typeof window === "undefined") return;
    if (sharingSet) {
      pendingShareIdRef.current = sharingSet.id;
    }
    try {
      sessionStorage.setItem(
        UI_STATE_KEY,
        JSON.stringify({
          selectedGrade,
          selectedUnitKey,
          subTypeFilter,
          sharingSetId: sharingSet ? sharingSet.id : pendingShareIdRef.current,
        })
      );
    } catch {}
  }, [selectedGrade, selectedUnitKey, subTypeFilter, sharingSet]);

  const parsedSets = useMemo(() => sets.map(parseGlobalSuccessSet), [sets]);

  // Count how many sets exist per grade
  const gradeCounts = useMemo(() => {
    const map: Record<number, number> = {};
    for (const ps of parsedSets) {
      map[ps.grade] = (map[ps.grade] || 0) + 1;
    }
    return map;
  }, [parsedSets]);

  // Sets for currently selected grade
  const setsForGrade = useMemo(
    () =>
      selectedGrade === null
        ? []
        : parsedSets.filter((ps) => ps.grade === selectedGrade),
    [parsedSets, selectedGrade]
  );

  // Distinct units in current grade
  const unitsInGrade = useMemo(() => {
    const map = new Map<string, { unitKey: string; unitNumber: number; unitHeader: string; count: number }>();
    for (const ps of setsForGrade) {
      const existing = map.get(ps.unitKey);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(ps.unitKey, {
          unitKey: ps.unitKey,
          unitNumber: ps.unitNumber,
          unitHeader: ps.unitHeader,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.unitNumber - b.unitNumber);
  }, [setsForGrade]);

  // Filtered sets in current grade
  const filteredSets = useMemo(() => {
    return setsForGrade.filter((ps) => {
      if (selectedUnitKey !== "all" && ps.unitKey !== selectedUnitKey) return false;
      if (subTypeFilter !== "all" && ps.raw.subType !== subTypeFilter) return false;
      return true;
    });
  }, [setsForGrade, selectedUnitKey, subTypeFilter]);

  // SubType counts within selected Grade + selected Unit
  const subTypeCounts = useMemo(() => {
    const baseSets = setsForGrade.filter(
      (ps) => selectedUnitKey === "all" || ps.unitKey === selectedUnitKey
    );
    const counts: Record<string, number> = {
      all: baseSets.length,
      "image-text": 0,
      "text-text": 0,
      quiz: 0,
    };
    for (const ps of baseSets) {
      counts[ps.raw.subType] = (counts[ps.raw.subType] || 0) + 1;
    }
    return counts;
  }, [setsForGrade, selectedUnitKey]);

  const selectedUnitObj = useMemo(
    () => unitsInGrade.find((u) => u.unitKey === selectedUnitKey) || null,
    [unitsInGrade, selectedUnitKey]
  );

  const hasActiveFilters =
    selectedUnitKey !== "all" || subTypeFilter !== "all";

  const handleSelectGrade = (grade: number) => {
    setSelectedGrade(grade);
    setSelectedUnitKey("all");
    setGradeMenuOpen(false);
    // Auto-cascade to Step 2 (Unit selector) if this grade has units
    if ((gradeCounts[grade] || 0) > 0) {
      setTimeout(() => {
        setUnitMenuOpen(true);
      }, 80);
    }
  };

  // Group filtered sets by unit
  const groupedUnits = useMemo(() => {
    const map = new Map<string, { unitKey: string; unitNumber: number; unitHeader: string; items: ParsedGlobalSet[] }>();
    for (const ps of filteredSets) {
      const existing = map.get(ps.unitKey);
      if (existing) {
        existing.items.push(ps);
      } else {
        map.set(ps.unitKey, {
          unitKey: ps.unitKey,
          unitNumber: ps.unitNumber,
          unitHeader: ps.unitHeader,
          items: [ps],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.unitNumber - b.unitNumber);
  }, [filteredSets]);

  const getGradePastelTheme = (grade: number, hasData: boolean) => {
    const palettes: Record<
      number,
      {
        cardCls: string;
        iconCls: string;
        titleHover: string;
        soonBadgeCls: string;
      }
    > = {
      1: {
        cardCls:
          "bg-gradient-to-br from-amber-50/95 via-amber-50/60 to-orange-100/65 border-amber-300/90 hover:border-amber-500 dark:from-amber-950/40 dark:via-slate-800/60 dark:to-orange-950/30 dark:border-amber-800/70",
        iconCls: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-2xs",
        titleHover: "group-hover:text-amber-700 dark:group-hover:text-amber-400",
        soonBadgeCls: "bg-white/90 text-amber-700 border border-amber-200/80",
      },
      2: {
        cardCls:
          "bg-gradient-to-br from-sky-50/95 via-sky-50/60 to-blue-100/65 border-sky-200/90 hover:border-sky-400 dark:from-sky-950/40 dark:via-slate-800/60 dark:to-blue-950/30 dark:border-sky-800/70",
        iconCls: "bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-2xs",
        titleHover: "group-hover:text-sky-700 dark:group-hover:text-sky-400",
        soonBadgeCls: "bg-white/90 text-sky-700 border border-sky-200/80",
      },
      3: {
        cardCls:
          "bg-gradient-to-br from-emerald-50/95 via-emerald-50/60 to-teal-100/65 border-emerald-300/90 hover:border-emerald-500 dark:from-emerald-950/40 dark:via-slate-800/60 dark:to-teal-950/30 dark:border-emerald-800/70",
        iconCls: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-2xs",
        titleHover: "group-hover:text-emerald-700 dark:group-hover:text-emerald-400",
        soonBadgeCls: "bg-white/90 text-emerald-700 border border-emerald-200/80",
      },
      4: {
        cardCls:
          "bg-gradient-to-br from-indigo-50/95 via-indigo-50/60 to-violet-100/65 border-indigo-200/90 hover:border-indigo-400 dark:from-indigo-950/40 dark:via-slate-800/60 dark:to-violet-950/30 dark:border-indigo-800/70",
        iconCls: "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-2xs",
        titleHover: "group-hover:text-indigo-700 dark:group-hover:text-indigo-400",
        soonBadgeCls: "bg-white/90 text-indigo-700 border border-indigo-200/80",
      },
      5: {
        cardCls:
          "bg-gradient-to-br from-rose-50/95 via-rose-50/60 to-pink-100/65 border-rose-200/90 hover:border-rose-400 dark:from-rose-950/40 dark:via-slate-800/60 dark:to-pink-950/30 dark:border-rose-800/70",
        iconCls: "bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-2xs",
        titleHover: "group-hover:text-rose-700 dark:group-hover:text-rose-400",
        soonBadgeCls: "bg-white/90 text-rose-700 border border-rose-200/80",
      },
      6: {
        cardCls:
          "bg-gradient-to-br from-cyan-50/95 via-cyan-50/60 to-sky-100/65 border-cyan-200/90 hover:border-cyan-400 dark:from-cyan-950/40 dark:via-slate-800/60 dark:to-sky-950/30 dark:border-cyan-800/70",
        iconCls: "bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-2xs",
        titleHover: "group-hover:text-cyan-700 dark:group-hover:text-cyan-400",
        soonBadgeCls: "bg-white/90 text-cyan-700 border border-cyan-200/80",
      },
      7: {
        cardCls:
          "bg-gradient-to-br from-purple-50/95 via-purple-50/60 to-fuchsia-100/65 border-purple-200/90 hover:border-purple-400 dark:from-purple-950/40 dark:via-slate-800/60 dark:to-fuchsia-950/30 dark:border-purple-800/70",
        iconCls: "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-2xs",
        titleHover: "group-hover:text-purple-700 dark:group-hover:text-purple-400",
        soonBadgeCls: "bg-white/90 text-purple-700 border border-purple-200/80",
      },
      8: {
        cardCls:
          "bg-gradient-to-br from-teal-50/95 via-teal-50/60 to-emerald-100/65 border-teal-200/90 hover:border-teal-400 dark:from-teal-950/40 dark:via-slate-800/60 dark:to-emerald-950/30 dark:border-teal-800/70",
        iconCls: "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-2xs",
        titleHover: "group-hover:text-teal-700 dark:group-hover:text-teal-400",
        soonBadgeCls: "bg-white/90 text-teal-700 border border-teal-200/80",
      },
      9: {
        cardCls:
          "bg-gradient-to-br from-orange-50/95 via-orange-50/60 to-amber-100/65 border-orange-200/90 hover:border-orange-400 dark:from-orange-950/40 dark:via-slate-800/60 dark:to-amber-950/30 dark:border-orange-800/70",
        iconCls: "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-2xs",
        titleHover: "group-hover:text-orange-700 dark:group-hover:text-orange-400",
        soonBadgeCls: "bg-white/90 text-orange-700 border border-orange-200/80",
      },
      10: {
        cardCls:
          "bg-gradient-to-br from-blue-50/95 via-blue-50/60 to-indigo-100/65 border-blue-200/90 hover:border-blue-400 dark:from-blue-950/40 dark:via-slate-800/60 dark:to-indigo-950/30 dark:border-blue-800/70",
        iconCls: "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-2xs",
        titleHover: "group-hover:text-blue-700 dark:group-hover:text-blue-400",
        soonBadgeCls: "bg-white/90 text-blue-700 border border-blue-200/80",
      },
      11: {
        cardCls:
          "bg-gradient-to-br from-fuchsia-50/95 via-fuchsia-50/60 to-pink-100/65 border-fuchsia-200/90 hover:border-fuchsia-400 dark:from-fuchsia-950/40 dark:via-slate-800/60 dark:to-pink-950/30 dark:border-fuchsia-800/70",
        iconCls: "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-2xs",
        titleHover: "group-hover:text-fuchsia-700 dark:group-hover:text-fuchsia-400",
        soonBadgeCls: "bg-white/90 text-fuchsia-700 border border-fuchsia-200/80",
      },
      12: {
        cardCls:
          "bg-gradient-to-br from-lime-50/95 via-emerald-50/60 to-teal-100/65 border-emerald-200/90 hover:border-emerald-400 dark:from-emerald-950/40 dark:via-slate-800/60 dark:to-teal-950/30 dark:border-emerald-800/70",
        iconCls: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xs",
        titleHover: "group-hover:text-emerald-700 dark:group-hover:text-emerald-400",
        soonBadgeCls: "bg-white/90 text-emerald-700 border border-emerald-200/80",
      },
    };
    const theme = palettes[grade] || palettes[1];
    return {
      ...theme,
      cardStateCls: hasData
        ? `${theme.cardCls} shadow-xs hover:shadow-md hover:-translate-y-0.5`
        : `${theme.cardCls} opacity-90 hover:opacity-100 shadow-2xs hover:shadow-xs`,
    };
  };

  const getSubTypeBadge = (subType: LibrarySubType, shortTitle?: string) => {
    const lowerTitle = (shortTitle || "").toLowerCase();
    const isConversationOrSentence =
      subType === "text-text" &&
      (lowerTitle.includes("conversation") ||
        lowerTitle.includes("sentence") ||
        lowerTitle.includes("hội thoại") ||
        lowerTitle.includes("mẫu câu"));

    if (isConversationOrSentence) {
      return {
        label: t.library.textTextBadge,
        cls: "bg-white/95 text-teal-700 border-teal-200 shadow-2xs",
        cardBg:
          "bg-gradient-to-br from-teal-50/95 via-teal-50/55 to-emerald-100/55 dark:from-teal-950/35 dark:via-slate-800/60 dark:to-emerald-950/30 border-teal-200/90 hover:border-teal-400 dark:border-teal-800/70 shadow-xs hover:shadow-md",
        previewBorder:
          "border-teal-200/80 dark:border-slate-700 group-hover/card:border-teal-300 shadow-2xs",
        titleHover: "group-hover/card:text-teal-700 dark:group-hover/card:text-teal-400",
        dividerBorder: "border-teal-200/60 dark:border-slate-700/70",
        iconColor: "text-teal-600",
        pairTextCls: "text-teal-600 dark:text-teal-400",
      };
    }

    switch (subType) {
      case "image-text":
        return {
          label: t.library.imageTextBadge,
          cls: "bg-white/95 text-sky-700 border-sky-200 shadow-2xs",
          cardBg:
            "bg-gradient-to-br from-sky-50/95 via-sky-50/55 to-blue-100/55 dark:from-sky-950/35 dark:via-slate-800/60 dark:to-blue-950/30 border-sky-200/90 hover:border-sky-400 dark:border-sky-800/70 shadow-xs hover:shadow-md",
          previewBorder:
            "border-sky-200/80 dark:border-slate-700 group-hover/card:border-sky-300 shadow-2xs",
          titleHover: "group-hover/card:text-sky-700 dark:group-hover/card:text-sky-400",
          dividerBorder: "border-sky-200/60 dark:border-slate-700/70",
          iconColor: "text-sky-500",
          pairTextCls: "text-sky-600 dark:text-sky-400",
        };
      case "image-image":
        return {
          label: t.library.imageImageBadge,
          cls: "bg-white/95 text-purple-700 border-purple-200 shadow-2xs",
          cardBg:
            "bg-gradient-to-br from-purple-50/95 via-purple-50/55 to-fuchsia-100/55 dark:from-purple-950/35 dark:via-slate-800/60 dark:to-fuchsia-950/30 border-purple-200/90 hover:border-purple-400 dark:border-purple-800/70 shadow-xs hover:shadow-md",
          previewBorder:
            "border-purple-200/80 dark:border-slate-700 group-hover/card:border-purple-300 shadow-2xs",
          titleHover: "group-hover/card:text-purple-700 dark:group-hover/card:text-purple-400",
          dividerBorder: "border-purple-200/60 dark:border-slate-700/70",
          iconColor: "text-purple-500",
          pairTextCls: "text-purple-600 dark:text-purple-400",
        };
      case "text-text":
        return {
          label: t.library.textTextBadge,
          cls: "bg-white/95 text-indigo-700 border-indigo-200 shadow-2xs",
          cardBg:
            "bg-gradient-to-br from-indigo-50/95 via-indigo-50/55 to-violet-100/55 dark:from-indigo-950/35 dark:via-slate-800/60 dark:to-violet-950/30 border-indigo-200/90 hover:border-indigo-400 dark:border-indigo-800/70 shadow-xs hover:shadow-md",
          previewBorder:
            "border-indigo-200/80 dark:border-slate-700 group-hover/card:border-indigo-300 shadow-2xs",
          titleHover: "group-hover/card:text-indigo-700 dark:group-hover/card:text-indigo-400",
          dividerBorder: "border-indigo-200/60 dark:border-slate-700/70",
          iconColor: "text-indigo-500",
          pairTextCls: "text-indigo-600 dark:text-indigo-400",
        };
      case "quiz":
        return {
          label: t.library.quizBadge,
          cls: "bg-white/95 text-amber-700 border-amber-200 shadow-2xs",
          cardBg:
            "bg-gradient-to-br from-amber-50/95 via-amber-50/55 to-orange-100/55 dark:from-amber-950/35 dark:via-slate-800/60 dark:to-orange-950/30 border-amber-200/90 hover:border-amber-400 dark:border-amber-800/70 shadow-xs hover:shadow-md",
          previewBorder:
            "border-amber-200/80 dark:border-slate-700 group-hover/card:border-amber-300 shadow-2xs",
          titleHover: "group-hover/card:text-amber-700 dark:group-hover/card:text-amber-400",
          dividerBorder: "border-amber-200/60 dark:border-slate-700/70",
          iconColor: "text-amber-500",
          pairTextCls: "text-amber-600 dark:text-amber-400",
        };
      case "choice":
        return {
          label: t.library.choiceBadge,
          cls: "bg-white/95 text-emerald-700 border-emerald-200 shadow-2xs",
          cardBg:
            "bg-gradient-to-br from-emerald-50/95 via-emerald-50/55 to-teal-100/55 dark:from-emerald-950/35 dark:via-slate-800/60 dark:to-teal-950/30 border-emerald-200/90 hover:border-emerald-400 dark:border-emerald-800/70 shadow-xs hover:shadow-md",
          previewBorder:
            "border-emerald-200/80 dark:border-slate-700 group-hover/card:border-emerald-300 shadow-2xs",
          titleHover: "group-hover/card:text-emerald-700 dark:group-hover/card:text-emerald-400",
          dividerBorder: "border-emerald-200/60 dark:border-slate-700/70",
          iconColor: "text-emerald-500",
          pairTextCls: "text-emerald-600 dark:text-emerald-400",
        };
    }
  };

  const getStudioEditHref = (setItem: LibrarySetItem): string => {
    const returnTab = `lib-${setItem.category}`;
    if (setItem.subType === "image-text") {
      return `/teacher/games/match-image-text/create?type=image-text&editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
    }
    if (setItem.subType === "image-image") {
      return `/teacher/games/match-image-text/create?type=image-image&editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
    }
    if (setItem.subType === "text-text") {
      return `/teacher/games/match-image-text/create?type=text-text&editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
    }
    if (setItem.subType === "quiz") {
      return `/teacher/games/candy-quiz/create?editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
    }
    return `/teacher/games/choice-shooter/create?editLibrarySetId=${setItem.id}&returnTab=${returnTab}`;
  };

  const handleOpenViewModal = async (setItem: LibrarySetItem) => {
    setLoadingViewId(setItem.id);
    const fullRes = await getTeacherLibrarySetByIdAction(setItem.id);
    setLoadingViewId(null);
    if (fullRes.success && fullRes.set) {
      setViewingSet(fullRes.set);
    } else {
      setViewingSet(setItem);
    }
  };

  const cacheSetForInstantStudioLoad = (setObj: LibrarySetItem) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(`cached_library_set_${setObj.id}`, JSON.stringify(setObj));
    } catch {}
  };

  const handleCustomizeSet = async (setItem: LibrarySetItem) => {
    setCustomizingId(setItem.id);
    setTransitionModal({
      mode: "cloning",
      setName: setItem.name,
    });

    const res = await duplicateTeacherLibrarySetAction(setItem.id, t.library.copySuffix);

    if (res.success && res.set) {
      cacheSetForInstantStudioLoad(res.set);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`cached_teacher_library_${res.set.category}`);
          sessionStorage.removeItem("cached_teacher_library_match");
          sessionStorage.removeItem("cached_teacher_library_flip");
          window.dispatchEvent(new CustomEvent("teacher-library-updated"));
        } catch {}
      }

      const href = withLangParam(getStudioEditHref(res.set), locale);
      try {
        router.prefetch(href);
      } catch {}

      setTransitionModal({
        mode: "cloned_redirecting",
        setName: res.set.name,
      });

      trackEvent("teacher_library_action", {
        action: "global_success_customize",
        sourceSetId: setItem.id,
        newSetId: res.set.id,
        subType: setItem.subType,
      });

      setTimeout(() => {
        router.push(href);
      }, 650);
    } else {
      setCustomizingId(null);
      setTransitionModal(null);
      toast.error(res.error || "Không thể tạo bản sao bộ câu hỏi");
    }
  };

  const handleOpenCreateGame = (setItem: LibrarySetItem) => {
    cacheSetForInstantStudioLoad(setItem);
    const games = getCompatibleGamesForSubType(setItem.subType);
    if (games.length === 1) {
      const game = games[0];
      const targetHref = withLangParam(game.buildHref(setItem.id), locale);
      setTransitionModal({
        mode: "create_game_redirecting",
        setName: setItem.name,
        gameTitle: locale === "vi" ? game.titleVi : game.titleEn,
      });
      trackEvent("teacher_library_action", {
        action: "global_success_create_game",
        setId: setItem.id,
        subType: setItem.subType,
        gameId: game.id,
      });
      router.push(targetHref);
      return;
    }
    setPickerSet(setItem);
  };

  return (
    <div className="space-y-5">
      {/* 1. UNIFIED SINGLE-BAR TOOLBAR: Labeled Step 1 Grade Box ➔ Step 2 Unit Box + Format Pills */}
      <div className="relative z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-amber-200/80 dark:border-slate-800 px-3.5 py-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Cluster: Step 1 Grade Box ➔ Step 2 Unit Box & Format Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1.1. STEP 1: Grade Labeled Select Box */}
          <div ref={gradeDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setGradeMenuOpen((prev) => !prev);
                setUnitMenuOpen(false);
              }}
              className={`group px-3 py-1.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                gradeMenuOpen || selectedGrade === null
                  ? "bg-amber-50/90 dark:bg-slate-800 border-amber-500 ring-2 ring-amber-400/35 shadow-xs"
                  : "bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 dark:from-slate-800 dark:to-slate-800/90 border-amber-300/90 hover:border-amber-500 shadow-2xs"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <GraduationCap className="w-4 h-4" />
              </div>

              <div className="flex flex-col min-w-[115px]">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700/80 dark:text-amber-400 flex items-center gap-1 leading-none mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[8px] font-black inline-flex items-center justify-center">
                    1
                  </span>
                  {locale === "vi" ? "Chọn Khối Lớp" : "Select Grade"}
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedGrade === null ? (
                    <span className="font-headline font-black text-xs text-amber-700 dark:text-amber-300 leading-none">
                      {locale === "vi" ? "Chọn khối lớp..." : "Choose Grade..."}
                    </span>
                  ) : (
                    <>
                      <span className="font-headline font-black text-xs text-slate-900 dark:text-white leading-none">
                        {t.library.gradeLabel} {selectedGrade}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold leading-none">
                        {gradeCounts[selectedGrade] || 0} {locale === "vi" ? "bộ" : "sets"}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-6 h-6 rounded-lg bg-amber-100/80 group-hover:bg-amber-200/80 dark:bg-slate-700 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 transition-colors">
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    gradeMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {/* Grade Dropdown Popover Grid */}
            {gradeMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-[320px] sm:w-[360px] bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/90 dark:border-slate-700 shadow-xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black inline-flex items-center justify-center">
                      1
                    </span>
                    {locale === "vi"
                      ? "Bước 1: Chọn Khối lớp bạn đang dạy"
                      : "Step 1: Choose your Grade level"}
                  </span>
                </div>

                {[
                  {
                    groupLabel: locale === "vi" ? "Tiểu học (Lớp 1 – 5)" : "Primary (Grade 1 – 5)",
                    grades: [1, 2, 3, 4, 5],
                  },
                  {
                    groupLabel: locale === "vi" ? "THCS (Lớp 6 – 9)" : "Lower Secondary (Grade 6 – 9)",
                    grades: [6, 7, 8, 9],
                  },
                  {
                    groupLabel: locale === "vi" ? "THPT (Lớp 10 – 12)" : "Upper Secondary (Grade 10 – 12)",
                    grades: [10, 11, 12],
                  },
                ].map((section) => (
                  <div key={section.groupLabel} className="space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                      {section.groupLabel}
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {section.grades.map((grade) => {
                        const count = gradeCounts[grade] || 0;
                        const isSelected = selectedGrade === grade;
                        const hasData = count > 0;
                        const gradeTheme = getGradePastelTheme(grade, hasData);
                        return (
                          <button
                            key={grade}
                            type="button"
                            onClick={() => handleSelectGrade(grade)}
                            className={`px-2.5 py-2 rounded-[8px] font-headline font-black text-xs transition-all flex items-center justify-between gap-1 cursor-pointer border ${
                              isSelected
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-xs"
                                : `${gradeTheme.cardCls} text-slate-800 dark:text-white`
                            }`}
                          >
                            <span>
                              {t.library.gradeLabel} {grade}
                            </span>
                            {hasData ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                  isSelected
                                    ? "bg-white/25 text-white"
                                    : "bg-emerald-500 text-white"
                                }`}
                              >
                                {count}
                              </span>
                            ) : loading && sets.length === 0 ? (
                              <span className="w-6 h-3.5 rounded-full bg-white/70 animate-pulse inline-block" />
                            ) : (
                              <span
                                className={`text-[9px] font-semibold ${
                                  isSelected ? "text-amber-100" : "text-slate-500"
                                }`}
                              >
                                {locale === "vi" ? "Sắp có" : "Soon"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step Connector Arrow (Step 1 ➔ Step 2) */}
          <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 hidden sm:block" />

          {/* 1.2. STEP 2: Unit Labeled Select Box */}
          <div ref={unitDropdownRef} className="relative">
            <button
              type="button"
              disabled={selectedGrade === null || unitsInGrade.length === 0}
              onClick={() => {
                setUnitMenuOpen((prev) => !prev);
                setGradeMenuOpen(false);
              }}
              className={`group px-3 py-1.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                selectedGrade === null || unitsInGrade.length === 0
                  ? "bg-slate-50/80 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-70"
                  : unitMenuOpen
                  ? "bg-amber-50/90 dark:bg-slate-800 border-amber-500 ring-2 ring-amber-400/40 shadow-xs cursor-pointer"
                  : selectedUnitKey !== "all"
                  ? "bg-amber-50/80 hover:bg-amber-100/70 text-amber-900 border-amber-300 shadow-2xs cursor-pointer"
                  : "bg-white hover:bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-300/90 hover:border-amber-400 dark:border-slate-700 shadow-2xs cursor-pointer"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  selectedGrade === null
                    ? "bg-slate-200/70 text-slate-400"
                    : selectedUnitKey !== "all" || unitMenuOpen
                    ? "bg-amber-500 text-white"
                    : "bg-amber-100 dark:bg-slate-700 text-amber-700 dark:text-amber-300"
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>

              <div className="flex flex-col min-w-[130px] max-w-[200px] sm:max-w-[230px]">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 leading-none mb-1">
                  <span
                    className={`w-3.5 h-3.5 rounded-full text-[8px] font-black inline-flex items-center justify-center ${
                      selectedGrade !== null && (selectedUnitKey !== "all" || unitMenuOpen)
                        ? "bg-amber-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    2
                  </span>
                  {locale === "vi" ? "Chọn Bài Học (Unit)" : "Select Unit"}
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedGrade === null ? (
                    <span className="font-headline font-bold text-xs text-slate-400 truncate leading-none">
                      {locale === "vi" ? "Chọn khối lớp trước" : "Select Grade first"}
                    </span>
                  ) : (
                    <>
                      <span className="font-headline font-black text-xs text-slate-900 dark:text-white truncate leading-none">
                        {selectedUnitObj ? selectedUnitObj.unitHeader : t.library.allUnits}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[9px] font-extrabold shrink-0 leading-none">
                        {selectedUnitObj ? selectedUnitObj.count : setsForGrade.length}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-amber-100/80 dark:bg-slate-700 text-slate-500 group-hover:text-amber-800 flex items-center justify-center shrink-0 transition-colors">
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    unitMenuOpen ? "rotate-180 text-amber-600" : ""
                  }`}
                />
              </div>
            </button>

            {/* Unit Dropdown Menu (Auto-opens after Step 1) */}
            {unitMenuOpen && unitsInGrade.length > 0 && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-[290px] sm:w-[330px] max-h-[360px] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-slate-700 shadow-xl p-2.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2.5 py-2 mb-1 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-300/70 dark:border-amber-800/40">
                  <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black inline-flex items-center justify-center shrink-0">
                      2
                    </span>
                    {locale === "vi"
                      ? `👆 Bước 2: Chọn Bài học (${t.library.gradeLabel} ${selectedGrade})`
                      : `👆 Step 2: Choose Unit (${t.library.gradeLabel} ${selectedGrade})`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedUnitKey("all");
                    setUnitMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    selectedUnitKey === "all"
                      ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${
                        selectedUnitKey === "all" ? "text-amber-600 opacity-100" : "opacity-0"
                      }`}
                    />
                    <span className="truncate">{t.library.allUnits}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold shrink-0">
                    {setsForGrade.length} {locale === "vi" ? "bộ" : "sets"}
                  </span>
                </button>

                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />

                {unitsInGrade.map((u) => {
                  const active = selectedUnitKey === u.unitKey;
                  return (
                    <button
                      key={u.unitKey}
                      type="button"
                      onClick={() => {
                        setSelectedUnitKey(u.unitKey);
                        setUnitMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        active
                          ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? "text-amber-600 opacity-100" : "opacity-0"
                          }`}
                        />
                        <span className="truncate">📘 {u.unitHeader}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-extrabold shrink-0">
                        {u.count} {locale === "vi" ? "bộ" : "sets"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Cluster: Format Segmented Pills & Reset Button */}
        {setsForGrade.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl flex-wrap">
              {(["all", "image-text", "text-text", "quiz"] as const).map((st) => {
                const active = subTypeFilter === st;
                const count = subTypeCounts[st] ?? 0;
                const label =
                  st === "all"
                    ? t.library.allSubTypes
                    : st === "image-text"
                    ? t.library.imageTextBadge
                    : st === "text-text"
                    ? t.library.textTextBadge
                    : t.library.quizBadge;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSubTypeFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      active
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[10px] font-extrabold ${
                        active ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedUnitKey("all");
                  setSubTypeFilter("all");
                }}
                title={locale === "vi" ? "Đặt lại bộ lọc" : "Reset filters"}
                className="h-9 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">
                  {locale === "vi" ? "Đặt lại" : "Reset"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Content Area: Step 1 Grade Onboarding Gate OR Selected Grade Units */}
      {selectedGrade === null ? (
        <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[8px] border border-amber-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Guided 2-Step Onboarding Banner */}
          <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {locale === "vi"
                  ? "Hướng dẫn: Chọn ① Khối lớp ➔ ② Bài học (Unit)"
                  : "Quick Start: Choose ① Grade ➔ ② Unit"}
              </span>
            </div>
            <h3 className="font-headline font-black text-xl sm:text-2xl text-slate-800 dark:text-white">
              {locale === "vi"
                ? "Bước 1: Chọn Khối lớp (Grade) bạn đang dạy"
                : "Step 1: Select your Grade level"}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              {locale === "vi"
                ? "Bấm chọn một Khối lớp bên dưới để mở danh sách các Bài học (Unit) và bộ câu hỏi tương ứng."
                : "Pick a Grade below to view its Units and ready-to-play question sets."}
            </p>
          </div>

          {/* 12-Grade Interactive Bookshelf Grid */}
          <div className="max-w-3xl mx-auto space-y-5">
            {[
              {
                groupLabel: locale === "vi" ? "Tiểu học (Lớp 1 – 5)" : "Primary School (Grade 1 – 5)",
                grades: [1, 2, 3, 4, 5],
              },
              {
                groupLabel: locale === "vi" ? "THCS (Lớp 6 – 9)" : "Lower Secondary (Grade 6 – 9)",
                grades: [6, 7, 8, 9],
              },
              {
                groupLabel: locale === "vi" ? "THPT (Lớp 10 – 12)" : "Upper Secondary (Grade 10 – 12)",
                grades: [10, 11, 12],
              },
            ].map((section) => (
              <div key={section.groupLabel} className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                  {section.groupLabel}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {section.grades.map((grade) => {
                    const count = gradeCounts[grade] || 0;
                    const hasData = count > 0;
                    const gradeTheme = getGradePastelTheme(grade, hasData);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => handleSelectGrade(grade)}
                        className={`p-3.5 rounded-[8px] border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer group ${gradeTheme.cardStateCls}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${gradeTheme.iconCls}`}
                          >
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          {hasData ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-2xs">
                              {count} {locale === "vi" ? "bộ" : "sets"}
                            </span>
                          ) : loading && sets.length === 0 ? (
                            <span className="w-11 h-4 rounded-full bg-white/80 border border-white/60 animate-pulse inline-block" />
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${gradeTheme.soonBadgeCls}`}
                            >
                              {locale === "vi" ? "Sắp có" : "Soon"}
                            </span>
                          )}
                        </div>
                        <div>
                          <div
                            className={`font-headline font-black text-sm text-slate-900 dark:text-white transition-colors ${gradeTheme.titleHover}`}
                          >
                            {t.library.gradeLabel} {grade}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500/85 dark:text-slate-400">
                            Global Success
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : loading && setsForGrade.length === 0 ? (
        <div className="w-full min-h-[280px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[8px] border border-amber-200/80 dark:border-slate-800 p-8 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-amber-500 animate-spin" />
          <p className="text-xs sm:text-sm font-bold text-slate-500">{t.library.loading}</p>
        </div>
      ) : setsForGrade.length === 0 ? (
        <div className="w-full min-h-[300px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-200/70 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shadow-xs">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-headline font-black text-xl text-slate-700 dark:text-slate-200">
              {t.library.comingSoonGradeTitle.replace("{grade}", String(selectedGrade))}
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {t.library.comingSoonGradeDesc.replace("{grade}", String(selectedGrade))}
            </p>
          </div>
          {gradeCounts[3] > 0 && (
            <button
              type="button"
              onClick={() => handleSelectGrade(3)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{locale === "vi" ? "Mở Sách Global Success Lớp 3" : "Explore Grade 3 Now"}</span>
            </button>
          )}
        </div>
      ) : (
        <>

          {/* Unit Sections */}
          <div className="space-y-6">
            {groupedUnits.map((unitGroup) => (
              <div
                key={unitGroup.unitKey}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[8px] border border-amber-200/70 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Unit Section Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-headline font-black text-xs shadow-xs">
                      {t.library.gradeLabel} {selectedGrade}
                    </div>
                    <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                      📘 {unitGroup.unitHeader}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-extrabold">
                    {unitGroup.items.length} {locale === "vi" ? "bộ câu hỏi" : "question sets"}
                  </span>
                </div>

                {/* Cards Grid for this Unit (3 items / row on desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {unitGroup.items.map(({ raw: setItem, shortTitle }) => {
                    const badge = getSubTypeBadge(setItem.subType, shortTitle);
                    const previewItems = setItem.items.slice(0, 3);
                    const isPairs =
                      setItem.subType === "image-text" ||
                      setItem.subType === "image-image" ||
                      setItem.subType === "text-text";

                    return (
                      <div
                        key={setItem.id}
                        className={`rounded-2xl border p-4 hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3 ${badge.cardBg}`}
                      >
                        <div
                          onClick={() => handleOpenViewModal(setItem)}
                          title={t.library.viewBtn}
                          className="space-y-2.5 cursor-pointer group/card"
                        >
                          {/* Title & Badges */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4
                                className={`font-headline font-black text-[15px] text-slate-800 dark:text-white transition-colors truncate ${badge.titleHover}`}
                              >
                                {shortTitle}
                              </h4>
                              <p className="text-[11px] font-semibold text-slate-500/85 dark:text-slate-400 truncate">
                                {setItem.name}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          {/* Count Badge & View Button Row */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/95 dark:bg-slate-900 border border-white/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold shadow-2xs">
                              <Layers className={`w-3 h-3 ${badge.iconColor}`} />
                              {setItem.totalItems}{" "}
                              {isPairs ? t.common.pairsCount : t.common.questionsCount}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenViewModal(setItem);
                              }}
                              disabled={loadingViewId === setItem.id}
                              className="px-2.5 py-1 rounded-lg bg-white/95 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 border border-white/80 hover:border-amber-300 dark:border-slate-700 text-slate-700 hover:text-amber-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                              {loadingViewId === setItem.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span>{t.library.viewBtn}</span>
                            </button>
                          </div>

                          {/* Mini Preview Strip */}
                          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                            {previewItems.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className={`rounded-[10px] bg-white/95 dark:bg-slate-900 border p-2 flex flex-col items-center justify-center text-center gap-1 min-h-[62px] transition-colors ${badge.previewBorder}`}
                              >
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.word || "item"}
                                    className="w-8 h-8 object-contain rounded-lg"
                                  />
                                ) : null}
                                {item.word ? (
                                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 break-words leading-tight">
                                    {item.word}
                                  </span>
                                ) : null}
                                {setItem.subType === "text-text" && item.labelB ? (
                                  <span className={`text-[10px] font-semibold line-clamp-1 ${badge.pairTextCls}`}>
                                    ↔ {item.labelB}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer Actions: Share Game | Create Game */}
                        <div className={`pt-2.5 border-t ${badge.dividerBorder} grid grid-cols-2 gap-2`}>
                          <button
                            type="button"
                            onClick={() => setSharingSet(setItem)}
                            className="py-2 px-3 rounded-xl bg-white/95 hover:bg-purple-50 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200/90 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">
                              {locale === "vi" ? "Chia sẻ Game" : "Share Game"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCreateGame(setItem)}
                            className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          >
                            <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{t.library.createGameBtn}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL 1: VIEW SET ITEMS */}
      {viewingSet && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewingSet(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-black uppercase tracking-wider mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t.sidebar.libraryGlobalTitle}</span>
                </div>
                <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
                  {viewingSet.name}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  {viewingSet.items.length}{" "}
                  {viewingSet.subType === "quiz" ? t.common.questionsCount : t.common.pairsCount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingSet(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {(() => {
                const sortedItems = [...viewingSet.items].sort(
                  (a, b) => (a.roundIndex ?? 0) - (b.roundIndex ?? 0)
                );
                const uniqueRounds = new Set(sortedItems.map((it) => it.roundIndex ?? 0));
                const showRoundHeaders = uniqueRounds.size > 1;

                return sortedItems.map((item, idx) => {
                  const currentRound = item.roundIndex ?? 0;
                  const prevRound = idx > 0 ? (sortedItems[idx - 1].roundIndex ?? 0) : -1;
                  const isNewRound = showRoundHeaders && currentRound !== prevRound;
                  const roundCount = sortedItems.filter(
                    (it) => (it.roundIndex ?? 0) === currentRound
                  ).length;

                  let quizOptions: Array<{ id: string; text: string; isCorrect: boolean }> = [];
                  if (viewingSet.subType === "quiz" && item.labelB) {
                    try {
                      const parsed = JSON.parse(item.labelB);
                      if (Array.isArray(parsed.options)) {
                        quizOptions = parsed.options;
                      }
                    } catch {}
                  }

                  return (
                    <div key={item.id || idx} className="space-y-2">
                      {isNewRound && (
                        <div className={`flex items-center gap-2 ${idx > 0 ? "pt-2" : "pt-0.5"}`}>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider">
                            <Layers className="w-3 h-3" />
                            {locale === "vi" ? `Vòng ${currentRound + 1}` : `Round ${currentRound + 1}`}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            ({roundCount}{" "}
                            {viewingSet.subType === "quiz" ? t.common.questionsCount : t.common.pairsCount})
                          </span>
                          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </div>
                      )}

                      <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.word}
                            className="w-12 h-12 object-contain rounded-xl bg-white border border-slate-200/70 p-1 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800 dark:text-white">
                              {item.word}
                            </span>
                            {viewingSet.subType === "text-text" && item.labelB && (
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                ↔ {item.labelB}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-400 ml-auto">
                              {locale === "vi" ? `Vòng ${currentRound + 1}` : `Round ${currentRound + 1}`}
                            </span>
                          </div>

                          {quizOptions.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {quizOptions.map((opt) => (
                                <div
                                  key={opt.id}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                    opt.isCorrect
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/60"
                                  }`}
                                >
                                  <span>{opt.id}.</span>
                                  <span className="truncate">{opt.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={customizingId === viewingSet.id}
                title={t.library.customizeTooltip}
                onClick={() => {
                  const target = viewingSet;
                  setViewingSet(null);
                  handleCustomizeSet(target);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer transition-all disabled:opacity-50"
              >
                <Copy className="w-4 h-4 text-amber-600" />
                <span>{t.library.customizeBtn}</span>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSharingSet(viewingSet);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{locale === "vi" ? "Chia sẻ Game" : "Share Game"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const target = viewingSet;
                    setViewingSet(null);
                    handleOpenCreateGame(target);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>{t.library.createGameBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SELECT GAME FORMAT TO CREATE */}
      {pickerSet && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPickerSet(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{pickerSet.name}</span>
                </div>
                <h3 className="font-headline font-black text-xl sm:text-2xl text-slate-800 dark:text-white">
                  {t.library.selectGameTitle}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {t.library.selectGameDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerSet(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {getCompatibleGamesForSubType(pickerSet.subType).map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    cacheSetForInstantStudioLoad(pickerSet);
                    const targetHref = withLangParam(game.buildHref(pickerSet.id), locale);
                    const pickedName = pickerSet.name;
                    const pickedGameTitle = locale === "vi" ? game.titleVi : game.titleEn;
                    trackEvent("teacher_library_action", {
                      action: "global_success_create_game",
                      setId: pickerSet.id,
                      subType: pickerSet.subType,
                      gameId: game.id,
                    });
                    setPickerSet(null);
                    setTransitionModal({
                      mode: "create_game_redirecting",
                      setName: pickedName,
                      gameTitle: pickedGameTitle,
                    });
                    router.push(targetHref);
                  }}
                  className="group text-left p-4 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-emerald-50/30 transition-all flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-wider ${game.badgeColor}`}
                      >
                        {locale === "vi" ? game.badgeVi : game.badgeEn}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h4 className="font-headline font-black text-sm text-slate-800 dark:text-white group-hover:text-emerald-700">
                      {locale === "vi" ? game.titleVi : game.titleEn}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                      {locale === "vi" ? game.descVi : game.descEn}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SHARE PRE-BUILT GAME DIRECTLY */}
      {sharingSet && (
        <MatchGameShareModal
          isOpen={Boolean(sharingSet)}
          onClose={() => {
            pendingShareIdRef.current = null;
            setSharingSet(null);
          }}
          topicName={sharingSet.name}
          topicId={sharingSet.id}
          gamePath={getShareableGameOptionsForSubType(sharingSet.subType)[0]?.gamePath}
          gameOptions={getShareableGameOptionsForSubType(sharingSet.subType)}
        />
      )}

      {/* MODAL 4: CLONE CONFIRMATION & REDIRECT LOADING POPUP */}
      {transitionModal && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-amber-200/80 dark:border-slate-700 text-center space-y-4 animate-in zoom-in-95 duration-150">
            {transitionModal.mode === "cloning" && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                    {locale === "vi"
                      ? "Đang tạo bản sao riêng cho bạn..."
                      : "Creating your personal copy..."}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {transitionModal.setName}
                  </p>
                </div>
              </>
            )}

            {transitionModal.mode === "cloned_redirecting" && (
              <>
                <div className="relative w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <Check className="w-8 h-8 stroke-[3]" />
                  <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1.5 -right-1.5 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-headline font-black text-lg text-emerald-700 dark:text-emerald-400">
                    {locale === "vi"
                      ? "Đã tạo bản sao thành công!"
                      : "Saved a copy to My Question Sets!"}
                  </h3>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 px-2">
                    “{transitionModal.setName}”
                  </p>
                  <p className="text-[11px] font-medium text-slate-400">
                    {locale === "vi"
                      ? "Bản sao đã được lưu vào Bộ câu hỏi của tôi."
                      : "This copy is now saved in your personal library."}
                  </p>
                </div>
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200/80 dark:border-slate-700 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <span>
                      {locale === "vi"
                        ? "Đang mở trang chỉnh sửa..."
                        : "Opening question set editor..."}
                    </span>
                  </div>
                </div>
              </>
            )}

            {transitionModal.mode === "create_game_redirecting" && (
              <>
                <div className="relative w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1.5 -right-1.5 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-headline font-black text-lg text-slate-800 dark:text-white">
                    {locale === "vi"
                      ? "Đang mở trang tạo trò chơi..."
                      : "Opening game studio..."}
                  </h3>
                  {transitionModal.gameTitle && (
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      🎮 {transitionModal.gameTitle}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-slate-400">
                    {transitionModal.setName}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

