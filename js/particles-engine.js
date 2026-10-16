/* Interactive particles engine (optional — disabled by default for performance) */
(() => {
  "use strict";
  const canvas = document.getElementById("particleField");
  if (!canvas || !canvas.getContext) return;
  // Disabled by default for performance. Uncomment usage in index.html to enable.
  return;
})();