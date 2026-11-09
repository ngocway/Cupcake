"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Search, X, Layers, Download, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  getTeacherLibrarySetsAction,
  getGlobalSuccessLibrarySetsAction,
  getTeacherLibrarySetByIdAction,
  LibraryCategory,
  LibrarySetItem,
  LibrarySubType,
} from "@/actions/teacher-library-actions";
import { useTeacherLocale } from "@/i18n/teacher-locale";
import { toast } from "sonner";

interface TeacherLibraryPickerButtonProps {
  /** Which question set format this game studio accepts */
  compatibleSubTypes: LibrarySubType[];
  /** Callback when teacher picks a set from My Library */
  onImportSet: (setItem: LibrarySetItem, mode: "replace" | "append") => void;
  className?: string;
}

export function TeacherLibraryPickerButton({
  compatibleSubTypes,
  onImportSet,
  className = "",
}: TeacherLibraryPickerButtonProps) {
  const { t } = useTeacherLocale();
  const searchParams = useSearchParams();
  const isFromLibrary = Boolean(
    searchParams.get("librarySetId") || searchParams.get("editLibrarySetId")
  );
  const [isOpen, setIsOpen] = useState(false);
  const [sourceTab, setSourceTab] = useState<"personal" | "global">("personal");
  const [sets, setSets] = useState<LibrarySetItem[]>([]);
  const [globalSets, setGlobalSets] = useState<LibrarySetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);

    const targetCategory: LibraryCategory | "all" =
      compatibleSubTypes.length === 1 && compatibleSubTypes[0] === "quiz"
        ? "quiz"
        : compatibleSubTypes.length === 1 && compatibleSubTypes[0] === "choice"
        ? "choice"
        : compatibleSubTypes.every((st) => st === "image-text" || st === "image-image" || st === "text-text")
        ? "match"
        : "all";

    Promise.all([
      getTeacherLibrarySetsAction(targetCategory),
      getGlobalSuccessLibrarySetsAction(),
    ]).then(([personalRes, globalRes]) => {
      if (!active) return;
      if (personalRes.success && Array.isArray(personalRes.sets)) {
        setSets(personalRes.sets.filter((s) => compatibleSubTypes.includes(s.subType)));
      }
      if (globalRes.success && Array.isArray(globalRes.sets)) {
        const compatGlobal = globalRes.sets.filter((s) => compatibleSubTypes.includes(s.subType));
        setGlobalSets(compatGlobal);
        if (
          (!personalRes.sets || personalRes.sets.filter((s) => compatibleSubTypes.includes(s.subType)).length === 0) &&
          compatGlobal.length > 0
        ) {
          setSourceTab("global");
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isOpen, compatibleSubTypes.join(",")]);

  const activeSourceList = sourceTab === "global" ? globalSets : sets;
  const filteredSets = activeSourceList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChoose = async (setItem: LibrarySetItem, mode: "replace" | "append") => {
    setIsOpen(false);
    if (setItem.totalItems > setItem.items.length) {
      const fullRes = await getTeacherLibrarySetByIdAction(setItem.id);
      if (fullRes.success && fullRes.set) {
        onImportSet(fullRes.set, mode);
        toast.success(t.library.importedToast.replace("{name}", fullRes.set.name));
        return;
      }
    }
    onImportSet(setItem, mode);
    toast.success(t.library.importedToast.replace("{name}", setItem.name));
  };

  if (isFromLibrary) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 ${className}`}
      >
        <BookOpen className="w-3.5 h-3.5 shrink-0" />
        <span>{t.studio.importFromMyLibrary}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-wider mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t.sidebar.libraryTitle}</span>
                </div>
                <h3 className="font-headline font-black text-xl text-slate-800 dark:text-white">
                  {t.library.importModalTitle}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {t.library.importModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source Tabs: My Saved Sets vs Global Success Books */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSourceTab("personal")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sourceTab === "personal"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                <span>👤 {t.library.mySetsTab}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
                  {sets.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSourceTab("global")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sourceTab === "global"
                    ? "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                <span>📘 {t.library.globalSuccessTab}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 text-[10px]">
                  {globalSets.length}
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.library.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">{t.library.loading}</span>
                </div>
              ) : filteredSets.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="font-headline font-black text-base text-slate-700 dark:text-slate-200">
                    {t.library.emptyTitle}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {t.library.emptyDesc}
                  </p>
                </div>
              ) : (
                filteredSets.map((setItem) => {
                  const isPairs =
                    setItem.subType === "image-text" ||
                    setItem.subType === "image-image" ||
                    setItem.subType === "text-text";

                  return (
                    <div
                      key={setItem.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-headline font-black text-sm text-slate-800 dark:text-white truncate">
                            {setItem.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            <Layers className="w-3 h-3 text-emerald-500" />
                            {setItem.totalItems}{" "}
                            {isPairs ? t.common.pairsCount : t.common.questionsCount}
                          </span>
                          {setItem.updatedAt && (
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0 hidden md:inline">
                              {format(new Date(setItem.updatedAt), "dd/MM/yyyy")}
                            </span>
                          )}
                        </div>

                        {/* Mini preview strip */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                          {setItem.items.slice(0, 5).map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="h-8 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 flex items-center gap-1.5 shrink-0"
                            >
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="w-6 h-6 object-contain rounded"
                                />
                              )}
                              {item.word && (
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[90px] truncate">
                                  {item.word}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleChoose(setItem, "replace")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t.library.replaceBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChoose(setItem, "append")}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t.library.appendBtn}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

