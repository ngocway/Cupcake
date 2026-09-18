// --- Game State & Dynamic Topic Support ---
let topicId = new URLSearchParams(window.location.search).get('topicId');
let topicData = null;
let topicTitle = '';
let gameRounds = []; // Array of { roundNumber: 1, allCards: [...], targets: [...] }
let currentRoundIdx = 0;
let currentTargetIdx = 0;
let currentTarget = null;
let currentOptions = [];
let score = 0;
let correctCount = 0;
let soundOn = true;
let lockBoard = false;
let collectedCards = [];
let currentAudio = null;

// Default fallback animals if no topicId or offline
const defaultCards = [
  { id: 'cat', word: 'CAT', imageUrl: 'assets/animals/animal-cat.png', audioUrl: null },
  { id: 'dog', word: 'DOG', imageUrl: 'assets/animals/animal-dog.png', audioUrl: null },
  { id: 'monkey', word: 'MONKEY', imageUrl: 'assets/animals/animal-monkey.png', audioUrl: null },
  { id: 'chicken', word: 'CHICKEN', imageUrl: 'assets/animals/animal-chicken.png', audioUrl: null }
];

// Tree Slots
const slotSets = {
  1: ['slot-2'],
  2: ['slot-2', 'slot-3'],
  3: ['slot-0', 'slot-2', 'slot-3'],
  4: ['slot-0', 'slot-1', 'slot-2', 'slot-3']
};

// DOM References
const cardsLayer = document.getElementById('cardsLayer');
const promptWord = document.getElementById('promptWord');
const plaqueWrap = document.getElementById('plaqueWrap');
const scoreValue = document.getElementById('scoreValue');
const confettiLayer = document.getElementById('confettiLayer');
const answerArea = document.querySelector('.answer-area');
const basketCardsStack = document.getElementById('basketCardsStack');
const finishModal = document.getElementById('finishModal');
const finishTitle = document.getElementById('finishTitle');
const finishSubtitle = document.getElementById('finishSubtitle');
const finalScore = document.getElementById('finalScore');
const soundButton = document.getElementById('soundButton');
const soundIcon = document.getElementById('soundIcon');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');
const roundTransitionOverlay = document.getElementById('roundTransitionOverlay');
const roundTransitionText = document.getElementById('roundTransitionText');
const slashCanvas = document.getElementById('slashCanvas');
const slashSparksLayer = document.getElementById('slashSparksLayer');
const slashCtx = slashCanvas ? slashCanvas.getContext('2d') : null;

// --- Web Audio Synthesizer ---
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSlashSound() {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {}
}

function playSnapSound() {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (e) {}
}

function playSuccessSound() {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.28, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.36);
    });
  } catch (e) {}
}

function playBasketPlopSound() {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  } catch (e) {}
}

function playWrongSound() {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.32);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.33);
  } catch (e) {}
}

function playRoundFanfareSound() {
  if (!soundOn) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.52);
    });
  } catch (e) {}
}

// --- Voice Pronunciation (Custom Audio & TTS) ---
function speak(text) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
}

function playWordAudio(card) {
  if (!soundOn || !card) return;

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }

  if (card.audioUrl) {
    try {
      currentAudio = new Audio(card.audioUrl);
      currentAudio.play().catch(() => {
        speak(card.word);
      });
      return;
    } catch (e) {
      speak(card.word);
    }
  } else {
    speak(card.word);
  }
}

// --- Visual Sparks & Cut FX ---
function spawnCutSparks(x, y, angle = 0) {
  if (!slashSparksLayer) return;

  const flash = document.createElement('div');
  flash.className = 'cut-flash';
  flash.style.left = `${x}px`;
  flash.style.top = `${y}px`;
  flash.style.width = '90px';
  flash.style.setProperty('--rot', `${angle}deg`);
  slashSparksLayer.appendChild(flash);
  setTimeout(() => flash.remove(), 380);

  for (let i = 0; i < 14; i++) {
    const spark = document.createElement('div');
    spark.className = 'slash-spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    const a = Math.random() * Math.PI * 2;
    const dist = 25 + Math.random() * 55;
    spark.style.setProperty('--sx', `${Math.cos(a) * dist}px`);
    spark.style.setProperty('--sy', `${Math.sin(a) * dist}px`);
    slashSparksLayer.appendChild(spark);
    setTimeout(() => spark.remove(), 420);
  }
}

function launchConfetti(originX, originY) {
  if (!confettiLayer) return;
  const colors = ['#ffd23c', '#ff6a6a', '#53d6ff', '#8ef070', '#ff9de1'];
  for (let i = 0; i < 22; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--dx-start', '0px');
    piece.style.setProperty('--dy-start', '0px');
    piece.style.setProperty('--dx-end', `${(Math.random() - 0.5) * 260}px`);
    piece.style.setProperty('--dy-end', `${(Math.random() * -160) - 50}px`);
    piece.style.setProperty('--rot', `${(Math.random() - 0.5) * 540}deg`);
    confettiLayer.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

// --- Shuffle & Game Rounds Construction ---
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setupDefaultRounds() {
  gameRounds = [
    {
      roundNumber: 1,
      allCards: defaultCards,
      targets: shuffle([...defaultCards, ...defaultCards])
    }
  ];
}

function setupDynamicRounds(cards) {
  const validCards = cards.filter(c => c && (c.word || c.imageUrl));
  if (validCards.length === 0) {
    setupDefaultRounds();
    return;
  }

  // Group by roundIndex (0 => Vòng 1, 1 => Vòng 2...)
  const groupMap = new Map();
  validCards.forEach((c) => {
    const r = c.roundIndex !== undefined && c.roundIndex !== null ? Number(c.roundIndex) : 0;
    if (!groupMap.has(r)) groupMap.set(r, []);
    groupMap.get(r).push({
      id: c.id || Math.random().toString(36).substring(2),
      word: (c.word || '').trim().toUpperCase(),
      imageUrl: c.imageUrl || 'assets/cards/card-frame-hanging.png',
      audioUrl: c.audioUrl || null
    });
  });

  const sortedRoundKeys = Array.from(groupMap.keys()).sort((a, b) => a - b);
  gameRounds = sortedRoundKeys.map((rKey, index) => {
    const roundCards = groupMap.get(rKey);
    return {
      roundNumber: index + 1,
      allCards: roundCards,
      targets: shuffle([...roundCards])
    };
  });

  if (gameRounds.length === 0) {
    setupDefaultRounds();
  }
}

async function loadGameData() {
  if (topicId) {
    try {
      const res = await fetch(`/api/games/flashcard-match/${topicId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.cards) && json.cards.length > 0) {
          topicData = json;
          topicTitle = json.topicName || '';
          setupDynamicRounds(json.cards);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to load topic from API, using fallback:', err);
    }
  }
  setupDefaultRounds();
}

const letterPalette = [
  { color: '#0088ff', shadow: '#0055b3' }, // Vibrant Blue
  { color: '#ff1493', shadow: '#b30062' }, // Hot Pink
  { color: '#00c853', shadow: '#007e33' }, // Fresh Green
  { color: '#ff9100', shadow: '#b35e00' }, // Orange Gold
  { color: '#9c27b0', shadow: '#6a0080' }, // Purple
  { color: '#e91e63', shadow: '#990033' }, // Berry
  { color: '#00bcd4', shadow: '#006978' }, // Cyan
  { color: '#ff5722', shadow: '#b21000' }  // Coral Red
];

function render3DPromptWord(word) {
  if (!promptWord) return;
  promptWord.innerHTML = '';
  const text = (word || '').toUpperCase();

  // Dynamic font sizing for longer words
  if (text.length > 8) {
    promptWord.style.fontSize = 'clamp(10px, 1.25vw, 22px)';
  } else if (text.length > 5) {
    promptWord.style.fontSize = 'clamp(12px, 1.55vw, 28px)';
  } else {
    promptWord.style.fontSize = 'clamp(14px, 1.8vw, 36px)';
  }

  const letters = text.split('');
  letters.forEach((char, index) => {
    const span = document.createElement('span');
    span.className = 'letter-3d';
    span.textContent = char;
    const item = letterPalette[index % letterPalette.length];
    span.style.setProperty('--letter-color', item.color);
    span.style.setProperty('--letter-shadow', item.shadow);
    promptWord.appendChild(span);
  });
}

function updateScore() {
  if (scoreValue) scoreValue.textContent = score;
}

// --- Render Current Turn Cards ---
function renderCurrentTurn() {
  const currentRound = gameRounds[currentRoundIdx];
  if (!currentRound || currentTargetIdx >= currentRound.targets.length) {
    finishGame();
    return;
  }

  currentTarget = currentRound.targets[currentTargetIdx];
  render3DPromptWord(currentTarget.word);
  cardsLayer.innerHTML = '';

  // Options selection
  let options = [];
  if (currentRound.allCards.length <= 4) {
    // Phương án A: Treo đúng số thẻ hiện có (2, 3 hoặc 4 thẻ)
    options = shuffle([...currentRound.allCards]);
  } else {
    // Từ 4 thẻ trở lên: 1 đúng + 3 gây nhiễu
    const distractors = shuffle(currentRound.allCards.filter(c => c.id !== currentTarget.id)).slice(0, 3);
    options = shuffle([currentTarget, ...distractors]);
  }
  currentOptions = options;

  const count = options.length;
  const assignedSlots = slotSets[count] || slotSets[4];

  options.forEach((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `card-button ${assignedSlots[index]}`;
    button.dataset.cardId = card.id;
    button.setAttribute('aria-label', `Cut rope for ${card.word}`);

    button.innerHTML = `
      <img class="card-frame" src="assets/cards/card-frame-hanging.png" alt="" />
      <img class="card-animal" src="${card.imageUrl}" alt="${card.word}" />
    `;

    // Tự động co hẹp chiều ngang khung gỗ theo tỉ lệ ảnh (Cách 1)
    const animalImg = button.querySelector('.card-animal');
    if (animalImg) {
      const applyRatio = () => {
        const nw = animalImg.naturalWidth;
        const nh = animalImg.naturalHeight;
        if (nw && nh) {
          const ratio = nw / nh;
          const baseRatio = 1.35;
          const factor = Math.max(0.72, Math.min(1.0, ratio / baseRatio));
          button.style.setProperty('--card-scale-w', factor.toFixed(3));
          button.dataset.scaleW = factor.toFixed(3);
        }
      };

      if (animalImg.complete && animalImg.naturalWidth) {
        applyRatio();
      } else {
        animalImg.addEventListener('load', applyRatio);
      }
    }

    cardsLayer.appendChild(button);
  });

  // Thông báo cho trang cha biết các khung đã xuất hiện đầy đủ trên cây
  try {
    window.parent.postMessage({ type: 'CUT_ROPE_READY' }, '*');
  } catch (e) {}

  // Phát âm thanh khi đổi từ mới (với delay nhẹ để hoạt ảnh xuất hiện)
  setTimeout(() => {
    playWordAudio(currentTarget);
  }, 260);
}

// --- Cutting Logic ---
function cutCard(button, cardId, cutX, cutY, angle = 0) {
  if (lockBoard) return;
  if (button.classList.contains('cut')) return;

  button.classList.add('cut');
  spawnCutSparks(cutX, cutY, angle);
  playSnapSound();

  // Tạo mẩu dây thừng bị cắt đứt còn dính lại đung đưa trên cành cây
  const slotMatch = button.className.match(/slot-\d/);
  const slotClass = slotMatch ? slotMatch[0] : 'slot-0';
  const scaleW = button.dataset.scaleW || '1';

  const ropeStub = document.createElement('div');
  ropeStub.className = `rope-stub ${slotClass}`;
  ropeStub.style.setProperty('--card-scale-w', scaleW);
  ropeStub.innerHTML = `<img class="card-frame" src="assets/cards/card-frame-hanging.png" alt="" />`;
  cardsLayer.appendChild(ropeStub);

  const sceneRect = document.getElementById('gameScene').getBoundingClientRect();
  const bRect = button.getBoundingClientRect();
  const basketRect = answerArea.getBoundingClientRect();

  if (cardId === currentTarget.id) {
    // === ĐÁP ÁN ĐÚNG: BAY VÀO LÒNG GIỎ ===
    lockBoard = true;
    correctCount += 1;
    score += 20;
    updateScore();

    const stackConfigs = [
      { left: '11%', rot: -7, bottom: '8%' },
      { left: '26%', rot: -2, bottom: '15%' },
      { left: '41%', rot: 3, bottom: '13%' },
      { left: '54%', rot: 7, bottom: '9%' }
    ];
    const cfg = stackConfigs[collectedCards.length % stackConfigs.length];
    collectedCards.push(cardId);

    // Tạo thẻ mini bên trong basketCardsStack với cùng tỉ lệ khung
    const scaleW = button.dataset.scaleW || '1';
    const miniCard = document.createElement('div');
    miniCard.className = 'basket-mini-card';
    miniCard.style.left = cfg.left;
    miniCard.style.bottom = cfg.bottom;
    miniCard.style.setProperty('--card-rot', `${cfg.rot}deg`);
    miniCard.style.setProperty('--mini-scale-w', scaleW);
    miniCard.innerHTML = `
      <img src="assets/cards/card-frame-mini.png" alt="" class="mini-frame-img" />
      <img src="${currentTarget.imageUrl}" alt="${currentTarget.word}" class="mini-animal-img" />
    `;
    basketCardsStack.appendChild(miniCard);

    // Tính toán chuyển động từ cành cây vào giỏ
    const targetRect = miniCard.getBoundingClientRect();
    const frameStartX = bRect.left + bRect.width * 0.5;
    const frameStartY = bRect.top + bRect.height * 0.77;
    const frameTargetX = targetRect.left + targetRect.width * 0.5;
    const frameTargetY = targetRect.top + targetRect.height * 0.5;

    const dx = frameStartX - frameTargetX;
    const dy = frameStartY - frameTargetY;
    const initialScale = (bRect.width * 0.98) / (targetRect.width || 1);

    button.remove();

    miniCard.style.transform = `translate(${dx}px, ${dy}px) scale(${initialScale}) rotate(0deg)`;
    miniCard.style.transition = 'none';

    void miniCard.offsetWidth;

    miniCard.style.transition = 'transform 0.72s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    miniCard.style.transform = `translate(0px, 0px) scale(1) rotate(${cfg.rot}deg)`;

    setTimeout(() => {
      playSuccessSound();
      playBasketPlopSound();
      // Phát âm thanh khi học sinh cắt đáp án đúng
      playWordAudio(currentTarget);

      answerArea.classList.remove('bounce');
      void answerArea.offsetWidth;
      answerArea.classList.add('bounce');

      if (promptWord) {
        promptWord.classList.add('gold-glow');
        setTimeout(() => promptWord.classList.remove('gold-glow'), 700);
      }

      launchConfetti(basketRect.left - sceneRect.left + basketRect.width / 2, basketRect.top - sceneRect.top + basketRect.height * 0.15);

      miniCard.style.transition = '';
    }, 720);

    setTimeout(() => nextTarget(), 1450);
  } else {
    // === ĐÁP ÁN SAI: DÂY ĐỨT, RƠI TRƯỢT RA NGOÀI ===
    score = Math.max(0, score - 5);
    updateScore();
    playWrongSound();

    const isLeft = (bRect.left - sceneRect.left) < sceneRect.width / 2;
    const targetX = isLeft ? -130 - Math.random() * 80 : 130 + Math.random() * 80;
    const targetY = sceneRect.height - (bRect.top - sceneRect.top) + 80;
    const targetRot = isLeft ? -38 : 38;

    button.style.setProperty('--target-x', `${targetX}px`);
    button.style.setProperty('--target-y', `${targetY}px`);
    button.style.setProperty('--target-rot', `${targetRot}deg`);
    button.classList.add('falling-wrong');

    setTimeout(() => {
      button.remove();
    }, 820);
  }
}

// --- Progression & Round Transitions ---
function nextTarget() {
  currentTargetIdx += 1;
  const currentRound = gameRounds[currentRoundIdx];

  if (currentTargetIdx < currentRound.targets.length) {
    lockBoard = false;
    renderCurrentTurn();
  } else {
    // Hết toàn bộ các thẻ của vòng hiện tại
    currentRoundIdx += 1;
    if (currentRoundIdx < gameRounds.length) {
      showRoundTransition(gameRounds[currentRoundIdx].roundNumber);
    } else {
      finishGame();
    }
  }
}

function showRoundTransition(nextRoundNumber) {
  if (roundTransitionOverlay) {
    roundTransitionText.textContent = `VÒNG ${nextRoundNumber}`;
    roundTransitionOverlay.classList.remove('hidden');
  }
  playRoundFanfareSound();

  // Dọn trống giỏ để chuẩn bị hứng các thẻ mới của Vòng mới
  if (basketCardsStack) {
    basketCardsStack.innerHTML = '';
  }
  collectedCards = [];

  setTimeout(() => {
    if (roundTransitionOverlay) {
      roundTransitionOverlay.classList.add('hidden');
    }
    currentTargetIdx = 0;
    lockBoard = false;
    renderCurrentTurn();
  }, 1600);
}

function finishGame() {
  if (finalScore) finalScore.textContent = score;
  if (finishTitle) {
    finishTitle.textContent = topicTitle ? topicTitle : 'Tuyệt vời!';
  }
  if (finishSubtitle) {
    finishSubtitle.textContent = 'Bạn đã hoàn thành bài tập.';
  }
  if (finishModal) finishModal.classList.remove('hidden');
  speak('Great job! You finished the game.');
}

// --- Slash / Blade Trail Canvas (Fruit Ninja Mechanic) ---
let slashPoints = [];
let isPointerDown = false;

function resizeSlashCanvas() {
  if (!slashCanvas) return;
  const rect = slashCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  slashCanvas.width = rect.width * dpr;
  slashCanvas.height = rect.height * dpr;
  if (slashCtx) {
    slashCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
window.addEventListener('resize', resizeSlashCanvas);

function addSlashPoint(x, y) {
  const now = performance.now();
  slashPoints.push({ x, y, time: now });
  checkPointCut(x, y);
}

function renderSlashTrail() {
  if (!slashCtx || !slashCanvas) return;
  const rect = slashCanvas.getBoundingClientRect();
  slashCtx.clearRect(0, 0, rect.width, rect.height);

  const now = performance.now();
  const maxAge = 140; // ms
  slashPoints = slashPoints.filter(p => now - p.time <= maxAge);

  if (slashPoints.length > 1) {
    for (let i = 1; i < slashPoints.length; i++) {
      const p0 = slashPoints[i - 1];
      const p1 = slashPoints[i];
      const age = now - p1.time;
      const life = Math.max(0, 1 - age / maxAge);

      // Outer Cyan Blade Glow
      slashCtx.beginPath();
      slashCtx.moveTo(p0.x, p0.y);
      slashCtx.lineTo(p1.x, p1.y);
      slashCtx.strokeStyle = `rgba(0, 240, 255, ${life * 0.75})`;
      slashCtx.lineWidth = 14 * life;
      slashCtx.lineCap = 'round';
      slashCtx.lineJoin = 'round';
      slashCtx.stroke();

      // Sharp Core White Blade
      slashCtx.beginPath();
      slashCtx.moveTo(p0.x, p0.y);
      slashCtx.lineTo(p1.x, p1.y);
      slashCtx.strokeStyle = `rgba(255, 255, 255, ${life * 0.95})`;
      slashCtx.lineWidth = 5 * life;
      slashCtx.lineCap = 'round';
      slashCtx.lineJoin = 'round';
      slashCtx.stroke();
    }

    // Glowing Blade Tip Spark at cursor head
    const tip = slashPoints[slashPoints.length - 1];
    slashCtx.beginPath();
    slashCtx.arc(tip.x, tip.y, 4.5, 0, Math.PI * 2);
    slashCtx.fillStyle = '#ffffff';
    slashCtx.shadowColor = '#00f0ff';
    slashCtx.shadowBlur = 16;
    slashCtx.fill();
    slashCtx.shadowBlur = 0;
  }

  requestAnimationFrame(renderSlashTrail);
}

function checkPointCut(x, y) {
  if (lockBoard) return;
  const sceneRect = document.getElementById('gameScene').getBoundingClientRect();
  const cardButtons = cardsLayer.querySelectorAll('.card-button:not(.cut)');

  cardButtons.forEach(button => {
    const bRect = button.getBoundingClientRect();
    const minX = bRect.left - sceneRect.left;
    const maxX = bRect.right - sceneRect.left;
    const minY = bRect.top - sceneRect.top;
    const maxY = bRect.bottom - sceneRect.top;

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      const ropeX = minX + bRect.width * 0.5;
      const ropeY = minY + bRect.height * 0.28;
      cutCard(button, button.dataset.cardId, ropeX, ropeY, 0);
    }
  });
}

if (slashCanvas) {
  const getScenePos = (e) => {
    const rect = slashCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  slashCanvas.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    try { slashCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    getAudioContext();
    playSlashSound();
    const p = getScenePos(e);
    slashPoints = [{ x: p.x, y: p.y, time: performance.now() }];
    checkPointCut(p.x, p.y);
  });

  slashCanvas.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return;
    const p = getScenePos(e);
    addSlashPoint(p.x, p.y);
  });

  const endPointer = () => { isPointerDown = false; };
  slashCanvas.addEventListener('pointerup', endPointer);
  slashCanvas.addEventListener('pointercancel', endPointer);
  slashCanvas.addEventListener('pointerleave', endPointer);
}

// --- Plaque Wrap: Click to replay pronunciation ---
if (plaqueWrap) {
  plaqueWrap.addEventListener('click', () => {
    if (currentTarget) {
      playWordAudio(currentTarget);
      plaqueWrap.style.transform = 'translateX(-50%) scale(1.08)';
      setTimeout(() => {
        plaqueWrap.style.transform = '';
      }, 220);
    }
  });
}

// --- Sound Toggle, Restart & Exit ---
if (soundButton) {
  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    soundIcon.src = soundOn ? 'assets/ui/sound-on.png' : 'assets/ui/sound-off.png';
    soundIcon.alt = soundOn ? 'Sound on' : 'Sound off';
    if (!soundOn) {
      if (currentAudio) {
        try { currentAudio.pause(); } catch(e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      if (currentTarget) playWordAudio(currentTarget);
    }
  });
}

if (restartButton) {
  restartButton.addEventListener('click', () => {
    finishModal.classList.add('hidden');
    startGame();
  });
}

if (exitButton) {
  exitButton.addEventListener('click', () => {
    try {
      window.parent.postMessage({ type: 'CUT_ROPE_EXIT' }, '*');
    } catch (e) {}
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/teacher';
    }
  });
}

// Support postMessage from parent wrapper if topic data is passed directly
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_GAME_DATA' && event.data.topicData) {
    const data = event.data.topicData;
    if (data.cards && data.cards.length > 0) {
      topicTitle = data.topicName || '';
      setupDynamicRounds(data.cards);
      startGame();
    }
  }
});

function startGame() {
  currentRoundIdx = 0;
  currentTargetIdx = 0;
  score = 0;
  correctCount = 0;
  lockBoard = false;
  collectedCards = [];
  if (basketCardsStack) basketCardsStack.innerHTML = '';
  updateScore();
  renderCurrentTurn();
}

let gameStarted = false;

async function initGame() {
  if (gameStarted) return;
  gameStarted = true;
  resizeSlashCanvas();
  requestAnimationFrame(renderSlashTrail);
  await loadGameData();
  startGame();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

window.addEventListener('load', () => {
  resizeSlashCanvas();
  if (!gameStarted) initGame();
});
