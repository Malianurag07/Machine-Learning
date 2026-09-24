/* Demos for ridge.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;

  /** Solve A x = b (Gaussian elimination, partial pivoting). */
  function solve(A0, b0) {
    const n = b0.length, A = A0.map((r, i) => r.concat(b0[i]));
    for (let i = 0; i < n; i++) {
      let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
      [A[i], A[m]] = [A[m], A[i]];
      for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
    return x;
  }
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };

  /* ---------- 1-feature ridge ---------- */
  (function () {
    const host = $("#demo-r1"), out = $("[data-out]", host), ctl = $("[data-controls]", host), base = [[1, 2], [2, 4], [3, 5], [4, 8]];
    let pts = base.map((p) => p.slice()), lam = 0;
    const stats = () => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0; pts.forEach((p) => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; }); return { mx, my, sxy, sxx }; };
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [0, 7], [0, 14], { l: 40, r: 14, t: 12, b: 32 }), s = stats(), b1o = s.sxy / s.sxx, b1r = s.sxy / (s.sxx + lam), l = (b1) => [s.my - b1 * s.mx, b1];
      axes(ctx, P, { nx: 7, ny: 7, xl: "x", yl: "y", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      const [a0, b0] = l(b1o), [a1, b1] = l(b1r);
      line(ctx, P.X(0), P.Y(a0), P.X(7), P.Y(a0 + 7 * b0), css("--good"), 3.5, [10, 7]);
      line(ctx, P.X(0), P.Y(a1), P.X(7), P.Y(a1 + 7 * b1), css("--accent"), 5.5);
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 6.5, css("--c1")));
      ctx.font = "700 20px Fredoka"; ctx.fillStyle = css("--ink"); ctx.textAlign = "center"; ctx.fillText("✚", P.X(s.mx), P.Y(s.my) + 7); ctx.restore();
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = css("--good"); ctx.fillText("OLS (λ = 0)", P.pad.l + 10, P.pad.t + 16); ctx.fillStyle = css("--accent"); ctx.fillText("Ridge", P.pad.l + 10, P.pad.t + 34);
    });
    function show() {
      const s = stats(), b1r = s.sxy / (s.sxx + lam), b0r = s.my - b1r * s.mx;
      out.innerHTML = `centre ✚ = (${s.mx.toFixed(2)}, ${s.my.toFixed(2)}) · S<sub>xy</sub> = ${s.sxy.toFixed(2)} · S<sub>xx</sub> = ${s.sxx.toFixed(2)}<br>Ridge slope θ₁ = S<sub>xy</sub> ÷ (S<sub>xx</sub> + λ) = ${s.sxy.toFixed(2)} ÷ (${s.sxx.toFixed(2)} + ${lam.toFixed(1)}) = <b>${b1r.toFixed(3)}</b> (OLS: ${(s.sxy / s.sxx).toFixed(3)}) · θ₀ = ${s.my.toFixed(2)} − ${b1r.toFixed(3)}×${s.mx.toFixed(2)} = <b>${b0r.toFixed(3)}</b><br>Prediction at x = 5: <b>${(b0r + 5 * b1r).toFixed(3)}</b>`;
      cv.redraw();
    }
    slider(ctl, { label: "Strength λ", min: 0, max: 30, step: 0.5, value: 0, fmt: (v) => v.toFixed(1), onInput: (v) => { lam = v; show(); } });
    btn(ctl, "Add an outlier", () => { pts.push([1.5, 11]); show(); }, "primary"); btn(ctl, "Reset", () => { pts = base.map((p) => p.slice()); show(); }); show();
  })();

  /* ---------- coefficient paths ---------- */
  (function () {
    const host = $("#demo-r2"), out = $("[data-out]", host), ctl = $("[data-controls]", host), tbl = $("#r2Tbl"), r = rng(12), N = 50;
    const raw = { x1: [], x2: [], x3: [], x4: [], x5: [] }, y = [];
    for (let i = 0; i < N; i++) { const b = randn(r); raw.x1.push(b + 0.08 * randn(r)); raw.x2.push(b + 0.08 * randn(r)); raw.x3.push(b + 0.08 * randn(r)); raw.x4.push(randn(r)); raw.x5.push(randn(r)); y.push(2 * b + 1.5 * raw.x4[i] + randn(r)); }
    const names = Object.keys(raw), Z = names.map((k) => { const m = mean(raw[k]), s = sd(raw[k]); return raw[k].map((v) => (v - m) / s); }), ym = mean(y), yc = y.map((v) => v - ym), p = names.length;
    const XtX = Z.map((a) => Z.map((b) => a.reduce((s, v, i) => s + v * b[i], 0))), Xty = Z.map((a) => a.reduce((s, v, i) => s + v * yc[i], 0));
    const fit = (lam) => solve(XtX.map((row, i) => row.map((v, j) => v + (i === j ? lam : 0))), Xty); // coefficients per 1 standard deviation of each feature
    const grid = []; for (let v = -1; v <= 4.001; v += 0.1) grid.push(v); const paths = grid.map((v) => fit(10 ** v)), ols = fit(1e-6);
    let lv = -1; const cols = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--bad)"], R = (c) => css(c.slice(4, -1));
    const lo = Math.min(...paths.flat(), ...ols) - 0.2, hi = Math.max(...paths.flat(), ...ols) + 0.2;
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [-1, 4], [lo, hi], { l: 46, r: 46, t: 12, b: 34 }); axes(ctx, P, { nx: 5, ny: 5, xl: "log₁₀ λ  (→ stronger regularisation)", yl: "coefficient", fx: (v) => v.toFixed(0), fy: (v) => v.toFixed(1) });
      line(ctx, P.X(-1), P.Y(0), P.X(4), P.Y(0), css("--line"), 2);
      for (let k = 0; k < p; k++) { ctx.beginPath(); grid.forEach((v, i) => (i ? ctx.lineTo(P.X(v), P.Y(paths[i][k])) : ctx.moveTo(P.X(v), P.Y(paths[i][k])))); ctx.strokeStyle = R(cols[k]); ctx.lineWidth = 3.5; ctx.stroke(); ctx.fillStyle = R(cols[k]); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillText(names[k], P.X(-1) + 4 + 0, P.Y(paths[0][k]) - 6); }
      line(ctx, P.X(lv), P.Y(lo), P.X(lv), P.Y(hi), css("--text"), 2, [5, 4]);
      const cur = fit(10 ** lv); cur.forEach((c, k) => dot(ctx, P.X(lv), P.Y(c), 6, R(cols[k])));
    });
    function show() {
      const c = fit(10 ** lv);
      tbl.innerHTML = "<tr><th>feature</th><th>role</th><th class='num'>OLS (λ≈0)</th><th class='num'>Ridge (λ = " + (10 ** lv).toPrecision(3) + ")</th></tr>" + names.map((n, k) => `<tr><td><b style="color:${R(cols[k])}">${n}</b></td><td>${k < 3 ? "near-copy of the same signal" : k === 3 ? "independent, real effect" : "pure noise (true effect 0)"}</td><td class="num">${ols[k].toFixed(2)}</td><td class="num"><b>${c[k].toFixed(2)}</b></td></tr>`).join("") + `<tr><th colspan="2">Sum of x₁ + x₂ + x₃ (their joint effect)</th><th class="num">${(ols[0] + ols[1] + ols[2]).toFixed(2)}</th><th class="num">${(c[0] + c[1] + c[2]).toFixed(2)}</th></tr>`;
      out.innerHTML = `λ = <b>${(10 ** lv).toPrecision(3)}</b>. Watch the three twins: at small λ they can be very different from each other (OLS is unstable); as λ grows they draw <b>together</b> and every coefficient shrinks towards 0 but none hits exactly 0. Their joint effect stays roughly the same until λ gets large.`; cv.redraw();
    }
    slider(ctl, { label: "log₁₀ λ", min: -1, max: 4, step: 0.1, value: lv, fmt: (v) => v.toFixed(1), onInput: (v) => { lv = v; show(); } }); show();
  })();

  /* ---------- polynomial ridge ---------- */
  (function () {
    const host = $("#demo-r3"), out = $("[data-out]", host), ctl = $("[data-controls]", host), f = (x) => Math.sin(2 * Math.PI * x) * 0.85, r = rng(5), tr = [], te = [];
    for (let i = 0; i < 10; i++) { const x = (i + 0.5) / 10 + (r() - 0.5) * 0.06; tr.push([x, f(x) + 0.2 * randn(r)]); } for (let i = 0; i < 40; i++) { const x = r(); te.push([x, f(x) + 0.2 * randn(r)]); }
    const sx = (x) => 2 * x - 1, phi = (x, d) => { const z = sx(x); return Array.from({ length: d + 1 }, (_, j) => z ** j); };
    function fit(d, lam) { const F = tr.map((p) => phi(p[0], d)), n = d + 1, A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => F.reduce((s, row) => s + row[i] * row[j], 0) + (i === j && i > 0 ? lam : 0) + (i === j ? 1e-10 : 0))), b = Array.from({ length: n }, (_, i) => F.reduce((s, row, k) => s + row[i] * tr[k][1], 0)); return solve(A, b); }
    const pred = (w, x) => phi(x, w.length - 1).reduce((s, v, j) => s + v * w[j], 0), mse = (w, D) => mean(D.map((p) => (pred(w, p[0]) - p[1]) ** 2));
    let deg = 9, lv = -6, errs = [];
    const vs = []; for (let v = -6; v <= 2.001; v += 0.25) vs.push(v);
    const recompute = () => { errs = vs.map((v) => { const w = fit(deg, 10 ** v); return [mse(w, tr), mse(w, te)]; }); };
    recompute();
    const cv = ML.canvas($("[data-canvas]", host), 310, (ctx, W, H) => {
      const lw = Math.round(W * 0.56), P = plane(lw, H, [0, 1], [-1.6, 1.6], { l: 36, r: 6, t: 10, b: 28 }); axes(ctx, P, { nx: 4, ny: 4, xl: "x", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      ctx.beginPath(); for (let i = 0; i <= 100; i++) { const x = i / 100; i ? ctx.lineTo(P.X(x), P.Y(f(x))) : ctx.moveTo(P.X(x), P.Y(f(x))); } ctx.setLineDash([6, 5]); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      const w = fit(deg, 10 ** lv); ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200, y = pred(w, x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4.5; ctx.stroke();
      te.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4, null, css("--c2"))); tr.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 6, css("--c1"))); ctx.restore();
      const lg = (v) => Math.log10(Math.max(v, 1e-4)), Q = plane(W, H, [-6, 2], [-3, 1.5], { l: lw + 44, r: 8, t: 26, b: 28 }); ctx.save(); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("error vs log₁₀ λ", (Q.pad.l + W) / 2, 15); ctx.restore();
      axes(ctx, Q, { nx: 4, ny: 3, fx: (v) => Math.round(v), fy: (v) => "10^" + Math.round(v) });
      [[0, css("--c1")], [1, css("--c2")]].forEach(([k, col]) => { ctx.beginPath(); vs.forEach((v, i) => (i ? ctx.lineTo(Q.X(v), Q.Y(lg(errs[i][k]))) : ctx.moveTo(Q.X(v), Q.Y(lg(errs[i][k]))))); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); const i = vs.findIndex((v) => Math.abs(v - lv) < 1e-6); if (i >= 0) dot(ctx, Q.X(lv), Q.Y(lg(errs[i][k])), 6, col); });
      let bi = 0; errs.forEach((e, i) => { if (e[1] < errs[bi][1]) bi = i; }); ctx.font = "700 18px Fredoka"; ctx.fillStyle = css("--good"); ctx.textAlign = "center"; ctx.fillText("★", Q.X(vs[bi]), Q.Y(lg(errs[bi][1])) - 8);
    });
    function show() {
      const i = vs.findIndex((v) => Math.abs(v - lv) < 1e-6), [a, b] = errs[i]; let bi = 0; errs.forEach((e, k) => { if (e[1] < errs[bi][1]) bi = k; });
      const verdict = b > 3 * a && b > 0.08 ? "🟥 <b>Overfitting</b>: tiny training error, big test error (the wiggly curve)." : a > 0.06 ? "🟦 <b>Underfitting</b>: λ is too large, so the curve is squashed flat." : "🟩 <b>Good balance</b>: smooth curve, test error close to the best possible.";
      out.innerHTML = `degree <b>${deg}</b> · λ = <b>${(10 ** lv).toPrecision(2)}</b> · train MSE <b>${a.toFixed(4)}</b> · test MSE <b>${b.toFixed(4)}</b> · best test error is at λ ≈ <b>${(10 ** vs[bi]).toPrecision(2)}</b> (★)<br>${verdict}`; cv.redraw();
    }
    slider(ctl, { label: "log₁₀ λ", min: -6, max: 2, step: 0.25, value: lv, fmt: (v) => v.toFixed(2), onInput: (v) => { lv = v; show(); } });
    slider(ctl, { label: "Polynomial degree", min: 3, max: 12, step: 1, value: deg, onInput: (v) => { deg = v; recompute(); show(); } });
    btn(ctl, "★ Jump to best λ", () => { let bi = 0; errs.forEach((e, k) => { if (e[1] < errs[bi][1]) bi = k; }); lv = vs[bi]; ctl.querySelectorAll("input")[0].value = lv; ctl.querySelector("output").textContent = lv.toFixed(2); show(); }, "primary"); show();
  })();

  /* ---------- geometry ---------- */
  (function () {
    const host = $("#demo-r4"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const A = [[2, 1.2], [1.2, 1]], th = [2.5, 1.5]; let lam = 1.5;
    const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
    const sol = (l) => { const M = [[A[0][0] + l, A[0][1]], [A[1][0], A[1][1] + l]], det = M[0][0] * M[1][1] - M[0][1] * M[1][0], inv = [[M[1][1] / det, -M[0][1] / det], [-M[1][0] / det, M[0][0] / det]]; return mv(inv, mv(A, th)); };
    const E = (t) => { const d = [t[0] - th[0], t[1] - th[1]], q = mv(A, d); return d[0] * q[0] + d[1] * q[1]; };
    const md = (A[0][0] + A[1][1]) / 2, df = Math.sqrt(((A[0][0] - A[1][1]) / 2) ** 2 + A[0][1] ** 2), l1 = md + df, l2 = md - df, v1r = [A[0][1], l1 - A[0][0]], n1 = Math.hypot(...v1r), v1 = [v1r[0] / n1, v1r[1] / n1], v2 = [-v1[1], v1[0]];
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const side = Math.min(W - 30, H - 24), px = (W - side) / 2, py = (H - side) / 2, P = plane(W, H, [-1.5, 4.5], [-1.5, 4.5], { l: px, r: px, t: py, b: py });
      ctx.strokeStyle = css("--border"); ctx.strokeRect(px, py, side, side); line(ctx, P.X(-1.5), P.Y(0), P.X(4.5), P.Y(0), css("--line"), 2); line(ctx, P.X(0), P.Y(-1.5), P.X(0), P.Y(4.5), css("--line"), 2);
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, side, side); ctx.clip();
      const s = sol(lam), cs = E(s);
      [0.3, 1, 2.5, 5, 9, 14, 20].concat(cs).forEach((c, i, arr) => { const last = i === arr.length - 1; ctx.beginPath(); for (let k = 0; k <= 80; k++) { const t = (k / 80) * 2 * Math.PI, r1 = Math.sqrt(c / l1), r2 = Math.sqrt(c / l2), x = th[0] + r1 * Math.cos(t) * v1[0] + r2 * Math.sin(t) * v2[0], y = th[1] + r1 * Math.cos(t) * v1[1] + r2 * Math.sin(t) * v2[1]; k ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = last ? css("--accent") : css("--muted"); ctx.lineWidth = last ? 4 : 1.6; ctx.globalAlpha = last ? 1 : 0.6; ctx.stroke(); ctx.globalAlpha = 1; });
      const rr = Math.hypot(s[0], s[1]); ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), rr * (P.X(1) - P.X(0)), 0, 7); ctx.setLineDash([9, 6]); ctx.strokeStyle = css("--c1"); ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore(); ctx.font = "700 22px Fredoka"; ctx.fillStyle = css("--good"); ctx.textAlign = "center"; ctx.fillText("★", P.X(th[0]), P.Y(th[1]) + 8);
      dot(ctx, P.X(s[0]), P.Y(s[1]), 8, css("--accent")); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "left"; ctx.fillText("θ₁ →", P.X(4.5) - 40, P.Y(0) - 8); ctx.fillText("θ₂ ↑", P.X(0) + 8, P.Y(4.5) + 14); ctx.fillStyle = css("--good"); ctx.fillText("OLS solution ★", P.X(th[0]) + 12, P.Y(th[1]) - 10);
    });
    function show() { const s = sol(lam); out.innerHTML = `λ = <b>${lam.toFixed(2)}</b> → Ridge solution (θ₁, θ₂) = <b>(${s[0].toFixed(3)}, ${s[1].toFixed(3)})</b> vs OLS (2.500, 1.500) · blue circle radius = ‖θ‖ = <b>${Math.hypot(...s).toFixed(3)}</b> · the coral ellipse is the smallest error contour that touches the circle.<br>` + (lam === 0 ? "λ = 0: no constraint, so the answer is the OLS star." : "As λ grows the circle shrinks and the answer slides towards the origin along a smooth curve, and it never lands exactly on an axis."); cv.redraw(); }
    slider(ctl, { label: "Strength λ", min: 0, max: 12, step: 0.05, value: lam, fmt: (v) => v.toFixed(2), onInput: (v) => { lam = v; show(); } }); show();
  })();
});
