const DEFAULT_GAME_DATA = [
  {
    roundIndex: 0,
    roundNumber: 1,
    title: 'Vòng 1',
    questions: [
      {question:'Listen! Someone _____ at the front door right now.',answers:['is knocking at the front door right now.','has already knocked at the front door.','knocked at the front door yesterday.','will be knocking at the front door soon.'],correct:0,fill:'is knocking'},
      {question:'Look! The children _____ in the garden now.',answers:['are playing happily together.','played there last Sunday.','have played there before.','will play there tomorrow.'],correct:0,fill:'are playing'},
      {question:'My sister _____ her homework every evening.',answers:['does her homework carefully.','is doing it right now.','did it yesterday morning.','has done it already today.'],correct:0,fill:'does'},
      {question:'We _____ to the zoo last weekend.',answers:['went with our classmates.','go there every weekend.','are going there right now.','have gone there tomorrow.'],correct:0,fill:'went'},
      {question:'She _____ this book three times already.',answers:['has read this book three times.','reads this book every night.','is reading it tomorrow.','read it next week.'],correct:0,fill:'has read'}
    ]
  }
];

(async () => {
  const root = document.getElementById('game');
  const answersGrid = document.getElementById('answersGrid');
  const cards = [...root.querySelectorAll('.answer-card')];
  const roundLabel = document.getElementById('roundLabel');
  const questionCounter = document.getElementById('questionCounter');
  const questionSection = document.getElementById('questionSection') || root.querySelector('.question');
  const questionTextSingle = document.getElementById('questionTextSingle');
  const questionTextSplit = document.getElementById('questionTextSplit');
  const questionText = document.getElementById('questionTextSingle') || document.getElementById('questionText');
  const questionImage = document.getElementById('questionImage');
  const splitImageFrame = document.getElementById('splitImageFrame');
  const imageZoomOverlay = document.getElementById('imageZoomOverlay');
  const zoomedImage = document.getElementById('zoomedImage');
  const closeZoomBtn = document.getElementById('closeZoomBtn');
  const coinValue = document.getElementById('coinValue');
  const instructionText = document.getElementById('instructionText');
  const nextBtn = document.getElementById('nextBtn');
  const autoNextBtn = document.getElementById('autoNextBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const soundBtn = document.getElementById('soundBtn');
  const addCoinBtn = document.getElementById('addCoinBtn');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const resumeBtn = document.getElementById('resumeBtn');
  const roundOverlay = document.getElementById('roundOverlay');
  const roundModalTitle = document.getElementById('roundModalTitle');
  const roundModalSubtitle = document.getElementById('roundModalSubtitle');
  const nextRoundBtn = document.getElementById('nextRoundBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const effectsLayer = document.getElementById('effectsLayer');
  const coinBurst = document.getElementById('coinBurst');
  const starDimmers = [...root.querySelectorAll('.star-dimmer')];
  const fireworksCanvas = document.getElementById('fireworksCanvas');
  const fctx = fireworksCanvas ? fireworksCanvas.getContext('2d') : null;
  let fireworksAnimId = null;
  let fireworksParticles = [];

  let gameRounds = DEFAULT_GAME_DATA;

  // Check URL param or window global data
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get('topicId');

  if (topicId) {
    if (loadingOverlay) loadingOverlay.hidden = false;
    try {
      const res = await fetch(`/api/games/candy-quiz/${encodeURIComponent(topicId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.rounds) && data.rounds.length > 0) {
        gameRounds = data.rounds;
      } else {
        console.warn('Cannot load topic data, falling back to default:', data.error);
      }
    } catch (err) {
      console.error('Error fetching quiz topic:', err);
    } finally {
      if (loadingOverlay) loadingOverlay.hidden = true;
    }
  } else if (Array.isArray(window.CANDY_QUIZ_DATA) && window.CANDY_QUIZ_DATA.length > 0) {
    // Legacy support for flat array window.CANDY_QUIZ_DATA
    gameRounds = [
      {
        roundIndex: 0,
        roundNumber: 1,
        title: 'Vòng 1',
        questions: window.CANDY_QUIZ_DATA
      }
    ];
  }

  const state = {
    roundIdx: 0,
    questionIdx: 0,
    coins: 160,
    stars: 3,
    locked: false,
    paused: false,
    sound: true,
    autoNext: localStorage.getItem('candy_quiz_auto_next') !== 'false'
  };
  let audioCtx = null;
  let autoAdvanceTimer = null;

  function resizeCanvas() {
    if (!fireworksCanvas) return;
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function triggerFireworks(durationMs = 2000) {
    if (!fctx || !fireworksCanvas) return;
    resizeCanvas();
    fireworksParticles = [];
    const colors = ['#ff4e78', '#ffd43a', '#42c9ff', '#9d63ff', '#63d94f', '#ff802b', '#ff73c2', '#ffffff', '#fff385'];
    const startTime = performance.now();

    function createBurst(cx, cy, count = 50) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 11;
        fireworksParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3.5,
          gravity: 0.19,
          drag: 0.982,
          size: 5 + Math.random() * 7,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.013 + Math.random() * 0.017,
          shape: Math.random() > 0.4 ? 'circle' : 'star',
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.22
        });
      }
    }

    createBurst(fireworksCanvas.width * 0.2, fireworksCanvas.height * 0.45, 55);
    createBurst(fireworksCanvas.width * 0.8, fireworksCanvas.height * 0.45, 55);
    createBurst(fireworksCanvas.width * 0.5, fireworksCanvas.height * 0.32, 70);

    const burstInterval = setInterval(() => {
      if (performance.now() - startTime < durationMs - 450) {
        const x = fireworksCanvas.width * (0.12 + Math.random() * 0.76);
        const y = fireworksCanvas.height * (0.18 + Math.random() * 0.5);
        createBurst(x, y, 40);
      } else {
        clearInterval(burstInterval);
      }
    }, 320);

    if (fireworksAnimId) cancelAnimationFrame(fireworksAnimId);

    function animate(now) {
      fctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
      for (let i = fireworksParticles.length - 1; i >= 0; i--) {
        const p = fireworksParticles[i];
        p.vx *= p.drag;
        p.vy = (p.vy + p.gravity) * p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.rot += p.vrot;

        if (p.alpha <= 0) {
          fireworksParticles.splice(i, 1);
          continue;
        }

        fctx.save();
        fctx.globalAlpha = Math.max(0, p.alpha);
        fctx.fillStyle = p.color;
        fctx.translate(p.x, p.y);
        fctx.rotate(p.rot);

        if (p.shape === 'circle') {
          fctx.beginPath();
          fctx.arc(0, 0, p.size, 0, Math.PI * 2);
          fctx.fill();
        } else {
          fctx.beginPath();
          for (let s = 0; s < 5; s++) {
            fctx.lineTo(Math.cos((18 + s * 72) * Math.PI / 180) * p.size * 1.35,
                        -Math.sin((18 + s * 72) * Math.PI / 180) * p.size * 1.35);
            fctx.lineTo(Math.cos((54 + s * 72) * Math.PI / 180) * (p.size * 0.65),
                        -Math.sin((54 + s * 72) * Math.PI / 180) * (p.size * 0.65));
          }
          fctx.closePath();
          fctx.fill();
        }
        fctx.restore();
      }

      if (performance.now() - startTime < durationMs || fireworksParticles.length > 0) {
        fireworksAnimId = requestAnimationFrame(animate);
      } else {
        fctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
        fireworksAnimId = null;
      }
    }

    fireworksAnimId = requestAnimationFrame(animate);
  }

  function stopFireworks() {
    if (fireworksAnimId) {
      cancelAnimationFrame(fireworksAnimId);
      fireworksAnimId = null;
    }
    if (fctx && fireworksCanvas) {
      fctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    }
    fireworksParticles = [];
  }

  function updateAutoNextUI() {
    if (!autoNextBtn) return;
    autoNextBtn.classList.toggle('active', state.autoNext);
    autoNextBtn.classList.toggle('off', !state.autoNext);
    autoNextBtn.setAttribute('aria-checked', String(state.autoNext));
    autoNextBtn.title = state.autoNext ? 'Tự chuyển câu: BẬT' : 'Tự chuyển câu: TẮT';
    const thumb = autoNextBtn.querySelector('.toggle-thumb');
    if (thumb) thumb.textContent = state.autoNext ? '⚡' : '⏸';
  }
  updateAutoNextUI();

  if (autoNextBtn) {
    autoNextBtn.addEventListener('click', () => {
      state.autoNext = !state.autoNext;
      localStorage.setItem('candy_quiz_auto_next', String(state.autoNext));
      updateAutoNextUI();
      uiSound();
    });
  }

  function tone(freq, duration = .1, delay = 0, type = 'sine', volume = .045) {
    if (!state.sound) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + duration + .04);
  }
  function correctSound() {
    tone(523, .08, 0); tone(659, .08, .08); tone(784, .1, .16, 'triangle', .05); tone(1047, .18, .27, 'triangle', .045);
  }
  function wrongSound() {
    tone(245, .07, 0, 'triangle', .045); tone(205, .08, .07, 'triangle', .04); tone(172, .12, .15, 'triangle', .038);
  }
  function uiSound() {
    tone(690, .075, 0, 'sine', .035);
  }

  function updateStars() {
    starDimmers.forEach((el, i) => el.classList.toggle('off', i >= state.stars));
  }

  function fitQuestionText(element, isSplit = false) {
    if (!element) return;

    const minSize = 14;
    const maxSize = isSplit
      ? Math.min(28, Math.max(20, Math.round(window.innerWidth * 0.023)))
      : Math.min(35, Math.max(24, Math.round(window.innerWidth * 0.030)));

    const lineHeightVal = 1.24;
    element.style.fontSize = `${maxSize}px`;
    element.style.lineHeight = `${lineHeightVal}`;

    const parent = element.parentElement;
    const maxH = parent ? parent.clientHeight * (isSplit ? 0.85 : 0.76) : 0;

    let low = minSize;
    let high = maxSize;
    let best = minSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      element.style.fontSize = `${mid}px`;

      let lineCount = 1;
      try {
        const range = document.createRange();
        range.selectNodeContents(element);
        lineCount = range.getClientRects().length;
      } catch (e) {}

      const isOverflowing =
        lineCount > 2 ||
        (maxH > 0 && element.clientHeight > maxH + 3) ||
        (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 6);

      if (isOverflowing) {
        high = mid - 1;
      } else {
        best = mid;
        low = mid + 1;
      }
    }

    element.style.fontSize = `${best}px`;
    element.style.lineHeight = `${lineHeightVal}`;
  }

  function fitAnswerText(card) {
    const textEl = card.querySelector('.answer-text');
    if (!textEl) return;

    const rawText = (textEl.textContent || '').trim();
    if (!rawText) return;

    const charCount = rawText.length;
    const isOptions2 = answersGrid && answersGrid.classList.contains('options-2');

    const cardH = card.clientHeight || 100;
    const cardW = card.clientWidth || 240;

    // Dynamic sizing bounds based on character count
    let minSize = 13;
    let maxSize = 24;

    if (charCount <= 4) {
      // Very short: numbers (e.g. 65, 68), short codes
      const hLimit = Math.round(cardH * 0.48);
      maxSize = Math.max(32, Math.min(hLimit, 52));
      minSize = 22;
    } else if (charCount <= 10) {
      // Short words/numbers: e.g. "Banana", "45 + 23"
      const hLimit = Math.round(cardH * 0.40);
      maxSize = Math.max(26, Math.min(hLimit, 42));
      minSize = 18;
    } else if (charCount <= 22) {
      // Medium phrases
      const hLimit = Math.round(cardH * 0.32);
      maxSize = Math.max(20, Math.min(hLimit, 32));
      minSize = 15;
    } else if (charCount <= 45) {
      // Regular sentences
      const hLimit = Math.round(cardH * 0.25);
      maxSize = Math.max(16, Math.min(hLimit, 24));
      minSize = 13;
    } else {
      // Long sentences (> 45 chars)
      const hLimit = Math.round(cardH * 0.20);
      maxSize = Math.max(13, Math.min(hLimit, 20));
      minSize = 12;
    }

    if (isOptions2) {
      maxSize = Math.round(maxSize * 1.15);
    }

    const lineHeightVal = charCount <= 6 ? 1.10 : 1.20;
    const maxH = cardH * (isOptions2 ? 0.86 : 0.80);
    const maxAllowedLines = charCount <= 10 ? 1 : 2;

    let low = minSize;
    let high = maxSize;
    let best = minSize;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      textEl.style.fontSize = `${mid}px`;
      textEl.style.lineHeight = `${lineHeightVal}`;

      let lineCount = 1;
      try {
        const range = document.createRange();
        range.selectNodeContents(textEl);
        lineCount = range.getClientRects().length;
      } catch (e) {}

      const isOverflowing =
        lineCount > maxAllowedLines ||
        (maxH > 0 && textEl.clientHeight > maxH) ||
        (textEl.scrollWidth > textEl.clientWidth + 4);

      if (isOverflowing) {
        high = mid - 1;
      } else {
        best = mid;
        low = mid + 1;
      }
    }

    textEl.style.fontSize = `${best}px`;
    textEl.style.lineHeight = `${lineHeightVal}`;
  }

  function classify(card, text) {
    card.classList.remove('long', 'xlong');
    if (text.length > 72) card.classList.add('xlong');
    else if (text.length > 50) card.classList.add('long');
  }

  function getCurrentRound() {
    return gameRounds[state.roundIdx] || gameRounds[0];
  }

  function getCurrentQuestion() {
    const r = getCurrentRound();
    return r.questions[state.questionIdx] || r.questions[0];
  }

  function render() {
    const currentRound = getCurrentRound();
    const totalQuestions = currentRound.questions.length;
    const q = getCurrentQuestion();

    // Round and Question HUD
    if (gameRounds.length > 1) {
      if (roundLabel) roundLabel.textContent = `V${state.roundIdx + 1}`;
    } else {
      if (roundLabel) roundLabel.textContent = 'Câu';
    }
    questionCounter.textContent = `${state.questionIdx + 1}/${totalQuestions}`;
    coinValue.textContent = state.coins;
    if (instructionText) instructionText.textContent = 'Chạm vào bảng đáp án đúng nhé!';
    nextBtn.hidden = true;
    state.stars = 3;
    state.locked = false;
    updateStars();

    // Question Image & Split Layout Check
    const hasValidImage = Boolean(
      q.imageUrl &&
      typeof q.imageUrl === 'string' &&
      q.imageUrl.trim() !== '' &&
      q.imageUrl !== 'null' &&
      q.imageUrl !== 'undefined'
    );

    if (hasValidImage && questionImage) {
      questionImage.src = q.imageUrl;
      const cookieFrameOuter = document.querySelector('.cookie-frame-outer');
      const splitFrame = document.getElementById('splitImageFrame');
      
      const updateFrameSize = () => {
        if (!questionImage.naturalWidth || !questionImage.naturalHeight || !cookieFrameOuter || !splitFrame) return;
        const availableHeight = splitFrame.clientHeight || cookieFrameOuter.clientHeight;
        if (availableHeight > 0) {
          // Inner padding and outer borders total ~16px vertically
          const contentHeight = availableHeight - 16;
          const targetWidth = Math.round((contentHeight * questionImage.naturalWidth) / questionImage.naturalHeight) + 16;
          cookieFrameOuter.style.width = `${targetWidth}px`;
        }
      };

      if (questionImage.complete && questionImage.naturalWidth) {
        updateFrameSize();
      } else {
        questionImage.onload = updateFrameSize;
      }
      
      if (questionSection) questionSection.classList.add('has-image');
      if (questionTextSplit) questionTextSplit.textContent = q.question;
      if (questionTextSingle) questionTextSingle.textContent = q.question;
      questionImage.onerror = () => {
        if (questionSection) questionSection.classList.remove('has-image');
        if (questionTextSingle) questionTextSingle.textContent = q.question;
        questionImage.removeAttribute('src');
      };
    } else {
      if (questionSection) questionSection.classList.remove('has-image');
      if (questionTextSingle) questionTextSingle.textContent = q.question;
      if (questionTextSplit) questionTextSplit.textContent = q.question;
      if (questionImage) questionImage.removeAttribute('src');
    }

    // Adapt layout for 2, 3 or 4 options
    const numOptions = q.answers.length;
    if (answersGrid) {
      answersGrid.classList.toggle('options-2', numOptions === 2);
      answersGrid.classList.toggle('options-3', numOptions === 3);
    }

    cards.forEach((card, i) => {
      if (i < numOptions) {
        card.hidden = false;
        card.style.display = '';
        card.disabled = false;
        card.classList.remove('sugar-correct', 'jelly-wrong', 'dimmed', 'long', 'xlong');
        const text = q.answers[i] ?? '';
        card.querySelector('.answer-text').textContent = text;
        card.setAttribute('aria-label', `Đáp án ${String.fromCharCode(65 + i)}: ${text}`);
        classify(card, text);
      } else {
        card.hidden = true;
        card.style.display = 'none';
      }
    });

    // Auto calculate question and answer font sizes dynamically
    requestAnimationFrame(() => {
      if (hasValidImage) {
        fitQuestionText(questionTextSplit, true);
      } else {
        fitQuestionText(questionTextSingle, false);
      }
      cards.forEach((card, i) => {
        if (i < numOptions) fitAnswerText(card);
      });
    });
  }

  function centerOf(card) {
    const r = card.getBoundingClientRect(), s = root.querySelector('.stage').getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }

  function sugarBurst(card) {
    const { x, y } = centerOf(card);
    const colors = ['#ff4e78', '#ffd43a', '#42c9ff', '#9d63ff', '#63d94f', '#ff902e', '#ff80c0'];
    for (let i = 0; i < 42; i++) {
      const p = document.createElement('i'); p.className = 'sprinkle';
      p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = colors[i % colors.length];
      const a = Math.PI * 2 * i / 42 + (Math.random() - .5) * .38, d = 75 + Math.random() * 165;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * d - 42) + 'px');
      p.style.setProperty('--rot', (Math.random() * 760 - 380) + 'deg');
      p.style.setProperty('--dur', (760 + Math.random() * 440) + 'ms');
      effectsLayer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('i'); p.className = 'sugar-dot';
      p.style.left = x + 'px'; p.style.top = y + 'px';
      const a = Math.random() * Math.PI * 2, d = 45 + Math.random() * 145;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * d - 25) + 'px');
      p.style.setProperty('--dur', (600 + Math.random() * 450) + 'ms');
      effectsLayer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('i'); p.className = 'sugar-star-particle';
      p.style.left = (x - 18) + 'px'; p.style.top = (y - 18) + 'px';
      const a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', (Math.sin(a) * d - 55) + 'px');
      p.style.setProperty('--rot', (Math.random() * 320 - 160) + 'deg');
      p.style.setProperty('--dur', (720 + Math.random() * 360) + 'ms');
      effectsLayer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function jellyDrops(card) {
    const { x, y } = centerOf(card), colors = ['#ff8ca7', '#ffd35c', '#7dcfff', '#b780ff'];
    for (let i = 0; i < 11; i++) {
      const p = document.createElement('i'); p.className = 'jelly-candy';
      p.style.left = (x + (Math.random() - .5) * 110) + 'px'; p.style.top = (y + 5) + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', ((Math.random() - .5) * 80) + 'px');
      p.style.setProperty('--dy', (58 + Math.random() * 76) + 'px');
      p.style.setProperty('--rot', (Math.random() * 320 - 160) + 'deg');
      p.style.setProperty('--dur', (520 + Math.random() * 280) + 'ms');
      effectsLayer.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }

  function showCoin(amount = '+15') {
    coinBurst.textContent = amount;
    coinBurst.classList.remove('show');
    void coinBurst.offsetWidth;
    coinBurst.classList.add('show');
  }

  function select(card) {
    if (state.locked || state.paused || card.disabled) return;
    const q = getCurrentQuestion();
    const idx = Number(card.dataset.index);

    if (idx === q.correct) {
      state.locked = true;
      card.classList.add('sugar-correct');
      cards.forEach(c => {
        c.disabled = true;
        if (c !== card && !c.hidden) c.classList.add('dimmed');
      });
      state.coins += 15;
      coinValue.textContent = state.coins;
      showCoin('+15');
      sugarBurst(card);
      correctSound();
      if (instructionText) instructionText.textContent = 'Sugar Burst! Chính xác! 🍬✨';
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
      // Bắn pháo hoa chúc mừng toàn màn hình 2s cho cả 2 chế độ
      triggerFireworks(2000);

      if (state.autoNext) {
        // Toggle BẬT: ẩn nút Câu tiếp và tự động chuyển câu sau 2s
        nextBtn.hidden = true;
        autoAdvanceTimer = setTimeout(() => {
          handleNext();
        }, 2000);
      } else {
        // Toggle TẮT: hiện nút Câu tiếp để học sinh bấm
        setTimeout(() => {
          nextBtn.hidden = false;
        }, 720);
      }
    } else {
      state.locked = true;
      card.disabled = true;
      card.classList.add('jelly-wrong');
      state.stars = Math.max(0, state.stars - 1);
      updateStars();
      jellyDrops(card);
      wrongSound();
      if (instructionText) instructionText.textContent = 'Jelly Wobble! Chưa đúng, thử lại nhé!';
      setTimeout(() => {
        card.classList.remove('jelly-wrong');
        card.disabled = false;
        state.locked = false;
      }, 760);
    }
  }

  function handleNext() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    stopFireworks();
    uiSound();
    const currentRound = getCurrentRound();
    if (state.questionIdx + 1 < currentRound.questions.length) {
      state.questionIdx++;
      render();
    } else {
      // Round Complete!
      if (state.roundIdx + 1 < gameRounds.length) {
        if (roundModalTitle) roundModalTitle.textContent = `Hoàn thành Vòng ${state.roundIdx + 1}!`;
        if (roundModalSubtitle) roundModalSubtitle.textContent = `Bé đã vượt qua ${currentRound.questions.length} câu hỏi. Sẵn sàng cho vòng tiếp theo nhé!`;
        if (nextRoundBtn) nextRoundBtn.textContent = 'Vòng tiếp theo ➔';
        if (roundOverlay) roundOverlay.hidden = false;
        correctSound();
        triggerFireworks(3500);
      } else {
        // All rounds complete
        if (roundModalTitle) roundModalTitle.textContent = 'Chiến Thắng!';
        if (roundModalSubtitle) roundModalSubtitle.textContent = `Tuyệt đỉnh! Bé đã xuất sắc hoàn thành tất cả các câu hỏi của bài tập!`;
        if (nextRoundBtn) nextRoundBtn.textContent = 'Chơi lại từ đầu 🔄';
        if (roundOverlay) roundOverlay.hidden = false;
        correctSound();
        triggerFireworks(5000);
      }
    }
  }

  function handleNextRound() {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    stopFireworks();
    uiSound();
    if (roundOverlay) roundOverlay.hidden = true;
    if (state.roundIdx + 1 < gameRounds.length) {
      state.roundIdx++;
      state.questionIdx = 0;
    } else {
      // Restart from beginning
      state.roundIdx = 0;
      state.questionIdx = 0;
    }
    render();
  }

  cards.forEach(card => card.addEventListener('click', () => select(card)));
  if (nextBtn) nextBtn.addEventListener('click', handleNext);
  if (nextRoundBtn) nextRoundBtn.addEventListener('click', handleNextRound);
  if (autoNextBtn) {
    autoNextBtn.classList.toggle('off', !state.autoNext);
    autoNextBtn.setAttribute('aria-checked', String(state.autoNext));
    autoNextBtn.addEventListener('click', () => {
      state.autoNext = !state.autoNext;
      localStorage.setItem('candy_quiz_auto_next', String(state.autoNext));
      autoNextBtn.classList.toggle('off', !state.autoNext);
      autoNextBtn.setAttribute('aria-checked', String(state.autoNext));
      autoNextBtn.setAttribute('title', `Tự chuyển câu: ${state.autoNext ? 'BẬT' : 'TẮT'}`);
      if (state.autoNext && nextBtn && !nextBtn.hidden) {
        nextBtn.hidden = true;
        handleNext();
      }
      uiSound();
    });
  }
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      state.paused = true;
      if (pauseOverlay) pauseOverlay.hidden = false;
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
      stopFireworks();
      uiSound();
    });
  }
  if (resumeBtn) resumeBtn.addEventListener('click', () => { state.paused = false; if (pauseOverlay) pauseOverlay.hidden = true; uiSound(); root.focus(); });
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      state.sound = !state.sound;
      soundBtn.classList.toggle('muted', !state.sound);
      if (state.sound) uiSound();
      if (instructionText) instructionText.textContent = state.sound ? 'Đã bật âm thanh 🔊' : 'Đã tắt âm thanh 🔇';
    });
  }
  if (addCoinBtn) addCoinBtn.addEventListener('click', () => { state.coins += 5; coinValue.textContent = state.coins; showCoin('+5'); uiSound(); });

  root.addEventListener('keydown', e => {
    if (e.target.matches('button,input,textarea,select')) return;
    const q = getCurrentQuestion();
    if (['1', '2', '3', '4'].includes(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < q.answers.length) {
        cards[idx]?.click();
      }
    }
    if (e.key === 'Escape') {
      if (imageZoomOverlay && !imageZoomOverlay.hidden) {
        closeZoom();
      } else {
        state.paused = !state.paused;
        if (pauseOverlay) pauseOverlay.hidden = !state.paused;
      }
    }
  });

  // Image Zoom / Lightbox Handlers
  function closeZoom() {
    if (imageZoomOverlay) imageZoomOverlay.hidden = true;
    if (zoomedImage) zoomedImage.removeAttribute('src');
    uiSound();
  }

  if (splitImageFrame && imageZoomOverlay && zoomedImage) {
    splitImageFrame.addEventListener('click', () => {
      const q = getCurrentQuestion();
      if (q && q.imageUrl) {
        zoomedImage.src = q.imageUrl;
        imageZoomOverlay.hidden = false;
        uiSound();
      }
    });
    splitImageFrame.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        splitImageFrame.click();
      }
    });
  }

  if (closeZoomBtn) closeZoomBtn.addEventListener('click', closeZoom);
  if (imageZoomOverlay) {
    imageZoomOverlay.addEventListener('click', e => {
      if (e.target === imageZoomOverlay) closeZoom();
    });
  }

  window.addEventListener('resize', () => {
    const q = getCurrentQuestion();
    if (q && q.imageUrl && questionImage && questionImage.naturalWidth) {
      const cookieFrameOuter = document.querySelector('.cookie-frame-outer');
      const splitFrame = document.getElementById('splitImageFrame');
      if (cookieFrameOuter && splitFrame) {
        const availableHeight = splitFrame.clientHeight || cookieFrameOuter.clientHeight;
        if (availableHeight > 0) {
          const contentHeight = availableHeight - 16;
          const targetWidth = Math.round((contentHeight * questionImage.naturalWidth) / questionImage.naturalHeight) + 16;
          cookieFrameOuter.style.width = `${targetWidth}px`;
        }
      }
    }
    const hasImage = Boolean(q && q.imageUrl && q.imageUrl.trim() !== '');
    fitQuestionText(hasImage ? questionTextSplit : questionTextSingle, hasImage);
    cards.forEach((card, i) => {
      if (!card.hidden) fitAnswerText(card);
    });
  });

  render();
})();
