/* Demos for gradient-boosting.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const f = (x) => 2 * Math.sin(0.9 * x) + 0.35 * x;

  /* regression tree on 1-D data (xs sorted), leaves = mean of residuals */
  function fitTree(xs, rs, depth) {
    const S = [0]; rs.forEach((v, i) => S.push(S[i] + v));
    function rec(a, b, d) {
      const node = { m: (S[b] - S[a]) / (b - a) }; if (d >= depth || b - a < 2) return node;
      let best = null; for (let i = a; i < b - 1; i++) { if (xs[i] === xs[i + 1]) continue; const nl = i + 1 - a, nr = b - i - 1, sl = S[i + 1] - S[a], sr = S[b] - S[i + 1], sc = (sl * sl) / nl + (sr * sr) / nr; if (!best || sc > best.sc + 1e-12) best = { i, sc }; }
      if (!best || best.sc - (S[b] - S[a]) ** 2 / (b - a) <= 1e-12) return node;
      node.t = (xs[best.i] + xs[best.i + 1]) / 2; node.l = rec(a, best.i + 1, d + 1); node.r = rec(best.i + 1, b, d + 1); return node;
    }
    return rec(0, xs.length, 0);
  }
  const tp = (n, x) => { while (n.l) n = x <= n.t ? n.l : n.r; return n.m; };
  function boostReg(xs, ys, depth, lr, R) { const f0 = mean(ys), F = ys.map(() => f0), trees = []; for (let k = 0; k < R; k++) { const t = fitTree(xs, ys.map((y, i) => y - F[i]), depth); trees.push(t); xs.forEach((x, i) => (F[i] += lr * tp(t, x))); } return { f0, lr, trees }; }
  const predK = (m, x, k) => { let s = m.f0; for (let j = 0; j < k; j++) s += m.lr * tp(m.trees[j], x); return s; };
  const mkData = (seed, n, sd) => { const r = rng(seed), a = Array.from({ length: n }, () => { const x = 0.3 + 9.4 * r(); return [x, f(x) + sd * randn(r)]; }); return a.sort((p, q) => p[0] - q[0]); };

  /* ---------- fitting the residuals, round by round ---------- */
  (function () {
    const host = $("#demo-resid"), out = $("[data-out]", host), ctl = $("[data-controls]", host), R = 100;
    let K = 3, lr = 0.5, depth = 2, seed = 19, pts, test, model;
    const build = () => { model = boostReg(pts.map((p) => p[0]), pts.map((p) => p[1]), depth, lr, R); };
    pts = mkData(seed, 25, 0.55); test = mkData(seed + 1000, 80, 0.55); build();
    const cv = ML.canvas($("[data-canvas]", host), 310, (ctx, W, H) => {
      const lw = Math.round(W * 0.56), P = plane(lw, H, [0, 10], [-3, 8], { l: 34, r: 8, t: 26, b: 30 }), Q = plane(W, H, [0, 10], [-4, 4], { l: lw + 40, r: 10, t: 26, b: 30 });
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("the model after " + K + " round" + (K === 1 ? "" : "s"), (P.pad.l + lw) / 2, 15); ctx.fillText("what is left over (residuals)", (Q.pad.l + W) / 2, 15);
      axes(ctx, P, { nx: 5, ny: 5, fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      const path = (pl, g, col, w, dash) => { ctx.save(); if (dash) ctx.setLineDash(dash); ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 20, y = g(x); i ? ctx.lineTo(pl.X(x), pl.Y(y)) : ctx.moveTo(pl.X(x), pl.Y(y)); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.restore(); };
      path(P, f, css("--muted"), 2, [7, 6]); path(P, (x) => predK(model, x, K), css("--accent"), 4.5); pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5, css("--c1")));
      axes(ctx, Q, { nx: 5, ny: 4, fx: (v) => Math.round(v), fy: (v) => Math.round(v) }); line(ctx, Q.X(0), Q.Y(0), Q.X(10), Q.Y(0), css("--text"), 2, [6, 5]);
      pts.forEach((p) => dot(ctx, Q.X(p[0]), Q.Y(clamp(p[1] - predK(model, p[0], K), -4, 4)), 5, css("--c2")));
      if (K < R) path(Q, (x) => tp(model.trees[K], x), css("--c4"), 4);
    });
    function show() {
      const mse = (D) => mean(D.map((p) => (predK(model, p[0], K) - p[1]) ** 2));
      out.innerHTML = `<b>${K}</b> round${K === 1 ? "" : "s"} · learning rate <b>${lr}</b> · tree depth <b>${depth}</b> · training MSE <b>${mse(pts).toFixed(2)}</b> · test MSE (80 new points) <b>${mse(test).toFixed(2)}</b> · noise floor ≈ 0.30<br>` + (K === 0 ? "Round 0: just the average of all the y-values, a flat line. The residuals on the right are simply y minus that average." : `Purple line on the right = the next tree, trained to predict the orange residuals. Adding ${lr} × (that purple curve) to the model moves the pink curve on the left closer to the data.`) + (K > 40 && lr >= 0.5 && depth >= 3 ? " Many strong steps: the pink curve is starting to chase the noise (overfitting)." : ""); cv.redraw();
    }
    slider(ctl, { label: "Rounds (trees)", min: 0, max: R, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "Learning rate", min: 0.05, max: 1, step: 0.05, value: lr, fmt: (v) => v.toFixed(2), onInput: (v) => { lr = v; build(); show(); } });
    slider(ctl, { label: "Tree depth", min: 1, max: 4, step: 1, value: depth, onInput: (v) => { depth = v; build(); show(); } });
    btn(ctl, "New random data", () => { seed += 3; pts = mkData(seed, 25, 0.55); test = mkData(seed + 1000, 80, 0.55); build(); show(); }, "primary"); show();
  })();

  /* ---------- learning rate vs number of trees ---------- */
  (function () {
    const host = $("#demo-lr"), out = $("[data-out]", host), ctl = $("[data-controls]", host), R = 200, LRS = [1, 0.3, 0.05];
    let depth = 2, sd = 0.6, seed = 7, curves, best;
    const cols = () => [css("--c2"), css("--c4"), css("--c3")];
    function compute() {
      const tr = mkData(seed, 50, sd), te = mkData(seed + 500, 120, sd), xs = tr.map((p) => p[0]), ys = tr.map((p) => p[1]); curves = LRS.map((lr) => { const m = boostReg(xs, ys, depth, lr, R), F = te.map(() => m.f0), c = []; m.trees.forEach((t) => { te.forEach((p, i) => (F[i] += lr * tp(t, p[0]))); c.push(mean(te.map((p, i) => (F[i] - p[1]) ** 2))); }); return c; });
      best = curves.map((c) => c.reduce((b, v, i) => (v < c[b] ? i : b), 0));
    }
    compute();
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [1, R], [0, 2.5], { l: 46, r: 14, t: 14, b: 36 }); axes(ctx, P, { nx: 4, ny: 5, xl: "number of trees (rounds)", yl: "test error (MSE)", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      line(ctx, P.X(1), P.Y(sd * sd), P.X(R), P.Y(sd * sd), css("--muted"), 2, [6, 5]);
      curves.forEach((c, j) => { ctx.beginPath(); c.forEach((v, i) => { const y = P.Y(clamp(v, 0, 2.5)); i ? ctx.lineTo(P.X(i + 1), y) : ctx.moveTo(P.X(1), y); }); ctx.strokeStyle = cols()[j]; ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, P.X(best[j] + 1), P.Y(clamp(c[best[j]], 0, 2.5)), 6, cols()[j]); });
    });
    function show() {
      out.innerHTML = LRS.map((lr, j) => `learning rate <b style="color:${["var(--c2)", "var(--c4)", "var(--c3)"][j]}">${lr}</b>: lowest test error <b>${curves[j][best[j]].toFixed(2)}</b> at <b>${best[j] + 1}</b> trees; after 200 trees <b>${curves[j][R - 1].toFixed(2)}</b>`).join("<br>") + `<br>Dashed line = the noise floor (${(sd * sd).toFixed(2)}): no model can beat it. Dots mark each curve's best round.` + (curves[0][R - 1] > curves[0][best[0]] * 1.15 ? " Notice the big learning rate reaches its best quickly, then <b>gets worse</b> as it chases the noise (overfitting); the small rates need far more trees but are gentler." : ""); cv.redraw();
    }
    slider(ctl, { label: "Tree depth", min: 1, max: 5, step: 1, value: depth, onInput: (v) => { depth = v; compute(); show(); } });
    slider(ctl, { label: "Noise in the data", min: 0.2, max: 1.2, step: 0.1, value: sd, fmt: (v) => v.toFixed(1), onInput: (v) => { sd = v; compute(); show(); } });
    btn(ctl, "New random data", () => { seed += 5; compute(); show(); }, "primary"); show();
  })();

  /* ---------- gradient boosting classifier on 2-D data ---------- */
  (function () {
    const host = $("#demo-2d"), out = $("[data-out]", host), ctl = $("[data-controls]", host), R = 200;
    const ranges = { moons: [[-1.8, 2.8], [-1.3, 1.8]], circles: [[-1.8, 1.8], [-1.8, 1.8]] };
    let ds = "moons", seed = 5, K = 10, lr = 0.3, depth = 2, train, test, m, curve;
    const sig = (z) => 1 / (1 + Math.exp(-z));
    function gen() {
      const r = rng(seed * 173), mk = (n) => { const a = []; for (let i = 0; i < n; i++) {
        if (ds === "moons") { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push({ 0: Math.cos(t1) + 0.3 * randn(r), 1: Math.sin(t1) + 0.3 * randn(r), c: 1 }); a.push({ 0: 1 - Math.cos(t2) + 0.3 * randn(r), 1: 0.5 - Math.sin(t2) + 0.3 * randn(r), c: 0 }); }
        else { const t1 = 2 * Math.PI * r(), t2 = 2 * Math.PI * r(); a.push({ 0: 0.5 * Math.cos(t1) + 0.14 * randn(r), 1: 0.5 * Math.sin(t1) + 0.14 * randn(r), c: 1 }); a.push({ 0: 1.2 * Math.cos(t2) + 0.14 * randn(r), 1: 1.2 * Math.sin(t2) + 0.14 * randn(r), c: 0 }); } } return a; };
      train = mk(30); test = mk(40);
    }
    function fit2(idx, r, hw, d) {
      let sr = 0, sh = 0; idx.forEach((i) => { sr += r[i]; sh += hw[i]; }); const node = { v: sh > 1e-9 ? sr / sh : 0 }; if (d >= depth || idx.length < 2) return node;
      let best = null, tot = sr * sr / idx.length;
      [0, 1].forEach((fe) => { const S = idx.slice().sort((a, b) => train[a][fe] - train[b][fe]); let sl = 0; for (let j = 0; j < S.length - 1; j++) { sl += r[S[j]]; if (train[S[j]][fe] === train[S[j + 1]][fe]) continue; const nl = j + 1, nr = S.length - nl, sc = (sl * sl) / nl + ((sr - sl) * (sr - sl)) / nr; if (!best || sc > best.sc + 1e-12) best = { fe, t: (train[S[j]][fe] + train[S[j + 1]][fe]) / 2, sc }; } });
      if (!best || best.sc - tot <= 1e-12) return node;
      node.f = best.fe; node.t = best.t; node.l = fit2(idx.filter((i) => train[i][best.fe] <= best.t), r, hw, d + 1); node.r = fit2(idx.filter((i) => train[i][best.fe] > best.t), r, hw, d + 1); return node;
    }
    const tv = (n, q) => { while (n.l) n = q[n.f] <= n.t ? n.l : n.r; return n.v; };
    function boost() {
      const n = train.length, all = train.map((_, i) => i), p0 = mean(train.map((p) => p.c)), f0 = Math.log(p0 / (1 - p0)), F = new Array(n).fill(f0), Ft = new Array(test.length).fill(f0), trees = []; curve = { tr: [], te: [], res: [] };
      for (let k = 0; k < R; k++) {
        const pr = F.map(sig), r = train.map((p, i) => p.c - pr[i]), hw = pr.map((p) => p * (1 - p)), t = fit2(all, r, hw, 0); trees.push(t);
        train.forEach((p, i) => (F[i] += lr * tv(t, p))); test.forEach((p, i) => (Ft[i] += lr * tv(t, p)));
        curve.res.push(F.map((z, i) => Math.abs(train[i].c - sig(z))));
        curve.tr.push(mean(train.map((p, i) => ((F[i] >= 0 ? 1 : 0) === p.c ? 1 : 0)))); curve.te.push(mean(test.map((p, i) => ((Ft[i] >= 0 ? 1 : 0) === p.c ? 1 : 0))));
      }
      m = { f0, trees };
    }
    const Fat = (q, k) => { let s = m.f0; for (let j = 0; j < k; j++) s += lr * tv(m.trees[j], q); return s; };
    gen(); boost();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const lw = Math.round(W * 0.6), [xr, yr] = ranges[ds], P = eqPlane(W, H, xr, yr, lw), col = (c) => (c ? css("--c1") : css("--c2"));
      ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b);
      const cs = 6; for (let px = P.pad.l; px < lw - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) { const p = sig(Fat([P.iX(px + cs / 2), P.iY(py + cs / 2)], K)); ctx.globalAlpha = 0.08 + 0.3 * Math.abs(2 * p - 1); ctx.fillStyle = p >= 0.5 ? css("--c1") : css("--c2"); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1;
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      test.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, null, col(p.c))); train.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 3.5 + 8 * curve.res[K - 1][i], col(p.c))); ctx.restore();
      const Q = plane(W, H, [1, R], [0.5, 1.0], { l: lw + 46, r: 10, t: 26, b: 32 }); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("accuracy vs rounds", (Q.pad.l + W) / 2, 15); axes(ctx, Q, { nx: 4, ny: 5, xl: "rounds (n_estimators)", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      [[curve.tr, css("--c1")], [curve.te, css("--c2")]].forEach(([c, cl]) => { ctx.beginPath(); c.forEach((v, i) => (i ? ctx.lineTo(Q.X(i + 1), Q.Y(v)) : ctx.moveTo(Q.X(1), Q.Y(v)))); ctx.strokeStyle = cl; ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(K), Q.Y(c[K - 1]), 5.5, cl); });
    });
    function show() {
      const tr = curve.tr[K - 1], te = curve.te[K - 1], pr = train.map((p) => sig(Fat(p, K))), ll = -mean(train.map((p, i) => p.c * Math.log(pr[i]) + (1 - p.c) * Math.log(1 - pr[i])));
      out.innerHTML = `data: <b>${ds}</b> · <b>${K}</b> round${K === 1 ? "" : "s"} · learning rate <b>${lr}</b> · tree depth <b>${depth}</b><br>training accuracy <b>${(tr * 100).toFixed(0)}%</b> · test accuracy <b>${(te * 100).toFixed(0)}%</b> · training log-loss <b>${ll.toFixed(3)}</b> (lower = more confident and correct). Bigger dots = points the model still gets wrong or is unsure about.<br>` + (K === 1 ? "One small tree on top of the starting guess (the overall class share)." : tr - te > 0.15 ? "Training accuracy far above test accuracy: overfitting. Try a smaller learning rate, shallower trees, or fewer rounds." : "The shading shows the predicted probability: pale = unsure, strong = confident."); cv.redraw();
    }
    slider(ctl, { label: "Rounds", min: 1, max: R, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "Learning rate", min: 0.05, max: 1, step: 0.05, value: lr, fmt: (v) => v.toFixed(2), onInput: (v) => { lr = v; boost(); show(); } });
    slider(ctl, { label: "Tree depth", min: 1, max: 4, step: 1, value: depth, onInput: (v) => { depth = v; boost(); show(); } });
    const bd = btn(ctl, "Data: moons", () => { ds = ds === "moons" ? "circles" : "moons"; bd.textContent = "Data: " + ds; gen(); boost(); show(); }, "primary");
    btn(ctl, "New random data", () => { seed++; gen(); boost(); show(); }); show();
  })();
});
