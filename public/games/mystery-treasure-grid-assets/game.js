const QUESTIONS = [
  { q: "Which animal says 'meow'?", answers: ["Dog", "Cat", "Fish", "Bird"], correct: 1 },
  { q: "What color is a ripe banana?", answers: ["Blue", "Yellow", "Purple", "Black"], correct: 1 },
  { q: "How many days are in a week?", answers: ["5", "6", "7", "8"], correct: 2 },
  { q: "Which planet do we live on?", answers: ["Mars", "Jupiter", "Earth", "Venus"], correct: 2 },
  { q: "Which shape has three sides?", answers: ["Circle", "Triangle", "Square", "Rectangle"], correct: 1 },
  { q: "What do bees make?", answers: ["Milk", "Honey", "Bread", "Juice"], correct: 1 },
  { q: "What is 5 + 3?", answers: ["7", "8", "9", "10"], correct: 1 },
  { q: "Which season is the hottest?", answers: ["Winter", "Spring", "Summer", "Autumn"], correct: 2 },
  { q: "What do plants need to grow?", answers: ["Sunlight", "Plastic", "Sandpaper", "Smoke"], correct: 0 },
  { q: "Which one is a fruit?", answers: ["Carrot", "Potato", "Apple", "Onion"], correct: 2 },
  { q: "How many legs does a spider have?", answers: ["6", "8", "10", "12"], correct: 1 },
  { q: "Which one can fly?", answers: ["Rock", "Boat", "Bird", "Chair"], correct: 2 },
  { q: "What color do you get from red + yellow?", answers: ["Orange", "Green", "Blue", "Pink"], correct: 0 },
  { q: "Which is used to tell time?", answers: ["Clock", "Spoon", "Pillow", "Ball"], correct: 0 },
  { q: "How many months are in one year?", answers: ["10", "11", "12", "13"], correct: 2 },
  { q: "Which place has lots of books?", answers: ["Zoo", "Library", "Kitchen", "Beach"], correct: 1 }
];

const TILE_COLORS = [
  'tile-red', 'tile-yellow', 'tile-green', 'tile-blue',
  'tile-purple', 'tile-blue', 'tile-red', 'tile-yellow',
  'tile-green', 'tile-yellow', 'tile-purple', 'tile-blue',
  'tile-red', 'tile-blue', 'tile-green', 'tile-purple'
];

const state = {
  solved: new Set(),
  score: 0,
  currentTile: null,
  timer: 31,
  timerId: null,
  soundOn: true,
  audioCtx: null,
  revealedSlots: 0,
};

const stage = document.getElementById('game-stage');
const tileGrid = document.getElementById('tileGrid');
const slotGrid = document.getElementById('slotGrid');
const questionModal = document.getElementById('questionModal');
const questionTitle = document.getElementById('questionTitle');
const questionIndex = document.getElementById('questionIndex');
const answerList = document.getElementById('answerList');
const scoreValue = document.getElementById('scoreValue');
const timerValue = document.getElementById('timerValue');
const leftCounterText = document.getElementById('leftCounterText');
const progressText = document.getElementById('progressText');
const finishOverlay = document.getElementById('finishOverlay');
const finishScore = document.getElementById('finishScore');
const particlesLayer = document.getElementById('particlesLayer');
const chestWrap = document.getElementById('chestWrap');
const soundBtn = document.getElementById('soundBtn');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const skipCloseBtn = document.getElementById('skipCloseBtn');

function setScale() {
  const shell = document.getElementById('game-shell');
  const vw = shell.clientWidth;
  const vh = shell.clientHeight;
  const scale = Math.min(vw / 1672, vh / 941);
  stage.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', setScale);
setScale();

function buildTiles() {
  tileGrid.innerHTML = '';
  QUESTIONS.forEach((_, index) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.dataset.index = String(index);
    tile.innerHTML = `
      <img class="tile-img" src="assets/webp/${TILE_COLORS[index]}.webp" alt="" />
      <span class="tile-number">${index + 1}</span>
      <span class="tile-overlay"></span>
    `;
    tile.addEventListener('click', () => openQuestion(index));
    tileGrid.appendChild(tile);
  });
}

function buildSlots() {
  slotGrid.innerHTML = '';
  for (let i = 0; i < 16; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = String(i);
    slotGrid.appendChild(slot);
  }
}

function updateCounters() {
  const count = state.solved.size;
  leftCounterText.textContent = `${count} / 16`;
  progressText.textContent = `${count} / 16 CODES`;
  scoreValue.textContent = `${state.score} pts`;
}

function formatTimer(n) {
  return `00:${String(n).padStart(2, '0')}`;
}

function updateTimer() {
  timerValue.textContent = formatTimer(state.timer);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer(onExpire) {
  stopTimer();
  state.timer = 31;
  updateTimer();
  state.timerId = setInterval(() => {
    state.timer -= 1;
    updateTimer();
    if (state.timer <= 0) {
      stopTimer();
      if (typeof onExpire === 'function') onExpire();
    }
  }, 1000);
}

function openQuestion(index) {
  if (state.solved.has(index)) return;
  state.currentTile = index;
  const question = QUESTIONS[index];
  questionIndex.textContent = `Tile ${index + 1}`;
  questionTitle.textContent = question.q;
  answerList.innerHTML = '';
  question.answers.forEach((answer, answerIndex) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = answer;
    btn.addEventListener('click', () => chooseAnswer(answerIndex, btn));
    answerList.appendChild(btn);
  });
  questionModal.classList.remove('hidden');
  startTimer(() => expireQuestion());
  playTone('open');
}

function closeQuestion() {
  questionModal.classList.add('hidden');
  stopTimer();
  state.currentTile = null;
  updateTimer();
}

function expireQuestion() {
  if (state.currentTile == null) return;
  const tileEl = getTileEl(state.currentTile);
  markTileWrong(tileEl);
  burstX(tileEl);
  playTone('wrong');
  closeQuestion();
}

function chooseAnswer(answerIndex, btn) {
  if (state.currentTile == null) return;
  const question = QUESTIONS[state.currentTile];
  if (answerIndex === question.correct) {
    btn.classList.add('correct');
    disableAnswers();
    stopTimer();
    window.setTimeout(() => solveCurrentTile(), 360);
  } else {
    btn.classList.add('wrong', 'disabled');
    btn.disabled = true;
    const tileEl = getTileEl(state.currentTile);
    markTileWrong(tileEl);
    burstX(tileEl);
    playTone('wrong');
  }
}

function disableAnswers() {
  [...answerList.children].forEach((child) => {
    child.classList.add('disabled');
    child.disabled = true;
  });
}

function getTileEl(index) {
  return tileGrid.querySelector(`.tile[data-index="${index}"]`);
}

function markTileWrong(tileEl) {
  tileEl.classList.remove('wrong-shake');
  tileEl.classList.add('wrong-flash');
  void tileEl.offsetWidth;
  tileEl.classList.add('wrong-shake');
  window.setTimeout(() => {
    tileEl.classList.remove('wrong-shake', 'wrong-flash');
  }, 650);
}

function solveCurrentTile() {
  const index = state.currentTile;
  if (index == null || state.solved.has(index)) return;
  state.solved.add(index);
  state.score += 10;
  const tileEl = getTileEl(index);
  tileEl.classList.remove('wrong-flash', 'wrong-shake');
  tileEl.classList.add('solved', 'correct', 'locked', 'correct-pop');
  tileEl.disabled = true;
  tileEl.style.pointerEvents = 'none';
  const slot = slotGrid.children[state.revealedSlots];
  if (slot) {
    slot.classList.add('filled', 'spark');
    window.setTimeout(() => slot.classList.remove('spark'), 720);
  }
  state.revealedSlots += 1;
  updateCounters();
  burstStars(tileEl);
  floatScore(tileEl, '+10');
  chestWrap.classList.remove('celebrate');
  void chestWrap.offsetWidth;
  chestWrap.classList.add('celebrate');
  if (state.solved.size === 16) {
    chestWrap.classList.add('mega');
    window.setTimeout(() => chestWrap.classList.remove('mega'), 1850);
  } else {
    window.setTimeout(() => chestWrap.classList.remove('celebrate'), 820);
  }
  playTone('correct');
  closeQuestion();
  if (state.solved.size === 16) {
    window.setTimeout(showFinish, 800);
  }
}

function burstStars(tileEl) {
  const rect = tileEl.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const cx = rect.left - stageRect.left + rect.width / 2;
  const cy = rect.top - stageRect.top + rect.height / 2;
  const colors = ['#ffd94b', '#fff6c4', '#79f86c', '#38d0ff', '#ffa3d2'];
  for (let i = 0; i < 16; i += 1) {
    const p = document.createElement('div');
    p.className = `particle ${i % 3 === 0 ? 'star' : ''}`.trim();
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.background = colors[i % colors.length];
    p.style.color = colors[i % colors.length];
    const angle = (Math.PI * 2 * i) / 16;
    const distance = 40 + Math.random() * 80;
    p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * distance - 20}px`);
    p.style.setProperty('--rot', `${(Math.random() * 260 - 130).toFixed(0)}deg`);
    particlesLayer.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

function burstX(tileEl) {
  const rect = tileEl.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const cx = rect.left - stageRect.left + rect.width / 2;
  const cy = rect.top - stageRect.top + rect.height / 2;
  for (let i = 0; i < 6; i += 1) {
    const p = document.createElement('div');
    p.className = 'particle xmark';
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.color = '#ff5a70';
    const angle = -Math.PI / 2 + (Math.random() * 1.2 - 0.6);
    const distance = 25 + Math.random() * 50;
    p.style.setProperty('--dx', `${Math.cos(angle) * distance + (Math.random() * 24 - 12)}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * distance - 20}px`);
    p.style.setProperty('--rot', `${(Math.random() * 120 - 60).toFixed(0)}deg`);
    particlesLayer.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

function floatScore(tileEl, text) {
  const rect = tileEl.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'particle score-float';
  p.textContent = text;
  p.style.left = `${rect.left - stageRect.left + rect.width * 0.35}px`;
  p.style.top = `${rect.top - stageRect.top + 10}px`;
  particlesLayer.appendChild(p);
  p.addEventListener('animationend', () => p.remove(), { once: true });
}

function showFinish() {
  finishScore.textContent = `Final Score: ${state.score} pts`;
  finishOverlay.classList.remove('hidden');
  playTone('win');
  for (let i = 0; i < 50; i += 1) {
    const p = document.createElement('div');
    p.className = `particle ${i % 4 === 0 ? 'star' : ''}`.trim();
    p.style.left = `${250 + Math.random() * 1150}px`;
    p.style.top = `${180 + Math.random() * 160}px`;
    const palette = ['#ffd94b','#79f86c','#38d0ff','#ff8bd5','#fff'];
    p.style.background = palette[i % palette.length];
    p.style.color = palette[i % palette.length];
    p.style.setProperty('--dx', `${(Math.random() * 460 - 230).toFixed(0)}px`);
    p.style.setProperty('--dy', `${(Math.random() * 280 - 140).toFixed(0)}px`);
    p.style.setProperty('--rot', `${(Math.random() * 360 - 180).toFixed(0)}deg`);
    particlesLayer.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

function resetGame() {
  stopTimer();
  state.solved.clear();
  state.score = 0;
  state.currentTile = null;
  state.timer = 31;
  state.revealedSlots = 0;
  [...tileGrid.children].forEach((tile) => {
    tile.className = 'tile';
    tile.disabled = false;
    tile.style.pointerEvents = 'auto';
  });
  [...slotGrid.children].forEach((slot) => slot.className = 'slot');
  finishOverlay.classList.add('hidden');
  questionModal.classList.add('hidden');
  chestWrap.classList.remove('celebrate', 'mega');
  updateCounters();
  updateTimer();
  particlesLayer.innerHTML = '';
}

function ensureAudio() {
  if (!state.soundOn) return null;
  if (!state.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    state.audioCtx = new Ctx();
  }
  return state.audioCtx;
}

function note(freq, time, type = 'sine', gainValue = 0.04, delay = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + time);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + time + 0.02);
}

function playTone(kind) {
  if (!state.soundOn) return;
  switch (kind) {
    case 'open':
      note(660, 0.11, 'triangle', 0.03);
      note(880, 0.11, 'triangle', 0.028, 0.06);
      break;
    case 'correct':
      note(523.25, 0.15, 'triangle', 0.04);
      note(659.25, 0.15, 'triangle', 0.04, 0.07);
      note(783.99, 0.18, 'triangle', 0.04, 0.14);
      break;
    case 'wrong':
      note(280, 0.18, 'sawtooth', 0.028);
      note(220, 0.20, 'sawtooth', 0.024, 0.08);
      break;
    case 'win':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, 0.22, 'triangle', 0.04, i * 0.08));
      break;
  }
}

soundBtn.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  soundBtn.classList.toggle('sound-off', !state.soundOn);
  if (state.soundOn) playTone('open');
});
restartBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);
skipCloseBtn.addEventListener('click', closeQuestion);
backBtn.addEventListener('click', () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    alert('Back to Games button clicked. Replace this with your own navigation.');
  }
});
finishOverlay.addEventListener('click', (e) => {
  if (e.target === finishOverlay) finishOverlay.classList.add('hidden');
});
questionModal.addEventListener('click', (e) => {
  if (e.target === questionModal) closeQuestion();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!questionModal.classList.contains('hidden')) closeQuestion();
  }
});

buildTiles();
buildSlots();
resetGame();
