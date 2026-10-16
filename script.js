/* Tusi MathLab — Main application script */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const fa = (n, digits = 0) => Number(n).toLocaleString("fa-IR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
  let toastTimer;
  const toast = (msg) => {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  };
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ─── Theme ─── */
  let theme = "dark";
  try { theme = localStorage.getItem("tusi-theme") || "dark"; } catch (e) {}
  if (theme === "light") document.documentElement.dataset.theme = "light";
  function updateThemeBtn() {
    const isLight = document.documentElement.dataset.theme === "light";
    const btn = $("themeToggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(isLight));
      btn.title = isLight ? "پوستهٔ تیره" : "پوستهٔ روشن";
    }
  }
  updateThemeBtn();
  $("themeToggle")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    if (next === "light") document.documentElement.dataset.theme = "light";
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem("tusi-theme", next); } catch (e) {}
    updateThemeBtn();
    toast(next === "light" ? "پوستهٔ روشن" : "پوستهٔ تیره");
  });

  /* ─── Menu ─── */
  $("menuToggle")?.addEventListener("click", () => {
    const nav = $("mainNav");
    const opened = nav.classList.toggle("open");
    $("menuToggle").setAttribute("aria-expanded", String(opened));
  });
  document.querySelectorAll("#mainNav a").forEach(a => {
    a.addEventListener("click", () => $("mainNav").classList.remove("open"));
  });
  $("backToTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ─── Scroll progress ─── */
  const progressBar = $("scrollProgressBar");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
      ticking = false;
    });
  }, { passive: true });

  /* ─── Reveal on scroll ─── */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal, .reveal-card").forEach(el => io.observe(el));
  } else {
    document.querySelectorAll(".reveal, .reveal-card").forEach(el => el.classList.add("visible"));
  }

  /* ─── Simulator ─── */
  const simCanvas = $("simCanvas");
  if (simCanvas) {
    const sx = simCanvas.getContext("2d");
    const state = {
      R: 100, speed: 1, angle0: 0,
      t: 0, running: true,
      trail: [], sparks: [],
      showTrail: true, showGrid: true, showVec: true, showQ: true, showVel: true,
      cycles: 0, maxY: 0, sumErr: 0, samples: 0,
      startTime: performance.now(),
      lastFrameTime: performance.now(), frameCount: 0, fps: 60,
      recording: false, recordedTrail: []
    };
    function pointAt(t) {
      const a = t + state.angle0 * Math.PI / 180;
      const m = window.TusiMath.pointAt(state.R, a);
      const v = window.TusiMath.velocityAt(state.R, a, 1e-4);
      return { a, C: m.C, Q: m.Q, P: m.P, theory: m.theory, vx: v.x, vy: v.y };
    }
    function resizeSim() {
      const rect = simCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (simCanvas.width === w && simCanvas.height === h) return;
      simCanvas.width = w;
      simCanvas.height = h;
      sx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSim();
    }
    function drawSim() {
      const rect = simCanvas.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      const cx = w / 2, cy = h / 2;
      sx.clearRect(0, 0, w, h);
      const scale = Math.min((w * 0.4) / Math.max(state.R * 1.25, 1), (h * 0.36) / Math.max(state.R, 1), 1.7);
      const Rs = state.R * scale, rs = Rs / 2;
      const p = pointAt(state.t);
      const pX = cx + p.P.x * scale, pY = cy - p.P.y * scale;
      const cX = cx + p.C.x * scale, cY = cy - p.C.y * scale;

      if (state.showGrid) {
        const lineColor = getComputedStyle(document.documentElement).getPropertyValue("--line").trim() || "rgba(150,170,200,0.15)";
        sx.strokeStyle = lineColor;
        sx.lineWidth = 1;
        const step = 25 * scale;
        for (let x = cx % step; x < w; x += step) {
          sx.beginPath(); sx.moveTo(x, 0); sx.lineTo(x, h); sx.stroke();
        }
        for (let y = cy % step; y < h; y += step) {
          sx.beginPath(); sx.moveTo(0, y); sx.lineTo(w, y); sx.stroke();
        }
        sx.strokeStyle = "rgba(150,170,200,0.42)";
        sx.lineWidth = 1.3;
        sx.beginPath();
        sx.moveTo(10, cy); sx.lineTo(w - 10, cy);
        sx.moveTo(cx, 10); sx.lineTo(cx, h - 10);
        sx.stroke();
      }
      // Big circle
      sx.strokeStyle = "#54d6df";
      sx.lineWidth = 2;
      sx.globalAlpha = 0.82;
      sx.beginPath(); sx.arc(cx, cy, Rs, 0, Math.PI * 2); sx.stroke();
      sx.globalAlpha = 0.28;
      sx.setLineDash([5, 6]);
      sx.beginPath(); sx.moveTo(cx - Rs, cy); sx.lineTo(cx + Rs, cy); sx.stroke();
      sx.setLineDash([]);
      sx.globalAlpha = 1;
      // Q path
      if (state.showQ) {
        sx.strokeStyle = "#a78bfa";
        sx.lineWidth = 1.4;
        sx.globalAlpha = 0.55;
        sx.setLineDash([3, 4]);
        sx.beginPath(); sx.arc(cX, cY, rs, 0, Math.PI * 2); sx.stroke();
        sx.setLineDash([]);
        sx.globalAlpha = 1;
      }
      // Small circle
      sx.strokeStyle = "#efc36a";
      sx.lineWidth = 2;
      sx.globalAlpha = 0.9;
      sx.beginPath(); sx.arc(cX, cY, rs, 0, Math.PI * 2); sx.stroke();
      sx.globalAlpha = 0.5;
      sx.setLineDash([4, 5]);
      sx.beginPath(); sx.moveTo(cx, cy); sx.lineTo(cX, cY); sx.stroke();
      sx.setLineDash([]);
      sx.globalAlpha = 1;
      // Trail
      if (state.showTrail && state.trail.length > 1) {
        sx.strokeStyle = "#f18cae";
        sx.lineWidth = 2.5;
        sx.lineCap = "round";
        sx.globalAlpha = 0.75;
        sx.beginPath();
        state.trail.forEach((pt, i) => {
          const x = cx + pt.x * scale, y = cy - pt.y * scale;
          if (i) sx.lineTo(x, y); else sx.moveTo(x, y);
        });
        sx.stroke();
        sx.globalAlpha = 1;
      }
      // Sparks
      for (const sp of state.sparks) {
        sx.save();
        sx.globalAlpha = sp.life;
        sx.fillStyle = sp.color;
        sx.beginPath(); sx.arc(sp.x, sp.y, sp.r * sp.life, 0, Math.PI * 2); sx.fill();
        sx.restore();
      }
      // Vectors
      if (state.showVec) {
        sx.strokeStyle = "#54d6df";
        sx.lineWidth = 1.4;
        sx.beginPath(); sx.moveTo(cx, cy); sx.lineTo(cX, cY); sx.stroke();
        sx.strokeStyle = "#a78bfa";
        sx.beginPath(); sx.moveTo(cX, cY); sx.lineTo(pX, pY); sx.stroke();
        sx.strokeStyle = "#efc36a";
        sx.setLineDash([4, 3]);
        sx.beginPath(); sx.moveTo(cx, cy); sx.lineTo(pX, pY); sx.stroke();
        sx.setLineDash([]);
      }
      // Velocity
      if (state.showVel) {
        const vScale = 0.15;
        const vx = p.vx * scale * vScale;
        const vy = -p.vy * scale * vScale;
        sx.strokeStyle = "#7bd9b1";
        sx.lineWidth = 2;
        sx.beginPath(); sx.moveTo(pX, pY); sx.lineTo(pX + vx, pY + vy); sx.stroke();
        const ang = Math.atan2(vy, vx);
        sx.beginPath();
        sx.moveTo(pX + vx, pY + vy);
        sx.lineTo(pX + vx - 8 * Math.cos(ang - 0.4), pY + vy - 8 * Math.sin(ang - 0.4));
        sx.moveTo(pX + vx, pY + vy);
        sx.lineTo(pX + vx - 8 * Math.cos(ang + 0.4), pY + vy - 8 * Math.sin(ang + 0.4));
        sx.stroke();
      }
      // Points
      sx.fillStyle = "#eef4ff";
      sx.beginPath(); sx.arc(cx, cy, 4, 0, Math.PI * 2); sx.fill();
      sx.fillStyle = "#efc36a";
      sx.beginPath(); sx.arc(cX, cY, 3.5, 0, Math.PI * 2); sx.fill();
      sx.shadowColor = "#f18cae";
      sx.shadowBlur = 12;
      sx.fillStyle = "#f18cae";
      sx.beginPath(); sx.arc(pX, pY, 5.5, 0, Math.PI * 2); sx.fill();
      sx.shadowBlur = 0;
      // Labels
      sx.font = "12px Dubai, Tahoma, sans-serif";
      sx.fillStyle = "#54d6df"; sx.fillText("O", cx + 7, cy - 8);
      sx.fillStyle = "#efc36a"; sx.fillText("C", cX + 7, cY - 6);
      sx.fillStyle = "#a78bfa"; sx.fillText("Q", (cX + pX) / 2 + 4, (cY + pY) / 2 - 4);
      sx.fillStyle = "#f18cae"; sx.fillText("P", pX + 9, pY - 8);
      // Readouts
      const angleDeg = ((state.t + state.angle0 * Math.PI / 180) * 180 / Math.PI) % 360;
      const $rA = $("currentAngle"), $rX = $("coordX"), $rY = $("coordY"), $rV = $("velocityMag");
      if ($rA) $rA.textContent = fa(angleDeg.toFixed(1)) + "°";
      if ($rX) $rX.textContent = p.P.x.toFixed(2);
      if ($rY) $rY.textContent = p.P.y.toFixed(2);
      if ($rV) $rV.textContent = Math.hypot(p.vx, p.vy).toFixed(3);
      const $st = $("simStatus");
      if ($st) $st.textContent = state.running ? "در حال حرکت" : "متوقف";
      // Stats
      if (Math.abs(p.P.y) > state.maxY) state.maxY = Math.abs(p.P.y);
      state.sumErr += Math.abs(p.P.y);
      state.samples++;
      const $cy = $("analysisCycles"), $my = $("analysisMaxY"), $ae = $("analysisAvgErr"), $tm = $("analysisTime");
      if ($cy) $cy.textContent = fa(state.cycles);
      if ($my) $my.textContent = state.maxY.toFixed(3);
      if ($ae) $ae.textContent = (state.sumErr / Math.max(1, state.samples)).toFixed(4);
      if ($tm) $tm.textContent = fa((performance.now() - state.startTime) / 1000, 1) + "s";
    }
    function emitSpark(pX, pY) {
      if (state.sparks.length > 60) state.sparks.shift();
      const colors = ["#54d6df", "#efc36a", "#f18cae", "#a78bfa"];
      state.sparks.push({
        x: pX, y: pY,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        r: 1.5 + Math.random() * 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    function loopSim(now) {
      const dt = now - state.lastFrameTime;
      state.lastFrameTime = now;
      state.frameCount++;
      if (state.frameCount % 30 === 0) {
        state.fps = Math.round(1000 / dt);
        const $f = $("simFps");
        if ($f) $f.textContent = fa(state.fps) + " FPS";
      }
      if (state.running) {
        const prevT = state.t;
        state.t += 0.018 * state.speed;
        const p = pointAt(state.t);
        if (state.showTrail) {
          state.trail.push({ x: p.P.x, y: p.P.y });
          if (state.trail.length > 300) state.trail.shift();
        }
        if (Math.floor(state.t / (Math.PI * 2)) > Math.floor(prevT / (Math.PI * 2))) state.cycles++;
        // Sparks
        const rect = simCanvas.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const scale = Math.min((rect.width * 0.4) / Math.max(state.R * 1.25, 1), (rect.height * 0.36) / Math.max(state.R, 1), 1.7);
        if (Math.random() < 0.35) emitSpark(cx + p.P.x * scale, cy - p.P.y * scale);
        for (const s of state.sparks) {
          s.x += s.vx; s.y += s.vy;
          s.vx *= 0.96; s.vy *= 0.96;
          s.life *= 0.94;
        }
        state.sparks = state.sparks.filter(s => s.life > 0.05);
        if (state.recording) {
          state.recordedTrail.push({ t: state.t, x: p.P.x, y: p.P.y });
          if (state.recordedTrail.length > 2000) state.recordedTrail.shift();
        }
        drawSim();
      }
      requestAnimationFrame(loopSim);
    }
    resizeSim();
    requestAnimationFrame(loopSim);
    window.addEventListener("resize", resizeSim);
    if ("ResizeObserver" in window) new ResizeObserver(resizeSim).observe(simCanvas);

    // Controls
    $("radiusRange")?.addEventListener("input", e => {
      state.R = +e.target.value;
      $("radiusValue").textContent = fa(state.R);
      state.trail = [];
    });
    $("speedRange")?.addEventListener("input", e => {
      state.speed = +e.target.value;
      $("speedValue").textContent = state.speed.toFixed(1) + "×";
    });
    $("angleRange")?.addEventListener("input", e => {
      state.angle0 = +e.target.value;
      $("angleValue").textContent = fa(state.angle0) + "°";
      state.trail = [];
    });
    $("traceToggle")?.addEventListener("change", e => { state.showTrail = e.target.checked; if (!state.showTrail) state.trail = []; });
    $("gridToggle")?.addEventListener("change", e => { state.showGrid = e.target.checked; });
    $("vectorToggle")?.addEventListener("change", e => { state.showVec = e.target.checked; });
    $("qPathToggle")?.addEventListener("change", e => { state.showQ = e.target.checked; });
    $("velocityToggle")?.addEventListener("change", e => { state.showVel = e.target.checked; });
    $("playPause")?.addEventListener("click", e => {
      state.running = !state.running;
      e.currentTarget.textContent = state.running ? "Ⅱ مکث" : "▶ ادامه";
    });
    $("stepFrame")?.addEventListener("click", () => {
      state.running = false;
      $("playPause").textContent = "▶ ادامه";
      state.t += 0.08;
      state.trail.push(pointAt(state.t).P);
    });
    $("resetSim")?.addEventListener("click", () => {
      state.R = 100; state.speed = 1; state.angle0 = 0; state.t = 0;
      state.running = true; state.trail = []; state.sparks = [];
      state.cycles = 0; state.maxY = 0; state.sumErr = 0; state.samples = 0;
      state.startTime = performance.now();
      $("radiusRange").value = 100;
      $("speedRange").value = 1;
      $("angleRange").value = 0;
      $("radiusValue").textContent = "۱۰۰";
      $("speedValue").textContent = "1.0×";
      $("angleValue").textContent = "۰°";
      $("playPause").textContent = "Ⅱ مکث";
      toast("بازنشانی شد");
    });
    $("fullscreenSim")?.addEventListener("click", async () => {
      const el = simCanvas.parentElement;
      try {
        if (!document.fullscreenElement) await el.requestFullscreen();
        else await document.exitFullscreen();
      } catch (e) { toast("تمام‌صفحه در دسترس نیست"); }
    });
    $("recordSim")?.addEventListener("click", () => {
      state.recording = !state.recording;
      if (state.recording) {
        state.recordedTrail = [];
        $("recordSim").style.color = "#f18cae";
        toast("ضبط شروع شد");
      } else {
        const blob = new Blob([JSON.stringify(state.recordedTrail, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tusi-trail-${Date.now()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        $("recordSim").style.color = "";
        toast(`ذخیره شد (${state.recordedTrail.length} نقطه)`);
      }
    });
    $("saveExperiment")?.addEventListener("click", () => {
      const key = "tusi-experiments-v1";
      let list = [];
      try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
      if (list.length >= 12) { toast("دفترچه پر است"); return; }
      list.unshift({
        name: "آزمایش " + fa(list.length + 1),
        radius: state.R,
        speed: state.speed,
        angle: state.angle0,
        date: new Date().toISOString()
      });
      try { localStorage.setItem(key, JSON.stringify(list)); toast("ذخیره شد"); renderExperiments(); } catch (e) { toast("ذخیره ناموفق"); }
    });
    function renderExperiments() {
      const listEl = $("experimentList");
      if (!listEl) return;
      let list = [];
      try { list = JSON.parse(localStorage.getItem("tusi-experiments-v1") || "[]"); } catch (e) {}
      if (!list.length) {
        listEl.innerHTML = '<p class="empty-state">هنوز آزمایشی ذخیره نکرده‌ای.</p>';
        return;
      }
      listEl.innerHTML = list.map((it, i) =>
        `<div class="experiment-item">
          <strong>${escapeHtml(it.name)}</strong>
          <small>شعاع ${fa(it.radius)} · سرعت ${Number(it.speed).toFixed(1)}× · زاویه ${fa(it.angle)}°</small>
          <button data-load="${i}">بارگذاری</button>
          <button data-delete="${i}">حذف</button>
        </div>`
      ).join("");
      listEl.querySelectorAll("[data-load]").forEach(b => b.addEventListener("click", () => {
        const it = list[+b.dataset.load];
        if (!it) return;
        state.R = it.radius;
        state.speed = it.speed;
        state.angle0 = it.angle;
        $("radiusRange").value = it.radius;
        $("speedRange").value = it.speed;
        $("angleRange").value = it.angle;
        $("radiusValue").textContent = fa(it.radius);
        $("speedValue").textContent = Number(it.speed).toFixed(1) + "×";
        $("angleValue").textContent = fa(it.angle) + "°";
        state.trail = [];
        toast("بارگذاری شد");
      }));
      listEl.querySelectorAll("[data-delete]").forEach(b => b.addEventListener("click", () => {
        list.splice(+b.dataset.delete, 1);
        try { localStorage.setItem("tusi-experiments-v1", JSON.stringify(list)); } catch (e) {}
        renderExperiments();
      }));
    }
    renderExperiments();
    $("clearExperiments")?.addEventListener("click", () => {
      if (confirm("همهٔ آزمایش‌ها پاک شوند؟")) {
        try { localStorage.removeItem("tusi-experiments-v1"); } catch (e) {}
        renderExperiments();
      }
    });

    // Research
    function renderResearch() {
      const R = Number($("radiusRange")?.value || 100);
      const angles = [0, 30, 45, 90, 180, 270, 360];
      const rows = angles.map(a => {
        const t = a * Math.PI / 180;
        const m = window.TusiMath.pointAt(R, t);
        return {
          angle: a,
          x: m.P.x, y: m.P.y,
          theoryX: R * Math.cos(t),
          err: Math.abs(m.P.x - R * Math.cos(t))
        };
      });
      const tb = $("researchRows");
      if (tb) {
        tb.innerHTML = rows.map(d =>
          `<tr>
            <td>${fa(d.angle)}°</td>
            <td>${d.x.toFixed(8)}</td>
            <td>${d.theoryX.toFixed(8)}</td>
            <td>${d.y.toFixed(8)}</td>
            <td>${d.err.toExponential(2)}</td>
          </tr>`
        ).join("");
      }
      const rc = $("researchChart");
      if (!rc) return;
      const rect = rc.getBoundingClientRect();
      const w = Math.max(320, rect.width || 560), h = 220;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rc.width = w * dpr;
      rc.height = h * dpr;
      rc.style.width = "100%";
      rc.style.height = h + "px";
      const c = rc.getContext("2d");
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      const pad = { l: 42, r: 14, t: 18, b: 32 };
      const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      const theme = getComputedStyle(document.documentElement);
      const textColor = theme.getPropertyValue("--muted").trim() || "#a2b2c9";
      const lineColor = theme.getPropertyValue("--line").trim() || "#526174";
      const max = Math.max(R, 1), min = -max;
      const Y = v => pad.t + ((max - v) / (max - min)) * ph;
      const X = i => pad.l + (i / 6) * pw;
      c.font = "11px Dubai, Tahoma, sans-serif";
      c.strokeStyle = lineColor;
      c.fillStyle = textColor;
      c.lineWidth = 1;
      for (let j = 0; j <= 4; j++) {
        const val = min + j * (max - min) / 4;
        const y = Y(val);
        c.beginPath(); c.moveTo(pad.l, y); c.lineTo(w - pad.r, y); c.stroke();
        c.fillText(val.toFixed(0), 3, y + 4);
      }
      c.beginPath();
      c.moveTo(pad.l, Y(0));
      c.lineTo(w - pad.r, Y(0));
      c.stroke();
      const drawSeries = (key, color) => {
        c.strokeStyle = color;
        c.lineWidth = 2.5;
        c.beginPath();
        rows.forEach((d, i) => {
          const x = X(i), y = Y(d[key]);
          if (i) c.lineTo(x, y); else c.moveTo(x, y);
        });
        c.stroke();
        rows.forEach((d, i) => {
          c.fillStyle = color;
          c.beginPath();
          c.arc(X(i), Y(d[key]), 3, 0, Math.PI * 2);
          c.fill();
        });
      };
      drawSeries("x", "#54d6df");
      drawSeries("y", "#efc36a");
      rows.forEach((d, i) => {
        c.fillStyle = textColor;
        c.fillText(String(d.angle), X(i) - 8, h - 9);
      });
      const concl = $("researchConclusion");
      if (concl) concl.textContent = `برای R=${R}، در تمام زوایای نمونه y=0 است.`;
    }
    let debounceTimer;
    const debouncedResearch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderResearch, 120);
    };
    $("refreshResearch")?.addEventListener("click", renderResearch);
    $("radiusRange")?.addEventListener("input", debouncedResearch);
    window.addEventListener("resize", debounceTimer ? () => {} : () => {});
    renderResearch();
    window.addEventListener("resize", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderResearch, 200);
    });
  }

  /* ─── Proof ─── */
  const proofs = [
    { k: "مدل هندسی", t: "مختصات را با زاویه می‌نویسیم", e: "C = (r cos θ, r sin θ)", p: "مرکز دایرهٔ کوچک روی مداری به شعاع r=R/2 حرکت می‌کند.", svg: `<svg viewBox="0 0 200 90"><circle cx="100" cy="45" r="30" fill="none" stroke="#54d6df" stroke-width="1.5"/><circle cx="100" cy="45" r="3" fill="#eef4ff"/><line x1="100" y1="45" x2="130" y2="45" stroke="#efc36a" stroke-width="1.5"/><text x="113" y="40" fill="#efc36a" font-size="10">r</text></svg>` },
    { k: "رابطهٔ زاویه‌ها", t: "نقطه نسبت به مرکز کوچک", e: "Q = (r cos(−θ), r sin(−θ))", p: "نقطهٔ P نسبت به مرکز دایرهٔ کوچک با زاویهٔ −θ توصیف می‌شود.", svg: `<svg viewBox="0 0 200 90"><circle cx="100" cy="45" r="26" fill="none" stroke="#efc36a" stroke-width="1.5"/><circle cx="100" cy="45" r="3" fill="#efc36a"/><line x1="100" y1="45" x2="82" y2="32" stroke="#a78bfa" stroke-width="1.5"/><text x="76" y="28" fill="#a78bfa" font-size="10">Q</text></svg>` },
    { k: "جمع بردارها", t: "مؤلفه‌های عمودی خنثی می‌شوند", e: "(R/2) sin θ + (R/2) sin(−θ) = 0", p: "چون سینوس تابعی فرد است، دو مؤلفهٔ عمودی یکدیگر را خنثی می‌کنند.", svg: `<svg viewBox="0 0 200 90"><line x1="30" y1="45" x2="170" y2="45" stroke="#54d6df" stroke-width="1.5"/><line x1="100" y1="15" x2="100" y2="75" stroke="#7bd9b1" stroke-width="1" stroke-dasharray="3,3"/><circle cx="100" cy="45" r="3" fill="#eef4ff"/></svg>` },
    { k: "نتیجه", t: "نقطه روی یک خط حرکت می‌کند", e: "P = (R cos θ, 0)", p: "وقتی y صفر بماند، نقطه فقط در راستای افقی جابه‌جا می‌شود.", svg: `<svg viewBox="0 0 200 90"><line x1="20" y1="45" x2="180" y2="45" stroke="#f18cae" stroke-width="2"/><circle cx="100" cy="45" r="5" fill="#f18cae"/><text x="107" y="40" fill="#f18cae" font-size="10">P</text></svg>` }
  ];
  let pIdx = 0;
  function renderProof() {
    const p = proofs[pIdx];
    const $k = $("proofKicker"), $t = $("proofTitle"), $e = $("proofEquation"),
      $p = $("proofText"), $v = $("proofVisual"), $s = $("proofStepLabel"),
      $b = $("proofProgress"), $prev = $("proofPrev"), $next = $("proofNext");
    if ($k) $k.textContent = p.k;
    if ($t) $t.textContent = p.t;
    if ($e) $e.textContent = p.e;
    if ($p) $p.textContent = p.p;
    if ($v) $v.innerHTML = p.svg;
    if ($s) $s.textContent = `مرحلهٔ ${fa(pIdx + 1)} از ${fa(proofs.length)}`;
    if ($b) $b.style.width = ((pIdx + 1) / proofs.length * 100) + "%";
    if ($prev) $prev.disabled = pIdx === 0;
    if ($next) $next.textContent = pIdx === proofs.length - 1 ? "از ابتدا ↺" : "بعدی ←";
  }
  $("proofPrev")?.addEventListener("click", () => { pIdx = Math.max(0, pIdx - 1); renderProof(); });
  $("proofNext")?.addEventListener("click", () => { pIdx = pIdx === proofs.length - 1 ? 0 : pIdx + 1; renderProof(); });
  renderProof();

  /* ─── Explain modal ─── */
  const explanations = {
    circle: ["حرکت دایره‌ای", "اگر نقطه‌ای روی دایره‌ای به شعاع r باشد، تصویر آن روی محور افقی برابر r cos(θ) و روی محور عمودی برابر r sin(θ) است. زاویه با زمان تغییر می‌کند."],
    combine: ["ترکیب حرکت‌ها", "زوج طوسی نتیجهٔ ترکیب دو حرکت دایره‌ای با نسبت‌های دقیق هندسی است. در این نمایش آموزشی، زاویه‌ها طوری مرتبط شده‌اند که مؤلفه‌های عمودی حذف شوند."],
    cancel: ["خنثی‌شدن مؤلفه‌ها", "برای هر زاویه، سینوس زاویهٔ منفی برابر منفی سینوس زاویهٔ مثبت است. بنابراین دو مؤلفهٔ عمودی هم‌اندازه و خلاف جهت‌اند."]
  };
  const modal = $("explainModal");
  let modalLastFocused = null;
  function openModal() {
    if (!modal) return;
    modalLastFocused = document.activeElement;
    modal.hidden = false;
    const closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus();
    document.addEventListener("keydown", trapFocus);
  }
  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.removeEventListener("keydown", trapFocus);
    if (modalLastFocused) modalLastFocused.focus();
  }
  function trapFocus(e) {
    if (e.key !== "Tab" || !modal) return;
    const focusables = modal.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])");
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.querySelectorAll(".explain-btn").forEach(b => b.addEventListener("click", () => {
    const [title, body] = explanations[b.dataset.explain];
    $("explainTitle").textContent = title;
    $("explainBody").textContent = body;
    openModal();
  }));
  document.querySelectorAll("[data-close-modal]").forEach(b => b.addEventListener("click", closeModal));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (modal && !modal.hidden) closeModal();
      if (document.body.classList.contains("presentation-mode")) {
        document.body.classList.remove("presentation-mode");
      }
    }
  });

  /* ─── Mission ─── */
  let missionSel = null, missionDone = false;
  let score = 0;
  try { score = Number(localStorage.getItem("tusi-score") || 0); } catch (e) {}
  const scoreEl = $("scoreValue");
  if (scoreEl) scoreEl.textContent = fa(score);
  document.querySelectorAll("#missionOptions button").forEach(b => b.addEventListener("click", () => {
    if (missionDone) return;
    missionSel = b.dataset.answer;
    document.querySelectorAll("#missionOptions button").forEach(x => x.classList.toggle("selected", x === b));
  }));
  $("checkMission")?.addEventListener("click", () => {
    if (missionDone) { toast("برای تکرار، «شروع دوباره» را بزن"); return; }
    if (!missionSel) { toast("یک گزینه را انتخاب کن"); return; }
    const ok = missionSel === "b";
    const fb = $("missionFeedback");
    if (fb) {
      fb.hidden = false;
      fb.className = "feedback " + (ok ? "success" : "error");
      fb.textContent = ok
        ? "درست است! رابطهٔ هندسی و زاویه‌ای عامل تعیین‌کننده است."
        : "این گزینه کافی نیست. رابطهٔ هندسی و زاویه‌ای باید درست باشد.";
    }
    const st = $("missionStatus");
    if (st) st.textContent = ok ? "تکمیل شد" : "نیاز به بررسی";
    if (ok) {
      score += 10;
      if (scoreEl) scoreEl.textContent = fa(score);
      try { localStorage.setItem("tusi-score", String(score)); } catch (e) {}
      missionDone = true;
      toast("۱۰ امتیاز گرفتی!");
    }
  });
  $("resetMission")?.addEventListener("click", () => {
    missionSel = null;
    missionDone = false;
    const st = $("missionStatus");
    if (st) st.textContent = "آمادهٔ شروع";
    const fb = $("missionFeedback");
    if (fb) fb.hidden = true;
    document.querySelectorAll("#missionOptions button").forEach(x => x.classList.remove("selected"));
  });
  $("saveHypothesis")?.addEventListener("click", () => {
    const val = $("hypothesisInput").value.trim();
    if (!val) { toast("اول بنویس"); return; }
    try { localStorage.setItem("tusi-hypothesis", val); } catch (e) {}
    const s = $("hypothesisSaved");
    if (s) s.hidden = false;
    toast("ذخیره شد");
  });
  try {
    const h = localStorage.getItem("tusi-hypothesis");
    if (h && $("hypothesisInput")) $("hypothesisInput").value = h;
  } catch (e) {}

  /* ─── Quiz ─── */
  const questions = [
    { q: "زوج طوسی چه چیزی را نشان می‌دهد؟", o: ["ترکیب حرکت‌های دایره‌ای برای ایجاد حرکت خطی", "محاسبهٔ مساحت مثلث", "اندازه‌گیری جرم سیاره"], a: 0, why: "ایدهٔ اصلی، ایجاد حرکت رفت‌وبرگشتی روی خط است." },
    { q: "برای مختصات دایره‌ای از کدام توابع استفاده می‌شود؟", o: ["فقط لگاریتم", "سینوس و کسینوس", "فقط توان دوم"], a: 1, why: "مختصات دایره‌ای با cos و sin بیان می‌شود." },
    { q: "رصدخانهٔ مراغه با کدام دانشمند پیوند دارد؟", o: ["ابن‌سینا", "خواجه نصیرالدین طوسی", "خیام فقط به عنوان معمار"], a: 1, why: "طوسی در شکل‌گیری رصدخانهٔ مراغه نقش مهمی داشت." },
    { q: "فرضیهٔ علمی خوب چه ویژگی‌ای دارد؟", o: ["هرگز تغییر نمی‌کند", "قابل بررسی و آزمایش است", "حتماً باید پیچیده باشد"], a: 1, why: "فرضیه باید قابل آزمایش باشد." },
    { q: "اگر y همیشه صفر باشد، چه نتیجه‌ای می‌گیریم؟", o: ["حرکت روی محور افقی", "نقطه روی دایره است", "هیچ حرکتی نیست"], a: 0, why: "y=0 یعنی حرکت افقی است." },
    { q: "اگر R=80 باشد، شعاع کوچک چقدر است؟", o: ["۲۰", "۴۰", "۸۰"], a: 1, why: "r = R/2 = 40." },
    { q: "فاصلهٔ مرکز بزرگ تا مرکز کوچک چقدر است؟", o: ["R/2", "R", "2R"], a: 0, why: "مرکز کوچک روی مداری به شعاع R/2 حرکت می‌کند." },
    { q: "در زاویهٔ ۹۰ درجه، x نظری چه مقدار است؟", o: ["R", "۰", "−R"], a: 1, why: "cos(90°)=0." },
    { q: "کدام مورد خطای ممیز شناور است؟", o: ["اختلاف کوچک ناشی از نمایش عددی رایانه", "تغییر نسبت شعاع‌ها", "قرار مرکز کوچک روی محیط"], a: 0, why: "محاسبات اعشاری رایانه خطاهای کوچکی دارند." },
    { q: "برای بررسی فرضیه چه روشی مناسب است؟", o: ["تغییر رنگ نمودار", "تولید داده از رابطه و مقایسه", "حدس بدون ثبت پارامتر"], a: 1, why: "فرضیه باید با روش روشن آزموده شود." }
  ];
  let qIdx = 0, qScore = 0, qAnswered = false;
  function renderQuiz() {
    const q = questions[qIdx];
    const $t = $("quizQuestion"), $c = $("quizCounter"), $s = $("quizScore"),
      $b = $("quizProgressBar"), $fb = $("quizFeedback"), $next = $("quizNext"),
      $opts = $("quizOptions");
    if ($t) $t.textContent = q.q;
    if ($c) $c.textContent = `سؤال ${fa(qIdx + 1)} از ${fa(questions.length)}`;
    if ($s) $s.textContent = "امتیاز: " + fa(qScore);
    if ($b) $b.style.width = ((qIdx + 1) / questions.length * 100) + "%";
    if ($fb) $fb.hidden = true;
    if ($next) {
      $next.disabled = true;
      $next.textContent = qIdx === questions.length - 1 ? "دیدن نتیجه ←" : "بعدی ←";
    }
    qAnswered = false;
    if ($opts) {
      $opts.innerHTML = q.o.map((o, i) =>
        `<button data-q="${i}">${["الف", "ب", "ج"][i]}) ${escapeHtml(o)}</button>`
      ).join("");
      $opts.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
        if (qAnswered) return;
        qAnswered = true;
        const chosen = +b.dataset.q, ok = chosen === q.a;
        if (ok) qScore++;
        $opts.querySelectorAll("button").forEach((x, i) => {
          x.disabled = true;
          if (i === q.a) x.classList.add("correct");
          if (i === chosen && !ok) x.classList.add("wrong");
        });
        if ($fb) {
          $fb.hidden = false;
          $fb.className = "feedback " + (ok ? "success" : "error");
          $fb.textContent = (ok ? "آفرین! " : "پاسخ درست: " + q.o[q.a] + ". ") + q.why;
        }
        if ($s) $s.textContent = "امتیاز: " + fa(qScore);
        if ($next) $next.disabled = false;
      }));
    }
  }
  $("quizNext")?.addEventListener("click", () => {
    if (!qAnswered) return;
    if (qIdx === questions.length - 1) {
      const $t = $("quizQuestion"), $opts = $("quizOptions"),
        $fb = $("quizFeedback"), $next = $("quizNext");
      if ($t) $t.textContent = `نتیجهٔ آزمون: ${fa(qScore)} از ${fa(questions.length)}`;
      if ($opts) $opts.innerHTML = "";
      if ($fb) {
        $fb.hidden = false;
        $fb.className = "feedback " + (qScore >= 7 ? "success" : "");
        $fb.textContent = qScore >= 7 ? "عالی! مفاهیم را فهمیدی." : "یک بار دیگر مرور کن و آزمون را تکرار کن.";
      }
      if ($next) {
        $next.disabled = true;
        $next.textContent = "آزمون پایان یافت";
      }
      return;
    }
    qIdx++;
    renderQuiz();
  });
  $("quizRestart")?.addEventListener("click", () => { qIdx = 0; qScore = 0; renderQuiz(); });
  renderQuiz();

  /* ─── Report & Presentation ─── */
  $("printReport")?.addEventListener("click", () => {
    const title = ($("reportTitle")?.value || "").trim() || "گزارش آزمایش زوج طوسی";
    const method = ($("reportMethod")?.value || "").trim();
    const conclusion = ($("reportConclusion")?.value || "").trim();
    const hypothesis = ($("hypothesisInput")?.value || "").trim();
    const old = document.getElementById("printReportSheet");
    if (old) old.remove();
    const sheet = document.createElement("section");
    sheet.id = "printReportSheet";
    sheet.style.cssText = "display:none";
    sheet.innerHTML = `
      <h1>${escapeHtml(title)}</h1>
      <h2>هدف</h2><p>بررسی رابطهٔ میان حرکت دایره‌ای و حرکت خطی در مدل آموزشی زوج طوسی.</p>
      <h2>فرضیه</h2><p>${escapeHtml(hypothesis || "فرضیه‌ای ثبت نشده است.")}</p>
      <h2>روش و مشاهده</h2><p>${escapeHtml(method || "توضیحی وارد نشده است.")}</p>
      <h2>نتیجه‌گیری</h2><p>${escapeHtml(conclusion || "توضیحی وارد نشده است.")}</p>
      <h2>محدودیت</h2><p>این گزارش بر پایهٔ یک مدل آموزشی ایده‌آل تهیه شده است.</p>
      <p>Tusi MathLab</p>
    `;
    document.body.appendChild(sheet);
    sheet.style.display = "block";
    window.print();
    setTimeout(() => sheet.remove(), 500);
  });
  $("copyPresentation")?.addEventListener("click", async () => {
    const text = "سلام. پروژهٔ من Tusi MathLab است. پرسش اصلی: چگونه ترکیب حرکت‌های دایره‌ای می‌تواند حرکت رفت‌وبرگشتی روی یک خط بسازد؟ ابتدا زمینهٔ تاریخی خواجه نصیرالدین طوسی را معرفی می‌کنم. سپس در شبیه‌ساز، پارامترها را تغییر می‌دهم و مسیر نقطه را مشاهده می‌کنیم. در بخش ریاضی، مختصات را با سینوس و کسینوس بیان می‌کنیم. در گالری، نسخه‌های خطی و میراث مکتوب را نمایش می‌دهیم. در پایان، نتیجه و محدودیت‌های مدل را بیان می‌کنم.";
    try {
      await navigator.clipboard.writeText(text);
      const s = $("copyStatus");
      if (s) s.hidden = false;
      toast("متن کپی شد");
    } catch (e) {
      const s = $("copyStatus");
      if (s) { s.hidden = false; s.textContent = text; }
      toast("کپی خودکار ممکن نبود");
    }
  });
  $("presentationBtn")?.addEventListener("click", () => {
    document.body.classList.toggle("presentation-mode");
    if (document.body.classList.contains("presentation-mode")) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      toast("حالت ارائه فعال شد. Esc برای خروج.");
    } else {
      if (document.fullscreenElement) document.exitFullscreen?.();
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) document.body.classList.remove("presentation-mode");
  });

  /* ─── Keyboard shortcuts ─── */
  document.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === " ") { e.preventDefault(); $("playPause")?.click(); }
    else if (k === "r") $("resetSim")?.click();
    else if (k === "t") $("themeToggle")?.click();
    else if (k === "c") $("cosmicToggle")?.click();
    else if (k === "p") $("presentationBtn")?.click();
  });
})();