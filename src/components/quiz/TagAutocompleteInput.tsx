"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { searchTags } from '@/actions/tag-actions';

interface TagAutocompleteInputProps {
  onAddTag: (tagName: string) => void;
  placeholder?: string;
  className?: string;
}

export function TagAutocompleteInput({
  onAddTag,
  placeholder = "Nhập thẻ tự chọn và nhấn Enter...",
  className = ""
}: TagAutocompleteInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ name: string; usageCount: number }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchTags(searchQuery);
      setSuggestions(results || []);
      setIsOpen(true);
    } catch (error) {
      console.error("Failed to search tags:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectTag = (tagName: string) => {
    const cleanTag = tagName.trim().toLowerCase().replace(/^#/, '');
    if (cleanTag) {
      onAddTag(cleanTag);
      setQuery("");
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (isOpen) {
        setSelectedIndex(prev => 
          prev < suggestions.length ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && selectedIndex >= 0 && selectedIndex < suggestions.length) {
        // Select existing tag
        handleSelectTag(suggestions[selectedIndex].name);
      } else if (query.trim()) {
        // Create new tag or select exact match
        handleSelectTag(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const exactMatchExists = suggestions.some(
    s => s.name.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-[#f0f2f4] dark:border-slate-700 rounded-2xl px-6 py-4 text-[#111418] dark:text-white font-bold text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-[#617589]/60 placeholder:font-normal pr-12"
          placeholder={placeholder}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#617589]">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </div>
      </div>

      {isOpen && query.trim() && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-[240px] overflow-y-auto py-2 custom-scrollbar">
            {suggestions.map((tag, index) => (
              <li
                key={tag.name}
                onClick={() => handleSelectTag(tag.name)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                  selectedIndex === index 
                    ? 'bg-primary/10 dark:bg-primary/20' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className="font-bold text-slate-800 dark:text-gray-100">#{tag.name}</span>
              </li>
            ))}
            
            {!exactMatchExists && query.trim() && (
              <li
                onClick={() => handleSelectTag(query)}
                onMouseEnter={() => setSelectedIndex(suggestions.length)}
                className={`px-4 py-3 cursor-pointer flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 transition-colors ${
                  selectedIndex === suggestions.length 
                    ? 'bg-primary/10 dark:bg-primary/20' 
                    : 'bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="bg-primary/20 text-primary p-1 rounded">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Tạo thẻ mới: <strong className="text-primary">#{query.trim().toLowerCase()}</strong>
                </span>
              </li>
            )}
            
            {suggestions.length === 0 && exactMatchExists && (
              <li className="px-4 py-3 text-sm text-slate-500 text-center">
                Không tìm thấy kết quả khác
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
