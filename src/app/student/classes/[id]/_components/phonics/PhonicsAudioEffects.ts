/**
 * Web Audio API synthesizer for instant zero-latency UI sound effects
 * + Oxford Master Phonics Studio Audio Loader (/audio/phonics/oxford/)
 * + ElevenLabs Alice Voice Manifest (/audio/phonics/alice/)
 * + Animal sound effects (cat meow, bat flutter, rat squeak, etc.)
 */

import {
  ALICE_STUDIO_WORDS,
  ALICE_SENTENCE_SLUGS,
  DEEPGRAM_STUDIO_WORDS,
  DEEPGRAM_SENTENCE_SLUGS,
} from '@/lib/phonics-alice-audio-manifest';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function triggerConfetti() {
  if (typeof window === 'undefined') return;
  try {
    const winConfetti = (window as any).confetti;
    if (typeof winConfetti === 'function') {
      winConfetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }
  } catch {}
}

export function playPopSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

export function playSnapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(250, now + 0.06);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

/**
 * Magnetic snap sound when 3D letter cubes lock together tightly side-by-side
 */
export function playMagneticSnapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // High crisp plastic/wood contact click
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(1400, now);
  osc1.frequency.exponentialRampToValueAtTime(160, now + 0.04);
  gain1.gain.setValueAtTime(0.45, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.04);

  // Body thump / resonance of toy cubes
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(260, now);
  osc2.frequency.exponentialRampToValueAtTime(90, now + 0.08);
  gain2.gain.setValueAtTime(0.35, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.08);
}

/**
 * Cartoon toy bouncy hop sound when an individual 3D cube jumps
 */
export function playToyBounceSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(560, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
  gain.gain.setValueAtTime(0.32, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

export function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.07;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.28, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.18);
  });
}

export function playCheerSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + idx * 0.08;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.3, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.28);
  });
}

export function playWrongSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(170, now + 0.2);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

// -------------------------------------------------------------
// TRAIN SOUND EFFECTS (Web Audio API Synthesizers)
// -------------------------------------------------------------

export function playTrainChugSound(count: number = 3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  for (let i = 0; i < count; i++) {
    const startTime = ctx.currentTime + i * 0.16;
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320 - i * 20, startTime);
    filter.Q.setValueAtTime(2.5, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + 0.12);
  }
}

export function playTrainCouplingSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const freqs = [780, 1150, 1680, 2400];
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const vol = 0.25 / (idx + 1);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  });

  const thud = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(140, now);
  thud.frequency.exponentialRampToValueAtTime(50, now + 0.15);

  thudGain.gain.setValueAtTime(0.4, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  thud.connect(thudGain);
  thudGain.connect(ctx.destination);

  thud.start(now);
  thud.stop(now + 0.15);
}

export function playTrainWhistleSound(): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioContext();
    if (!ctx) {
      resolve();
      return;
    }

    const playChirp = (startTime: number, duration: number) => {
      const tones = [620, 780];
      tones.forEach((baseFreq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.linearRampToValueAtTime(baseFreq + 25, startTime + duration);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.04);
        gain.gain.setValueAtTime(0.22, startTime + duration - 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    };

    const now = ctx.currentTime;
    playChirp(now, 0.24);
    playChirp(now + 0.30, 0.38);

    setTimeout(() => {
      resolve();
    }, 720);
  });
}

// -------------------------------------------------------------
// ANIMAL / OBJECT SFX
// -------------------------------------------------------------

export function playAnimalSound(word: string) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const lower = word.toLowerCase().trim();

  switch (lower) {
    case 'cat': {
      // Cute kitten meow
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.22);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.55);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.12);
      gain.gain.setValueAtTime(0.32, now + 0.38);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.58);
      break;
    }

    case 'bat': {
      // Fluttering wings
      for (let i = 0; i < 4; i++) {
        const start = now + i * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260 + i * 40, start);
        osc.frequency.exponentialRampToValueAtTime(100, start + 0.06);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.06);
      }
      break;
    }

    case 'rat': {
      // Squeak squeak
      for (let i = 0; i < 2; i++) {
        const start = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, start);
        osc.frequency.linearRampToValueAtTime(3200, start + 0.04);
        osc.frequency.linearRampToValueAtTime(2600, start + 0.09);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.09);
      }
      break;
    }

    case 'hat': {
      // Magic sparkling chime
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
      freqs.forEach((f, idx) => {
        const start = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
      break;
    }

    case 'fat': {
      // Bouncy boing
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      break;
    }

    case 'mat': {
      // Soft woosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
      break;
    }

    case 'sat': {
      // Content purr
      const freqs = [587.33, 739.99, 880];
      freqs.forEach((f, idx) => {
        const start = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
      break;
    }

    default:
      playCorrectSound();
      break;
  }
}

// -------------------------------------------------------------
// JOLLY PHONICS & STUDIO AUDIO PLAYBACK (AUTHENTIC RECORDINGS)
// -------------------------------------------------------------

const AUDIO_VERSION = 'v7_r2_loud_085';
const audioCache = new Map<string, HTMLAudioElement>();
let activeSpokenAudio: HTMLAudioElement | null = null;
let activeSpokenAbort: (() => void) | null = null;

/**
 * Immediately stops any currently playing spoken word/sentence audio or Web Speech utterance.
 */
export function stopSpokenAudio() {
  if (activeSpokenAudio) {
    try {
      activeSpokenAudio.pause();
      activeSpokenAudio.currentTime = 0;
    } catch {}
    activeSpokenAudio = null;
  }
  if (activeSpokenAbort) {
    const abortFn = activeSpokenAbort;
    activeSpokenAbort = null;
    abortFn();
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function sentenceToAudioSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function enqueuePreloadUrl(url: string) {
  if (typeof window === 'undefined' || audioCache.has(url)) return;
  try {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.load();
    audioCache.set(url, audio);
  } catch {}
}

export function preloadJollyPhonicsAudio(
  letters: string[] = ['a', 'b', 'c', 'f', 'h', 'm', 'r', 's', 't'],
  words: string[] = []
) {
  if (typeof window === 'undefined') return;
  const urls = new Set<string>();

  for (const letter of letters) {
    const clean = normalizeGeminatePhoneme(letter.toLowerCase().trim().replace(/[^a-z]/g, ''));
    if (!clean) continue;
    if (JOLLY_AVAILABLE_PHONEMES.has(clean)) {
      urls.add(`/audio/phonics/jolly/uk/${clean}.mp3?v=${AUDIO_VERSION}`);
    } else {
      let i = 0;
      while (i < clean.length) {
        const two = clean.slice(i, i + 2);
        if (JOLLY_AVAILABLE_PHONEMES.has(two)) {
          urls.add(`/audio/phonics/jolly/uk/${two}.mp3?v=${AUDIO_VERSION}`);
          i += 2;
        } else {
          const one = clean[i];
          if (JOLLY_AVAILABLE_PHONEMES.has(one)) {
            urls.add(`/audio/phonics/jolly/uk/${one}.mp3?v=${AUDIO_VERSION}`);
          }
          i += 1;
        }
      }
    }
  }

  // Preload active day's blended word audio files (fallback to Day 1 defaults)
  const targetWords = words.length > 0 ? words : Array.from(DAY_1_STUDIO_WORDS);
  for (const rawWord of targetWords) {
    const cleanWord = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanWord) continue;
    if (DAY_1_STUDIO_WORDS.has(cleanWord)) {
      urls.add(`/audio/phonics/human_oxford/${cleanWord}.mp3?v=${AUDIO_VERSION}`);
    } else if (R2_STUDIO_WORDS.has(cleanWord)) {
      urls.add(`${R2_AUDIO_BASE}/${cleanWord}.mp3?v=${AUDIO_VERSION}`);
    } else if (ALICE_STUDIO_WORDS.has(cleanWord)) {
      urls.add(`${R2_AUDIO_BASE}/alice/${cleanWord}.mp3?v=${AUDIO_VERSION}`);
    } else if (DEEPGRAM_STUDIO_WORDS.has(cleanWord)) {
      urls.add(`${R2_AUDIO_BASE}/deepgram/${cleanWord}.mp3?v=${AUDIO_VERSION}`);
    }
  }

  for (const url of urls) {
    enqueuePreloadUrl(url);
  }
}

function pickFemaleEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = enVoices.length > 0 ? enVoices : voices;

  const maleRegex =
    /\b(david|mark|george|daniel|guy|ryan|richard|james|thomas|brian|christopher|eric|roger|steffan|william|andrew|alex|fred|male)\b/i;
  const preferredFemaleOrder = [
    /google us english/i,
    /jenny/i,
    /aria/i,
    /ava/i,
    /emma/i,
    /sonia/i,
    /libby/i,
    /samantha/i,
    /zira/i,
    /hazel/i,
    /susan/i,
    /victoria/i,
    /karen/i,
    /google uk english female/i,
    /female|woman|girl/i,
  ];

  for (const pattern of preferredFemaleOrder) {
    const match = pool.find((v) => pattern.test(v.name) && !maleRegex.test(v.name));
    if (match) return match;
  }

  const nonMaleEn = pool.find((v) => !maleRegex.test(v.name));
  return nonMaleEn || pool[0] || null;
}

function getVoicesReady(timeoutMs = 150): Promise<SpeechSynthesisVoice | null> {
  const immediate = pickFemaleEnglishVoice();
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve(null);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(pickFemaleEnglishVoice());
    };
    const prevHandler = window.speechSynthesis.onvoiceschanged;
    window.speechSynthesis.onvoiceschanged = (ev) => {
      if (typeof prevHandler === 'function') prevHandler.call(window.speechSynthesis, ev);
      finish();
    };
    setTimeout(finish, timeoutMs);
  });
}

function speakWithBrowserTtsFallback(text: string, rate: number = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }
    void getVoicesReady().then((femaleVoice) => {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = femaleVoice?.lang || 'en-US';
        if (femaleVoice) {
          utter.voice = femaleVoice;
        }
        utter.rate = rate;
        utter.pitch = 1.05;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          if (activeSpokenAbort === finish) activeSpokenAbort = null;
          resolve();
        };
        activeSpokenAbort = finish;
        utter.onend = finish;
        utter.onerror = finish;
        window.speechSynthesis.speak(utter);
        setTimeout(finish, Math.max(4000, text.length * 140));
      } catch {
        resolve();
      }
    });
  });
}

function playAudioFromUrl(
  url: string,
  fallbackUrl?: string,
  options?: {
    trackAsSpoken?: boolean;
    maxTimeoutMs?: number;
    ttsFallbackText?: string;
    ttsRate?: number;
    playbackRate?: number;
  }
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    const trackAsSpoken = options?.trackAsSpoken ?? false;
    const maxTimeoutMs = options?.maxTimeoutMs ?? 3000;

    if (trackAsSpoken) {
      stopSpokenAudio();
    }

    const cached = audioCache.get(url);
    const canReuseCached = Boolean(cached && !cached.error && cached.paused && cached.readyState >= 2);
    const audio = canReuseCached ? (cached as HTMLAudioElement) : new Audio(url);
    if (!canReuseCached && !audioCache.has(url)) {
      audio.preload = 'auto';
      audioCache.set(url, audio);
    }
    if (canReuseCached) {
      try {
        audio.currentTime = 0;
      } catch {}
    }
    audio.volume = 1.0;
    audio.playbackRate = options?.playbackRate ?? 1.0;
    if ('preservesPitch' in audio) {
      audio.preservesPitch = true;
    }
    if (trackAsSpoken) {
      activeSpokenAudio = audio;
    }

    let hasEnded = false;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      audio.removeEventListener('ended', finish);
      audio.removeEventListener('error', onError);
      if (trackAsSpoken && activeSpokenAudio === audio) {
        activeSpokenAudio = null;
      }
      if (trackAsSpoken && activeSpokenAbort === finish) {
        activeSpokenAbort = null;
      }
    };

    const finish = () => {
      if (hasEnded) return;
      hasEnded = true;
      cleanup();
      resolve();
    };

    if (trackAsSpoken) {
      activeSpokenAbort = finish;
    }

    const onError = () => {
      if (hasEnded) return;
      hasEnded = true;
      cleanup();

      if (fallbackUrl) {
        playAudioFromUrl(fallbackUrl, undefined, {
          trackAsSpoken,
          maxTimeoutMs,
          ttsFallbackText: options?.ttsFallbackText,
          ttsRate: options?.ttsRate,
        }).then(resolve);
      } else if (options?.ttsFallbackText) {
        speakWithBrowserTtsFallback(options.ttsFallbackText, options.ttsRate).then(resolve);
      } else {
        resolve();
      }
    };

    audio.addEventListener('ended', finish);
    audio.addEventListener('error', onError);

    safetyTimer = setTimeout(() => {
      finish();
    }, maxTimeoutMs);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        onError();
      });
    }
  });
}

const DAY_1_STUDIO_WORDS = new Set([
  'bat',
  'cat',
  'fat',
  'hat',
  'mat',
  'rat',
  'sat',
]);

const R2_AUDIO_BASE = 'https://media.dolcake.com/phonics/audio';

const R2_STUDIO_WORDS = new Set([
  // Day 2 (-an)
  'can', 'fan', 'man', 'pan', 'ran', 'van',
  // Days 3–9 (Short A)
  'cap', 'map', 'nap', 'tap', 'lap', 'gap',
  'dam', 'ham', 'jam', 'ram', 'yam',
  'bad', 'dad', 'lad', 'mad', 'sad',
  'bag', 'flag', 'rag', 'tag', 'wag',
  'cab', 'crab', 'lab', 'tab',
  'back', 'black', 'pack', 'sack', 'track',
  'cash', 'dash', 'flash', 'rash', 'splash',
  // Days 11–17 (Short E)
  'jet', 'net', 'pet', 'set', 'vet', 'wet',
  'den', 'hen', 'men', 'pen', 'ten',
  'bed', 'fed', 'led', 'red', 'wed',
  'beg', 'egg', 'leg', 'peg',
  'bell', 'shell', 'tell', 'well', 'yell',
  'best', 'nest', 'rest', 'test', 'vest',
  'bend', 'lend', 'send', 'tent', 'vent',
  // Days 19–26 (Short I)
  'bit', 'fit', 'hit', 'kit', 'pit', 'sit',
  'bin', 'fin', 'pin', 'tin', 'win',
  'dip', 'lip', 'rip', 'sip', 'tip', 'zip',
  'big', 'dig', 'fig', 'pig', 'wig',
  'kid', 'lid', 'hid', 'swim', 'rim',
  'fill', 'hill', 'mill', 'pill', 'spill',
  'brick', 'kick', 'pick', 'sick', 'tick',
  'dish', 'fish', 'wish', 'swish',
  // Days 28–34 (Short O)
  'cot', 'dot', 'hot', 'lot', 'pot', 'rot',
  'hop', 'mop', 'pop', 'stop', 'top',
  'dog', 'fog', 'frog', 'jog', 'log',
  'box', 'fox', 'ox',
  'clock', 'lock', 'rock', 'shock', 'sock',
  'bob', 'cob', 'job', 'sob',
  'mom', 'nod', 'pod', 'rod',
  // Days 36–45 (Short U & Graduation)
  'bug', 'hug', 'jug', 'mug', 'rug', 'tug',
  'bun', 'fun', 'run', 'sun',
  'cut', 'hut', 'nut', 'shut',
  'cub', 'rub', 'sub', 'tub',
  'cup', 'pup', 'bud', 'mud',
  'duck', 'luck', 'truck', 'stuck',
  'drum', 'gum', 'hum', 'bump', 'jump',
  'brush', 'crush', 'flush', 'rush',
  'star',
]);

const JOLLY_AVAILABLE_PHONEMES = new Set([
  'a', 'ai', 'ar', 'b', 'c', 'ch', 'ck', 'd', 'e', 'ee', 'er',
  'f', 'g', 'h', 'i', 'ie', 'j', 'k', 'l', 'm', 'n', 'ng',
  'o', 'oa', 'oi', 'oo', 'or', 'ou', 'p', 'qu', 'r', 's', 'sh',
  't', 'th', 'u', 'ue', 'v', 'w', 'x', 'y', 'z',
]);

function normalizeGeminatePhoneme(raw: string): string {
  if (raw === 'll') return 'l';
  if (raw === 'gg') return 'g';
  if (raw === 'ss') return 's';
  if (raw === 'ff') return 'f';
  if (raw === 'zz') return 'z';
  return raw;
}

/**
 * Play authentic preschool Jolly Phonics phoneme sound (e.g. /k/, /æ/, /t/, /ʃ/, or blends like /fl/, /cr/)
 * Priority 1: Jolly Phonics UK Female (/audio/phonics/jolly/uk/{phoneme}.mp3)
 * Priority 2: Jolly Phonics US Female (/audio/phonics/jolly/us/{phoneme}.mp3)
 * Priority 3: Sequential phoneme blending for multi-letter clusters (fl, cr, st, nt, spl, etc.) + Web Speech fallback
 */
export async function playLetterPhoneme(letter: string, accent: 'uk' | 'us' = 'uk'): Promise<void> {
  const rawClean = normalizeGeminatePhoneme(letter.toLowerCase().trim().replace(/[^a-z]/g, ''));
  if (!rawClean) return;

  if (JOLLY_AVAILABLE_PHONEMES.has(rawClean)) {
    const primaryUrl = `/audio/phonics/jolly/${accent}/${rawClean}.mp3?v=${AUDIO_VERSION}`;
    const secondaryUrl = `/audio/phonics/jolly/${accent === 'uk' ? 'us' : 'uk'}/${rawClean}.mp3?v=${AUDIO_VERSION}`;
    return playAudioFromUrl(primaryUrl, secondaryUrl, {
      maxTimeoutMs: 2200,
      ttsFallbackText: rawClean,
      ttsRate: 0.78,
    });
  }

  // Handle multi-letter consonant blends (e.g., fl, cr, bl, tr, st, spl, nt, nd, mp)
  // Check if ending has a digraph (e.g. 'shr') or play constituent letters smoothly!
  const parts: string[] = [];
  let i = 0;
  while (i < rawClean.length) {
    const two = rawClean.slice(i, i + 2);
    if (JOLLY_AVAILABLE_PHONEMES.has(two)) {
      parts.push(two);
      i += 2;
    } else {
      parts.push(rawClean[i]);
      i += 1;
    }
  }

  for (const part of parts) {
    if (JOLLY_AVAILABLE_PHONEMES.has(part)) {
      const pUrl = `/audio/phonics/jolly/${accent}/${part}.mp3?v=${AUDIO_VERSION}`;
      const sUrl = `/audio/phonics/jolly/${accent === 'uk' ? 'us' : 'uk'}/${part}.mp3?v=${AUDIO_VERSION}`;
      await playAudioFromUrl(pUrl, sUrl, {
        maxTimeoutMs: 1200,
        ttsFallbackText: part,
        ttsRate: 0.85,
      });
    } else {
      await speakWithBrowserTtsFallback(part, 0.85);
    }
  }
}

/**
 * Play full word OR full sentence pronunciation:
 * - Known Day 1 Studio Words: /audio/phonics/human_oxford/{word}.mp3 -> R2 alice/{word}.mp3
 * - Days 2–45 User Custom R2 Words: https://media.dolcake.com/phonics/audio/{word}.mp3 (0.85x boosted)
 * - Verified Alice Day 1 Sentences: https://media.dolcake.com/phonics/audio/alice/sentences/{slug}.mp3
 * - Verified Deepgram Athena Days 2–45 Sentences: https://media.dolcake.com/phonics/audio/deepgram/sentences/{slug}.mp3
 * - Remaining items: Female English Web Speech voice fallback (never male default!)
 */
export function playSpokenText(text: string, rate: number = 0.82): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve();

  const isSingleWord = !/\s/.test(trimmed);
  if (isSingleWord) {
    const cleanWord = trimmed.toLowerCase().replace(/[^a-z]/g, '');
    if (!cleanWord) return Promise.resolve();

    if (DAY_1_STUDIO_WORDS.has(cleanWord)) {
      const wordUrl = `/audio/phonics/human_oxford/${cleanWord}.mp3?v=${AUDIO_VERSION}`;
      const fallbackUrl = `${R2_AUDIO_BASE}/alice/${cleanWord}.mp3?v=${AUDIO_VERSION}`;
      return playAudioFromUrl(wordUrl, fallbackUrl, {
        trackAsSpoken: true,
        maxTimeoutMs: 4000,
        ttsFallbackText: cleanWord,
        ttsRate: rate,
      });
    }

    if (R2_STUDIO_WORDS.has(cleanWord)) {
      const r2Url = `${R2_AUDIO_BASE}/${cleanWord}.mp3?v=${AUDIO_VERSION}`;
      return playAudioFromUrl(r2Url, undefined, {
        trackAsSpoken: true,
        maxTimeoutMs: 4000,
        ttsFallbackText: cleanWord,
        ttsRate: rate,
      });
    }

    if (ALICE_STUDIO_WORDS.has(cleanWord)) {
      const aliceUrl = `${R2_AUDIO_BASE}/alice/${cleanWord}.mp3?v=${AUDIO_VERSION}`;
      return playAudioFromUrl(aliceUrl, undefined, {
        trackAsSpoken: true,
        maxTimeoutMs: 4000,
        ttsFallbackText: cleanWord,
        ttsRate: rate,
      });
    }

    if (DEEPGRAM_STUDIO_WORDS.has(cleanWord)) {
      const deepgramUrl = `${R2_AUDIO_BASE}/deepgram/${cleanWord}.mp3?v=${AUDIO_VERSION}`;
      return playAudioFromUrl(deepgramUrl, undefined, {
        trackAsSpoken: true,
        maxTimeoutMs: 4000,
        ttsFallbackText: cleanWord,
        ttsRate: rate,
        playbackRate: 0.8,
      });
    }

    stopSpokenAudio();
    return speakWithBrowserTtsFallback(cleanWord, rate);
  }

  const slug = sentenceToAudioSlug(trimmed);
  if (ALICE_SENTENCE_SLUGS.has(slug)) {
    const sentenceUrl = `${R2_AUDIO_BASE}/alice/sentences/${slug}.mp3?v=${AUDIO_VERSION}`;
    return playAudioFromUrl(sentenceUrl, undefined, {
      trackAsSpoken: true,
      maxTimeoutMs: 12000,
      ttsFallbackText: trimmed,
      ttsRate: rate,
    });
  }

  if (DEEPGRAM_SENTENCE_SLUGS.has(slug)) {
    const deepgramSentenceUrl = `${R2_AUDIO_BASE}/deepgram/sentences/${slug}.mp3?v=${AUDIO_VERSION}`;
    return playAudioFromUrl(deepgramSentenceUrl, undefined, {
      trackAsSpoken: true,
      maxTimeoutMs: 12000,
      ttsFallbackText: trimmed,
      ttsRate: rate,
      playbackRate: 0.8,
    });
  }

  stopSpokenAudio();
  return speakWithBrowserTtsFallback(trimmed, rate);
}
