/* Demos for xgboost.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const f = (x) => 2 * Math.sin(0.9 * x) + 0.35 * x;

  /* ---------- split gain calculator on the 6-point example ---------- */
  (function () {
    const host = $("#demo-gain"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const X = [1, 2, 3, 4, 5, 6], Y = [2, 4, 3, 9, 11, 10], F0 = 6.5, g = Y.map((y) => F0 - y); let lam = 1, gam = 0;
    const sum = (a) => a.reduce((s, v) => s + v, 0), cuts = [1.5, 2.5, 3.5, 4.5, 5.5];
    const rows = () => cuts.map((t) => { const L = g.filter((_, i) => X[i] <= t), R = g.filter((_, i) => X[i] > t), GL = sum(L), GR = sum(R), HL = L.length, HR = R.length, sl = (GL * GL) / (HL + lam), sr = (GR * GR) / (HR + lam), root = Math.pow(sum(g), 2) / (g.length + lam); return { t, GL, GR, HL, HR, sl, sr, gain: sl + sr - root }; });
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const R = rows(), P = plane(W, H, [0.5, 6.5], [0, 80], { l: 46, r: 14, t: 24, b: 66 }), best = R.reduce((b, r) => (r.gain > b.gain ? r : b), R[0]);
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("gain of each possible cut (bar) vs the price γ of adding a leaf (dashed line)", W / 2, 14);
      axes(ctx, P, { nx: 6, ny: 8, grid: true, fx: () => "", fy: (v) => Math.round(v) });
      R.forEach((r) => { const y1 = P.Y(r.gain), y0 = P.Y(0), ok = r.gain > gam; ctx.fillStyle = r === best && ok ? css("--accent") : ok ? css("--c1") : css("--line"); ctx.globalAlpha = ok ? 0.95 : 0.45; ctx.fillRect(P.X(r.t) - 22, y1, 44, y0 - y1); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.strokeRect(P.X(r.t) - 22, y1, 44, y0 - y1); ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillText(r.gain.toFixed(1), P.X(r.t), y1 - 5); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText("x ≤ " + r.t, P.X(r.t), P.Y(0) + 15); });
      if (gam > 0) { line(ctx, P.X(0.5), P.Y(gam), P.X(6.5), P.Y(gam), css("--bad"), 3, [8, 6]); ctx.fillStyle = css("--bad"); ctx.textAlign = "left"; ctx.fillText("γ = " + gam, P.X(0.5) + 4, P.Y(gam) - 5); }
      ctx.textAlign = "center"; X.forEach((x, i) => { const px = P.X(x); ctx.fillStyle = css("--text"); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText("x=" + x + "  y=" + Y[i], px, P.Y(0) + 38); ctx.fillText("g=" + g[i].toFixed(1), px, P.Y(0) + 54); });
    });
    function show() {
      const R = rows(), b = R.reduce((m, r) => (r.gain > m.gain ? r : m), R[0]), net = b.gain - gam, wl = -b.GL / (b.HL + lam), wr = -b.GR / (b.HR + lam);
      out.innerHTML = `λ = <b>${lam}</b>, γ = <b>${gam}</b>. Best cut: <b>x ≤ ${b.t}</b> with gain = ${b.sl.toFixed(2)} + ${b.sr.toFixed(2)} − 0 = <b>${b.gain.toFixed(2)}</b>. ` + (net > 0 ? `After the price γ it is worth <b>${net.toFixed(2)}</b>, so the split is kept.<br>Leaf weights: left = −(${b.GL.toFixed(1)}) ÷ (${b.HL} + ${lam}) = <b>${wl.toFixed(3)}</b>, right = <b>${wr.toFixed(3)}</b>. (Plain gradient boosting would use the residual averages −3.5 and +3.5; a larger λ shrinks the leaves towards 0.) With learning rate 0.5 the predictions move to ${(6.5 + 0.5 * wl).toFixed(3)} and ${(6.5 + 0.5 * wr).toFixed(3)}.` : `The best gain (${b.gain.toFixed(2)}) is not more than γ, so <b>every split is pruned</b>: the tree is a single leaf and learns nothing this round.`); cv.redraw();
    }
    slider(ctl, { label: "λ (lambda)", min: 0, max: 10, step: 0.5, value: lam, fmt: (v) => v.toFixed(1), onInput: (v) => { lam = v; show(); } });
    slider(ctl, { label: "γ (gamma)", min: 0, max: 80, step: 1, value: gam, onInput: (v) => { gam = v; show(); } }); show();
  })();

  /* 1-D regularised tree: squared error so hessian = 1 per point */
  function xgbTree(xs, gs, depth, lam, gam, mcw) {
    const S = [0]; gs.forEach((v, i) => S.push(S[i] + v));
    function rec(a, b, d) {
      const G = S[b] - S[a], H = b - a, node = { w: -G / (H + lam) }; if (d >= depth || H < 2 * mcw) return node;
      let best = null; for (let i = a; i < b - 1; i++) { if (xs[i] === xs[i + 1]) continue; const nl = i + 1 - a, nr = b - i - 1; if (nl < mcw || nr < mcw) continue; const gl = S[i + 1] - S[a], gr = G - gl, gain = (gl * gl) / (nl + lam) + (gr * gr) / (nr + lam) - (G * G) / (H + lam) - gam; if (!best || gain > best.gain + 1e-12) best = { i, gain }; }
      if (!best || best.gain <= 1e-12) return node;
      node.t = (xs[best.i] + xs[best.i + 1]) / 2; node.l = rec(a, best.i + 1, d + 1); node.r = rec(best.i + 1, b, d + 1); return node;
    }
    return rec(0, xs.length, 0);
  }
  const tw = (n, x) => { while (n.l) n = x <= n.t ? n.l : n.r; return n.w; };
  const leaves = (n) => (n.l ? leaves(n.l) + leaves(n.r) : 1);
  function boost(xs, ys, o, R) { const f0 = mean(ys), F = ys.map(() => f0), trees = []; for (let k = 0; k < R; k++) { const t = xgbTree(xs, F.map((v, i) => v - ys[i]), o.depth, o.lam, o.gam, 1); trees.push(t); xs.forEach((x, i) => (F[i] += o.eta * tw(t, x))); } return { f0, eta: o.eta, trees }; }
  const predK = (m, x, k) => { let s = m.f0; for (let j = 0; j < k; j++) s += m.eta * tw(m.trees[j], x); return s; };
  const mkData = (seed, n, sd) => { const r = rng(seed), a = Array.from({ length: n }, () => { const x = 0.3 + 9.4 * r(); return [x, f(x) + sd * randn(r)]; }); return a.sort((p, q) => p[0] - q[0]); };

  /* ---------- regularisation in action ---------- */
  (function () {
    const host = $("#demo-reg"), out = $("[data-out]", host), ctl = $("[data-controls]", host), R = 150;
    let K = 100, eta = 0.3, depth = 5, lam = 5, gam = 0.5, seed = 11, tr, te, mr, mp;
    const build = () => { const xs = tr.map((p) => p[0]), ys = tr.map((p) => p[1]); mr = boost(xs, ys, { depth, lam, gam, eta }, R); mp = boost(xs, ys, { depth, lam: 0, gam: 0, eta }, R); };
    tr = mkData(seed, 40, 0.7); te = mkData(seed + 900, 120, 0.7); build();
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [0, 10], [-3.5, 8], { l: 40, r: 14, t: 12, b: 34 }); axes(ctx, P, { nx: 5, ny: 5, xl: "x", yl: "y", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      const path = (g, col, w, dash) => { ctx.save(); if (dash) ctx.setLineDash(dash); ctx.beginPath(); for (let i = 0; i <= 300; i++) { const x = i / 30, y = g(x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.restore(); };
      path(f, css("--muted"), 2, [7, 6]); path((x) => predK(mp, x, K), css("--c1"), 3, [4, 4]); path((x) => predK(mr, x, K), css("--accent"), 4.5); tr.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5, css("--c2")));
    });
    function show() {
      const mse = (m, D) => mean(D.map((p) => (predK(m, p[0], K) - p[1]) ** 2)), lv = mean(mr.trees.slice(0, K).map(leaves)), lp = mean(mp.trees.slice(0, K).map(leaves));
      out.innerHTML = `<b>${K}</b> rounds · learning rate <b>${eta}</b> · max depth <b>${depth}</b><br><b style="color:var(--accent)">Regularised (λ = ${lam}, γ = ${gam})</b>: training MSE <b>${mse(mr, tr).toFixed(2)}</b>, test MSE <b>${mse(mr, te).toFixed(2)}</b>, about ${lv.toFixed(1)} leaves per tree<br><b style="color:var(--c1)">Same settings but λ = 0, γ = 0</b> (dashed blue): training MSE <b>${mse(mp, tr).toFixed(2)}</b>, test MSE <b>${mse(mp, te).toFixed(2)}</b>, about ${lp.toFixed(1)} leaves per tree<br>The dashed grey curve is the true function; noise floor ≈ 0.49.` + (mse(mr, te) < mse(mp, te) ? " Here the penalties give the better test error: simpler trees, smoother curve." : " Here the penalties did not help (too strong, or too few rounds): tune λ and γ, don't assume more is better."); cv.redraw();
    }
    slider(ctl, { label: "Rounds", min: 1, max: R, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "Learning rate (eta)", min: 0.05, max: 1, step: 0.05, value: eta, fmt: (v) => v.toFixed(2), onInput: (v) => { eta = v; build(); show(); } });
    slider(ctl, { label: "max_depth", min: 1, max: 8, step: 1, value: depth, onInput: (v) => { depth = v; build(); show(); } });
    slider(ctl, { label: "λ (reg_lambda)", min: 0, max: 30, step: 1, value: lam, onInput: (v) => { lam = v; build(); show(); } });
    slider(ctl, { label: "γ (gamma)", min: 0, max: 5, step: 0.25, value: gam, fmt: (v) => v.toFixed(2), onInput: (v) => { gam = v; build(); show(); } });
    btn(ctl, "New random data", () => { seed += 4; tr = mkData(seed, 40, 0.7); te = mkData(seed + 900, 120, 0.7); build(); show(); }, "primary"); show();
  })();

  /* ---------- XGBoost-style classifier on 2-D data ---------- */
  (function () {
    const host = $("#demo-2d"), out = $("[data-out]", host), ctl = $("[data-controls]", host), R = 200;
    const ranges = { moons: [[-1.8, 2.8], [-1.3, 1.8]], circles: [[-1.8, 1.8], [-1.8, 1.8]] };
    let ds = "moons", seed = 5, K = 15, eta = 0.3, depth = 3, lam = 1, gam = 0, train, test, m, curve;
    const sig = (z) => 1 / (1 + Math.exp(-z));
    function gen() {
      const r = rng(seed * 173), mk = (n) => { const a = []; for (let i = 0; i < n; i++) {
        if (ds === "moons") { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push({ 0: Math.cos(t1) + 0.3 * randn(r), 1: Math.sin(t1) + 0.3 * randn(r), c: 1 }); a.push({ 0: 1 - Math.cos(t2) + 0.3 * randn(r), 1: 0.5 - Math.sin(t2) + 0.3 * randn(r), c: 0 }); }
        else { const t1 = 2 * Math.PI * r(), t2 = 2 * Math.PI * r(); a.push({ 0: 0.5 * Math.cos(t1) + 0.14 * randn(r), 1: 0.5 * Math.sin(t1) + 0.14 * randn(r), c: 1 }); a.push({ 0: 1.2 * Math.cos(t2) + 0.14 * randn(r), 1: 1.2 * Math.sin(t2) + 0.14 * randn(r), c: 0 }); } } return a; };
      train = mk(30); test = mk(40);
    }
    function fit2(idx, gs, hs, d) {
      let G = 0, H = 0; idx.forEach((i) => { G += gs[i]; H += hs[i]; }); const node = { w: -G / (H + lam) }; if (d >= depth || idx.length < 2) return node;
      let best = null; const root = (G * G) / (H + lam);
      [0, 1].forEach((fe) => { const S = idx.slice().sort((a, b) => train[a][fe] - train[b][fe]); let gl = 0, hl = 0; for (let j = 0; j < S.length - 1; j++) { gl += gs[S[j]]; hl += hs[S[j]]; if (train[S[j]][fe] === train[S[j + 1]][fe]) continue; const gr = G - gl, hr = H - hl, gain = (gl * gl) / (hl + lam) + (gr * gr) / (hr + lam) - root - gam; if (!best || gain > best.gain + 1e-12) best = { fe, t: (train[S[j]][fe] + train[S[j + 1]][fe]) / 2, gain }; } });
      if (!best || best.gain <= 1e-9) return node;
      node.f = best.fe; node.t = best.t; node.l = fit2(idx.filter((i) => train[i][best.fe] <= best.t), gs, hs, d + 1); node.r = fit2(idx.filter((i) => train[i][best.fe] > best.t), gs, hs, d + 1); return node;
    }
    const tv = (n, q) => { while (n.l) n = q[n.f] <= n.t ? n.l : n.r; return n.w; };
    function run() {
      const n = train.length, all = train.map((_, i) => i), p0 = mean(train.map((p) => p.c)), f0 = Math.log(p0 / (1 - p0)), F = new Array(n).fill(f0), Ft = new Array(test.length).fill(f0), trees = []; curve = { tr: [], te: [], res: [], lv: [] };
      for (let k = 0; k < R; k++) {
        const pr = F.map(sig), gs = pr.map((p, i) => p - train[i].c), hs = pr.map((p) => p * (1 - p)), t = fit2(all, gs, hs, 0); trees.push(t); curve.lv.push(leaves(t));
        train.forEach((p, i) => (F[i] += eta * tv(t, p))); test.forEach((p, i) => (Ft[i] += eta * tv(t, p)));
        curve.res.push(F.map((z, i) => Math.abs(train[i].c - sig(z)))); curve.tr.push(mean(train.map((p, i) => ((F[i] >= 0 ? 1 : 0) === p.c ? 1 : 0)))); curve.te.push(mean(test.map((p, i) => ((Ft[i] >= 0 ? 1 : 0) === p.c ? 1 : 0))));
      }
      m = { f0, trees };
    }
    const Fat = (q, k) => { let s = m.f0; for (let j = 0; j < k; j++) s += eta * tv(m.trees[j], q); return s; };
    gen(); run();
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
      const tr = curve.tr[K - 1], te = curve.te[K - 1], lv = mean(curve.lv.slice(0, K));
      out.innerHTML = `data: <b>${ds}</b> · <b>${K}</b> round${K === 1 ? "" : "s"} · eta <b>${eta}</b> · max_depth <b>${depth}</b> · λ <b>${lam}</b> · γ <b>${gam}</b> · about <b>${lv.toFixed(1)}</b> leaves per tree<br>training accuracy <b>${(tr * 100).toFixed(0)}%</b> · test accuracy <b>${(te * 100).toFixed(0)}%</b>. Bigger dots = points the model is still wrong or unsure about.<br>` + (lv < 1.05 ? "The penalties are so large that no split pays for itself: every tree is a single leaf and nothing is learned. Lower γ or λ." : tr - te > 0.15 ? "Training accuracy far above test accuracy: overfitting. Try a larger λ or γ, a smaller depth, or a smaller eta." : "λ shrinks the leaf values, γ removes weak splits; both tame the fit."); cv.redraw();
    }
    slider(ctl, { label: "Rounds", min: 1, max: R, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "Learning rate (eta)", min: 0.05, max: 1, step: 0.05, value: eta, fmt: (v) => v.toFixed(2), onInput: (v) => { eta = v; run(); show(); } });
    slider(ctl, { label: "max_depth", min: 1, max: 6, step: 1, value: depth, onInput: (v) => { depth = v; run(); show(); } });
    slider(ctl, { label: "λ (reg_lambda)", min: 0, max: 20, step: 0.5, value: lam, fmt: (v) => v.toFixed(1), onInput: (v) => { lam = v; run(); show(); } });
    slider(ctl, { label: "γ (gamma)", min: 0, max: 3, step: 0.1, value: gam, fmt: (v) => v.toFixed(1), onInput: (v) => { gam = v; run(); show(); } });
    const bd = btn(ctl, "Data: moons", () => { ds = ds === "moons" ? "circles" : "moons"; bd.textContent = "Data: " + ds; gen(); run(); show(); }, "primary");
    btn(ctl, "New random data", () => { seed++; gen(); run(); show(); }); show();
  })();
});
