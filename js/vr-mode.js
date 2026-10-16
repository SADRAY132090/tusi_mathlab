/* VR depth effect — opt-in */
(() => {
  "use strict";
  const toggle = document.getElementById("vrToggle");
  if (!toggle) return;
  let enabled = false;
  const MAX_TILT = 4;
  let raf = 0, mx = 0, my = 0;
  const targets = [];

  function collect() {
    targets.length = 0;
    document.querySelectorAll(".panel, .hero-art, .readout").forEach(el => {
      targets.push(el);
      el.style.willChange = "transform";
    });
  }
  function loop() {
    if (!enabled) { raf = 0; return; }
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const dx = ((mx - cx) / cx) * MAX_TILT;
    const dy = ((my - cy) / cy) * MAX_TILT;
    for (const el of targets) {
      el.style.transform = `perspective(1200px) rotateY(${-dx}deg) rotateX(${dy}deg)`;
    }
    raf = requestAnimationFrame(loop);
  }
  window.addEventListener("pointermove", e => {
    mx = e.clientX; my = e.clientY;
    if (enabled && !raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  function setEnabled(on) {
    enabled = on;
    toggle.setAttribute("aria-pressed", String(on));
    toggle.textContent = on ? "◉" : "◈";
    if (on) {
      collect();
      raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf); raf = 0;
      for (const el of targets) el.style.transform = "";
    }
  }
  toggle.addEventListener("click", () => setEnabled(!enabled));
})();