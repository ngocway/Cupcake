import React from 'react';

interface PhonicsIllustrationProps {
  word: string;
  className?: string;
  size?: number;
}

const PHONICS_WORD_VISUALS: Record<
  string,
  { emoji: string; bgFrom: string; bgTo: string; accent: string }
> = {
  // Stage 1: Short A
  can: { emoji: '🥫', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#ef4444' },
  fan: { emoji: '🌀', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  man: { emoji: '👨', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  pan: { emoji: '🍳', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  ran: { emoji: '🏃', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  van: { emoji: '🚐', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  cap: { emoji: '🧢', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  map: { emoji: '🗺️', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#b45309' },
  nap: { emoji: '😴', bgFrom: '#ede9fe', bgTo: '#ddd6fe', accent: '#7c3aed' },
  tap: { emoji: '🚰', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  lap: { emoji: '🪑', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  gap: { emoji: '🌉', bgFrom: '#f3e8ff', bgTo: '#e9d5ff', accent: '#9333ea' },
  dam: { emoji: '🏞️', bgFrom: '#cffafe', bgTo: '#bae6fd', accent: '#0284c7' },
  ham: { emoji: '🍖', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  jam: { emoji: '🍓', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#e11d48' },
  ram: { emoji: '🐏', bgFrom: '#f3f4f6', bgTo: '#e5e7eb', accent: '#4b5563' },
  yam: { emoji: '🍠', bgFrom: '#ffedd5', bgTo: '#fdba74', accent: '#c2410c' },
  bad: { emoji: '🌧️', bgFrom: '#e2e8f0', bgTo: '#cbd5e1', accent: '#475569' },
  dad: { emoji: '👨‍👧', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  lad: { emoji: '🧒', bgFrom: '#fef9c3', bgTo: '#fef08a', accent: '#ca8a04' },
  mad: { emoji: '😠', bgFrom: '#fee2e2', bgTo: '#fca5a5', accent: '#dc2626' },
  sad: { emoji: '😢', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0369a1' },
  bag: { emoji: '🎒', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  flag: { emoji: '🚩', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  rag: { emoji: '🧽', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  tag: { emoji: '🏷️', bgFrom: '#e0e7ff', bgTo: '#c7d2fe', accent: '#4f46e5' },
  wag: { emoji: '🐕', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  cab: { emoji: '🚕', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  crab: { emoji: '🦀', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  lab: { emoji: '🧪', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#059669' },
  tab: { emoji: '📑', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  back: { emoji: '🔙', bgFrom: '#e0e7ff', bgTo: '#c7d2fe', accent: '#4f46e5' },
  black: { emoji: '🐈‍⬛', bgFrom: '#e2e8f0', bgTo: '#cbd5e1', accent: '#334155' },
  pack: { emoji: '📦', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#c2410c' },
  sack: { emoji: '🛍️', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#b45309' },
  track: { emoji: '🚂', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#15803d' },
  cash: { emoji: '💵', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  dash: { emoji: '💨', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  flash: { emoji: '📸', bgFrom: '#fef9c3', bgTo: '#fde047', accent: '#ca8a04' },
  rash: { emoji: '🩹', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  splash: { emoji: '💦', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },

  // Stage 2: Short E
  jet: { emoji: '✈️', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  net: { emoji: '🥅', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  pet: { emoji: '🐶', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  set: { emoji: '🥣', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  vet: { emoji: '🩺', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  wet: { emoji: '☔', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  den: { emoji: '🐻', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#b45309' },
  hen: { emoji: '🐔', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  men: { emoji: '👷', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  pen: { emoji: '🖊️', bgFrom: '#e0e7ff', bgTo: '#c7d2fe', accent: '#4f46e5' },
  ten: { emoji: '🔟', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#059669' },
  bed: { emoji: '🛏️', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  fed: { emoji: '🥕', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  led: { emoji: '🧭', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  red: { emoji: '🍎', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  wed: { emoji: '💍', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  beg: { emoji: '🐾', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  egg: { emoji: '🥚', bgFrom: '#fef9c3', bgTo: '#fde68a', accent: '#ca8a04' },
  leg: { emoji: '🦩', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  peg: { emoji: '🪝', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#b45309' },
  bell: { emoji: '🔔', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  shell: { emoji: '🐚', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  tell: { emoji: '💬', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  well: { emoji: '🪣', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  yell: { emoji: '📣', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  best: { emoji: '🌟', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  nest: { emoji: '🪺', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#15803d' },
  rest: { emoji: '🛋️', bgFrom: '#ede9fe', bgTo: '#ddd6fe', accent: '#7c3aed' },
  test: { emoji: '📝', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  vest: { emoji: '🦺', bgFrom: '#ffedd5', bgTo: '#fdba74', accent: '#ea580c' },
  bend: { emoji: '🤸', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  lend: { emoji: '🖍️', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  send: { emoji: '✉️', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  tent: { emoji: '⛺', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  vent: { emoji: '🌬️', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },

  // Stage 3: Short I
  bit: { emoji: '🍰', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  fit: { emoji: '👟', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  hit: { emoji: '⚾', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  kit: { emoji: '🎨', bgFrom: '#ede9fe', bgTo: '#ddd6fe', accent: '#7c3aed' },
  pit: { emoji: '🍑', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  sit: { emoji: '🧘', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  bin: { emoji: '🗑️', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  fin: { emoji: '🐬', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  pin: { emoji: '📌', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  tin: { emoji: '🥫', bgFrom: '#e2e8f0', bgTo: '#cbd5e1', accent: '#475569' },
  win: { emoji: '🏆', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  dip: { emoji: '🥣', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  lip: { emoji: '👄', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  rip: { emoji: '📄', bgFrom: '#f3f4f6', bgTo: '#e5e7eb', accent: '#4b5563' },
  sip: { emoji: '🧃', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  tip: { emoji: '🖌️', bgFrom: '#e0e7ff', bgTo: '#c7d2fe', accent: '#4f46e5' },
  zip: { emoji: '🤐', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  big: { emoji: '🐘', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  dig: { emoji: '🪏', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#b45309' },
  fig: { emoji: '🫐', bgFrom: '#f3e8ff', bgTo: '#e9d5ff', accent: '#7c3aed' },
  pig: { emoji: '🐷', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  wig: { emoji: '🤡', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  kid: { emoji: '🧒', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  lid: { emoji: '🫕', bgFrom: '#e2e8f0', bgTo: '#cbd5e1', accent: '#475569' },
  hid: { emoji: '🫣', bgFrom: '#ede9fe', bgTo: '#ddd6fe', accent: '#7c3aed' },
  swim: { emoji: '🏊', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  rim: { emoji: '🥤', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  fill: { emoji: '🚿', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  hill: { emoji: '⛰️', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  mill: { emoji: '🎡', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  pill: { emoji: '💊', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  spill: { emoji: '🥛', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  brick: { emoji: '🧱', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  kick: { emoji: '⚽', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  pick: { emoji: '🧺', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  sick: { emoji: '🤒', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  tick: { emoji: '⏰', bgFrom: '#fef9c3', bgTo: '#fde68a', accent: '#ca8a04' },
  dish: { emoji: '🍽️', bgFrom: '#f3f4f6', bgTo: '#e5e7eb', accent: '#475569' },
  fish: { emoji: '🐠', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  wish: { emoji: '🌠', bgFrom: '#ede9fe', bgTo: '#ddd6fe', accent: '#7c3aed' },
  swish: { emoji: '🌊', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },

  // Stage 4: Short O
  cot: { emoji: '🛏️', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  dot: { emoji: '🔴', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  hot: { emoji: '🍲', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  lot: { emoji: '🎁', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  pot: { emoji: '🪴', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  rot: { emoji: '🍂', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#b45309' },
  hop: { emoji: '🐇', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  mop: { emoji: '🧹', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  pop: { emoji: '🫧', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  stop: { emoji: '🛑', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  top: { emoji: '🪀', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  dog: { emoji: '🐶', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  fog: { emoji: '🌫️', bgFrom: '#e2e8f0', bgTo: '#cbd5e1', accent: '#475569' },
  frog: { emoji: '🐸', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  jog: { emoji: '🏃', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  log: { emoji: '🪵', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#92400e' },
  box: { emoji: '📦', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#c2410c' },
  fox: { emoji: '🦊', bgFrom: '#ffedd5', bgTo: '#fdba74', accent: '#ea580c' },
  ox: { emoji: '🐂', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#92400e' },
  clock: { emoji: '🕰️', bgFrom: '#fef9c3', bgTo: '#fde68a', accent: '#ca8a04' },
  lock: { emoji: '🔒', bgFrom: '#e0e7ff', bgTo: '#c7d2fe', accent: '#4f46e5' },
  rock: { emoji: '🪨', bgFrom: '#e2e8f0', bgTo: '#cbd5e1', accent: '#475569' },
  shock: { emoji: '😲', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  sock: { emoji: '🧦', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  bob: { emoji: '🍏', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  cob: { emoji: '🌽', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  job: { emoji: '👩‍🌾', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  sob: { emoji: '🥹', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  mom: { emoji: '👩', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  nod: { emoji: '🙂', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  pod: { emoji: '🫛', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  rod: { emoji: '🎣', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },

  // Stage 5: Short U & Mastery
  bug: { emoji: '🐞', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  hug: { emoji: '🤗', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  jug: { emoji: '🫗', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  mug: { emoji: '☕', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#b45309' },
  rug: { emoji: '🧶', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  tug: { emoji: '🪢', bgFrom: '#dbeafe', bgTo: '#bfdbfe', accent: '#2563eb' },
  bun: { emoji: '🥐', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  fun: { emoji: '🎉', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  run: { emoji: '🏃‍♂️', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  sun: { emoji: '☀️', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  cut: { emoji: '✂️', bgFrom: '#e0e7ff', bgTo: '#c7d2fe', accent: '#4f46e5' },
  hut: { emoji: '🛖', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#b45309' },
  nut: { emoji: '🥜', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#c2410c' },
  shut: { emoji: '🚪', bgFrom: '#e2e8f0', bgTo: '#cbd5e1', accent: '#475569' },
  cub: { emoji: '🐻', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#b45309' },
  rub: { emoji: '🧼', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  sub: { emoji: '🚤', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  tub: { emoji: '🛁', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  cup: { emoji: '🥤', bgFrom: '#ffe4e6', bgTo: '#fecdd3', accent: '#e11d48' },
  pup: { emoji: '🐶', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  bud: { emoji: '🌷', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  mud: { emoji: '🥾', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#92400e' },
  duck: { emoji: '🦆', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  luck: { emoji: '🍀', bgFrom: '#dcfce7', bgTo: '#bbf7d0', accent: '#16a34a' },
  truck: { emoji: '🚚', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  stuck: { emoji: '🚜', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  drum: { emoji: '🥁', bgFrom: '#fee2e2', bgTo: '#fecaca', accent: '#dc2626' },
  gum: { emoji: '🍬', bgFrom: '#fce7f3', bgTo: '#fbcfe8', accent: '#db2777' },
  hum: { emoji: '🎶', bgFrom: '#ede9fe', bgTo: '#ddd6fe', accent: '#7c3aed' },
  bump: { emoji: '🤜', bgFrom: '#ffedd5', bgTo: '#fed7aa', accent: '#ea580c' },
  jump: { emoji: '🦘', bgFrom: '#fef3c7', bgTo: '#fde68a', accent: '#d97706' },
  brush: { emoji: '🪥', bgFrom: '#cffafe', bgTo: '#a5f3fc', accent: '#0891b2' },
  crush: { emoji: '🫐', bgFrom: '#ede9fe', bgTo: '#ddd6fe', accent: '#7c3aed' },
  flush: { emoji: '💧', bgFrom: '#e0f2fe', bgTo: '#bae6fd', accent: '#0284c7' },
  rush: { emoji: '⚡', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
  star: { emoji: '⭐', bgFrom: '#fef08a', bgTo: '#fde047', accent: '#ca8a04' },
};

const STAGE_1_R2_BASE = 'https://media.dolcake.com/phonics/words';

const STAGE_1_R2_WORDS = new Set<string>([
  // Day 1 (-at)
  'bat', 'cat', 'fat', 'hat', 'mat', 'rat', 'sat',
  // Day 2 (-an)
  'can', 'fan', 'man', 'pan', 'ran', 'van',
  // Day 3 (-ap)
  'cap', 'map', 'nap', 'tap', 'lap', 'gap',
  // Day 4 (-am)
  'dam', 'ham', 'jam', 'ram', 'yam',
  // Day 5 (-ad)
  'bad', 'dad', 'lad', 'mad', 'sad',
  // Day 6 (-ag)
  'bag', 'flag', 'rag', 'tag', 'wag',
  // Day 7 (-ab)
  'cab', 'crab', 'lab', 'tab',
  // Day 8 (-ack)
  'back', 'black', 'pack', 'sack', 'track',
  // Day 9 (-ash)
  'cash', 'dash', 'flash', 'rash', 'splash',
]);

export function PhonicsWordIllustration({ word, className = '', size = 120 }: PhonicsIllustrationProps) {
  const normalized = (word || '').toLowerCase().trim();

  if (STAGE_1_R2_WORDS.has(normalized)) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-2xl bg-white p-1.5 border border-slate-100 shadow-[0_6px_16px_rgba(15,23,42,0.08)] flex items-center justify-center overflow-hidden select-none ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${STAGE_1_R2_BASE}/${normalized}.png`}
          alt={normalized}
          className="w-full h-full object-contain rounded-xl select-none pointer-events-none"
          loading="lazy"
        />
      </div>
    );
  }

  switch (normalized) {
    case 'bat':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Bat body glow */}
          <circle cx="80" cy="80" r="70" fill="#fdf4ff" />
          {/* Left Wing */}
          <path
            d="M30 65 C10 40 12 90 28 95 C38 98 48 85 58 80 Z"
            fill="#a855f7"
            stroke="#7e22ce"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Right Wing */}
          <path
            d="M130 65 C150 40 148 90 132 95 C122 98 112 85 102 80 Z"
            fill="#a855f7"
            stroke="#7e22ce"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Ears */}
          <polygon points="62,60 70,32 78,55" fill="#7e22ce" />
          <polygon points="65,58 70,40 75,55" fill="#f472b6" />
          <polygon points="98,60 90,32 82,55" fill="#7e22ce" />
          <polygon points="95,58 90,40 85,55" fill="#f472b6" />
          {/* Head & Body */}
          <ellipse cx="80" cy="85" rx="28" ry="32" fill="#9333ea" stroke="#6b21a8" strokeWidth="3.5" />
          {/* Eyes */}
          <circle cx="71" cy="78" r="6" fill="#1e1b4b" />
          <circle cx="73" cy="76" r="2.2" fill="#ffffff" />
          <circle cx="89" cy="78" r="6" fill="#1e1b4b" />
          <circle cx="91" cy="76" r="2.2" fill="#ffffff" />
          {/* Rosy Cheeks */}
          <ellipse cx="66" cy="87" rx="4.5" ry="3" fill="#f472b6" opacity="0.8" />
          <ellipse cx="94" cy="87" rx="4.5" ry="3" fill="#f472b6" opacity="0.8" />
          {/* Cute Smile with Tiny Fangs */}
          <path d="M75 92 Q80 97 85 92" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <polygon points="76,92 78,96 79,92" fill="#ffffff" />
          <polygon points="81,92 82,96 84,92" fill="#ffffff" />
          {/* Floating Stars */}
          <polygon points="120,35 122,40 127,41 123,45 124,50 120,47 116,50 117,45 113,41 118,40" fill="#fbbf24" />
          <polygon points="40,45 41,48 45,49 42,52 43,56 40,54 37,56 38,52 35,49 39,48" fill="#fbbf24" />
        </svg>
      );

    case 'cat':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Backdrop */}
          <circle cx="80" cy="80" r="70" fill="#fff7ed" />
          {/* Left Ear */}
          <polygon points="50,65 52,28 78,50" fill="#fb923c" stroke="#ea580c" strokeWidth="3.5" />
          <polygon points="56,60 58,38 72,52" fill="#fda4af" />
          {/* Right Ear */}
          <polygon points="110,65 108,28 82,50" fill="#fb923c" stroke="#ea580c" strokeWidth="3.5" />
          <polygon points="104,60 102,38 88,52" fill="#fda4af" />
          {/* Body */}
          <ellipse cx="80" cy="115" rx="36" ry="28" fill="#fb923c" stroke="#ea580c" strokeWidth="3.5" />
          <ellipse cx="80" cy="120" rx="22" ry="18" fill="#ffedd5" />
          {/* Head */}
          <circle cx="80" cy="78" r="34" fill="#fb923c" stroke="#ea580c" strokeWidth="3.5" />
          {/* Forehead Stripes */}
          <path d="M80 48 L80 58 M74 50 L76 57 M86 50 L84 57" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
          {/* Eyes */}
          <ellipse cx="67" cy="75" rx="5.5" ry="6.5" fill="#1e293b" />
          <circle cx="69" cy="73" r="2.2" fill="#ffffff" />
          <ellipse cx="93" cy="75" rx="5.5" ry="6.5" fill="#1e293b" />
          <circle cx="95" cy="73" r="2.2" fill="#ffffff" />
          {/* Nose */}
          <polygon points="80,84 76,80 84,80" fill="#f43f5e" />
          {/* Mouth */}
          <path d="M74 88 Q80 93 80 85 Q80 93 86 88" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Rosy Cheeks */}
          <ellipse cx="60" cy="85" rx="5" ry="3.5" fill="#fb7185" opacity="0.8" />
          <ellipse cx="100" cy="85" rx="5" ry="3.5" fill="#fb7185" opacity="0.8" />
          {/* Whiskers */}
          <path d="M42 78 L56 80 M40 86 L55 85" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M118 78 L104 80 M120 86 L105 85" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'fat':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Backdrop */}
          <circle cx="80" cy="80" r="70" fill="#fef9c3" />
          {/* Ears */}
          <circle cx="50" cy="48" r="14" fill="#f59e0b" stroke="#d97706" strokeWidth="3" />
          <circle cx="50" cy="48" r="8" fill="#fed7aa" />
          <circle cx="110" cy="48" r="14" fill="#f59e0b" stroke="#d97706" strokeWidth="3" />
          <circle cx="110" cy="48" r="8" fill="#fed7aa" />
          {/* Extra Chubby Round Body */}
          <ellipse cx="80" cy="98" rx="48" ry="44" fill="#fbbf24" stroke="#d97706" strokeWidth="4" />
          {/* Big White Round Belly */}
          <ellipse cx="80" cy="108" rx="34" ry="30" fill="#fef3c7" />
          {/* Chubby Cheeks / Head merged */}
          <ellipse cx="80" cy="74" rx="32" ry="26" fill="#fbbf24" />
          {/* Eyes */}
          <circle cx="68" cy="70" r="5" fill="#1e293b" />
          <circle cx="70" cy="68" r="2" fill="#ffffff" />
          <circle cx="92" cy="70" r="5" fill="#1e293b" />
          <circle cx="94" cy="68" r="2" fill="#ffffff" />
          {/* Rosy Cheeks */}
          <circle cx="58" cy="80" r="6" fill="#f87171" opacity="0.8" />
          <circle cx="102" cy="80" r="6" fill="#f87171" opacity="0.8" />
          {/* Nose & Big Smile */}
          <ellipse cx="80" cy="76" rx="4" ry="3" fill="#b45309" />
          <path d="M72 82 Q80 92 88 82" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Little Paws on Belly */}
          <ellipse cx="58" cy="115" rx="8" ry="6" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
          <ellipse cx="102" cy="115" rx="8" ry="6" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
        </svg>
      );

    case 'hat':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Backdrop */}
          <circle cx="80" cy="80" r="70" fill="#f0fdf4" />
          {/* Hat Brim */}
          <ellipse cx="80" cy="118" rx="55" ry="16" fill="#0284c7" stroke="#0369a1" strokeWidth="4" />
          <ellipse cx="80" cy="116" rx="46" ry="12" fill="#38bdf8" />
          {/* Hat Crown / Cylinder */}
          <path
            d="M50 114 L55 52 Q80 44 105 52 L110 114 Z"
            fill="#0ea5e9"
            stroke="#0369a1"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Hat Top Oval */}
          <ellipse cx="80" cy="52" rx="26" ry="8" fill="#7dd3fc" stroke="#0369a1" strokeWidth="3" />
          {/* Yellow Ribbon Band */}
          <path
            d="M52 100 L50 114 Q80 120 110 114 L108 100 Q80 106 52 100 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="3"
          />
          {/* Ribbon Buckle */}
          <rect x="74" y="99" width="12" height="15" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
          <rect x="77" y="102" width="6" height="9" rx="1.5" fill="#fef3c7" />
          {/* Magical Star Sparkles */}
          <polygon points="122,48 124,53 129,54 125,58 126,63 122,60 118,63 119,58 115,54 120,53" fill="#eab308" />
          <polygon points="38,62 39,66 43,67 40,70 41,74 38,72 35,74 36,70 33,67 37,66" fill="#eab308" />
        </svg>
      );

    case 'mat':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Backdrop */}
          <circle cx="80" cy="80" r="70" fill="#fdf2f8" />
          {/* Mat Fringes Left & Right */}
          <path d="M22 68 L22 102 M25 66 L25 104 M28 65 L28 105" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M138 68 L138 102 M135 66 L135 104 M132 65 L132 105" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
          {/* Main Mat Shape (3D Isometric Perspective) */}
          <polygon
            points="32,65 128,65 138,105 22,105"
            fill="#f472b6"
            stroke="#db2777"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Inner Decorative Stripes */}
          <polygon points="38,72 122,72 128,82 32,82" fill="#fbcfe8" />
          <polygon points="30,86 130,86 134,94 26,94" fill="#f43f5e" />
          {/* Cozy Welcome Heart on Mat */}
          <path
            d="M80 80 C80 75 74 72 70 76 C66 80 72 86 80 91 C88 86 94 80 90 76 C86 72 80 75 80 80 Z"
            fill="#ffffff"
            stroke="#e11d48"
            strokeWidth="1.5"
          />
        </svg>
      );

    case 'rat':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Backdrop */}
          <circle cx="80" cy="80" r="70" fill="#f3f4f6" />
          {/* Long Curled Tail */}
          <path d="M42 120 C18 125 15 90 28 85 C35 82 38 95 44 105" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Left Big Round Ear */}
          <circle cx="56" cy="55" r="16" fill="#9ca3af" stroke="#6b7280" strokeWidth="3" />
          <circle cx="56" cy="55" r="10" fill="#fbcfe8" />
          {/* Right Big Round Ear */}
          <circle cx="104" cy="55" r="16" fill="#9ca3af" stroke="#6b7280" strokeWidth="3" />
          <circle cx="104" cy="55" r="10" fill="#fbcfe8" />
          {/* Body */}
          <ellipse cx="80" cy="105" rx="34" ry="26" fill="#9ca3af" stroke="#6b7280" strokeWidth="3.5" />
          <ellipse cx="80" cy="110" rx="20" ry="16" fill="#e5e7eb" />
          {/* Head */}
          <circle cx="80" cy="78" r="28" fill="#9ca3af" stroke="#6b7280" strokeWidth="3.5" />
          {/* Eyes */}
          <circle cx="70" cy="74" r="4.5" fill="#1f2937" />
          <circle cx="72" cy="72" r="1.8" fill="#ffffff" />
          <circle cx="90" cy="74" r="4.5" fill="#1f2937" />
          <circle cx="92" cy="72" r="1.8" fill="#ffffff" />
          {/* Pink Snout Nose */}
          <circle cx="80" cy="84" r="4" fill="#f472b6" />
          {/* Whiskers */}
          <path d="M50 82 L65 83 M48 88 L64 86" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
          <path d="M110 82 L95 83 M112 88 L96 86" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
          {/* Triangular Wedge of Swiss Cheese */}
          <polygon points="70,118 96,112 88,132" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5" />
          <circle cx="80" cy="118" r="2.5" fill="#f59e0b" />
          <circle cx="86" cy="124" r="2" fill="#f59e0b" />
        </svg>
      );

    case 'sat':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Backdrop */}
          <circle cx="80" cy="80" r="70" fill="#eff6ff" />
          {/* Wooden Stool / Mat Underneath */}
          <ellipse cx="80" cy="126" rx="42" ry="12" fill="#ca8a04" stroke="#854d0e" strokeWidth="3" />
          <rect x="52" y="126" width="6" height="18" rx="2" fill="#a16207" />
          <rect x="102" y="126" width="6" height="18" rx="2" fill="#a16207" />
          {/* Cat Body sitting down comfortably */}
          <ellipse cx="80" cy="100" rx="30" ry="24" fill="#38bdf8" stroke="#0284c7" strokeWidth="3.5" />
          <ellipse cx="80" cy="105" rx="18" ry="15" fill="#e0f2fe" />
          {/* Little Front Paws resting on stool */}
          <ellipse cx="72" cy="118" rx="5" ry="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          <ellipse cx="88" cy="118" rx="5" ry="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          {/* Ears */}
          <polygon points="56,62 58,35 76,52" fill="#38bdf8" stroke="#0284c7" strokeWidth="3" />
          <polygon points="62,58 64,44 72,52" fill="#fbcfe8" />
          <polygon points="104,62 102,35 84,52" fill="#38bdf8" stroke="#0284c7" strokeWidth="3" />
          <polygon points="98,58 96,44 88,52" fill="#fbcfe8" />
          {/* Head */}
          <circle cx="80" cy="72" r="26" fill="#38bdf8" stroke="#0284c7" strokeWidth="3.5" />
          {/* Peaceful Content Eyes (Closed crescent smiles) */}
          <path d="M66 70 Q71 75 76 70" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M84 70 Q89 75 94 70" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Pink Nose & Cute Smile */}
          <polygon points="80,75 77,72 83,72" fill="#f43f5e" />
          <path d="M75 78 Q80 82 85 78" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Rosy Cheeks */}
          <circle cx="62" cy="76" r="4.5" fill="#f472b6" opacity="0.8" />
          <circle cx="98" cy="76" r="4.5" fill="#f472b6" opacity="0.8" />
          {/* Musical Notes in Air */}
          <path d="M115 42 L115 54 M115 46 Q122 42 125 48" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="112" cy="54" r="3" fill="#0284c7" />
        </svg>
      );

    default: {
      const visual = PHONICS_WORD_VISUALS[normalized] || {
        emoji: '🌟',
        bgFrom: '#e0f2fe',
        bgTo: '#bae6fd',
        accent: '#0284c7',
      };
      const emojiSize = Math.round(size * 0.56);

      return (
        <div
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${visual.bgFrom} 58%, ${visual.bgTo} 100%)`,
            borderColor: '#ffffff',
            boxShadow: `0 6px 18px ${visual.accent}26, inset 0 2px 6px rgba(255,255,255,0.95)`,
          }}
          className={`relative rounded-full border-3 flex items-center justify-center select-none ${className}`}
        >
          <span
            style={{ fontSize: emojiSize, lineHeight: 1 }}
            className="drop-shadow-[0_4px_6px_rgba(15,23,42,0.14)]"
          >
            {visual.emoji}
          </span>
          <span
            style={{ color: visual.accent }}
            className="pointer-events-none absolute top-[12%] right-[14%] text-xs opacity-80"
          >
            ✨
          </span>
        </div>
      );
    }
  }
}
