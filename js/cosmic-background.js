/* Full-page animated cosmos — lightweight, no external deps */
(() => {
  "use strict";
  const canvas = document.getElementById("cosmicBackground");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TAU = Math.PI * 2;
  const rand = (min, max) => min + Math.random() * (max - min);
  let width = 0, height = 0, dpr = 1, elapsed = 0, last = 0, frame = 0;
  let stars = [], nebulae = [], shootingStars = [];
  const palette = [[69, 190, 220], [114, 112, 232], [238, 184, 103], [116, 220, 210]];

  function makeField() {
    const area = width * height;
    stars = Array.from({ length: Math.max(80, Math.min(280, Math.round(area / 6000))) }, () => ({
      x: rand(0, width), y: rand(0, height),
      r: rand(0.3, 1.5),
      phase: rand(0, TAU),
      speed: rand(0.25, 1.3),
      alpha: rand(0.2, 0.9),
      color: palette[Math.floor(Math.random() * palette.length)]
    }));
    nebulae = [
      { x: width * 0.18, y: height * 0.22, r: Math.max(width, height) * 0.42, color: [23, 82, 158], alpha: 0.15 },
      { x: width * 0.79, y: height * 0.42, r: Math.max(width, height) * 0.36, color: [0, 155, 175], alpha: 0.1 },
      { x: width * 0.47, y: height * 0.88, r: Math.max(width, height) * 0.32, color: [105, 69, 166], alpha: 0.08 }
    ];
    shootingStars = [];
  }
  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeField();
    draw(0);
  }
  function glow(x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color.join(",")},${alpha})`);
    g.addColorStop(1, `rgba(${color.join(",")},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function draw(dt) {
    if (!width || !height) return;
    if (!motionQuery.matches) elapsed += Math.min(dt || 0, 40) / 1000;
    ctx.clearRect(0, 0, width, height);
    for (const n of nebulae) glow(n.x, n.y, n.r, n.color, n.alpha);
    for (const s of stars) {
      const a = motionQuery.matches ? s.alpha : s.alpha * (0.6 + 0.4 * Math.sin(elapsed * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fillStyle = `rgba(${s.color.join(",")},${a})`;
      ctx.fill();
    }
    if (!motionQuery.matches) {
      if (Math.random() < 0.008 && shootingStars.length < 2) {
        shootingStars.push({
          x: rand(width * 0.1, width * 0.9),
          y: rand(0, height * 0.4),
          vx: rand(6, 10), vy: rand(2, 5),
          life: 0, max: rand(20, 36)
        });
      }
      shootingStars = shootingStars.filter(s => s.life < s.max);
      for (const s of shootingStars) {
        s.x += s.vx; s.y += s.vy; s.life++;
        const a = 1 - s.life / s.max;
        const grad = ctx.createLinearGradient(s.x - s.vx * 5, s.y - s.vy * 5, s.x, s.y);
        grad.addColorStop(0, "rgba(84,214,223,0)");
        grad.addColorStop(1, `rgba(215,250,255,${a * 0.85})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * 5, s.y - s.vy * 5);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
    }
  }
  function tick(now) {
    if (!last) last = now;
    draw(now - last);
    last = now;
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (!motionQuery.matches && !document.hidden && !frame) frame = requestAnimationFrame(tick);
    else if (motionQuery.matches) draw(0);
  }
  function stop() { cancelAnimationFrame(frame); frame = 0; last = 0; }

  const toggle = document.getElementById("cosmicToggle");
  let cosmicEnabled = true;
  try { cosmicEnabled = localStorage.getItem("tusi-cosmic-enabled") !== "false"; } catch (e) {}
  function apply() {
    document.body.classList.toggle("cosmic-muted", !cosmicEnabled);
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(cosmicEnabled));
      toggle.textContent = cosmicEnabled ? "✦" : "✧";
      toggle.title = cosmicEnabled ? "خاموش کردن انیمیشن" : "روشن کردن انیمیشن";
    }
    if (cosmicEnabled) start(); else stop();
  }
  if (toggle) toggle.addEventListener("click", () => {
    cosmicEnabled = !cosmicEnabled;
    try { localStorage.setItem("tusi-cosmic-enabled", String(cosmicEnabled)); } catch (e) {}
    apply();
  });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : (cosmicEnabled && start()));
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", () => { stop(); draw(0); if (cosmicEnabled) start(); });
  resize(); apply();
})();