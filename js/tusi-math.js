/* Core ideal Tusi-couple model */
(function (root) {
  "use strict";
  function pointAt(R, t) {
    if (!Number.isFinite(R) || R <= 0 || !Number.isFinite(t)) {
      throw new TypeError("R must be positive and parameters finite");
    }
    const r = R / 2;
    const C = { x: r * Math.cos(t), y: r * Math.sin(t) };
    const Q = { x: r * Math.cos(-t), y: r * Math.sin(-t) };
    return {
      R, r, C, Q,
      P: { x: C.x + Q.x, y: C.y + Q.y },
      theory: { x: R * Math.cos(t), y: 0 }
    };
  }
  function velocityAt(R, t, dt) {
    if (!Number.isFinite(dt) || dt <= 0) dt = 1e-4;
    const p1 = pointAt(R, t);
    const p2 = pointAt(R, t + dt);
    return {
      x: (p2.P.x - p1.P.x) / dt,
      y: (p2.P.y - p1.P.y) / dt
    };
  }
  const api = { pointAt, velocityAt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TusiMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this);