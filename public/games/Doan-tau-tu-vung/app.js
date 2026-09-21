'use strict';

// Bộ chọn phần tử tiện ích
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Cấu hình màu sắc cho các toa tàu
const wagonColors = ['yellow', 'teal', 'coral', 'purple'];

// Trạng thái của game
let currentStationIndex = 0;
let activePairs = [];
let selectedWordId = null;
let matchedSet = new Set();
let isMoving = false; // Khi tàu đang vào ga hoặc rời ga
let departureTimer = null;
let audioCtx = null;

// Khởi tạo AudioContext khi người dùng tương tác
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Bộ tạo âm thanh Web Audio
function playSoundTone(freq, type = 'sine', duration = 0.15, delay = 0, gainLevel = 0.12) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + delay;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {}
}

// Âm thanh gõ khối gỗ mộc Montessori giòn tan
function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.055);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);

    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1150, now);
    clickGain.gain.setValueAtTime(0.09, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.02);
  } catch (err) {}
}

// Hợp âm chuông ngân reo vui khi ghép đúng
function playCorrectChime() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    playSoundTone(freq, 'triangle', 0.24, idx * 0.07, 0.14);
  });
}

// Âm thanh nhẹ nhàng khi ghép chưa đúng (không phạt trẻ)
function playWrongSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 0.2);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {}
}

// Tiếng còi tàu xe lửa "Tu tu!" chân thực
function playTrainWhistle() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // 2 hồi còi liên tiếp
    [0, 0.38].forEach((delay) => {
      const now = ctx.currentTime + delay;
      const duration = 0.32;

      // Tần số hòa âm 587Hz (D5) & 740Hz (F#5)
      [587.33, 739.99].forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1150, now);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      });
    });
  } catch (err) {}
}

// Âm thanh bánh xe xình xịch nhịp nhàng (Train Chug-Chug Rhythm)
let chugInterval = null;
let noiseBuffer = null;

function getNoiseBuffer(ctx) {
  if (!noiseBuffer) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

function playSingleChug(gainMultiplier = 1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tiếng hơi xả nhịp nhàng
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.07 * gainMultiplier, now + 0.015);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + 0.11);

    // Tiếng pít-tông trầm êm tai
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

    oscGain.gain.setValueAtTime(0.05 * gainMultiplier, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {}
}

function startTrainChug() {
  stopTrainChug();
  let beat = 0;
  chugInterval = setInterval(() => {
    playSingleChug(beat % 2 === 0 ? 1 : 0.65);
    beat++;
  }, 340);
}

function stopTrainChug() {
  if (chugInterval) {
    clearInterval(chugInterval);
    chugInterval = null;
  }
}

// Phát âm từ tiếng Anh (ưu tiên audioUrl từ giáo viên, fallback SpeechSynthesis)
let currentAudio = null;

function speakWord(word, audioUrl) {
  if (audioUrl) {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      currentAudio = new Audio(audioUrl);
      const playPromise = currentAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          speakWithSynthesis(word);
        });
      }
      return;
    } catch (e) {
      // Fallback to speech synthesis
    }
  }
  speakWithSynthesis(word);
}

function speakWithSynthesis(word) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
}

// Trộn mảng ngẫu nhiên
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Vẽ thanh danh sách trạm ở phía trên
function renderStationButtons() {
  const container = $('#stations');
  if (!container) return;
  container.innerHTML = '';

  window.WORD_SETS.forEach((set, idx) => {
    if (idx > 0) {
      const connector = document.createElement('i');
      connector.className = 'station-connector';
      container.appendChild(connector);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.station = String(idx);
    btn.className = idx === currentStationIndex ? 'active' : '';

    const numSpan = document.createElement('span');
    numSpan.className = 'station-num';
    numSpan.textContent = idx < 9 ? `0${idx + 1}` : String(idx + 1);

    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'station-emoji';
    emojiSpan.textContent = set.icon || '🚂';

    const nameText = document.createTextNode(` ${set.name}`);
    btn.append(numSpan, emojiSpan, nameText);

    // Biểu tượng tàu mini ở ga hiện tại
    if (idx === currentStationIndex) {
      const trainSpan = document.createElement('span');
      trainSpan.className = 'mini-train-icon';
      trainSpan.textContent = ' 🚂';
      btn.appendChild(trainSpan);
    }
    btn.onclick = () => {
      if (isMoving) return;
      getAudioContext();
      startStation(idx);
    };

    container.appendChild(btn);
  });
}

// Khởi động một vòng chơi (Đoàn tàu từ từ vào ga từ bên trái)
function startStation(index = currentStationIndex) {
  clearTimeout(departureTimer);
  window.speechSynthesis?.cancel();
  if (currentAudio) {
    try { currentAudio.pause(); } catch (e) {}
  }
  hideVictoryScreen();

  isMoving = true;
  document.body.classList.add('train-moving');
  document.body.classList.remove('word-selected');

  currentStationIndex = index;
  selectedWordId = null;
  matchedSet.clear();

  // Xoá confetti cũ
  const confettiContainer = $('#confetti-container');
  if (confettiContainer) confettiContainer.innerHTML = '';

  const data = window.WORD_SETS[index] || window.WORD_SETS[0];

  // Trộn thứ tự các cặp từ vựng
  activePairs = shuffleArray(
    data.pairs.map((p, id) => ({
      id,
      word: p[0],
      picture: p[1],
      audioUrl: p[2] || null
    }))
  );

  // Cập nhật thanh trạm
  renderStationButtons();

  // Dựng các toa tàu
  const carsContainer = $('#cars');
  carsContainer.replaceChildren();
  carsContainer.style.setProperty('--car-count', String(activePairs.length));

  activePairs.forEach((pair, i) => {
    const car = document.createElement('div');
    car.className = 'car';
    car.style.setProperty('--wagon', `url(assets/train/wagon-${wagonColors[i % wagonColors.length]}.png)`);
    car.dataset.id = String(pair.id);

    // Hình ảnh hoặc emoji
    const picDiv = document.createElement('div');
    picDiv.className = 'picture';

    if (/^(data:|assets\/|\.\/|https?:|\/)/.test(pair.picture)) {
      const img = new Image();
      img.src = pair.picture;
      img.alt = pair.word;
      img.loading = 'eager';
      picDiv.appendChild(img);
    } else {
      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = pair.picture;
      emojiSpan.setAttribute('aria-hidden', 'true');
      picDiv.appendChild(emojiSpan);
    }

    // Số thứ tự toa
    const numBadge = document.createElement('span');
    numBadge.className = 'car-number';
    numBadge.textContent = `0${i + 1}`;
    picDiv.appendChild(numBadge);

    // Ô đặt thẻ chữ (drop zone)
    const dropBtn = document.createElement('button');
    dropBtn.type = 'button';
    dropBtn.className = 'drop';
    dropBtn.dataset.target = String(pair.id);
    dropBtn.innerHTML = `<span class="drop-inner"><span class="drop-placeholder"><span class="drop-icon">?</span><span class="drop-text">Ghép từ</span></span></span>`;
    dropBtn.setAttribute('aria-label', `Ghép chữ vào toa ${i + 1}`);

    car.onclick = () => {
      if (isMoving) return;
      getAudioContext();
      if (selectedWordId !== null) {
        matchPair(selectedWordId, pair.id);
      } else if (matchedSet.has(pair.id)) {
        // Bấm vào bất kỳ đâu trên toa đã ghép đúng để nghe lại phát âm & nhún nhảy
        speakWord(pair.word, pair.audioUrl);
        car.classList.remove('matched');
        void car.offsetWidth;
        car.classList.add('matched');
        if (picDiv) {
          picDiv.classList.remove('celebrating');
          void picDiv.offsetWidth;
          picDiv.classList.add('celebrating');
        }
      } else {
        playClickSound();
      }
    };

    car.append(picDiv, dropBtn);

    // Bánh xe
    ['left', 'right'].forEach((side) => {
      const wheel = new Image();
      wheel.src = 'assets/train/wheel-wagon.png';
      wheel.alt = '';
      wheel.className = `wagon-wheel ${side}`;
      car.appendChild(wheel);
    });

    carsContainer.appendChild(car);
  });

  // Dựng danh sách các thẻ chữ
  const wordsContainer = $('#words');
  wordsContainer.replaceChildren();

  const shuffledWords = shuffleArray(activePairs);
  shuffledWords.forEach((pair) => {
    const wordBtn = document.createElement('button');
    wordBtn.type = 'button';
    wordBtn.className = 'word';
    wordBtn.textContent = pair.word;
    wordBtn.dataset.word = String(pair.id);
    wordBtn.setAttribute('aria-pressed', 'false');

    wordBtn.onclick = () => {
      if (isMoving) return;
      getAudioContext();
      selectWord(pair.id);
    };

    wordBtn.addEventListener('pointerdown', handleDragStart);
    wordsContainer.appendChild(wordBtn);
  });

  // Tự động căn chỉnh text vừa khít các ô
  requestAnimationFrame(() => {
    $$('.drop').forEach(fitDropText);
  });

  // KÍCH HOẠT CHUYỂN ĐỘNG: Tàu từ từ di chuyển từ trái sang giữa
  const trainEl = $('#train');
  trainEl.className = 'train arriving';
  void trainEl.offsetWidth; // Buộc trình duyệt tính toán lại layout
  startTrainChug();

  // Sau khi tàu vào ga dừng hẳn (3.8s)
  setTimeout(() => {
    trainEl.className = 'train stationary';
    isMoving = false;
    document.body.classList.remove('train-moving');
    stopTrainChug();
  }, 3800);
}

// Chọn hoặc huỷ chọn thẻ chữ
function selectWord(id) {
  if (isMoving || matchedSet.has(id)) return;

  if (selectedWordId === id) {
    selectedWordId = null;
    document.body.classList.remove('word-selected');
    $$('.word').forEach((b) => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    playClickSound();
    return;
  }

  selectedWordId = id;
  document.body.classList.add('word-selected');

  $$('.word').forEach((b) => {
    const isSelected = +b.dataset.word === id;
    b.classList.toggle('selected', isSelected);
    b.setAttribute('aria-pressed', String(isSelected));
  });

  playClickSound();

  // Phát âm từ vựng ngay khi bé chọn
  const item = activePairs.find((p) => p.id === id);
  if (item) {
    speakWord(item.word, item.audioUrl);
  }
}

// Bắn pháo giấy chúc mừng
function spawnConfetti() {
  const container = $('#confetti-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 28; i++) {
    const img = new Image();
    img.src = 'assets/effects/confetti.svg';
    img.alt = '';
    img.className = 'confetti';
    img.style.left = `${i * 3.6}%`;
    img.style.animationDelay = `${Math.random() * 0.8}s`;
    img.style.animationDuration = `${3.5 + Math.random() * 1.5}s`;
    container.appendChild(img);
  }
}

// Hiệu ứng ngôi sao lấp lánh khi ghép đúng 1 toa
function spawnSparks(element) {
  const rect = element.getBoundingClientRect();
  for (let i = 0; i < 9; i++) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    const img = new Image();
    img.src = `assets/effects/${i % 2 === 0 ? 'star' : 'sparkle'}.svg`;
    img.alt = '';
    spark.appendChild(img);

    const angle = (Math.PI * 2 * i) / 9;
    const distance = 50 + Math.random() * 60;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 20;

    spark.style.cssText = `
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      --dx: ${dx}px;
      --dy: ${dy}px;
    `;
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 1000);
  }
}

// Xử lý khi ghép từ vào toa
function matchPair(wordId, targetCarId) {
  if (isMoving || matchedSet.has(wordId) || matchedSet.has(targetCarId)) return;

  const targetCar = document.querySelector(`.car[data-id="${targetCarId}"]`);
  if (!targetCar) return;

  targetCar.classList.remove('wrong');

  if (wordId === targetCarId) {
    // ĐÚNG!
    matchedSet.add(wordId);
    const matchedItem = activePairs.find((x) => x.id === wordId);

    targetCar.classList.add('matched');
    const dropBtn = targetCar.querySelector('.drop');
    dropBtn.innerHTML = `<span class="drop-inner"><span class="drop-matched-text">${matchedItem.word}</span> <span class="drop-check">✓</span></span>`;
    fitDropText(dropBtn);

    // Nhân vật trong toa nhảy cẫng lên ăn mừng!
    const picDiv = targetCar.querySelector('.picture');
    if (picDiv) {
      picDiv.classList.remove('celebrating', 'confused');
      void picDiv.offsetWidth;
      picDiv.classList.add('celebrating');
    }

    const wordCard = document.querySelector(`[data-word="${wordId}"]`);
    if (wordCard) {
      wordCard.classList.add('used');
      wordCard.classList.remove('selected');
      wordCard.disabled = true;
      wordCard.setAttribute('aria-pressed', 'false');
    }

    selectedWordId = null;
    document.body.classList.remove('word-selected');

    spawnSparks(targetCar);
    playCorrectChime();
    speakWord(matchedItem.word, matchedItem.audioUrl);

    // KIỂM TRA: NẾU ĐÃ GHÉP ĐỦ TẤT CẢ CÁC TOA -> TÀU TỰ ĐỘNG CHẠY!
    if (matchedSet.size === activePairs.length) {
      isMoving = true;
      document.body.classList.add('train-moving');

      // Tạm dừng 0.6s để bé nhìn thấy kết quả hoàn chỉnh & nghe từ cuối cùng
      setTimeout(() => {
        playTrainWhistle();
        spawnConfetti();
        startTrainChug();

        const trainEl = $('#train');
        trainEl.className = 'train departing';

        // Tàu từ từ chuyển động sang phải (4.2s)
        departureTimer = setTimeout(() => {
          stopTrainChug();
          if (currentStationIndex < window.WORD_SETS.length - 1) {
            startStation(currentStationIndex + 1);
          } else {
            showVictoryScreen();
          }
        }, 4200);
      }, 600);
    }
  } else {
    // CHƯA ĐÚNG! (rung lắc toa & nhân vật bối rối nghiêng nhẹ)
    void targetCar.offsetWidth;
    targetCar.classList.add('wrong');
    const picDiv = targetCar.querySelector('.picture');
    if (picDiv) {
      picDiv.classList.remove('celebrating', 'confused');
      void picDiv.offsetWidth;
      picDiv.classList.add('confused');
    }
    playWrongSound();
  }
}

// Kéo thả thẻ chữ mượt mà hỗ trợ chuột & cảm ứng di động
function handleDragStart(e) {
  if (isMoving || matchedSet.has(+e.currentTarget.dataset.word) || e.button !== 0) return;

  const cardBtn = e.currentTarget;
  const wordId = +cardBtn.dataset.word;
  const startX = e.clientX;
  const startY = e.clientY;

  let dragGhost = null;
  let hasMoved = false;

  function onPointerMove(ev) {
    const distance = Math.hypot(ev.clientX - startX, ev.clientY - startY);
    if (distance < 7 && !hasMoved) return;

    if (!hasMoved) {
      hasMoved = true;
      selectWord(wordId);

      dragGhost = cardBtn.cloneNode(true);
      dragGhost.classList.add('drag-ghost');
      dragGhost.style.width = `${cardBtn.offsetWidth}px`;
      document.body.appendChild(dragGhost);
    }

    ev.preventDefault();
    if (dragGhost) {
      dragGhost.style.left = `${ev.clientX - dragGhost.offsetWidth / 2}px`;
      dragGhost.style.top = `${ev.clientY - 35}px`;
    }

    $$('.drop.over').forEach((d) => d.classList.remove('over'));
    const hoveredElement = document.elementFromPoint(ev.clientX, ev.clientY);
    const targetCar = hoveredElement?.closest('.car');
    if (targetCar && !matchedSet.has(+targetCar.dataset.id)) {
      const dropBtn = targetCar.querySelector('.drop');
      if (dropBtn) {
        dropBtn.classList.add('over');
      }
    }
  }

  function onPointerEnd(ev) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerEnd);
    document.removeEventListener('pointercancel', onPointerCancel);

    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }

    $$('.drop.over').forEach((d) => d.classList.remove('over'));

    if (hasMoved) {
      const hoveredElement = document.elementFromPoint(ev.clientX, ev.clientY);
      const targetCar = hoveredElement?.closest('.car');
      if (targetCar && ev.type !== 'pointercancel') {
        matchPair(wordId, +targetCar.dataset.id);
      }
      const preventClick = (event) => {
        event.stopImmediatePropagation();
        event.preventDefault();
      };
      cardBtn.addEventListener('click', preventClick, { once: true, capture: true });
      setTimeout(() => cardBtn.removeEventListener('click', preventClick, true), 50);
    }
  }

  function onPointerCancel(ev) {
    onPointerEnd(ev);
  }

  document.addEventListener('pointermove', onPointerMove, { passive: false });
  document.addEventListener('pointerup', onPointerEnd);
  document.addEventListener('pointercancel', onPointerCancel);
}

// Tự động co giãn kích thước text để không bao giờ bị tràn ra ngoài ô
function fitDropText(dropBtn) {
  if (!dropBtn) return;
  const inner = dropBtn.querySelector('.drop-inner');
  if (!inner) return;

  inner.style.transform = 'none';

  const availW = dropBtn.clientWidth - 8;
  const availH = dropBtn.clientHeight - 4;
  const contentW = inner.scrollWidth;
  const contentH = inner.scrollHeight;

  if (availW > 0 && availH > 0 && (contentW > availW || contentH > availH)) {
    const scaleW = availW / contentW;
    const scaleH = availH / contentH;
    const scale = Math.min(scaleW, scaleH, 1);
    inner.style.transform = `scale(${scale})`;
  } else {
    inner.style.transform = 'none';
  }
}

// Lắng nghe thay đổi kích thước màn hình để tự động co giãn tất cả các ô
window.addEventListener('resize', () => {
  $$('.drop').forEach(fitDropText);
});

// ==================== VICTORY & GAME COMPLETION ====================
function showVictoryScreen() {
  const trainEl = $('#train');
  if (trainEl) {
    trainEl.className = 'train stationary';
  }
  isMoving = false;
  document.body.classList.remove('train-moving');
  stopTrainChug();
  spawnConfetti();
  playCorrectChime();

  let modal = $('#victory-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'victory-modal';
    modal.className = 'victory-modal-backdrop';
    modal.innerHTML = `
      <div class="victory-modal-card">
        <div class="victory-badge">🏆</div>
        <h2 class="victory-title">XUẤT SẮC QUÁ!</h2>
        <p class="victory-subtitle">Bé đã hoàn thành tất cả các chặng tàu từ vựng! Đoàn tàu đã về đích an toàn!</p>
        <div class="victory-actions">
          <button type="button" class="victory-btn victory-btn-replay" id="victory-replay-btn">
            <span>🔄</span> Chơi lại từ đầu
          </button>
          <button type="button" class="victory-btn victory-btn-exit" id="victory-exit-btn">
            <span>🚪</span> Thoát Game
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#victory-replay-btn').onclick = () => {
      hideVictoryScreen();
      startStation(0);
    };

    modal.querySelector('#victory-exit-btn').onclick = () => {
      try {
        window.parent.postMessage({ type: 'TRAIN_EXIT' }, '*');
      } catch (e) {}
    };
  } else {
    modal.style.display = 'flex';
  }
}

function hideVictoryScreen() {
  const modal = $('#victory-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Khởi chạy game & nạp dữ liệu bài tập nếu có topicId
async function initGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get('topicId');

  if (topicId) {
    try {
      const res = await fetch(`/api/games/flashcard-match/${topicId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.cards) && json.cards.length > 0) {
          const validCards = json.cards.filter(c => c && (c.word || c.imageUrl));
          if (validCards.length > 0) {
            const groupMap = new Map();
            validCards.forEach(c => {
              const r = (c.roundIndex !== undefined && c.roundIndex !== null) ? Number(c.roundIndex) : 0;
              if (!groupMap.has(r)) groupMap.set(r, []);
              groupMap.get(r).push({
                word: (c.word || '').trim(),
                picture: c.imageUrl || 'assets/train/wagon-yellow.png',
                audioUrl: c.audioUrl || null
              });
            });
            const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => a - b);
            window.WORD_SETS = sortedKeys.map((rKey, idx) => ({
              name: `VÒNG ${idx + 1}`,
              icon: ['🚂', '🌟', '🎯', '🎨', '🎪', '🚀', '🌈'][idx % 7],
              pairs: groupMap.get(rKey).map(item => [item.word, item.picture, item.audioUrl])
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load topic from API, fallback to default sets:', err);
    }
  }

  // Preload các hình ảnh của Vòng 1 để đảm bảo khi tàu vào ga, ảnh đã sẵn sàng
  try {
    const firstSet = window.WORD_SETS && window.WORD_SETS[0];
    if (firstSet && Array.isArray(firstSet.pairs)) {
      const preloadPromises = firstSet.pairs.map(p => {
        const imgUrl = p[1];
        if (imgUrl && /^(data:|assets\/|\.\/|https?:|\/)/.test(imgUrl)) {
          return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imgUrl;
            setTimeout(() => resolve(false), 2000);
          });
        }
        return Promise.resolve(true);
      });
      await Promise.all(preloadPromises);
    }
  } catch (e) {}

  renderStationButtons();
  startStation(0);

  // Báo cho trang ngoài tắt Loading Skeleton khi tàu bắt đầu chuyển động vào ga
  setTimeout(() => {
    try {
      window.parent.postMessage({ type: 'TRAIN_READY' }, '*');
    } catch (e) {}
  }, 100);
}

// Bắt đầu khởi động game
initGame();


