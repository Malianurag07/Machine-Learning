/* Demos for logistic-regression.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
  function solve(A0, b0) {
    const n = b0.length, A = A0.map((r, i) => r.concat(b0[i]));
    for (let i = 0; i < n; i++) { let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r; [A[i], A[m]] = [A[m], A[i]]; for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; } }
    const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; } return x;
  }
  /** Newton's method for logistic regression. rows: array of feature vectors (without the 1). pen: L2 strength on non-intercept weights. */
  function fitLogit(rows, y, pen) {
    const d = rows[0].length + 1; let w = new Array(d).fill(0);
    for (let it = 0; it < 40; it++) {
      const g = new Array(d).fill(0), H = Array.from({ length: d }, () => new Array(d).fill(0));
      rows.forEach((r, i) => { const v = [1, ...r], p = sig(v.reduce((s, t, k) => s + t * w[k], 0)), e = p - y[i], q = p * (1 - p); for (let a = 0; a < d; a++) { g[a] += e * v[a]; for (let b = 0; b < d; b++) H[a][b] += q * v[a] * v[b]; } });
      for (let a = 1; a < d; a++) { g[a] += pen * w[a]; H[a][a] += pen; } for (let a = 0; a < d; a++) H[a][a] += 1e-9;
      const step = solve(H, g); w = w.map((v, k) => v - step[k]); if (Math.max(...step.map(Math.abs)) < 1e-9) break;
    }
    return w;
  }

  /* ---------- line vs S-curve ---------- */
  (function () {
    const host = $("#demo-lin"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const base = [[0.5, 0], [1, 0], [1.5, 0], [2, 1], [2.5, 0], [3, 0], [3.5, 1], [4, 0], [4.5, 1], [5, 1], [5.5, 1], [6, 1]]; let pts = base.map((p) => p.slice());
    const ols = (P) => { const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]), mx = mean(xs), my = mean(ys); let n = 0, d = 0; P.forEach((p) => { n += (p[0] - mx) * (p[1] - my); d += (p[0] - mx) ** 2; }); const b = n / d; return [my - b * mx, b]; };
    const models = (P) => { const [a, b] = ols(P), w = fitLogit(P.map((p) => [p[0]]), P.map((p) => p[1]), 0.001); return { a, b, w, bl: (0.5 - a) / b, bg: -w[0] / w[1] }; };
    const m0 = models(base);
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const m = models(pts), P = plane(W, H, [-1, 14], [-0.5, 1.5], { l: 42, r: 14, t: 12, b: 34 });
      axes(ctx, P, { nx: 5, ny: 4, xl: "hours studied", yl: "pass = 1 / fail = 0", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      line(ctx, P.X(-1), P.Y(0), P.X(14), P.Y(0), css("--muted"), 2, [6, 5]); line(ctx, P.X(-1), P.Y(1), P.X(14), P.Y(1), css("--muted"), 2, [6, 5]);
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      line(ctx, P.X(-1), P.Y(m.a - m.b), P.X(14), P.Y(m.a + 14 * m.b), css("--c2"), 4.5);
      ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = -1 + (15 * i) / 200, y = sig(m.w[0] + m.w[1] * x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 5; ctx.stroke();
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 6.5, p[1] ? css("--c3") : css("--c1"))); ctx.restore();
      [[m.bl, css("--c2")], [m.bg, css("--accent")]].forEach(([x, c], i) => { if (x > -1 && x < 14) { line(ctx, P.X(x), P.Y(-0.5) - 12 * (i + 1), P.X(x), P.Y(-0.5), c, 3); } });
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = css("--c2"); ctx.fillText("straight line (linear regression)", P.pad.l + 10, P.pad.t + 16); ctx.fillStyle = css("--accent"); ctx.fillText("S-curve (logistic regression)", P.pad.l + 10, P.pad.t + 34);
    });
    function show() {
      const m = models(pts), out0 = pts.length > base.length;
      out.innerHTML = `Straight line: predicts <b style="color:${m.a < 0 ? "var(--bad)" : "inherit"}">${m.a.toFixed(2)}</b> at 0 hours and <b style="color:${m.a + 12 * m.b > 1 ? "var(--bad)" : "inherit"}">${(m.a + 12 * m.b).toFixed(2)}</b> at 12 hours ${m.a < 0 || m.a + 12 * m.b > 1 ? "→ impossible as probabilities" : ""}. Its 0.5 boundary is at <b>${m.bl.toFixed(2)}</b> h.<br>S-curve: always between 0 and 1. Its boundary is at <b>${m.bg.toFixed(2)}</b> h.` + (out0 ? `<br>With the outlier the straight-line boundary moved from ${m0.bl.toFixed(2)} to <b>${m.bl.toFixed(2)}</b> h, while the S-curve boundary moved only from ${m0.bg.toFixed(2)} to <b>${m.bg.toFixed(2)}</b> h.` : ""); cv.redraw();
    }
    btn(ctl, "Add an outlier (12 h, passed)", () => { if (pts.length === base.length) pts.push([12, 1]); show(); }, "primary"); btn(ctl, "Reset", () => { pts = base.map((p) => p.slice()); show(); }); show();
  })();

  /* ---------- sigmoid explorer ---------- */
  (function () {
    const host = $("#demo-sig"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let t0 = -2, t1 = 1, x = 3;
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [-6, 8], [-0.05, 1.05], { l: 42, r: 14, t: 12, b: 34 }); axes(ctx, P, { nx: 7, ny: 4, xl: "input x", yl: "probability p", fx: (v) => Math.round(v), fy: (v) => v.toFixed(2) });
      line(ctx, P.X(-6), P.Y(0.5), P.X(8), P.Y(0.5), css("--muted"), 2, [6, 5]);
      ctx.beginPath(); for (let i = 0; i <= 200; i++) { const xx = -6 + (14 * i) / 200, y = sig(t0 + t1 * xx); i ? ctx.lineTo(P.X(xx), P.Y(y)) : ctx.moveTo(P.X(xx), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 5; ctx.stroke();
      if (Math.abs(t1) > 0.02) { const b = -t0 / t1; if (b > -6 && b < 8) { line(ctx, P.X(b), P.Y(0), P.X(b), P.Y(1), css("--c1"), 3, [8, 6]); ctx.fillStyle = css("--c1"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("boundary x = " + b.toFixed(2), P.X(b), P.Y(1) + 2); } }
      const p = sig(t0 + t1 * x); line(ctx, P.X(x), P.Y(0), P.X(x), P.Y(p), css("--c3"), 3); dot(ctx, P.X(x), P.Y(p), 9, css("--c3"));
    });
    function show() { const z = t0 + t1 * x, p = sig(z), odds = p / (1 - p); out.innerHTML = `score z = ${t0.toFixed(1)} + ${t1.toFixed(1)}×${x.toFixed(1)} = <b>${z.toFixed(2)}</b> → p = 1 ÷ (1 + e<sup>${(-z).toFixed(2)}</sup>) = <b>${p.toFixed(3)}</b> → class <b>${p >= 0.5 ? 1 : 0}</b> · odds = p ÷ (1 − p) = <b>${odds < 1000 ? odds.toFixed(2) : "huge"}</b> (= e<sup>z</sup>)<br>Each +1 in x multiplies the odds by e<sup>${t1.toFixed(1)}</sup> = <b>${Math.exp(t1).toFixed(2)}</b>.`; cv.redraw(); }
    slider(ctl, { label: "θ₀ (shift)", min: -8, max: 8, step: 0.1, value: t0, fmt: (v) => v.toFixed(1), onInput: (v) => { t0 = v; show(); } });
    slider(ctl, { label: "θ₁ (sharpness)", min: -3, max: 3, step: 0.1, value: t1, fmt: (v) => v.toFixed(1), onInput: (v) => { t1 = v; show(); } });
    slider(ctl, { label: "a new input x", min: -6, max: 8, step: 0.1, value: x, fmt: (v) => v.toFixed(1), onInput: (v) => { x = v; show(); } }); show();
  })();

  /* ---------- log-loss ---------- */
  (function () {
    const host = $("#demo-ll"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let truth = 1, p = 0.9;
    const cost = (pp) => -Math.log(truth ? pp : 1 - pp);
    const cv = ML.canvas($("[data-canvas]", host), 270, (ctx, W, H) => {
      const P = plane(W, H, [0, 1], [0, 5], { l: 44, r: 14, t: 12, b: 34 }); axes(ctx, P, { nx: 5, ny: 5, xl: "model's probability of class 1", yl: "cost", fx: (v) => v.toFixed(1), fy: (v) => Math.round(v) });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      ctx.beginPath(); for (let i = 1; i < 200; i++) { const pp = i / 200, c = cost(pp); i > 1 ? ctx.lineTo(P.X(pp), P.Y(c)) : ctx.moveTo(P.X(pp), P.Y(c)); } ctx.strokeStyle = css("--c4"); ctx.lineWidth = 5; ctx.stroke();
      line(ctx, P.X(p), P.Y(0), P.X(p), P.Y(cost(p)), css("--accent"), 3, [5, 4]); dot(ctx, P.X(p), P.Y(cost(p)), 9, css("--accent")); ctx.restore();
      ctx.font = "700 14px Fredoka, sans-serif"; ctx.fillStyle = css("--good"); ctx.textAlign = truth ? "right" : "left"; ctx.fillText("✔ right & confident: cost ≈ 0", truth ? P.X(1) - 6 : P.X(0) + 6, P.Y(0) - 8); ctx.fillStyle = css("--bad"); ctx.textAlign = truth ? "left" : "right"; ctx.fillText("✘ confidently wrong: cost explodes", truth ? P.X(0) + 12 : P.X(1) - 12, P.Y(4.6));
    });
    function show() { const c = cost(p); out.innerHTML = `Truth = <b>${truth}</b>, model says p = <b>${p.toFixed(2)}</b> → cost = −log(${truth ? p.toFixed(2) : "1 − " + p.toFixed(2)}) = <b>${c.toFixed(3)}</b> · ` + (c < 0.3 ? "😌 barely surprised." : c < 1 ? "🙂 mildly surprised." : c < 2.5 ? "😟 quite surprised." : "😱 shocked: the model was confidently wrong."); cv.redraw(); }
    const tb = btn(ctl, "The truth is: 1 (class 1)", () => { truth = truth ? 0 : 1; tb.textContent = "The truth is: " + (truth ? "1 (class 1)" : "0 (class 0)"); show(); });
    slider(ctl, { label: "Model's p(class 1)", min: 0.01, max: 0.99, step: 0.01, value: p, fmt: (v) => v.toFixed(2), onInput: (v) => { p = v; show(); } }); show();
  })();

  /* ---------- gradient descent training ---------- */
  (function () {
    const host = $("#demo-gd"), out = $("[data-out]", host), ctl = $("[data-controls]", host), X = [1, 2, 3, 4, 5, 6], Y = [0, 0, 1, 0, 1, 1];
    let th = [0, 0], lr = 0.5, hist = [], timer = 0, steps = 0;
    const J = (t) => mean(X.map((x, i) => { const p = sig(t[0] + t[1] * x); return -Math.log(Y[i] ? p : 1 - p); })), best = fitLogit(X.map((x) => [x]), Y, 0), Jbest = J(best);
    hist.push(J(th));
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const lw = Math.round(W * 0.58), P = plane(lw, H, [0, 7], [-0.1, 1.1], { l: 38, r: 6, t: 16, b: 32 });
      ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("data and the current S-curve", lw / 2, 12);
      axes(ctx, P, { nx: 7, ny: 2, xl: "hours studied", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      ctx.beginPath(); for (let i = 0; i <= 120; i++) { const x = (7 * i) / 120, y = sig(th[0] + th[1] * x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); for (let i = 0; i <= 120; i++) { const x = (7 * i) / 120, y = sig(best[0] + best[1] * x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.setLineDash([7, 6]); ctx.strokeStyle = css("--good"); ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
      X.forEach((x, i) => dot(ctx, P.X(x), P.Y(Y[i]), 7, Y[i] ? css("--c3") : css("--c1")));
      const ox = lw + 14, Q = plane(W - ox, H, [0, Math.max(40, steps)], [0, Math.max(hist[0], 0.8)], { l: 34, r: 8, t: 16, b: 32 });
      ctx.save(); ctx.translate(ox, 0); ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("cost J (log-loss) over steps", (W - ox) / 2, 12);
      axes(ctx, Q, { nx: 3, ny: 3, xl: "step", fx: (v) => Math.round(v), fy: (v) => v.toFixed(2) }); line(ctx, Q.X(0), Q.Y(Jbest), Q.X(Math.max(40, steps)), Q.Y(Jbest), css("--good"), 2, [6, 5]);
      ctx.beginPath(); hist.forEach((v, i) => (i ? ctx.lineTo(Q.X(i), Q.Y(v)) : ctx.moveTo(Q.X(i), Q.Y(v)))); ctx.strokeStyle = css("--c2"); ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();
    });
    function step() {
      let ge = 0, gx = 0; X.forEach((x, i) => { const e = sig(th[0] + th[1] * x) - Y[i]; ge += e / 6; gx += (e * x) / 6; });
      const o = th.slice(); th = [th[0] - lr * ge, th[1] - lr * gx]; steps++; hist.push(J(th));
      return `average error = ${ge.toFixed(3)}, average of error × x = ${gx.toFixed(3)} → θ₀ = ${o[0].toFixed(3)} − ${lr}×${ge.toFixed(3)} = <b>${th[0].toFixed(3)}</b>, θ₁ = ${o[1].toFixed(3)} − ${lr}×${gx.toFixed(3)} = <b>${th[1].toFixed(3)}</b>`;
    }
    function show(msg) { out.innerHTML = `step <b>${steps}</b> · θ₀ = <b>${th[0].toFixed(3)}</b>, θ₁ = <b>${th[1].toFixed(3)}</b> · cost J = <b>${hist[hist.length - 1].toFixed(4)}</b> (lowest possible ${Jbest.toFixed(4)}, green dashed curve: θ₀ = ${best[0].toFixed(2)}, θ₁ = ${best[1].toFixed(2)})` + (msg ? "<br>" + msg : "") + `<br>Decision boundary now at x = ${Math.abs(th[1]) > 1e-6 ? (-th[0] / th[1]).toFixed(2) : "?"} hours.`; cv.redraw(); }
    function stop() { clearInterval(timer); timer = 0; rb.textContent = "▶ Run"; }
    btn(ctl, "Step", () => { stop(); show(step()); }, "primary");
    const rb = btn(ctl, "▶ Run", () => { if (timer) return stop(); rb.textContent = "❚❚ Pause"; timer = setInterval(() => { let m; for (let i = 0; i < 4; i++) m = step(); show(m); if (steps > 1500) stop(); }, 50); });
    btn(ctl, "Reset", () => { stop(); th = [0, 0]; steps = 0; hist = [J(th)]; show(); });
    slider(ctl, { label: "Learning rate α", min: 0.05, max: 2, step: 0.05, value: lr, fmt: (v) => v.toFixed(2), onInput: (v) => (lr = v) });
    show("Press <b>Step</b> once: it reproduces the hand calculation above (θ₁ = 0.292).");
  })();

  /* ---------- 2-D classifier ---------- */
  (function () {
    const host = $("#demo-2d"), out = $("[data-out]", host), ctl = $("[data-controls]", host), r = rng(33);
    const gen = () => { const P = []; for (let i = 0; i < 22; i++) { P.push([clamp(3.4 + 1.5 * randn(r), 0.2, 9.8), clamp(64 + 9 * randn(r), 42, 98), 0]); P.push([clamp(6.6 + 1.5 * randn(r), 0.2, 9.8), clamp(82 + 8 * randn(r), 42, 98), 1]); } return P; };
    let pts = gen(), lv = 0, thr = 0.5, addCls = 1, lastP, model;
    function fit() { const m1 = mean(pts.map((p) => p[0])), s1 = sd(pts.map((p) => p[0])), m2 = mean(pts.map((p) => p[1])), s2 = sd(pts.map((p) => p[1])); const w = fitLogit(pts.map((p) => [(p[0] - m1) / s1, (p[1] - m2) / s2]), pts.map((p) => p[2]), 1 / 10 ** lv); model = { w, m1, s1, m2, s2 }; }
    const prob = (x1, x2) => sig(model.w[0] + model.w[1] * ((x1 - model.m1) / model.s1) + model.w[2] * ((x2 - model.m2) / model.s2));
    fit();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const P = plane(W, H, [0, 10], [40, 100], { l: 44, r: 12, t: 12, b: 34 }); lastP = P;
      ctx.globalAlpha = 0.16; for (let px = P.pad.l; px < W - P.pad.r; px += 10) for (let py = P.pad.t; py < H - P.pad.b; py += 10) { ctx.fillStyle = prob(P.iX(px + 5), P.iY(py + 5)) >= thr ? css("--c3") : css("--c2"); ctx.fillRect(px, py, 10, 10); } ctx.globalAlpha = 1;
      axes(ctx, P, { nx: 5, ny: 3, grid: false, xl: "hours studied", yl: "attendance %", fy: (v) => Math.round(v) });
      const lg = Math.log(thr / (1 - thr)), w = model.w;
      if (Math.abs(w[2]) > 1e-6) { const at = (x1) => model.m2 + model.s2 * ((lg - w[0] - w[1] * ((x1 - model.m1) / model.s1)) / w[2]); ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip(); line(ctx, P.X(0), P.Y(at(0)), P.X(10), P.Y(at(10)), css("--text"), 4, [10, 7]); ctx.restore(); }
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, p[2] ? css("--c3") : css("--c2")));
    });
    function show() {
      fit(); let tp = 0, fp = 0, fn = 0, tn = 0; pts.forEach((p) => { const pr = prob(p[0], p[1]) >= thr ? 1 : 0; if (pr && p[2]) tp++; else if (pr) fp++; else if (p[2]) fn++; else tn++; });
      const acc = (tp + tn) / pts.length, pre = tp + fp ? tp / (tp + fp) : 0, rec = tp + fn ? tp / (tp + fn) : 0;
      out.innerHTML = `C = <b>${(10 ** lv).toPrecision(2)}</b> · threshold = <b>${thr.toFixed(2)}</b> · weights (scaled features): θ₀ = ${model.w[0].toFixed(2)}, θ<sub>hours</sub> = <b>${model.w[1].toFixed(2)}</b>, θ<sub>attendance</sub> = <b>${model.w[2].toFixed(2)}</b><br>TP ${tp} · FP ${fp} · FN ${fn} · TN ${tn} → accuracy <b>${(acc * 100).toFixed(0)}%</b> · precision <b>${(pre * 100).toFixed(0)}%</b> · recall <b>${(rec * 100).toFixed(0)}%</b><br>` + (thr < 0.35 ? "Low threshold: more students flagged as 'pass' → recall up, precision down." : thr > 0.65 ? "High threshold: only very sure 'pass' predictions → precision up, recall down." : "Click the plot to add a point of the chosen class, and watch the boundary move."); cv.redraw();
    }
    slider(ctl, { label: "Threshold", min: 0.05, max: 0.95, step: 0.05, value: thr, fmt: (v) => v.toFixed(2), onInput: (v) => { thr = v; show(); } });
    slider(ctl, { label: "log₁₀ C (regularisation)", min: -2, max: 2, step: 0.25, value: lv, fmt: (v) => v.toFixed(2), onInput: (v) => { lv = v; show(); } });
    const tb = btn(ctl, "Click adds: PASS", () => { addCls = addCls ? 0 : 1; tb.textContent = "Click adds: " + (addCls ? "PASS" : "FAIL"); }); btn(ctl, "Reset points", () => { pts = gen(); show(); });
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), P = lastP; if (p.x > P.pad.l && p.x < P.w - P.pad.r && p.y > P.pad.t && p.y < P.h - P.pad.b) { pts.push([clamp(P.iX(p.x), 0, 10), clamp(P.iY(p.y), 40, 100), addCls]); show(); } });
    show();
  })();
});
