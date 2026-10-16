"use strict";
const assert = require("node:assert/strict");
const { pointAt, velocityAt } = require("../js/tusi-math.js");
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("PASS", name); }
  catch (e) { failed++; console.error("FAIL", name, "—", e.message); }
}
function near(a, b, tol = 1e-10) {
  assert.ok(Math.abs(a - b) <= tol, `${a} not within ${tol} of ${b}`);
}
for (const R of [1, 2, 17, 80, 125]) {
  for (const deg of [0, 30, 45, 90, 180, 270, 360]) {
    test(`vector model R=${R}, angle=${deg}°`, () => {
      const t = deg * Math.PI / 180, m = pointAt(R, t);
      near(m.r, R / 2);
      near(Math.hypot(m.C.x, m.C.y), R / 2);
      near(Math.hypot(m.Q.x, m.Q.y), R / 2);
      near(m.C.x, m.Q.x);
      near(m.C.y, -m.Q.y);
      near(m.P.x, m.C.x + m.Q.x);
      near(m.P.y, m.C.y + m.Q.y);
      near(m.P.y, 0);
      near(m.P.x, R * Math.cos(t));
      near(m.P.x, m.theory.x);
      near(m.P.y, m.theory.y);
    });
  }
}
test("velocity finite with zero vertical", () => {
  const v = velocityAt(100, 1.0, 1e-5);
  assert.ok(Number.isFinite(v.x) && Number.isFinite(v.y));
  near(v.y, 0, 1e-3);
});
test("reject zero radius", () => assert.throws(() => pointAt(0, 0), TypeError));
test("reject negative radius", () => assert.throws(() => pointAt(-1, 0), TypeError));
test("reject NaN radius", () => assert.throws(() => pointAt(NaN, 0), TypeError));
test("reject Infinity radius", () => assert.throws(() => pointAt(Infinity, 0), TypeError));
test("reject NaN angle", () => assert.throws(() => pointAt(10, NaN), TypeError));
test("reject Infinity angle", () => assert.throws(() => pointAt(10, Infinity), TypeError));
console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;