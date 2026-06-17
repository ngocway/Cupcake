/**
 * Programmatic audio synthesis using Web Audio API
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  return sharedAudioCtx;
}

export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Audio Context could be in suspended state due to browser autoplay policy
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // A pleasant "ting" sound: dual high notes played sequentially (perfect fifth)
    const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Dual chime notes
    playTone(523.25, now, 0.4, 0.15); // C5
    playTone(783.99, now + 0.08, 0.4, 0.15); // G5 (fifth)
  } catch (e) {
    console.error("Failed to play correct sound via AudioContext", e);
  }
}

export function playIncorrectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const duration = 0.25;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // "buzz" sound: lower frequency triangle wave
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    // Frequency sweep downwards for a classic buzz down/sad sound
    osc.frequency.linearRampToValueAtTime(100, now + duration);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.00001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.error("Failed to play incorrect sound via AudioContext", e);
  }
}
