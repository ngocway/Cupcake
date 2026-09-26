"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  assignBundleToClassAction, 
  createDraftMaterial,
  searchAssignableContentAction,
  AssignableLibraryItem 
} from '@/actions/material-actions';

interface AssignContentModalProps {
  classId: string;
  onClose: () => void;
  onAssigned?: () => void;
  initialGroupId?: string;
  initialGroupTitle?: string;
}

function isLikelyLinkOrId(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('/')) return true;
  if (/^localhost(:\d+)?\//i.test(trimmed)) return true;
  if (/^(student|teacher|admin|game|exercises|flashcards|read-along|grammar|lesson|lessons)\//i.test(trimmed)) return true;
  if (/^c[a-z0-9]{24,32}$/i.test(trimmed)) return true;
  return false;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; bgClass: string; textClass: string; badgeClass: string }> = {
  LESSON: { 
    label: 'Grammar lesson', 
    icon: 'school', 
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/30', 
    textClass: 'text-indigo-600 dark:text-indigo-400',
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
  },
  GAME: { 
    label: 'Game', 
    icon: 'sports_esports', 
    bgClass: 'bg-pink-50 dark:bg-pink-900/30', 
    textClass: 'text-pink-600 dark:text-pink-400',
    badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'
  },
  FLASHCARD: { 
    label: 'Flashcard', 
    icon: 'style', 
    bgClass: 'bg-purple-50 dark:bg-purple-900/30', 
    textClass: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
  },
  READING: { 
    label: 'Reading', 
    icon: 'auto_stories', 
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/30', 
    textClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
  },
  GRAMMAR: { 
    label: 'Grammar', 
    icon: 'quiz', 
    bgClass: 'bg-blue-50 dark:bg-blue-900/30', 
    textClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
  },
  BOOK: { 
    label: 'Shadowing', 
    icon: 'menu_book', 
    bgClass: 'bg-amber-50 dark:bg-amber-900/30', 
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  },
};

export function AssignContentModal({ 
  classId, 
  onClose, 
  onAssigned,
  initialGroupId,
  initialGroupTitle
}: AssignContentModalProps) {
  const router = useRouter();
  
  // Group Title: At the very top, defaults to current date or initialGroupTitle
  const [groupTitle, setGroupTitle] = useState(() => {
    if (initialGroupTitle) return initialGroupTitle;
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `Bài tập ngày ${day}/${month}/${year}`;
  });

  // Basket / Cart of selected assignments
  const [selectedItems, setSelectedItems] = useState<AssignableLibraryItem[]>([]);
  const [isAssigningBundle, setIsAssigningBundle] = useState(false);
  const [creating, setCreating] = useState(false);

  // Tabs & filters
  const [activeSource, setActiveSource] = useState<'mine' | 'library' | 'recent'>('mine');
  const [searchTerm, setSearchTerm] = useState('');
  const [contentType, setContentType] = useState('ALL');
  const [level, setLevel] = useState('ALL');

  // Search execution states (On-demand search: 0s on mount)
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AssignableLibraryItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFromLink, setIsFromLink] = useState(false);

  // Cart operations
  const toggleItemInCart = (item: AssignableLibraryItem) => {
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.filter((i) => i.id !== item.id);
      }
      const defaultSection: 'NEW' | 'REVIEW' = activeSource === 'recent' ? 'REVIEW' : (item.section || 'NEW');
      return [...prev, { ...item, section: defaultSection }];
    });
  };

  const toggleItemSection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const nextSection: 'NEW' | 'REVIEW' = i.section === 'REVIEW' ? 'NEW' : 'REVIEW';
          return { ...i, section: nextSection };
        }
        return i;
      })
    );
  };

  const removeItemFromCart = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Fast on-demand search action
  const handleSearch = async (overrides?: {
    contentType?: string;
    level?: string;
    source?: 'mine' | 'library' | 'recent';
    query?: string;
  }) => {
    const effectiveSource = overrides?.source ?? activeSource;
    const effectiveType = overrides?.contentType ?? contentType;
    const effectiveLevel = overrides?.level ?? level;
    const effectiveQuery = overrides?.query !== undefined ? overrides.query : searchTerm;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await searchAssignableContentAction({
        query: effectiveQuery,
        contentType: effectiveType,
        level: effectiveLevel,
        source: effectiveSource,
        classId,
        limit: 30
      });
      setHasSearched(true);
      setIsFromLink(!!res.isFromLink);
      if (res.linkError) {
        setSearchResults([]);
        setSearchError(res.linkError);
      } else {
        setSearchResults(res.items);
        setSearchError(null);
      }
    } catch (err: any) {
      setHasSearched(true);
      setSearchResults([]);
      setSearchError(err?.message || 'Có lỗi xảy ra khi tìm kiếm');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSourceChange = (newSource: 'mine' | 'library' | 'recent') => {
    setActiveSource(newSource);
    handleSearch({ source: newSource });
  };

  // Submit bundle assignment
  const handleAssignBundle = async () => {
    if (selectedItems.length === 0) return;
    setIsAssigningBundle(true);
    try {
      await assignBundleToClassAction(classId, groupTitle, selectedItems, initialGroupId);
      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to assign bundle', err);
      alert('Giao nhóm bài thất bại: ' + (err?.message || 'Lỗi không xác định'));
    } finally {
      setIsAssigningBundle(false);
    }
  };

  const handleCreateAndAssign = async () => {
    setCreating(true);
    try {
      const newId = await createDraftMaterial();
      onClose();
      router.push(`/teacher/materials/${newId}/edit?assignToClass=${classId}`);
    } catch (err) {
      console.error('Failed to create and prepare', err);
      alert('Tạo bài thất bại: ' + (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const formatLevelBadge = (lvl: string) => {
    const l = (lvl || '').toUpperCase();
    if (l.includes('PRE-A1') || l.includes('PRE_A1')) return 'PRE-A1';
    if (l === 'A1') return 'A1';
    if (l === 'A2') return 'A2';
    if (l === 'B1') return 'B1';
    if (l === 'B2') return 'B2';
    if (l === 'C1') return 'C1';
    return l || 'ALL';
  };

  const renderItemCard = (item: AssignableLibraryItem, isFromLinkMatch = false) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.GRAMMAR;
    const isSelected = selectedItems.some((i) => i.id === item.id);

    return (
      <div 
        key={item.id} 
        onClick={() => toggleItemInCart(item)}
        className={`flex items-center gap-4 p-3.5 rounded-xl transition-all group cursor-pointer shadow-xs border ${
          isSelected
            ? 'border-primary bg-primary/[0.04] dark:bg-primary/10 ring-1 ring-primary/40'
            : isFromLinkMatch
              ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-400/80 dark:border-blue-600/80 hover:border-blue-500'
              : 'border-gray-100 dark:border-gray-800/60 hover:bg-[#f0f2f4] dark:hover:bg-gray-800/50 hover:border-primary/20'
        }`}
      >
        {/* Checkbox indicator */}
        <div className="flex items-center justify-center">
          <div className={`size-5 rounded-md flex items-center justify-center transition-colors border ${
            isSelected 
              ? 'bg-primary border-primary text-white' 
              : 'border-gray-300 dark:border-gray-600 group-hover:border-primary'
          }`}>
            {isSelected && <span className="material-symbols-outlined text-[16px] font-bold">check</span>}
          </div>
        </div>

        <div className={`size-12 ${config.bgClass} ${config.textClass} rounded-xl flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-2xl">{config.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.badgeClass}`}>
              {config.label}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {formatLevelBadge(item.level)}
            </span>
            {isFromLinkMatch && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                <span className="material-symbols-outlined text-[13px]">link</span>
                Tìm thấy từ liên kết
              </span>
            )}
          </div>
          <h4 className="font-bold text-[#111418] dark:text-white truncate text-sm sm:text-base">
            {item.title}
          </h4>
          <div className="flex items-center gap-4 mt-1 text-xs text-[#617589]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span> 
              {item.itemCount} {item.itemUnit}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">history</span> 
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              window.open(item.previewUrl, '_blank'); 
            }}
            className="p-2 border border-[#d1d5db] dark:border-gray-600 text-[#617589] hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center group/tooltip relative cursor-pointer"
            title="Xem trước"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              Xem trước
            </span>
          </button>

          {isSelected ? (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleItemInCart(item); }}
              className="px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm bg-emerald-100 hover:bg-rose-100 text-emerald-800 hover:text-rose-700 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-rose-900/40 dark:hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer group/btn shrink-0"
            >
              <span className="material-symbols-outlined text-[16px] group-hover/btn:hidden">check_circle</span>
              <span className="material-symbols-outlined text-[16px] hidden group-hover/btn:inline">remove_circle</span>
              <span className="group-hover/btn:hidden">Đã chọn</span>
              <span className="hidden group-hover/btn:inline">Bỏ chọn</span>
            </button>
          ) : (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleItemInCart(item); }}
              className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Thêm vào nhóm</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-background-dark w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f4] dark:border-gray-800">
          <div className="flex flex-col">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-0.5">
              {initialGroupId ? 'Cập nhật nhóm bài tập' : 'Giao bài cho lớp'}
            </p>
            <h2 className="text-xl font-bold">
              {initialGroupId ? 'Thêm bài tập vào nhóm' : 'Tạo nhóm bài tập mới'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[#f0f2f4] dark:hover:bg-gray-800 rounded-full text-[#617589] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* TOP: Input Tên nhóm bài tập (Ngay đầu popup theo yêu cầu) */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-primary/5 via-blue-50/50 to-primary/5 dark:from-primary/10 dark:via-blue-950/20 dark:to-primary/10 border-b border-[#f0f2f4] dark:border-gray-800 flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-primary shrink-0 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[20px]">folder_special</span>
            <span>Tên nhóm bài tập:</span>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="Nhập tên nhóm bài tập (vd: Bài tập ngày 25/09, Unit 1: Animals...)"
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-3.5 py-2 text-sm font-bold text-[#111418] dark:text-white outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Source Tabs: Mine vs System Library vs Recent */}
        <div className={`flex border-b border-[#f0f2f4] dark:border-gray-800 px-6 pt-2 bg-gray-50/50 dark:bg-gray-800/20 transition-all ${
          isFromLink ? 'opacity-40 pointer-events-none' : ''
        }`}>
          <button 
            type="button"
            onClick={() => handleSourceChange('mine')} 
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSource === 'mine' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-[#617589] hover:text-[#111418] dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Bài của tôi
          </button>
          <button 
            type="button"
            onClick={() => handleSourceChange('library')} 
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSource === 'library' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-[#617589] hover:text-[#111418] dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">public</span>
            Thư viện hệ thống
          </button>
          <button 
            type="button"
            onClick={() => handleSourceChange('recent')} 
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSource === 'recent' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-[#617589] hover:text-[#111418] dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Đã giao gần đây (Ôn bài)
          </button>
        </div>

        {/* Filters: Search + Dạng bài + Level + Search Button */}
        <div className="p-4 sm:p-5 border-b border-[#f0f2f4] dark:border-gray-800 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isLikelyLinkOrId(searchTerm) ? (
                  <span className="material-symbols-outlined text-[20px] text-blue-600 dark:text-blue-400">link</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px] text-[#617589]">search</span>
                )}
              </div>
              <input 
                className={`block w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none ${
                  isLikelyLinkOrId(searchTerm)
                    ? 'border-blue-400 dark:border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100 font-medium'
                    : 'border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
                placeholder="Nhập tên bài tập, game, hoặc dán link/URL bài..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setIsFromLink(false);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-[#617589] hover:text-[#111418] dark:hover:text-white transition-colors cursor-pointer"
                    title="Xóa tìm kiếm"
                  >
                    <span className="material-symbols-outlined text-[16px] block">close</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dạng bài dropdown */}
            <div className={`relative min-w-[185px] transition-opacity ${isFromLink ? 'opacity-40 pointer-events-none' : ''}`}>
              <select 
                className="appearance-none block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-sm font-semibold focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer outline-none"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="ALL">🎮 Tất cả dạng bài</option>
                <option value="LESSON">🎓 Grammar lesson</option>
                <option value="GAME">🎮 Games (Trò chơi)</option>
                <option value="FLASHCARD">🗂️ Flashcards (Từ vựng)</option>
                <option value="READING">📖 Reading (Đọc hiểu)</option>
                <option value="GRAMMAR">❓ Grammar (Ngữ pháp)</option>
                <option value="BOOK">📚 Shadowing (Sách nói)</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#617589]">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>

            {/* Level dropdown */}
            <div className={`relative min-w-[135px] transition-opacity ${isFromLink ? 'opacity-40 pointer-events-none' : ''}`}>
              <select 
                className="appearance-none block w-full rounded-xl border border-[#f0f2f4] dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-sm font-semibold focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer outline-none"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="ALL">🎯 Tất cả level</option>
                <option value="pre-a1">Pre-A1</option>
                <option value="a1">A1</option>
                <option value="a2">A2</option>
                <option value="b1">B1</option>
                <option value="b2">B2</option>
                <option value="c1">C1</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#617589]">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </div>
            </div>

            {/* Nút Tìm kiếm */}
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="px-6 py-2.5 bg-primary hover:bg-primary/90 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  <span>Tìm kiếm</span>
                </>
              )}
            </button>
          </div>

          {/* Link mode indicator banner */}
          {isFromLink && (
            <div className="px-4 py-2 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold truncate">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px] shrink-0">link</span>
                <span className="truncate">
                  Kết quả được tìm trực tiếp theo liên kết / mã ID
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIsFromLink(false);
                  setHasSearched(false);
                  setSearchResults([]);
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold shrink-0 underline ml-3 cursor-pointer"
              >
                Xóa liên kết
              </button>
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Quick create options (visible in 'mine' tab when NOT from link) */}
          {!isFromLink && activeSource === 'mine' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <button 
                type="button"
                onClick={handleCreateAndAssign}
                disabled={creating}
                className="flex items-center gap-4 p-4 border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-2xl transition-all group text-left disabled:opacity-50 cursor-pointer"
              >
                <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl font-bold">add</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#111418] dark:text-white">Tạo bài mới</h4>
                  <p className="text-xs text-[#617589] mt-0.5">Soạn thảo câu hỏi thủ công</p>
                </div>
              </button>

              <div className="flex items-center gap-4 p-4 bg-primary/[0.03] border border-primary/10 rounded-2xl relative group overflow-hidden opacity-80 cursor-not-allowed">
                <div className="size-12 bg-primary text-white rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                    Tạo bằng AI
                  </h4>
                  <p className="text-xs text-[#617589] mt-0.5">Tự động tạo từ tài liệu của bạn</p>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-lg uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* State 1: Searching */}
          {isSearching ? (
            <div className="flex flex-col items-center justify-center p-14 gap-3 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in duration-200">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  {isLikelyLinkOrId(searchTerm) ? 'link' : 'search'}
                </span>
                {isLikelyLinkOrId(searchTerm) ? 'Đang phân tích liên kết và tìm bài...' : 'Đang tìm kiếm bài tập và trò chơi...'}
              </p>
              {searchTerm && (
                <p className="text-xs text-[#617589] max-w-md text-center truncate">{searchTerm}</p>
              )}
            </div>
          ) : !hasSearched ? (
            /* State 2: Initial Idle Screen (Phương án A - Nhanh 0s) */
            <div className="flex flex-col items-center justify-center p-12 sm:p-14 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">manage_search</span>
              </div>
              <h3 className="text-base font-bold text-[#111418] dark:text-white mb-2">
                Chọn tiêu chí hoặc dán link rồi bấm Tìm kiếm
              </h3>
              <p className="text-xs text-[#617589] dark:text-gray-400 max-w-md leading-relaxed mb-6">
                Bạn có thể chọn <strong>Dạng bài</strong> (Game, Flashcard, Đọc hiểu, Ngữ pháp, Sách nói...), chọn <strong>Cấp độ</strong>, hoặc dán <strong>đường link bài tập</strong> vào ô tìm kiếm, sau đó bấm nút <strong>Tìm kiếm</strong> (hoặc nhấn <strong>Enter</strong>) để hiển thị danh sách và thêm vào nhóm.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button 
                  type="button"
                  onClick={() => { setContentType('ALL'); handleSearch({ contentType: 'ALL' }); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-[#111418] dark:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
                  Xem tất cả
                </button>
                <button 
                  type="button"
                  onClick={() => { setContentType('LESSON'); handleSearch({ contentType: 'LESSON' }); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  Grammar lesson
                </button>
                <button 
                  type="button"
                  onClick={() => { setContentType('GAME'); handleSearch({ contentType: 'GAME' }); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">sports_esports</span>
                  Trò chơi (Games)
                </button>
                <button 
                  type="button"
                  onClick={() => { setContentType('FLASHCARD'); handleSearch({ contentType: 'FLASHCARD' }); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">style</span>
                  Flashcards
                </button>
                <button 
                  type="button"
                  onClick={() => { setContentType('BOOK'); handleSearch({ contentType: 'BOOK' }); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  Sách nói (Shadowing)
                </button>
              </div>
            </div>
          ) : searchError ? (
            /* State 3: Error */
            <div className="p-10 text-center bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl animate-in fade-in duration-200">
              <div className="size-12 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-2xl">error_outline</span>
              </div>
              <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm mb-1">
                {isFromLink ? 'Không tìm thấy nội dung từ liên kết này' : 'Không có kết quả'}
              </h4>
              <p className="text-xs text-[#617589] dark:text-neutral-400 mb-4 max-w-md mx-auto">
                {searchError}
              </p>
              <button 
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSearchError(null);
                  setIsFromLink(false);
                  setHasSearched(false);
                }}
                className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-xs cursor-pointer"
              >
                Xóa tìm kiếm & chọn lại
              </button>
            </div>
          ) : searchResults.length === 0 ? (
            /* State 4: Empty Results */
            <div className="p-12 text-center text-[#617589] opacity-70">
              <span className="material-symbols-outlined text-[48px] mb-2 text-primary/40">auto_stories</span>
              <p className="font-bold">Không tìm thấy bài tập hoặc trò chơi nào phù hợp.</p>
              <p className="text-xs text-[#617589] mt-1">Thử thay đổi bộ lọc Dạng bài, Cấp độ hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            /* State 5: Results List */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-[#617589] px-1 pb-1">
                <span>Tìm thấy <strong>{searchResults.length}</strong> bài tập & nội dung</span>
                {isFromLink && (
                  <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    Khớp theo liên kết
                  </span>
                )}
              </div>
              {searchResults.map((item) => renderItemCard(item, isFromLink))}
            </div>
          )}
        </div>

        {/* BOTTOM: Fixed Cart Tray & Assign Action (Giỏ bài tập 2 ngăn) */}
        <div className="px-6 py-3 bg-[#f8f9fa] dark:bg-gray-800/90 border-t border-[#f0f2f4] dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="material-symbols-outlined text-primary text-[20px]">shopping_bag</span>
              <span className="text-xs font-bold text-[#111418] dark:text-white">
                Giỏ bài tập:
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {selectedItems.filter(i => i.section !== 'REVIEW').length} Bài mới
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {selectedItems.filter(i => i.section === 'REVIEW').length} Ôn bài
              </span>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-[11px] text-[#617589] hover:text-rose-600 font-semibold underline ml-1 cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <p className="text-xs text-[#617589] italic">
                Chưa có bài nào được chọn. Hãy tìm kiếm ở trên và bấm chọn bài.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-w-2xl">
                {/* Ngăn 1: Bài mới */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar">
                  <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 shrink-0 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-[14px]">menu_book</span>
                    Bài mới ({selectedItems.filter(i => i.section !== 'REVIEW').length}):
                  </span>
                  {selectedItems.filter(i => i.section !== 'REVIEW').length === 0 ? (
                    <span className="text-[11px] text-gray-400 italic">Trống</span>
                  ) : (
                    selectedItems.filter(i => i.section !== 'REVIEW').map((item) => {
                      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.GRAMMAR;
                      return (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 text-xs font-semibold text-[#111418] dark:text-white shrink-0 border border-blue-200 dark:border-blue-900/40 shadow-xs"
                        >
                          <span className={`material-symbols-outlined text-[15px] ${config.textClass}`}>
                            {config.icon}
                          </span>
                          <span className="max-w-[130px] truncate">{item.title}</span>
                          <button
                            type="button"
                            onClick={() => toggleItemSection(item.id)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition-colors ml-0.5 cursor-pointer"
                            title="Chuyển sang mục Ôn bài"
                          >
                            🔄 Đặt làm Ôn bài
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItemFromCart(item.id)}
                            className="hover:text-rose-500 text-gray-400 p-0.5 rounded-full transition-colors cursor-pointer"
                            title="Bỏ bài này"
                          >
                            <span className="material-symbols-outlined text-[14px] block">close</span>
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>

                {/* Ngăn 2: Ôn bài */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5 custom-scrollbar">
                  <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 shrink-0 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-[14px]">history_edu</span>
                    Ôn bài ({selectedItems.filter(i => i.section === 'REVIEW').length}):
                  </span>
                  {selectedItems.filter(i => i.section === 'REVIEW').length === 0 ? (
                    <span className="text-[11px] text-gray-400 italic">Trống</span>
                  ) : (
                    selectedItems.filter(i => i.section === 'REVIEW').map((item) => {
                      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.GRAMMAR;
                      return (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 text-xs font-semibold text-amber-950 dark:text-amber-200 shrink-0 border border-amber-200 dark:border-amber-800 shadow-xs"
                        >
                          <span className={`material-symbols-outlined text-[15px] ${config.textClass}`}>
                            {config.icon}
                          </span>
                          <span className="max-w-[130px] truncate">{item.title}</span>
                          <button
                            type="button"
                            onClick={() => toggleItemSection(item.id)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition-colors ml-0.5 cursor-pointer"
                            title="Chuyển về Bài mới"
                          >
                            📘 Đặt làm Bài mới
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItemFromCart(item.id)}
                            className="hover:text-rose-500 text-gray-400 p-0.5 rounded-full transition-colors cursor-pointer"
                            title="Bỏ bài này"
                          >
                            <span className="material-symbols-outlined text-[14px] block">close</span>
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 font-bold text-xs sm:text-sm text-[#617589] hover:bg-white dark:hover:bg-gray-700 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleAssignBundle}
              disabled={selectedItems.length === 0 || isAssigningBundle}
              className="bg-primary hover:bg-primary/90 text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95"
            >
              {isAssigningBundle ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang giao nhóm bài...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Xác nhận giao nhóm ({selectedItems.length} bài)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
