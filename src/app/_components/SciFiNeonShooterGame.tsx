"use client";

import { useEffect, useRef, useState } from "react";
import { ChoiceShooterGame, ChoiceShooterQuestion } from "@/lib/choice-shooter-storage";
import { Volume2, VolumeX, X, ArrowLeft, RefreshCw, Play } from "lucide-react";

interface SciFiNeonShooterGameProps {
  game: ChoiceShooterGame;
  onClose?: () => void;
  isModal?: boolean;
}

// ==========================================
// WEB AUDIO ENGINE
// ==========================================
class WebAudioEngine {
  ctx: AudioContext | null = null;
  muted: boolean = false;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTypewriter() {
    if (this.muted || !this.ctx || Math.random() > 0.3) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playShoot() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }

  playExplosion(pitchOffset = 1) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(100 * pitchOffset, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  playCorrect(comboMult = 1) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sine";
      const baseFreq = 600 + (comboMult - 1) * 200;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  playWrong() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  playWarning() {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }
}

export function SciFiNeonShooterGame({ game, onClose, isModal = false }: SciFiNeonShooterGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<WebAudioEngine | null>(null);

  const [gameState, setGameState] = useState<"start" | "playing" | "victory">("start");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [showComboBadge, setShowComboBadge] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [typewriterText, setTypewriterText] = useState("");
  const [muted, setMuted] = useState(false);

  const questions = game.questions || [];
  const endMode = game.endMode || "finish";

  // Audio Engine Ref init
  if (!audioRef.current) {
    audioRef.current = new WebAudioEngine();
  }

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  };

  const startGame = () => {
    if (audioRef.current) audioRef.current.init();
    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setShowComboBadge(false);
    setQIndex(0);
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let animId: number;
    let localScore = 0;
    let localCombo = 0;
    let localMult = 1;
    let localQIdx = 0;

    const audio = audioRef.current;

    // Background stars
    let bgStars: Array<{ x: number; y: number; radius: number; speed: number; alpha: number }> = [];
    for (let i = 0; i < 120; i++) {
      let layer = Math.random();
      bgStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: layer > 0.8 ? 2 : layer > 0.4 ? 1 : 0.5,
        speed: layer > 0.8 ? 0.8 : layer > 0.4 ? 0.3 : 0.1,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }

    // Canvas Entities
    let bullets: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      angle: number;
      length: number;
      markedForDeletion: boolean;
      history: Array<{ x: number; y: number }>;
    }> = [];

    let targets: Array<{
      x: number;
      y: number;
      radius: number;
      text: string;
      isCorrect: boolean;
      baseColor: string;
      speed: number;
      rotation: number;
      rotSpeed: number;
      scale: number;
      pulseAngle: number;
      markedForDeletion: boolean;
    }> = [];

    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      lifeDecay: number;
      markedForDeletion: boolean;
    }> = [];

    let shockwaves: Array<{
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      color: string;
      thickness: number;
      alpha: number;
      markedForDeletion: boolean;
    }> = [];

    let floatingTexts: Array<{
      x: number;
      y: number;
      text: string;
      color: string;
      alpha: number;
      scale: number;
      vy: number;
      markedForDeletion: boolean;
    }> = [];

    let screenShake = 0;
    let dangerAlpha = 0;
    let reticleRot = 0;
    let isTargetLocked = false;

    // Turret State
    const turret = {
      x: width / 2,
      y: height - 15,
      angle: -Math.PI / 2,
      recoil: 0,
      radius: 45,
      lastShootTime: 0,
    };

    let mouse = { x: width / 2, y: height / 2 };

    // Typewriter State for Question
    let fullQText = questions[0]?.q || "7 + 8 = ?";
    let currentTypeStr = "";
    let typeIdx = 0;
    let typeTimer = 0;

    function loadQuestionData(qObj: ChoiceShooterQuestion) {
      targets = [];
      dangerAlpha = 0;
      fullQText = qObj.q;
      currentTypeStr = "";
      typeIdx = 0;
      typeTimer = 0;

      const opts: Array<{ text: string; isCorrect: boolean }> = [
        { text: qObj.a, isCorrect: true },
        { text: qObj.wrong[0] || "0", isCorrect: false },
        { text: qObj.wrong[1] || "1", isCorrect: false },
        { text: qObj.wrong[2] || "2", isCorrect: false },
      ].sort(() => Math.random() - 0.5);

      const sciFiColors = [
        "16, 185, 129",
        "6, 182, 212",
        "139, 92, 246",
        "249, 115, 22",
        "236, 72, 153",
        "244, 63, 94",
        "234, 179, 8",
      ];

      const segment = width / opts.length;
      opts.forEach((opt, index) => {
        const minX = segment * index + 60;
        const maxX = segment * (index + 1) - 60;
        const targetX = Math.max(60, Math.min(width - 60, Math.random() * (maxX - minX) + minX));
        const color = sciFiColors[Math.floor(Math.random() * sciFiColors.length)];
        const r = Math.floor(Math.random() * 20) + 32;

        targets.push({
          x: targetX,
          y: -70,
          radius: r,
          text: opt.text,
          isCorrect: opt.isCorrect,
          baseColor: color,
          speed: (55 - r) / 20 + Math.random() * 0.4 + Math.min(localCombo * 0.08, 1.2),
          rotation: Math.random() * Math.PI,
          rotSpeed: 0.02,
          scale: 0.1,
          pulseAngle: Math.random() * Math.PI * 2,
          markedForDeletion: false,
        });
      });
    }

    loadQuestionData(questions[0]);

    function createExplosion(x: number, y: number, color: string, isBig = false) {
      if (audio) audio.playExplosion(isBig ? 1 : 1.5);
      screenShake = isBig ? 22 : 8;

      if (isBig) {
        shockwaves.push({
          x,
          y,
          radius: 10,
          maxRadius: 100,
          color,
          thickness: 10,
          alpha: 1,
          markedForDeletion: false,
        });
      }

      for (let i = 0; i < (isBig ? 35 : 15); i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * (isBig ? 16 : 10),
          vy: (Math.random() - 0.5) * (isBig ? 16 : 10),
          radius: Math.random() * 4 + 2,
          color,
          alpha: 1,
          lifeDecay: Math.random() * 0.03 + 0.02,
          markedForDeletion: false,
        });
      }
    }

    function shoot() {
      const now = Date.now();
      if (now - turret.lastShootTime < 180) return;
      turret.lastShootTime = now;

      if (audio) audio.playShoot();
      turret.recoil = 22;

      const barrelTipX = turret.x + Math.cos(turret.angle) * 75;
      const barrelTipY = turret.y + Math.sin(turret.angle) * 75;

      bullets.push({
        x: barrelTipX,
        y: barrelTipY,
        vx: Math.cos(turret.angle) * 22,
        vy: Math.sin(turret.angle) * 22,
        angle: turret.angle,
        length: 35,
        markedForDeletion: false,
        history: [],
      });

      for (let i = 0; i < 4; i++) {
        particles.push({
          x: barrelTipX,
          y: barrelTipY,
          vx: (Math.random() - 0.5) * 8 + Math.cos(turret.angle) * 15,
          vy: (Math.random() - 0.5) * 8 + Math.sin(turret.angle) * 15,
          radius: Math.random() * 3 + 1.5,
          color: "#22d3ee",
          alpha: 1,
          lifeDecay: 0.04,
          markedForDeletion: false,
        });
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onClick = () => {
      shoot();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        shoot();
      }
    };

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      turret.x = width / 2;
      turret.y = height - 15;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("resize", onResize);

    function gameLoop() {
      if (!ctx) return;
      ctx.save();

      // Screen Shake
      if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.85;
        if (screenShake < 0.5) screenShake = 0;
      }

      // Background Draw
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, width, height);

      const g1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.7);
      g1.addColorStop(0, "rgba(139, 92, 246, 0.15)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, width * 0.6);
      g2.addColorStop(0, "rgba(6, 182, 212, 0.1)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Stars
      bgStars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Perspective Grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const vpX = width / 2;
      const vpY = height * 0.3;
      for (let i = -15; i <= 15; i++) {
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(width / 2 + i * 200, height);
      }
      let yGrid = vpY;
      let spacing = 5;
      while (yGrid < height) {
        yGrid += spacing;
        ctx.moveTo(0, yGrid);
        ctx.lineTo(width, yGrid);
        spacing *= 1.25;
      }
      ctx.stroke();

      // Red Danger Tint Flash
      if (dangerAlpha > 0) {
        ctx.fillStyle = `rgba(220, 38, 38, ${dangerAlpha})`;
        ctx.fillRect(0, 0, width, height);
        dangerAlpha *= 0.95;
      }

      // Typewriter Question Process
      if (typeIdx < fullQText.length) {
        typeTimer++;
        if (typeTimer % 3 === 0) {
          currentTypeStr += fullQText[typeIdx];
          setTypewriterText(currentTypeStr + (typeTimer % 10 < 5 ? "█" : ""));
          typeIdx++;
          if (audio) audio.playTypewriter();
        }
      } else {
        setTypewriterText(fullQText);
      }

      // Turret Aim & Recoil Update
      turret.x = width / 2;
      turret.y = height - 15;
      const dx = mouse.x - turret.x;
      const dy = mouse.y - turret.y;
      turret.angle = Math.atan2(dy, dx);
      if (turret.recoil > 0) turret.recoil -= 1.5;

      // Update Bullets
      bullets.forEach((b) => {
        b.history.push({ x: b.x, y: b.y });
        if (b.history.length > 5) b.history.shift();
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) b.markedForDeletion = true;
      });

      // Draw Bullets
      bullets.forEach((b) => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#22d3ee";
        ctx.beginPath();
        for (let i = 0; i < b.history.length; i++) {
          ctx.lineTo(b.history[i].x, b.history[i].y);
        }
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.roundRect(-b.length / 2, -3, b.length, 6, 3);
        ctx.fill();
        ctx.restore();
      });
      bullets = bullets.filter((b) => !b.markedForDeletion);

      // Update & Draw Targets
      isTargetLocked = false;
      targets.forEach((t) => {
        t.y += t.speed;
        t.rotation += t.rotSpeed;
        t.pulseAngle += 0.05;
        if (t.scale < 1) t.scale += 0.05;

        // Check cursor lock
        const dMx = t.x - mouse.x;
        const dMy = t.y - mouse.y;
        if (Math.sqrt(dMx * dMx + dMy * dMy) < t.radius) isTargetLocked = true;

        // Danger Alert: If correct target is near bottom (<350px from bottom)
        if (t.isCorrect && t.y > height - 350 && t.y < height) {
          dangerAlpha = Math.max(dangerAlpha, 0.3 * (Math.sin(Date.now() / 100) + 1) / 2);
          if (audio && Math.random() < 0.05) {
            audio.playWarning();
          }
        }

        // Check if target fell off bottom
        if (t.y > height + t.radius) {
          t.markedForDeletion = true;
          if (t.isCorrect) {
            // Deduct 5 points (minimum score 0)
            localScore = Math.max(0, localScore - 5);
            setScore(localScore);

            // Reset combo
            localCombo = 0;
            localMult = 1;
            setCombo(0);
            setMultiplier(1);
            setShowComboBadge(false);

            // Danger flash, wrong sound, and screen shake
            dangerAlpha = 0.8;
            screenShake = 20;
            if (audio) audio.playWrong();

            floatingTexts.push({
              x: width / 2,
              y: height - 120,
              text: "BỎ LỠ! -5",
              color: "#f43f5e",
              alpha: 1,
              scale: 1.8,
              vy: -2,
              markedForDeletion: false,
            });

            // Reload next question
            if (endMode === "finish" && localQIdx + 1 >= questions.length) {
              setGameState("victory");
              return;
            }
            localQIdx = (localQIdx + 1) % questions.length;
            setQIndex(localQIdx);
            loadQuestionData(questions[localQIdx]);
          }
        }

        // Bullet Collision Check
        bullets.forEach((b) => {
          if (t.markedForDeletion || b.markedForDeletion) return;
          const cdx = t.x - b.x;
          const cdy = t.y - b.y;
          if (Math.sqrt(cdx * cdx + cdy * cdy) < t.radius + 10) {
            b.markedForDeletion = true;
            t.markedForDeletion = true;

            if (t.isCorrect) {
              // CORRECT HIT!
              localCombo++;
              if (localCombo >= 6) localMult = 3;
              else if (localCombo >= 3) localMult = 2;
              else localMult = 1;

              setCombo(localCombo);
              setMultiplier(localMult);
              if (localCombo >= 3) setShowComboBadge(true);

              const pts = 10 * localMult;
              localScore += pts;
              setScore(localScore);

              createExplosion(t.x, t.y, `rgb(${t.baseColor})`, true);
              if (audio) audio.playCorrect(localMult);

              floatingTexts.push({
                x: t.x,
                y: t.y,
                text: `+${pts}`,
                color: "#34d399",
                alpha: 1,
                scale: 1.5,
                vy: -2,
                markedForDeletion: false,
              });

              // Clear wrong targets
              targets.forEach((wt) => {
                if (wt !== t) {
                  createExplosion(wt.x, wt.y, "#475569");
                  wt.markedForDeletion = true;
                }
              });

              // Advance to next question
              setTimeout(() => {
                if (endMode === "finish" && localQIdx + 1 >= questions.length) {
                  setGameState("victory");
                  return;
                }
                localQIdx = (localQIdx + 1) % questions.length;
                setQIndex(localQIdx);
                loadQuestionData(questions[localQIdx]);
              }, 500);
            } else {
              // WRONG HIT! Deduct 5 points & reset combo
              localScore = Math.max(0, localScore - 5);
              setScore(localScore);

              localCombo = 0;
              localMult = 1;
              setCombo(0);
              setMultiplier(1);
              setShowComboBadge(false);
              dangerAlpha = 0.5;

              createExplosion(t.x, t.y, "#f43f5e", false);
              if (audio) audio.playWrong();

              floatingTexts.push({
                x: t.x,
                y: t.y,
                text: "LỖI! -5",
                color: "#f43f5e",
                alpha: 1,
                scale: 1.5,
                vy: -2,
                markedForDeletion: false,
              });
            }
          }
        });
      });
      targets = targets.filter((t) => !t.markedForDeletion);

      // Draw Targets
      targets.forEach((t) => {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(t.scale, t.scale);

        const pulse = (Math.sin(t.pulseAngle) + 1) / 2;
        ctx.shadowBlur = 25 + pulse * 15;
        ctx.shadowColor = `rgb(${t.baseColor})`;

        const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, t.radius);
        radGrad.addColorStop(0, `rgba(${t.baseColor}, 0.2)`);
        radGrad.addColorStop(0.8, `rgba(${t.baseColor}, 0.6)`);
        radGrad.addColorStop(1, `rgba(${t.baseColor}, 0.9)`);

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(0, 0, t.radius - 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.rotate(t.rotation);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(0, 0, t.radius, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.rotate(-t.rotation * 2.5);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${t.baseColor}, 1)`;
        ctx.setLineDash([10, 15, 30, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, t.radius - 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.rotate(t.rotation * 1.5);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";

        let fontSize = Math.max(12, Math.floor(t.radius * 0.5));
        ctx.font = `900 ${fontSize}px Roboto, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";

        if (t.text.length > 7 && t.text.includes(" ")) {
          let parts = t.text.split(" ");
          let mid = Math.floor(parts.length / 2);
          let line1 = parts.slice(0, mid).join(" ");
          let line2 = parts.slice(mid).join(" ");
          ctx.strokeText(line1, 0, -fontSize / 2);
          ctx.fillText(line1, 0, -fontSize / 2);
          ctx.strokeText(line2, 0, fontSize / 2);
          ctx.fillText(line2, 0, fontSize / 2);
        } else {
          if (t.text.length > 8) ctx.font = `900 ${fontSize * 0.75}px Roboto, Arial, sans-serif`;
          ctx.strokeText(t.text, 0, 0);
          ctx.fillText(t.text, 0, 0);
        }
        ctx.restore();
      });

      // Draw Shockwaves
      shockwaves.forEach((s) => {
        s.radius += 8;
        s.thickness *= 0.9;
        s.alpha -= 0.05;
        if (s.alpha <= 0 || s.radius >= s.maxRadius) s.markedForDeletion = true;

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.thickness;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      shockwaves = shockwaves.filter((s) => !s.markedForDeletion);

      // Draw Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.alpha -= p.lifeDecay;
        if (p.alpha <= 0) p.markedForDeletion = true;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      particles = particles.filter((p) => !p.markedForDeletion);

      // Draw Floating Texts
      floatingTexts.forEach((f) => {
        f.y += f.vy;
        f.alpha -= 0.02;
        f.scale += 0.01;
        if (f.alpha <= 0) f.markedForDeletion = true;

        ctx.save();
        ctx.globalAlpha = Math.max(0, f.alpha);
        ctx.translate(f.x, f.y);
        ctx.scale(f.scale, f.scale);
        ctx.fillStyle = f.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = f.color;
        ctx.font = '900 24px "Roboto Mono", monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.text, 0, 0);
        ctx.restore();
      });
      floatingTexts = floatingTexts.filter((f) => !f.markedForDeletion);

      // Draw Turret Base
      ctx.save();
      ctx.translate(turret.x, turret.y);

      ctx.shadowBlur = 30;
      ctx.shadowColor = "#06b6d4";
      ctx.fillStyle = "rgba(6, 182, 212, 0.1)";
      ctx.beginPath();
      ctx.ellipse(0, 10, turret.radius + 20, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      const baseGrad = ctx.createLinearGradient(-turret.radius, -turret.radius, turret.radius, turret.radius);
      baseGrad.addColorStop(0, "#475569");
      baseGrad.addColorStop(0.5, "#1e293b");
      baseGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(0, 0, turret.radius, Math.PI, 0);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = "#334155";
      ctx.stroke();
      ctx.fillStyle = "#0891b2";
      ctx.beginPath();
      ctx.arc(0, 0, 15, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(0, 0, 8, Math.PI, 0);
      ctx.fill();

      ctx.rotate(turret.angle);

      // Laser Guide Line
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(3000, 0);
      ctx.strokeStyle = isTargetLocked ? "rgba(244, 63, 94, 0.3)" : "rgba(34, 211, 238, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([15, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      const barrelX = -turret.recoil;
      ctx.fillStyle = "#475569";
      ctx.fillRect(barrelX - 10, -12, 30, 24);

      const barrelGrad = ctx.createLinearGradient(barrelX, -18, barrelX, 18);
      barrelGrad.addColorStop(0, "#64748b");
      barrelGrad.addColorStop(0.5, "#1e293b");
      barrelGrad.addColorStop(1, "#334155");

      ctx.fillStyle = barrelGrad;
      ctx.beginPath();
      ctx.moveTo(barrelX + 15, -18);
      ctx.lineTo(barrelX + 65, -12);
      ctx.lineTo(barrelX + 65, 12);
      ctx.lineTo(barrelX + 15, 18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(barrelX + 30, -8, 20, 3);
      ctx.fillRect(barrelX + 30, 5, 20, 3);

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#22d3ee";
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(barrelX + 20, -16, 40, 2);
      ctx.fillRect(barrelX + 20, 14, 40, 2);

      ctx.fillStyle = "#22d3ee";
      ctx.shadowBlur = 25;
      ctx.fillRect(barrelX + 65, -14, 8, 28);

      ctx.restore();

      // Custom Reticle Cursor Draw
      ctx.save();
      ctx.translate(mouse.x, mouse.y);
      reticleRot += isTargetLocked ? 0.1 : 0.02;
      ctx.rotate(reticleRot);

      ctx.strokeStyle = isTargetLocked ? "#f43f5e" : "#22d3ee";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.strokeStyle;

      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, isTargetLocked ? 18 : 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 8);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("resize", onResize);
    };
  }, [gameState, questions, endMode]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510] text-white font-sans select-none overflow-hidden flex flex-col">
      <style flex-inline="true">{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@700&family=Roboto:wght@700;900&display=swap');
        .font-sci-fi { font-family: 'Roboto Mono', Courier, monospace; }
        .glass-panel {
          background: rgba(10, 15, 30, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 255, 255, 0.25);
          box-shadow: 0 0 25px rgba(0, 255, 255, 0.15);
        }
        @keyframes pulse-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3); }
          50% { text-shadow: 0 0 20px rgba(0, 255, 255, 0.9), 0 0 30px rgba(0, 255, 255, 0.6); }
        }
        .text-glow { animation: pulse-glow 1.5s infinite; }
        @keyframes combo-pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-combo { animation: combo-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {/* Game Canvas Area */}
      <canvas ref={canvasRef} className="block w-full h-full cursor-none" />

      {/* UI HUD OVERLAY */}
      {gameState === "playing" && (
        <div className="absolute inset-0 p-4 md:p-6 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between items-start gap-4 relative">
            {/* Score Board */}
            <div className="pointer-events-auto flex flex-col items-center glass-panel p-3 md:p-4 rounded-2xl w-32 relative">
              <span className="text-cyan-400/80 text-xs font-sci-fi tracking-widest uppercase font-bold">
                Điểm Số
              </span>
              <span className="text-cyan-300 text-3xl md:text-4xl font-black font-sci-fi drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                {score}
              </span>

              {/* Combo Badge */}
              {showComboBadge && (
                <div className="absolute -bottom-6 animate-combo bg-gradient-to-r from-orange-500 to-yellow-400 text-black font-black font-sci-fi px-3 py-0.5 rounded-full text-xs shadow-[0_0_15px_rgba(249,115,22,0.8)] whitespace-nowrap">
                  COMBO x{multiplier}
                </div>
              )}
            </div>

            {/* Question Box */}
            <div className="pointer-events-auto flex-1 max-w-2xl glass-panel rounded-3xl p-4 text-center border-t-4 border-t-cyan-400 relative overflow-hidden flex items-center justify-center min-h-[70px]">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
              <p className="text-white text-2xl md:text-4xl font-black text-glow tracking-wide flex items-center justify-center font-sci-fi">
                {typewriterText}
              </p>
            </div>

            {/* Controls: Sound Toggle & Exit */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="w-11 h-11 rounded-2xl glass-panel hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-11 h-11 rounded-2xl glass-panel hover:border-rose-400 text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                  title="Thoát game"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* START OVERLAY SCREEN - STYLIZED PLAY BUTTON ONLY */}
      {gameState === "start" && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-50 p-6">
          <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <button
              type="button"
              onClick={startGame}
              className="group relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-fuchsia-500 p-1 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.6)] hover:shadow-[0_0_90px_rgba(6,182,212,0.9)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              {/* Pulsing Outer Ring */}
              <span className="absolute inset-0 rounded-full border-2 border-cyan-300/60 animate-ping pointer-events-none" />

              {/* Inner Glowing Disc */}
              <span className="w-full h-full rounded-full bg-[#0a0f24] flex items-center justify-center group-hover:bg-[#0f1738] transition-colors border border-cyan-400/40">
                <Play className="w-12 h-12 md:w-16 md:h-16 text-cyan-300 ml-2 group-hover:text-white group-hover:scale-110 transition-all drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
              </span>
            </button>

            <span className="font-sci-fi font-black text-cyan-300 text-sm md:text-base uppercase tracking-widest text-glow drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              BẮT ĐẦU CHƠI
            </span>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Quay lại
              </button>
            )}
          </div>
        </div>
      )}

      {/* VICTORY OVERLAY SCREEN (Finish Mode Completed) */}
      {gameState === "victory" && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50 p-6 animate-in fade-in duration-300">
          <div className="text-center glass-panel p-8 md:p-12 rounded-[2.5rem] border border-cyan-500/40 shadow-[0_0_80px_rgba(0,255,255,0.2)] max-w-lg w-full space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.6)] text-4xl font-black">
              🏆
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-black font-sci-fi text-cyan-300 tracking-wide uppercase">
                HOÀN THÀNH!
              </h2>
            </div>

            <div className="bg-black/50 rounded-2xl p-5 border border-cyan-500/30">
              <span className="text-xs font-sci-fi text-cyan-400/70 uppercase tracking-widest block font-bold mb-1">
                TỔNG ĐIỂM ĐẠT ĐƯỢC
              </span>
              <span className="text-5xl font-black font-sci-fi text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                {score}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={startGame}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black font-sci-fi rounded-2xl text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer"
              >
                CHƠI LẠI
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-sm uppercase transition-all cursor-pointer"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
