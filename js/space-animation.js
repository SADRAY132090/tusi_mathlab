/* Hero space canvas animation */
(() => {
  "use strict";
  const canvas = document.getElementById("spaceCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0, height = 0, dpr = 1, raf = 0, last = 0, elapsed = 0;
  let stars = [];
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.max(50, Math.round(width * height / 3000)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: rand(0.3, 1.4),
      phase: rand(0, TAU),
      rate: rand(0.35, 1.7),
      alpha: rand(0.2, 0.85)
    }));
    draw(0);
  }
  function glow(x, y, radius, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  function planet(x, y, r, colorA, colorB, ring) {
    if (ring) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.32);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.65, r * 0.52, 0, 0, TAU);
      ctx.strokeStyle = "rgba(239,195,106,0.52)";
      ctx.lineWidth = Math.max(1, r * 0.09);
      ctx.stroke();
      ctx.restore();
    }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    g.addColorStop(0, colorA);
    g.addColorStop(0.55, colorB);
    g.addColorStop(1, "#071225");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
  }
  function draw(dt) {
    if (!width || !height) return;
    if (!reduced) elapsed += Math.min(dt || 0, 40) / 1000;
    ctx.clearRect(0, 0, width, height);
    const cx = width * 0.5, cy = height * 0.5;
    glow(cx - width * 0.1, cy - height * 0.1, Math.max(width, height) * 0.4, "16,75,133", 0.18);
    glow(cx + width * 0.15, cy + height * 0.1, Math.max(width, height) * 0.3, "22,180,193", 0.1);
    for (const s of stars) {
      const a = reduced ? s.alpha : s.alpha * (0.65 + 0.35 * Math.sin(elapsed * s.rate + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, TAU);
      ctx.fillStyle = `rgba(210,238,255,${a})`;
      ctx.fill();
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.24);
    const orbits = [
      [width * 0.35, height * 0.18, "rgba(84,214,223,0.15)"],
      [width * 0.3, height * 0.25, "rgba(239,195,106,0.12)"],
      [width * 0.2, height * 0.3, "rgba(112,143,255,0.13)"]
    ];
    for (const [rx, ry, stroke] of orbits) {
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(30, rx), Math.max(24, ry), 0, 0, TAU);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
    const a1 = elapsed * 0.25 + 0.5;
    const a2 = -elapsed * 0.17 + 2.3;
    const a3 = elapsed * 0.11 + 4.4;
    const p1 = { x: cx + Math.cos(a1) * width * 0.32, y: cy + Math.sin(a1) * height * 0.18 };
    const p2 = { x: cx + Math.cos(a2) * width * 0.27, y: cy + Math.sin(a2) * height * 0.25 };
    const p3 = { x: cx + Math.cos(a3) * width * 0.18, y: cy + Math.sin(a3) * height * 0.3 };
    glow(p1.x, p1.y, 24, "239,195,106", 0.18);
    planet(p1.x, p1.y, 5, "#ffe7a0", "#bd8437", true);
    glow(p2.x, p2.y, 20, "84,214,223", 0.18);
    planet(p2.x, p2.y, 4, "#b6fbff", "#147f9b");
    glow(p3.x, p3.y, 16, "129,139,255", 0.16);
    planet(p3.x, p3.y, 3, "#d8dcff", "#5559ad");
  }
  function tick(now) {
    if (!last) last = now;
    draw(now - last);
    last = now;
    raf = requestAnimationFrame(tick);
  }
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  if (observer) observer.observe(canvas);
  window.addEventListener("resize", resize, { passive: true });
  resize();
  if (!reduced) raf = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); last = 0; }
    else if (!reduced) { last = 0; raf = requestAnimationFrame(tick); }
  });
})();