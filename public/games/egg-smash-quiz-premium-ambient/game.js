
const DEFAULT_GAME_DATA = [
  { question: '15 - 8 = ?', answers: [6, 8, 9, 7], correct: 7 },
  { question: '6 + 3 = ?', answers: [9, 7, 8, 10], correct: 9 },
  { question: '12 - 5 = ?', answers: [7, 5, 6, 8], correct: 7 },
  { question: '4 + 4 = ?', answers: [9, 8, 7, 6], correct: 8 },
  { question: '10 - 3 = ?', answers: [5, 7, 6, 8], correct: 7 },
  { question: '9 + 1 = ?', answers: [8, 10, 9, 11], correct: 10 },
  { question: '14 - 6 = ?', answers: [8, 6, 9, 7], correct: 8 },
  { question: '5 + 2 = ?', answers: [6, 7, 8, 5], correct: 7 },
  { question: '11 - 4 = ?', answers: [7, 5, 6, 8], correct: 7 },
  { question: '3 + 6 = ?', answers: [10, 8, 7, 9], correct: 9 }
];

const GAME_DATA = (typeof window !== "undefined" && window.parent && window.parent.CUSTOM_EGG_GAME_DATA) || (typeof window !== "undefined" && window.CUSTOM_GAME_DATA) || DEFAULT_GAME_DATA;
const END_MODE = (typeof window !== "undefined" && window.parent && window.parent.CUSTOM_EGG_END_MODE) || (typeof window !== "undefined" && window.CUSTOM_EGG_END_MODE) || "finish";

(() => {
  const state = {
    qIndex: 0,
    coins: 160,
    stars: 3,
    soundOn: true,
    paused: false,
    locked: false,
    finished: false,
  };

  const eggs = [...document.querySelectorAll('.egg-btn')];
  const questionCounter = document.getElementById('questionCounter');
  const questionText = document.getElementById('questionText');
  const instructionText = document.getElementById('instructionText');
  const coinValue = document.getElementById('coinValue');
  const toast = document.getElementById('toast');
  const coinBurst = document.getElementById('coinBurst');
  const effectLayer = document.getElementById('effectLayer');
  const customCursorHammer = document.getElementById('customCursorHammer');
  const pauseBtn = document.getElementById('pauseBtn');
  const soundBtn = document.getElementById('soundBtn');
  const addCoinBtn = document.getElementById('addCoinBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const resultOverlay = document.getElementById('resultOverlay');
  const resultTitle = document.getElementById('resultTitle');
  const resultDesc = document.getElementById('resultDesc');
  const resumeBtn = document.getElementById('resumeBtn');
  const nextBtn = document.getElementById('nextBtn');
  const restartBtn = document.getElementById('restartBtn');
  const stars = [...document.querySelectorAll('.star')];

  let toastTimer = null;
  let audioCtx = null;

  function currentQuestion() {
    return GAME_DATA[state.qIndex];
  }

  function speakQuestionText() {
    if (!state.soundOn) return;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const q = currentQuestion();
        const textToSpeak = q.question.replace(/-/g, ' trừ ').replace(/\+/g, ' cộng ').replace(/=/g, ' bằng ').replace(/\?/g, '');
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  }

  function ensureAudio() {
    if (!state.soundOn) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, duration = 0.12, type = 'sine', volume = 0.05, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const when = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.04);
  }

  function createNoiseBuffer(ctx, duration = 0.08) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function playPopImpact(isCorrect = true) {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Low punchy thud/pop: frequency sweep 340Hz -> 50Hz
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(isCorrect ? 340 : 180, now);
      popOsc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

      popGain.gain.setValueAtTime(0.35, now);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      popOsc.connect(popGain);
      popGain.connect(ctx.destination);
      popOsc.start(now);
      popOsc.stop(now + 0.09);

      // High crisp shell snap noise
      const buffer = createNoiseBuffer(ctx, isCorrect ? 0.05 : 0.08);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = isCorrect ? 'highpass' : 'lowpass';
      filter.frequency.setValueAtTime(isCorrect ? 2400 : 500, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(isCorrect ? 0.25 : 0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isCorrect ? 0.05 : 0.08));

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch(e) {}
  }

  function playCorrectSfx() {
    playPopImpact(true);
    const ctx = ensureAudio();
    if (!ctx) return;

    // Upbeat 6-note marimba / bell victory chime arpeggio: C5, E5, G5, C6, E6, G6
    const notes = [
      { freq: 523.25, time: 0.02, dur: 0.14, vol: 0.12 }, // C5
      { freq: 659.25, time: 0.09, dur: 0.14, vol: 0.12 }, // E5
      { freq: 783.99, time: 0.16, dur: 0.15, vol: 0.14 }, // G5
      { freq: 1046.50, time: 0.24, dur: 0.22, vol: 0.16 }, // C6
      { freq: 1318.51, time: 0.33, dur: 0.26, vol: 0.18 }, // E6
      { freq: 1567.98, time: 0.44, dur: 0.42, vol: 0.20 }  // G6 (High climax)
    ];

    notes.forEach(n => {
      // Primary marimba note (triangle)
      playTone(n.freq, n.dur, 'triangle', n.vol, n.time);
      // Bell overtone (sine, 2x freq)
      playTone(n.freq * 2, n.dur * 0.7, 'sine', n.vol * 0.4, n.time + 0.01);
    });

    // Magical glissando/chime sweep (sparkling stars effect)
    try {
      const now = ctx.currentTime;
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(1200, now + 0.20);
      sweepOsc.frequency.exponentialRampToValueAtTime(3600, now + 0.55);

      sweepGain.gain.setValueAtTime(0.001, now + 0.20);
      sweepGain.gain.linearRampToValueAtTime(0.08, now + 0.35);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.60);

      sweepOsc.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweepOsc.start(now + 0.20);
      sweepOsc.stop(now + 0.62);
    } catch(e) {}
  }

  function playWrongSfx() {
    playPopImpact(false);
    const ctx = ensureAudio();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: High warning "Uh" (G#3 - 207.65Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(207.65, now + 0.05);

      gain1.gain.setValueAtTime(0.20, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now + 0.05);
      osc1.stop(now + 0.23);

      // Note 2: Low descending "Oh no" buzzer (E3 - 164.81Hz down to 90Hz slide)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, now + 0.22);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.55);

      gain2.gain.setValueAtTime(0.25, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.60);

      // Cartoon spring wobble layer
      const springOsc = ctx.createOscillator();
      const springGain = ctx.createGain();
      springOsc.type = 'sine';
      springOsc.frequency.setValueAtTime(300, now + 0.08);
      springOsc.frequency.exponentialRampToValueAtTime(110, now + 0.45);

      springGain.gain.setValueAtTime(0.15, now + 0.08);
      springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      springOsc.connect(springGain);
      springGain.connect(ctx.destination);
      springOsc.start(now + 0.08);
      springOsc.stop(now + 0.50);
    } catch(e) {
      playTone(200, 0.2, 'sawtooth', 0.15, 0);
      playTone(130, 0.3, 'triangle', 0.15, 0.15);
    }
  }

  function playUiSfx() {
    playTone(660, 0.08, 'sine', 0.04, 0);
  }

  function showToast(msg, duration = 1100, type = 'info') {
    clearTimeout(toastTimer);
    toast.textContent = msg;
    toast.className = `toast show toast-${type}`;
    toastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, duration);
  }

  function setPaused(next) {
    state.paused = next;
    pauseOverlay.classList.toggle('hidden', !next);
  }

  function updateStars() {
    stars.forEach((star, i) => {
      star.classList.toggle('off', i >= state.stars);
    });
  }

  function renderQuestion() {
    const q = currentQuestion();
    questionCounter.textContent = `${state.qIndex + 1}/${GAME_DATA.length}`;
    questionText.textContent = q.question;
    if (instructionText) instructionText.textContent = 'Chạm vào trứng để đập! ✨';
    coinValue.textContent = state.coins;
    updateStars();
    eggs.forEach((egg, i) => {
      const label = egg.querySelector('.answer-label');
      label.textContent = q.answers[i];
      egg.setAttribute('aria-label', `Đáp án ${q.answers[i]}`);
      resetEggVisual(egg);
      egg.classList.remove('locked', 'hidden-option');
    });
    state.locked = false;
  }

  function resetEggVisual(egg) {
    egg.classList.remove('hit', 'break-correct', 'break-wrong');
    const intact = egg.querySelector('.egg-intact');
    const label = egg.querySelector('.answer-label');
    intact.style.opacity = '';
    label.style.opacity = '';
    egg.querySelectorAll('.egg-half').forEach(part => {
      part.style.opacity = '';
      part.style.transform = '';
    });
  }

  function burstCoins(targetEgg) {
    if (targetEgg && effectLayer) {
      const rect = targetEgg.getBoundingClientRect();
      const wrap = document.querySelector('.scene').getBoundingClientRect();
      const cx = rect.left - wrap.left + rect.width * 0.5;
      const cy = rect.top - wrap.top;

      const eggPop = document.createElement('div');
      eggPop.className = 'egg-coin-pop';
      eggPop.textContent = '+15 XU';
      eggPop.style.left = `${cx}px`;
      eggPop.style.top = `${cy}px`;
      effectLayer.appendChild(eggPop);
      eggPop.addEventListener('animationend', () => eggPop.remove(), { once: true });
    }

    if (coinBurst) {
      coinBurst.classList.remove('show');
      void coinBurst.offsetWidth;
      coinBurst.textContent = '+15';
      coinBurst.classList.add('show');
    }
  }

  function spawnCelebration(egg, correct = true) {
    const rect = egg.getBoundingClientRect();
    const wrap = document.querySelector('.scene').getBoundingClientRect();
    const cx = rect.left - wrap.left + rect.width / 2;
    const cy = rect.top - wrap.top + rect.height * 0.48;

    if (correct) {
      // 1. Expanding Fireworks Shockwave Ring
      const ring = document.createElement('div');
      ring.className = 'firework-ring';
      ring.style.left = `${cx}px`;
      ring.style.top = `${cy}px`;
      effectLayer.appendChild(ring);
      ring.addEventListener('animationend', () => ring.remove(), { once: true });

      // 2. Multi-color Fireworks Explosion Sparks (55 particles)
      const colors = ['#ffd700', '#ff4500', '#00e5ff', '#76ff03', '#e040fb', '#ffeb3b', '#ffffff'];
      const sparkCount = 55;
      for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        spark.className = 'firework-spark';
        spark.style.left = `${cx}px`;
        spark.style.top = `${cy}px`;
        const color = colors[i % colors.length];
        spark.style.backgroundColor = color;
        spark.style.color = color;
        const size = 6 + Math.random() * 10;
        spark.style.setProperty('--size', `${size}px`);

        const angle = (Math.PI * 2 * i / sparkCount) + (Math.random() - 0.5) * 0.3;
        const distance = 80 + Math.random() * 220;
        spark.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        spark.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        spark.style.setProperty('--dur', `${800 + Math.random() * 450}ms`);

        effectLayer.appendChild(spark);
        spark.addEventListener('animationend', () => spark.remove(), { once: true });
      }

      // 3. Floating Golden Stars
      const starSymbols = ['⭐', '✨', '🌟', '✦'];
      for (let i = 0; i < 12; i++) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        star.textContent = starSymbols[i % starSymbols.length];
        star.style.left = `${cx + (Math.random() - 0.5) * 60}px`;
        star.style.top = `${cy + (Math.random() - 0.5) * 40}px`;
        
        const dx = (Math.random() - 0.5) * 160;
        const dy = -(60 + Math.random() * 140);
        star.style.setProperty('--dx', `${dx}px`);
        star.style.setProperty('--dy', `${dy}px`);
        star.style.setProperty('--dur', `${900 + Math.random() * 500}ms`);
        star.style.setProperty('--size', `${18 + Math.random() * 16}px`);

        effectLayer.appendChild(star);
        star.addEventListener('animationend', () => star.remove(), { once: true });
      }

      // 4. Additional Sparkler Pops
      for (let i = 0; i < 6; i++) {
        const sparkPop = document.createElement('i');
        sparkPop.className = 'spark-pop';
        sparkPop.style.left = `${cx - 28 + (Math.random() - 0.5) * 120}px`;
        sparkPop.style.top = `${cy - 24 + (Math.random() - 0.5) * 90}px`;
        effectLayer.appendChild(sparkPop);
        sparkPop.addEventListener('animationend', () => sparkPop.remove(), { once: true });
      }
    } else {
      // Wrong Answer Effect: Small puff & X sparks
      const confettiCount = 10;
      for (let i = 0; i < confettiCount; i++) {
        const piece = document.createElement('i');
        piece.className = 'confetti-piece';
        piece.style.left = `${cx}px`;
        piece.style.top = `${cy}px`;
        piece.style.background = '#888888';
        const angle = (Math.PI * 2 * i / confettiCount);
        const distance = 40 + Math.random() * 50;
        piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        piece.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
        piece.style.setProperty('--rot', `${Math.random() * 360}deg`);
        piece.style.setProperty('--dur', `600ms`);
        effectLayer.appendChild(piece);
        piece.addEventListener('animationend', () => piece.remove(), { once: true });
      }
    }
  }

  function markWrongStarPenalty() {
    state.stars = Math.max(0, state.stars - 1);
    updateStars();
  }

  function openResultModal() {
    resultTitle.textContent = 'Hoàn thành rồi!';
    resultDesc.textContent = `Bé đã vượt qua ${GAME_DATA.length}/${GAME_DATA.length} câu. Tổng xu: ${state.coins}.`;
    nextBtn.textContent = 'Chơi lại từ đầu';
    resultOverlay.classList.remove('hidden');
  }

  function handleCorrect(egg) {
    state.locked = true;
    eggs.forEach(item => {
      item.classList.add('locked');
      if (item !== egg) item.classList.add('hidden-option');
    });
    egg.classList.add('break-correct');
    state.coins += 15;
    coinValue.textContent = state.coins;
    burstCoins(egg);
    showToast('✓ Đúng rồi! ✨', 1000, 'correct');
    playCorrectSfx();
    spawnCelebration(egg, true);

    setTimeout(() => {
      const isLast = state.qIndex >= GAME_DATA.length - 1;
      if (isLast && END_MODE !== "loop") {
        openResultModal();
      } else {
        nextQuestion();
      }
    }, 1000);
  }

  function handleWrong(egg) {
    state.locked = true;
    egg.classList.add('locked', 'break-wrong');
    showToast('✕ Sai rồi, thử quả khác nhé!', 1100, 'wrong');
    playWrongSfx();
    spawnCelebration(egg, false);
    markWrongStarPenalty();

    setTimeout(() => {
      resetEggVisual(egg);
      egg.classList.remove('locked');
      state.locked = false;
    }, 780);
  }

  let mouseX = 0;
  let mouseY = 0;
  let isHammerSwinging = false;

  function updateCustomHammerPos(e) {
    if (!customCursorHammer || !e) return;
    const scene = document.querySelector('.scene');
    if (!scene) return;
    const wrap = scene.getBoundingClientRect();
    if (typeof e.clientX === 'number' && e.clientX > 0) {
      mouseX = e.clientX - wrap.left;
      mouseY = e.clientY - wrap.top;
    }

    if (!isHammerSwinging) {
      customCursorHammer.style.left = `${mouseX}px`;
      customCursorHammer.style.top = `${mouseY}px`;
      customCursorHammer.classList.remove('hidden');
    }
  }

  function triggerHammerSwing() {
    if (!customCursorHammer || isHammerSwinging) return;
    isHammerSwinging = true;

    customCursorHammer.classList.remove('hidden', 'swinging');
    void customCursorHammer.offsetWidth; // Force instant reflow
    customCursorHammer.classList.add('swinging');

    const onAnimEnd = () => {
      isHammerSwinging = false;
      customCursorHammer.classList.remove('swinging');
      customCursorHammer.style.left = `${mouseX}px`;
      customCursorHammer.style.top = `${mouseY}px`;
      customCursorHammer.removeEventListener('animationend', onAnimEnd);
    };

    customCursorHammer.addEventListener('animationend', onAnimEnd, { once: true });
  }

  function onEggClick(e, egg) {
    if (state.paused || state.locked || resultOverlay && !resultOverlay.classList.contains('hidden')) return;
    playTone(800, 0.04, 'sine', 0.08, 0);
    egg.classList.remove('hit');
    void egg.offsetWidth;
    egg.classList.add('hit');

    const chosen = egg.querySelector('.answer-label').textContent.trim();
    if (String(chosen) === String(currentQuestion().correct)) {
      handleCorrect(egg);
    } else {
      handleWrong(egg);
    }
  }

  function nextQuestion() {
    resultOverlay.classList.add('hidden');
    if (state.qIndex >= GAME_DATA.length - 1) {
      restartGame();
      return;
    }
    state.qIndex += 1;
    state.stars = 3;
    renderQuestion();
    showToast('Sẵn sàng cho câu mới!', 1000);
  }

  function restartGame() {
    state.qIndex = 0;
    state.coins = 160;
    state.stars = 3;
    resultOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    renderQuestion();
    showToast('Bắt đầu lại nhé! Chạm vào trứng để đập!', 1300);
  }

  eggs.forEach(egg => {
    egg.addEventListener('pointerdown', (e) => {
      updateCustomHammerPos(e);
      triggerHammerSwing();
    });
    egg.addEventListener('click', (e) => onEggClick(e, egg));
  });

  const sceneEl = document.querySelector('.scene');
  if (sceneEl) {
    sceneEl.addEventListener('pointermove', updateCustomHammerPos);
    sceneEl.addEventListener('pointerenter', (e) => {
      updateCustomHammerPos(e);
      if (customCursorHammer) customCursorHammer.classList.remove('hidden');
    });
    sceneEl.addEventListener('pointerleave', () => {
      if (customCursorHammer && !isHammerSwinging) customCursorHammer.classList.add('hidden');
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (!resultOverlay.classList.contains('hidden')) return;
      setPaused(true);
      playUiSfx();
    });
  }
  resumeBtn.addEventListener('click', () => {
    setPaused(false);
    playUiSfx();
  });
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      state.soundOn = !state.soundOn;
      soundBtn.classList.toggle('muted', !state.soundOn);
      soundBtn.textContent = state.soundOn ? '🔊' : '🔇';
      if (state.soundOn) playUiSfx();
      showToast(state.soundOn ? 'Đã bật âm thanh' : 'Đã tắt âm thanh', 900);
    });
  }
  addCoinBtn.addEventListener('click', () => {
    state.coins += 5;
    coinValue.textContent = state.coins;
    coinBurst.textContent = '+5';
    burstCoins();
    playUiSfx();
  });
  nextBtn.addEventListener('click', nextQuestion);
  restartBtn.addEventListener('click', restartGame);
  if (questionText) {
    questionText.style.cursor = 'pointer';
    questionText.title = 'Nhấp vào đây để nghe đọc phép tính 🔊';
    questionText.addEventListener('click', speakQuestionText);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!resultOverlay.classList.contains('hidden')) return;
      setPaused(!state.paused);
      return;
    }
    if (state.paused || state.locked || !resultOverlay.classList.contains('hidden')) return;
    if (['1', '2', '3', '4'].includes(e.key)) {
      eggs[Number(e.key) - 1]?.click();
    }
  });

  renderQuestion();
  showToast('Chạm vào trứng để đập! ✨', 1400);
})();
