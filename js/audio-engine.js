/* Ambient audio — opt-in only */
(() => {
  "use strict";
  const toggle = document.getElementById("audioToggle");
  if (!toggle) return;
  let ctx = null, masterGain = null, enabled = false, oscillators = [];

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    const freqs = [55, 82.5, 110, 164.81];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.06;
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      oscillators.push(osc);
    }
    return true;
  }
  function setEnabled(on) {
    enabled = on;
    if (!ctx && on) {
      if (!init()) { toggle.disabled = true; return; }
    }
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.linearRampToValueAtTime(on ? 0.2 : 0, now + 1);
    toggle.setAttribute("aria-pressed", String(on));
    toggle.textContent = on ? "♫" : "♪";
    toggle.title = on ? "خاموش کردن صدا" : "روشن کردن صدا";
  }
  toggle.addEventListener("click", () => setEnabled(!enabled));
})();