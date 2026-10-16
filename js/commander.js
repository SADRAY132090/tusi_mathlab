/* Command palette (Ctrl+K) */
(() => {
  "use strict";
  const palette = document.getElementById("commandPalette");
  const input = document.getElementById("commandInput");
  const list = document.getElementById("commandList");
  const openBtn = document.getElementById("commandBtn");
  if (!palette || !input || !list) return;

  const cmds = [
    { icon: "▶", label: "پخش/توقف شبیه‌ساز", hint: "Space", run: () => document.getElementById("playPause")?.click() },
    { icon: "↺", label: "بازنشانی شبیه‌ساز", hint: "R", run: () => document.getElementById("resetSim")?.click() },
    { icon: "◐", label: "تغییر پوسته", hint: "T", run: () => document.getElementById("themeToggle")?.click() },
    { icon: "✦", label: "انیمیشن فضایی", hint: "C", run: () => document.getElementById("cosmicToggle")?.click() },
    { icon: "♪", label: "صدا", run: () => document.getElementById("audioToggle")?.click() },
    { icon: "◈", label: "حالت سه‌بعدی", run: () => document.getElementById("vrToggle")?.click() },
    { icon: "⛶", label: "حالت ارائه", hint: "P", run: () => document.getElementById("presentationBtn")?.click() },
    { icon: "→", label: "رفتن به آزمایشگاه", run: () => go("#simulator") },
    { icon: "→", label: "رفتن به آموزش", run: () => go("#learn") },
    { icon: "→", label: "رفتن به گالری", run: () => go("#gallery") },
    { icon: "→", label: "رفتن به مأموریت‌ها", run: () => go("#missions") },
    { icon: "→", label: "رفتن به تاریخچه", run: () => go("#history") },
    { icon: "→", label: "رفتن به منابع", run: () => go("#sources") },
    { icon: "▤", label: "چاپ گزارش", run: () => document.getElementById("printReport")?.click() },
    { icon: "▲", label: "بازگشت به بالا", run: () => window.scrollTo({ top: 0, behavior: "smooth" }) }
  ];
  function go(hash) {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  let active = 0, filtered = cmds.slice();

  function render() {
    list.innerHTML = filtered.map((c, i) =>
      `<li data-i="${i}" class="${i === active ? "active" : ""}" role="option">
        <span class="cmd-icon">${c.icon}</span>
        <span>${c.label}</span>
        ${c.hint ? `<span class="cmd-hint">${c.hint}</span>` : ""}
      </li>`
    ).join("");
    list.querySelectorAll("li").forEach(li => {
      li.addEventListener("click", () => run(+li.dataset.i));
      li.addEventListener("mouseenter", () => {
        active = +li.dataset.i;
        list.querySelectorAll("li").forEach((x, i) => x.classList.toggle("active", i === active));
      });
    });
  }
  function run(i) {
    const c = filtered[i];
    if (!c) return;
    close();
    setTimeout(() => c.run(), 60);
  }
  function open() {
    palette.hidden = false;
    input.value = "";
    active = 0;
    filtered = cmds.slice();
    render();
    setTimeout(() => input.focus(), 30);
  }
  function close() {
    palette.hidden = true;
    if (openBtn) openBtn.focus();
  }
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    filtered = q ? cmds.filter(c => c.label.toLowerCase().includes(q)) : cmds.slice();
    active = 0;
    render();
  });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      active = Math.min(active + 1, filtered.length - 1);
      render();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = Math.max(active - 1, 0);
      render();
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(active);
    } else if (e.key === "Escape") {
      close();
    }
  });
  palette.querySelectorAll("[data-close-command]").forEach(el => el.addEventListener("click", close));
  if (openBtn) openBtn.addEventListener("click", open);
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.hidden ? open() : close();
    }
  });
})();