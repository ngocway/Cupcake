'use client';

import React from 'react';

interface ClassCommunityLinksProps {
  zaloUrl?: string | null;
  facebookUrl?: string;
  variant?: 'sidebar' | 'map-floating' | 'bottom-sheet';
}

const DEFAULT_FACEBOOK_URL = 'https://www.facebook.com/groups/2340951663410999';

export function ClassCommunityLinks({
  zaloUrl,
  facebookUrl = DEFAULT_FACEBOOK_URL,
  variant = 'sidebar',
}: ClassCommunityLinksProps) {
  const activeZaloUrl = zaloUrl || 'https://zalo.me/g/24aixg2gxprba7rv0ofl';

  const FacebookIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={`${className} fill-current shrink-0`} viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );

  const ZaloIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <img
      src="/images/icons/zalo-icon.png?v=2"
      alt="Zalo"
      className={`${className} object-contain shrink-0 drop-shadow-xs`}
      draggable={false}
    />
  );

  // Variant 1: Sidebar footer (Desktop sidebar)
  if (variant === 'sidebar') {
    return (
      <div className="shrink-0 p-2 sm:p-2.5 border-t border-[#F0E2BF] dark:border-slate-800 bg-[#FBF3DF]/95 dark:bg-slate-900/95 flex items-center gap-1.5 font-['Baloo_2',_'Nunito',_sans-serif]">
        {activeZaloUrl && (
          <a
            href={activeZaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gradient-to-r from-[#0055D4] via-[#0068FF] to-[#2684FF] hover:from-[#0048b8] hover:to-[#0055d4] text-white font-extrabold text-xs shadow-xs hover:shadow-md active:scale-95 transition-all group cursor-pointer border border-white/40"
            title="Tham gia nhóm Zalo lớp học"
          >
            <ZaloIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">Nhóm Zalo</span>
          </a>
        )}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-extrabold text-xs shadow-xs hover:shadow-md active:scale-95 transition-all group cursor-pointer border border-white/40"
          title="Tham gia nhóm Facebook Dolcake"
        >
          <FacebookIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Nhóm FB</span>
        </a>
      </div>
    );
  }

  // Variant 2: Bottom sheet footer (Mobile stations drawer)
  if (variant === 'bottom-sheet') {
    return (
      <div className="shrink-0 p-3 pt-2.5 border-t border-[#F0E2BF] dark:border-slate-800 bg-[#FBF3DF] dark:bg-slate-900 flex items-center gap-2 font-['Baloo_2',_'Nunito',_sans-serif]">
        {activeZaloUrl && (
          <a
            href={activeZaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#0055D4] via-[#0068FF] to-[#2684FF] text-white font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer border border-white/40"
            title="Tham gia nhóm Zalo lớp học"
          >
            <ZaloIcon className="w-4 h-4 shrink-0" />
            <span>Nhóm Zalo</span>
          </a>
        )}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#1877F2] text-white font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer border border-white/40"
          title="Tham gia nhóm Facebook Dolcake"
        >
          <FacebookIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Nhóm Facebook</span>
        </a>
      </div>
    );
  }

  // Variant 3: Raw floating icons on Map view (Bottom-Right corner, no wrapper frame or border)
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {activeZaloUrl && (
        <a
          href={activeZaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-transform duration-200 hover:scale-115 active:scale-90 cursor-pointer inline-flex items-center justify-center p-0.5 focus:outline-none"
          title="Tham gia nhóm Zalo lớp học"
          aria-label="Tham gia nhóm Zalo lớp học"
        >
          <img
            src="/images/icons/zalo-icon.png?v=2"
            alt="Zalo"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_3px_8px_rgba(0,70,180,0.45)] shrink-0"
            draggable={false}
          />
        </a>
      )}
      <a
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-transform duration-200 hover:scale-115 active:scale-90 cursor-pointer inline-flex items-center justify-center p-0.5 focus:outline-none"
        title="Tham gia nhóm Facebook Dolcake"
        aria-label="Tham gia nhóm Facebook Dolcake"
      >
        <svg className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-[0_4px_10px_rgba(24,119,242,0.4)] shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="#1877F2"
            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
          />
          <path
            fill="#FFFFFF"
            d="M16.671 15.463l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.474V4.916s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.668H7.078v3.47h3.047v8.385a12.187 12.187 0 003.875 0v-8.385h2.671z"
          />
        </svg>
      </a>
    </div>
  );
}
