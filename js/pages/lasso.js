/* Demos for lasso.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const S = (v, t) => Math.sign(v) * Math.max(Math.abs(v) - t, 0);   // soft threshold
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
  function solve(A0, b0) {
    const n = b0.length, A = A0.map((r, i) => r.concat(b0[i]));
    for (let i = 0; i < n; i++) { let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r; [A[i], A[m]] = [A[m], A[i]]; for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; } }
    const x = new Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; } return x;
  }

  /* ---------- 1 feature: slope hits zero ---------- */
  (function () {
    const host = $("#demo-l1"), out = $("[data-out]", host), ctl = $("[data-controls]", host), base = [[1, 2], [2, 4], [3, 5], [4, 8]]; let pts = base.map((p) => p.slice()), lam = 0;
    const st = () => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0; pts.forEach((p) => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; }); return { mx, my, sxy, sxx, n: pts.length }; };
    const slopeL = (s) => (Math.sign(s.sxy) * Math.max(Math.abs(s.sxy) - s.n * lam, 0)) / s.sxx;
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [0, 7], [0, 14], { l: 40, r: 14, t: 12, b: 32 }), s = st(), bo = s.sxy / s.sxx, bl = slopeL(s), L = (b) => [s.my - b * s.mx, b];
      axes(ctx, P, { nx: 7, ny: 7, xl: "x", yl: "y", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      const [a0, b0] = L(bo), [a1, b1] = L(bl);
      line(ctx, P.X(0), P.Y(a0), P.X(7), P.Y(a0 + 7 * b0), css("--good"), 3.5, [10, 7]); line(ctx, P.X(0), P.Y(a1), P.X(7), P.Y(a1 + 7 * b1), css("--accent"), 5.5);
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 6.5, css("--c1"))); ctx.restore();
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = css("--good"); ctx.fillText("plain regression", P.pad.l + 10, P.pad.t + 16); ctx.fillStyle = css("--accent"); ctx.fillText("LASSO", P.pad.l + 10, P.pad.t + 34);
    });
    function show() {
      const s = st(), pull = s.n * lam, sl = slopeL(s), ic = s.my - sl * s.mx;
      out.innerHTML = `λ = <b>${lam.toFixed(2)}</b> · pull = n × λ = ${s.n} × ${lam.toFixed(2)} = <b>${pull.toFixed(2)}</b> · S<sub>xy</sub> = ${s.sxy.toFixed(2)}, S<sub>xx</sub> = ${s.sxx.toFixed(2)}<br>` + (pull >= Math.abs(s.sxy) ? `pull ≥ S<sub>xy</sub>, so nothing is left: slope = <b style="color:var(--bad)">exactly 0</b> and the model predicts the average (${s.my.toFixed(2)}) for everything.` : `slope = (${s.sxy.toFixed(2)} − ${pull.toFixed(2)}) ÷ ${s.sxx.toFixed(2)} = <b>${sl.toFixed(3)}</b> · intercept = ${s.my.toFixed(2)} − ${sl.toFixed(3)}×${s.mx.toFixed(2)} = <b>${ic.toFixed(3)}</b> · prediction at x = 5: <b>${(ic + 5 * sl).toFixed(3)}</b>`) + `<br>The slope hits zero at λ = S<sub>xy</sub> ÷ n = <b>${(Math.abs(s.sxy) / s.n).toFixed(3)}</b>.`; cv.redraw();
    }
    slider(ctl, { label: "Strength λ", min: 0, max: 3, step: 0.05, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { lam = v; show(); } });
    btn(ctl, "Add an outlier", () => { pts.push([1.5, 11]); show(); }, "primary"); btn(ctl, "Reset", () => { pts = base.map((p) => p.slice()); show(); }); show();
  })();

  /* ---------- soft threshold ---------- */
  (function () {
    const host = $("#demo-l2"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let lam = 1, b = 0.8;
    const ridge = (v) => v / (1 + lam), lasso = (v) => S(v, lam);
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const side = Math.min(W - 40, H - 20), px = (W - side) / 2, py = (H - side) / 2, P = plane(W, H, [-4, 4], [-4, 4], { l: px, r: px, t: py, b: py });
      ctx.strokeStyle = css("--border"); ctx.strokeRect(px, py, side, side);
      ctx.globalAlpha = 0.28; ctx.fillStyle = css("--bad"); ctx.fillRect(P.X(-lam), py, P.X(lam) - P.X(-lam), side); ctx.globalAlpha = 1;
      line(ctx, P.X(-4), P.Y(0), P.X(4), P.Y(0), css("--line"), 2); line(ctx, P.X(0), P.Y(-4), P.X(0), P.Y(4), css("--line"), 2);
      line(ctx, P.X(-4), P.Y(-4), P.X(4), P.Y(4), css("--muted"), 3, [8, 6]);
      line(ctx, P.X(-4), P.Y(ridge(-4)), P.X(4), P.Y(ridge(4)), css("--c1"), 5);
      ctx.beginPath(); for (let i = 0; i <= 160; i++) { const v = -4 + i * 0.05, y = lasso(v); i ? ctx.lineTo(P.X(v), P.Y(y)) : ctx.moveTo(P.X(v), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 5.5; ctx.stroke();
      dot(ctx, P.X(b), P.Y(b), 6, css("--muted")); dot(ctx, P.X(b), P.Y(ridge(b)), 8, css("--c1")); dot(ctx, P.X(b), P.Y(lasso(b)), 8, css("--accent"));
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = css("--muted"); ctx.fillText("plain regression", px + 8, py + 18); ctx.fillStyle = css("--c1"); ctx.fillText("Ridge", px + 8, py + 36); ctx.fillStyle = css("--accent"); ctx.fillText("LASSO", px + 8, py + 54);
      ctx.fillStyle = css("--bad"); ctx.textAlign = "center"; ctx.fillText("dead zone", P.X(0), py + side - 8); ctx.fillStyle = css("--text"); ctx.fillText("weight from plain regression →", P.X(0) + side * 0.22, py + side + 14); ctx.save(); ctx.translate(px - 12, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("weight after shrinking →", 0, 0); ctx.restore();
    });
    function show() { out.innerHTML = `A feature that plain regression weighs at <b>${b.toFixed(1)}</b> becomes: Ridge → <b>${ridge(b).toFixed(2)}</b> (shrunk, still non-zero) · LASSO → <b>${lasso(b).toFixed(2)}</b> ` + (Math.abs(b) <= lam ? `<b style="color:var(--bad)">(|${b.toFixed(1)}| ≤ λ = ${lam.toFixed(2)}: inside the dead zone, so exactly 0, the feature is dropped)</b>` : `(moved ${lam.toFixed(2)} closer to 0)`); cv.redraw(); }
    slider(ctl, { label: "Strength λ", min: 0, max: 3, step: 0.05, value: lam, fmt: (v) => v.toFixed(2), onInput: (v) => { lam = v; show(); } });
    slider(ctl, { label: "A feature's plain weight", min: -4, max: 4, step: 0.1, value: b, fmt: (v) => v.toFixed(1), onInput: (v) => { b = v; show(); } }); show();
  })();

  /* ---------- LASSO path ---------- */
  (function () {
    const host = $("#demo-l3"), out = $("[data-out]", host), ctl = $("[data-controls]", host), tbl = $("#l3Tbl"), r = rng(21), N = 60, p = 8;
    const raw = Array.from({ length: p }, () => []), y = [], truth = [3, -2, 1.5, 0, 0, 0, 0, 0];
    for (let i = 0; i < N; i++) { const c = []; for (let j = 0; j < p; j++) c.push(randn(r)); c[7] = 0.7 * c[0] + 0.71 * c[7]; c.forEach((v, j) => raw[j].push(v)); y.push(3 * c[0] - 2 * c[1] + 1.5 * c[2] + randn(r)); }
    const Z = raw.map((col) => { const m = mean(col), s = sd(col); return col.map((v) => (v - m) / s); }), ym = mean(y), yc = y.map((v) => v - ym), names = raw.map((_, j) => "x" + (j + 1));
    function lasso(a) { const w = new Array(p).fill(0), res = yc.slice(); for (let it = 0; it < 400; it++) { let ch = 0; for (let j = 0; j < p; j++) { let rho = 0; for (let i = 0; i < N; i++) rho += Z[j][i] * (res[i] + Z[j][i] * w[j]); rho /= N; const nw = S(rho, a), d = nw - w[j]; if (d) { for (let i = 0; i < N; i++) res[i] -= Z[j][i] * d; w[j] = nw; ch = Math.max(ch, Math.abs(d)); } } if (ch < 1e-9) break; } return w; }
    const XtX = Z.map((a) => Z.map((b) => a.reduce((s, v, i) => s + v * b[i], 0) / N)), Xty = Z.map((a) => a.reduce((s, v, i) => s + v * yc[i], 0) / N);
    const ridge = (a) => solve(XtX.map((row, i) => row.map((v, j) => v + (i === j ? 2 * a : 0))), Xty);
    const grid = []; for (let v = -3; v <= 0.801; v += 0.05) grid.push(+v.toFixed(2)); const paths = grid.map((v) => lasso(10 ** v)), ols = lasso(1e-6);
    let lv = -0.7; const R = (c) => css(c), cols = ["--c1", "--c2", "--c3"], noise = ["--muted", "--c4", "--c5", "--bad", "--orange"];
    const colOf = (j) => (j < 3 ? cols[j] : j === 7 ? "--pink" : noise[(j - 3) % noise.length]);
    const lo = Math.min(...paths.flat()) - 0.3, hi = Math.max(...paths.flat()) + 0.3;
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [-3, 0.8], [lo, hi], { l: 46, r: 18, t: 12, b: 34 }); axes(ctx, P, { nx: 4, ny: 5, xl: "log₁₀ λ  (→ stronger penalty, more zeros)", yl: "coefficient", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) });
      line(ctx, P.X(-3), P.Y(0), P.X(0.8), P.Y(0), css("--line"), 2);
      for (let k = 0; k < p; k++) { ctx.beginPath(); grid.forEach((v, i) => (i ? ctx.lineTo(P.X(v), P.Y(paths[i][k])) : ctx.moveTo(P.X(v), P.Y(paths[i][k])))); ctx.strokeStyle = R(css(colOf(k))); ctx.lineWidth = k < 3 ? 4 : 2; ctx.stroke(); }
      line(ctx, P.X(lv), P.Y(lo), P.X(lv), P.Y(hi), css("--text"), 2, [5, 4]);
      lasso(10 ** lv).forEach((c, k) => dot(ctx, P.X(lv), P.Y(c), c === 0 ? 4 : 6, css(colOf(k))));
    });
    function show() {
      const a = 10 ** lv, w = lasso(a), rd = ridge(a), kept = names.filter((_, k) => w[k] !== 0), gone = names.filter((_, k) => w[k] === 0);
      tbl.innerHTML = "<tr><th>feature</th><th>true effect</th><th class='num'>plain (λ≈0)</th><th class='num'>LASSO</th><th class='num'>Ridge (same λ)</th></tr>" + names.map((n, k) => `<tr><td><b style="color:${css(colOf(k))}">${n}</b></td><td>${truth[k] === 0 ? "0 (noise)" : truth[k]}</td><td class="num">${ols[k].toFixed(2)}</td><td class="num" style="${w[k] === 0 ? "background:color-mix(in srgb,var(--bad) 24%,transparent);font-weight:800" : "font-weight:700"}">${w[k] === 0 ? "0  ✗ dropped" : w[k].toFixed(2)}</td><td class="num">${rd[k].toFixed(2)}</td></tr>`).join("");
      out.innerHTML = `λ = <b>${a.toPrecision(2)}</b> → LASSO keeps <b>${kept.length}</b> of 8 features: <b>${kept.join(", ") || "none"}</b>${gone.length ? ` · dropped: ${gone.join(", ")}` : ""}.<br>` + (kept.length === 3 && kept.join() === "x1,x2,x3" ? "✅ It found exactly the three real features and threw out all the noise." : kept.length > 3 ? "Still keeping some noise features: increase λ." : kept.length < 3 ? "Too strong: a real feature has been dropped (underfitting)." : "");
      cv.redraw();
    }
    slider(ctl, { label: "log₁₀ λ", min: -3, max: 0.8, step: 0.05, value: lv, fmt: (v) => v.toFixed(2), onInput: (v) => { lv = v; show(); } }); show();
  })();

  /* ---------- diamond geometry ---------- */
  (function () {
    const host = $("#demo-l4"), out = $("[data-out]", host), ctl = $("[data-controls]", host), A = [[2, 1.2], [1.2, 1]], th = [2.5, 1.5]; let lam = 1.5;
    const solveL = (l) => { let t = th.slice(); for (let it = 0; it < 800; it++) { t[0] = S(A[0][0] * th[0] - A[0][1] * (t[1] - th[1]), l / 2) / A[0][0]; t[1] = S(A[1][1] * th[1] - A[1][0] * (t[0] - th[0]), l / 2) / A[1][1]; } return t; };
    const E = (t) => { const d = [t[0] - th[0], t[1] - th[1]]; return d[0] * (A[0][0] * d[0] + A[0][1] * d[1]) + d[1] * (A[1][0] * d[0] + A[1][1] * d[1]); };
    const md = (A[0][0] + A[1][1]) / 2, df = Math.sqrt(((A[0][0] - A[1][1]) / 2) ** 2 + A[0][1] ** 2), l1 = md + df, l2 = md - df, v1r = [A[0][1], l1 - A[0][0]], n1 = Math.hypot(...v1r), v1 = [v1r[0] / n1, v1r[1] / n1], v2 = [-v1[1], v1[0]];
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const side = Math.min(W - 30, H - 24), px = (W - side) / 2, py = (H - side) / 2, P = plane(W, H, [-1.5, 4.5], [-1.5, 4.5], { l: px, r: px, t: py, b: py });
      ctx.strokeStyle = css("--border"); ctx.strokeRect(px, py, side, side); line(ctx, P.X(-1.5), P.Y(0), P.X(4.5), P.Y(0), css("--line"), 2); line(ctx, P.X(0), P.Y(-1.5), P.X(0), P.Y(4.5), css("--line"), 2);
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, side, side); ctx.clip(); const s = solveL(lam), cs = E(s);
      [0.3, 1, 2.5, 5, 9, 14, 20].concat(cs).forEach((c, i, arr) => { const last = i === arr.length - 1; ctx.beginPath(); for (let k = 0; k <= 80; k++) { const t = (k / 80) * 2 * Math.PI, r1 = Math.sqrt(c / l1), r2 = Math.sqrt(c / l2), x = th[0] + r1 * Math.cos(t) * v1[0] + r2 * Math.sin(t) * v2[0], y = th[1] + r1 * Math.cos(t) * v1[1] + r2 * Math.sin(t) * v2[1]; k ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = last ? css("--accent") : css("--muted"); ctx.lineWidth = last ? 4 : 1.6; ctx.globalAlpha = last ? 1 : 0.6; ctx.stroke(); ctx.globalAlpha = 1; });
      const t = Math.abs(s[0]) + Math.abs(s[1]); ctx.beginPath(); ctx.moveTo(P.X(t), P.Y(0)); ctx.lineTo(P.X(0), P.Y(t)); ctx.lineTo(P.X(-t), P.Y(0)); ctx.lineTo(P.X(0), P.Y(-t)); ctx.closePath(); ctx.setLineDash([9, 6]); ctx.strokeStyle = css("--c1"); ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      ctx.font = "700 22px Fredoka"; ctx.fillStyle = css("--good"); ctx.textAlign = "center"; ctx.fillText("★", P.X(th[0]), P.Y(th[1]) + 8); dot(ctx, P.X(s[0]), P.Y(s[1]), 8, css("--accent"));
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "left"; ctx.fillText("θ₁ →", P.X(4.5) - 40, P.Y(0) - 8); ctx.fillText("θ₂ ↑", P.X(0) + 8, P.Y(4.5) + 14); ctx.fillStyle = css("--good"); ctx.fillText("plain solution ★", P.X(th[0]) + 12, P.Y(th[1]) - 10);
    });
    function show() { const s = solveL(lam), z = s.map((v) => Math.abs(v) < 1e-9); out.innerHTML = `λ = <b>${lam.toFixed(2)}</b> → LASSO solution (θ₁, θ₂) = <b>(${s[0].toFixed(3)}, ${s[1].toFixed(3)})</b> vs plain (2.500, 1.500) · diamond size |θ₁|+|θ₂| = ${(Math.abs(s[0]) + Math.abs(s[1])).toFixed(3)}<br>` + (z[0] && z[1] ? "Both weights are 0: the diamond has shrunk to a point." : z[1] ? "<b style='color:var(--bad)'>θ₂ is exactly 0</b>: the answer sits on a corner of the diamond (feature 2 dropped)." : z[0] ? "<b style='color:var(--bad)'>θ₁ is exactly 0</b>: a corner again." : "Both weights are still non-zero: the touch point is on a flat side of the diamond. Increase λ and watch it slide to a corner."); cv.redraw(); }
    slider(ctl, { label: "Strength λ", min: 0, max: 8, step: 0.05, value: lam, fmt: (v) => v.toFixed(2), onInput: (v) => { lam = v; show(); } }); show();
  })();
});
