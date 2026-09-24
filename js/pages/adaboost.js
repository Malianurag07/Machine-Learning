/* Demos for adaboost.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const colOf = (c) => (c > 0 ? css("--c1") : css("--c2"));

  /* ---------- the alpha (say) of a stump ---------- */
  (function () {
    const host = $("#demo-alpha"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let e = 0.3;
    const al = (x) => 0.5 * Math.log((1 - x) / x);
    const cv = ML.canvas($("[data-canvas]", host), 260, (ctx, W, H) => {
      const P = plane(W, H, [0, 1], [-2.5, 2.5], { l: 46, r: 14, t: 12, b: 36 }); axes(ctx, P, { nx: 5, ny: 5, xl: "weighted error of the stump", yl: "its say (α)", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) });
      line(ctx, P.X(0), P.Y(0), P.X(1), P.Y(0), css("--text"), 2, [6, 5]);
      ctx.beginPath(); for (let i = 1; i < 100; i++) { const x = i / 100, y = clamp(al(x), -2.5, 2.5); i > 1 ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = css("--c4"); ctx.lineWidth = 4.5; ctx.stroke();
      dot(ctx, P.X(e), P.Y(al(e)), 8, css("--accent"));
    });
    function show() {
      const a = al(e), up = Math.exp(a), dn = Math.exp(-a);
      out.innerHTML = `error = <b>${e.toFixed(2)}</b> → say α = ½ · ln((1 − ${e.toFixed(2)}) ÷ ${e.toFixed(2)}) = <b>${a.toFixed(3)}</b><br>After this round, every point it got <b>wrong</b> has its weight multiplied by e<sup>α</sup> = <b>×${up.toFixed(3)}</b>; every point it got <b>right</b> by e<sup>−α</sup> = <b>×${dn.toFixed(3)}</b> (then all weights are rescaled to add up to 1).<br>` + (Math.abs(e - 0.5) < 0.015 ? "A coin-flip stump (error ≈ 0.5) gets no say at all, and its mistakes are not emphasised." : e > 0.5 ? "Worse than a coin flip: α is negative, so its vote is <b>reversed</b> (a reliably wrong guesser is as useful as a reliably right one)." : e < 0.1 ? "Very accurate: a big say, and its few mistakes become very heavy." : "Better than a coin flip: a positive say."); cv.redraw();
    }
    slider(ctl, { label: "Weighted error", min: 0.02, max: 0.98, step: 0.01, value: e, fmt: (v) => v.toFixed(2), onInput: (v) => { e = v; show(); } }); show();
  })();

  /* ---------- round by round, 10 points on a line ---------- */
  (function () {
    const host = $("#demo-round"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const X = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Y = [1, 1, 1, -1, -1, -1, 1, 1, 1, -1], R = [], NR = 8; let k = 1;
    (function build() {
      let w = X.map(() => 1 / 10), F = X.map(() => 0);
      for (let r = 0; r < NR; r++) {
        let best = null; for (let t = 1.5; t < 10; t += 1) for (const s of [1, -1]) { const pred = X.map((x) => (x <= t ? s : -s)), err = w.reduce((a, wi, i) => a + (pred[i] !== Y[i] ? wi : 0), 0); if (!best || err < best.err - 1e-12) best = { t, s, err, pred }; }
        const a = 0.5 * Math.log((1 - best.err) / best.err); F = F.map((f, i) => f + a * best.pred[i]);
        R.push({ w: w.slice(), t: best.t, s: best.s, err: best.err, a, pred: best.pred, F: F.slice() });
        const nw = w.map((wi, i) => wi * Math.exp(-a * Y[i] * best.pred[i])), Z = nw.reduce((s, v) => s + v, 0); w = nw.map((v) => v / Z);
      }
    })();
    const cv = ML.canvas($("[data-canvas]", host), 380, (ctx, W, H) => {
      const r = R[k - 1], xr = [0.5, 10.5], A = plane(W, H, xr, [0, 1], { l: 46, r: 14, t: 30, b: H - 92 }), B = plane(W, H, xr, [0, 0.26], { l: 46, r: 14, t: 116, b: H - 214 }), C = plane(W, H, xr, [-2.6, 2.6], { l: 46, r: 14, t: 250, b: 34 });
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center";
      ctx.fillText("1 · this round's stump (dot size = weight; ringed = it got it wrong)", W / 2, 16);
      const tx = A.X(r.t); ctx.globalAlpha = 0.16; ctx.fillStyle = r.s > 0 ? css("--c1") : css("--c2"); ctx.fillRect(A.X(0.5), 26, tx - A.X(0.5), 62); ctx.fillStyle = r.s > 0 ? css("--c2") : css("--c1"); ctx.fillRect(tx, 26, A.X(10.5) - tx, 62); ctx.globalAlpha = 1;
      line(ctx, tx, 24, tx, 92, css("--text"), 3.5, [7, 5]); line(ctx, A.X(0.5), 58, A.X(10.5), 58, css("--line"), 2);
      X.forEach((x, i) => { const rad = 5 + 22 * Math.sqrt(r.w[i]) * 0.9; if (r.pred[i] !== Y[i]) dot(ctx, A.X(x), 58, rad + 5, null, css("--bad")); dot(ctx, A.X(x), 58, rad, colOf(Y[i])); ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillText(x, A.X(x), 100); });
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.fillText("2 · the weight each point had this round (they add up to 1)", W / 2, 116); ctx.textAlign = "center";
      X.forEach((x, i) => { const y0 = B.Y(0), y1 = B.Y(r.w[i]); ctx.fillStyle = r.pred[i] !== Y[i] ? css("--bad") : colOf(Y[i]); ctx.globalAlpha = 0.9; ctx.fillRect(B.X(x) - 13, y1, 26, y0 - y1); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.strokeRect(B.X(x) - 13, y1, 26, y0 - y1); ctx.fillStyle = css("--text"); ctx.font = "600 11px DM Sans, sans-serif"; ctx.fillText(r.w[i].toFixed(3), B.X(x), y1 - 4); });
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.fillText("3 · combined score after rounds 1 to " + k + " (up = predicts +, down = predicts −)", W / 2, 244);
      line(ctx, C.X(0.5), C.Y(0), C.X(10.5), C.Y(0), css("--text"), 2, [6, 5]);
      X.forEach((x, i) => { const f = r.F[i], y0 = C.Y(0), y1 = C.Y(clamp(f, -2.6, 2.6)), right = (f >= 0 ? 1 : -1) === Y[i]; ctx.fillStyle = colOf(Y[i]); ctx.fillRect(C.X(x) - 13, Math.min(y0, y1), 26, Math.abs(y1 - y0)); ctx.strokeStyle = right ? css("--ink") : css("--bad"); ctx.lineWidth = right ? 2 : 4; ctx.strokeRect(C.X(x) - 13, Math.min(y0, y1), 26, Math.abs(y1 - y0)); ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillText(x, C.X(x), H - 12); });
    });
    function show() {
      const r = R[k - 1], wrong = X.filter((_, i) => r.pred[i] !== Y[i]), acc = r.F.filter((f, i) => (f >= 0 ? 1 : -1) === Y[i]).length;
      out.innerHTML = `<b>Round ${k}</b>: stump "x ≤ ${r.t} → ${r.s > 0 ? "+" : "−"}, otherwise ${r.s > 0 ? "−" : "+"}" · weighted error = <b>${r.err.toFixed(3)}</b> (${wrong.map((x) => "point " + x).join(", ")} wrong) · say α = <b>${r.a.toFixed(3)}</b><br>The whole ensemble after ${k} round${k > 1 ? "s" : ""} classifies <b>${acc} of 10</b> points correctly` + (k === 3 ? " ✅ three weak stumps, each wrong on several points, together get all 10 right." : k === 1 ? ". A single stump cannot handle this pattern (+ + + − − − + + + −)." : ".") + ` Watch the weights: the points that were just misclassified become the tall bars in the next round.`; cv.redraw();
    }
    const sl = slider(ctl, { label: "Round", min: 1, max: NR, step: 1, value: k, onInput: (v) => { k = v; show(); } });
    btn(ctl, "◀ Previous", () => { k = Math.max(1, k - 1); sl.set(k); show(); }); btn(ctl, "Next round ▶", () => { k = Math.min(NR, k + 1); sl.set(k); show(); }, "primary");
    show();
  })();

  /* ---------- AdaBoost on 2-D data ---------- */
  (function () {
    const host = $("#demo-2d"), out = $("[data-out]", host), ctl = $("[data-controls]", host), MAXR = 200;
    const ranges = { moons: [[-1.8, 2.8], [-1.3, 1.8]], circles: [[-1.8, 1.8], [-1.8, 1.8]] };
    let ds = "moons", seed = 5, K = 10, lr = 1, depth = 1, noisy = false, train, test, models = [], ws = [], curve, stopped = false;
    function gen() {
      const r = rng(seed * 173), mk = (n) => { const a = []; for (let i = 0; i < n; i++) {
        if (ds === "moons") { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push({ 0: Math.cos(t1) + 0.25 * randn(r), 1: Math.sin(t1) + 0.25 * randn(r), c: 1 }); a.push({ 0: 1 - Math.cos(t2) + 0.25 * randn(r), 1: 0.5 - Math.sin(t2) + 0.25 * randn(r), c: -1 }); }
        else { const t1 = 2 * Math.PI * r(), t2 = 2 * Math.PI * r(); a.push({ 0: 0.5 * Math.cos(t1) + 0.14 * randn(r), 1: 0.5 * Math.sin(t1) + 0.14 * randn(r), c: 1 }); a.push({ 0: 1.2 * Math.cos(t2) + 0.14 * randn(r), 1: 1.2 * Math.sin(t2) + 0.14 * randn(r), c: -1 }); } } return a; };
      train = mk(30); test = mk(40); if (noisy) { const rr = rng(seed * 7 + 1); train.forEach((p) => { if (rr() < 0.1) p.c = -p.c; }); }
    }
    const g = (p, n) => (n > 1e-15 ? 1 - (p / n) ** 2 - (1 - p / n) ** 2 : 0);
    function bldW(idx, w, d) {
      let W = 0, wp = 0; idx.forEach((i) => { W += w[i]; if (train[i].c > 0) wp += w[i]; }); const node = { v: wp >= W - wp ? 1 : -1 };
      if (d >= depth || wp <= 1e-12 || W - wp <= 1e-12 || idx.length < 2) return node;
      let best = null; [0, 1].forEach((f) => { const S = idx.slice().sort((a, b) => train[a][f] - train[b][f]); let lt = 0, lp = 0; for (let j = 0; j < S.length - 1; j++) { const i = S[j]; lt += w[i]; if (train[i].c > 0) lp += w[i]; if (train[i][f] === train[S[j + 1]][f]) continue; const sc = (lt * g(lp, lt) + (W - lt) * g(wp - lp, W - lt)) / W; if (!best || sc < best.sc - 1e-12) best = { f, t: (train[i][f] + train[S[j + 1]][f]) / 2, sc }; } });
      if (!best || g(wp, W) - best.sc <= 1e-12) return node;
      node.f = best.f; node.t = best.t; node.l = bldW(idx.filter((i) => train[i][best.f] <= best.t), w, d + 1); node.r = bldW(idx.filter((i) => train[i][best.f] > best.t), w, d + 1); return node;
    }
    const pred = (n, q) => { while (n.l) n = q[n.f] <= n.t ? n.l : n.r; return n.v; };
    function boost() {
      const n = train.length, all = train.map((_, i) => i); let w = new Array(n).fill(1 / n); models = []; ws = []; stopped = false;
      for (let r = 0; r < MAXR; r++) {
        const tree = bldW(all, w, 0), ph = train.map((p) => pred(tree, p)); let err = 0; ph.forEach((v, i) => { if (v !== train[i].c) err += w[i]; });
        if (err < 1e-10) { stopped = true; if (!models.length) { models.push({ tree, a: lr * 3 }); ws.push(w.slice()); } break; }
        if (err >= 0.5 - 1e-12) { stopped = true; break; }
        const a = lr * 0.5 * Math.log((1 - err) / err); ws.push(w.slice()); models.push({ tree, a });
        w = w.map((wi, i) => wi * Math.exp(-a * train[i].c * ph[i])); const Z = w.reduce((s, v) => s + v, 0); w = w.map((v) => v / Z);
      }
      const Ftr = new Array(n).fill(0), Fte = new Array(test.length).fill(0); curve = { tr: [], te: [] };
      models.forEach((m) => { train.forEach((p, i) => (Ftr[i] += m.a * pred(m.tree, p))); test.forEach((p, i) => (Fte[i] += m.a * pred(m.tree, p))); curve.tr.push(mean(train.map((p, i) => ((Ftr[i] >= 0 ? 1 : -1) === p.c ? 1 : 0)))); curve.te.push(mean(test.map((p, i) => ((Fte[i] >= 0 ? 1 : -1) === p.c ? 1 : 0)))); });
    }
    gen(); boost();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const kk = Math.min(K, models.length), lw = Math.round(W * 0.6), [xr, yr] = ranges[ds], P = eqPlane(W, H, xr, yr, lw), sa = models.slice(0, kk).reduce((s, m) => s + m.a, 0) || 1;
      ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b);
      const cs = 6; for (let px = P.pad.l; px < lw - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) { const q = [P.iX(px + cs / 2), P.iY(py + cs / 2)]; let F = 0; for (let j = 0; j < kk; j++) F += models[j].a * pred(models[j].tree, q); ctx.globalAlpha = 0.1 + 0.28 * Math.min(1, Math.abs(F) / sa); ctx.fillStyle = F >= 0 ? css("--c1") : css("--c2"); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1;
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      test.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, null, colOf(p.c)));
      const wk = ws[kk - 1] || [], wm = Math.max(...wk, 1e-9); train.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 3.5 + 8 * Math.sqrt((wk[i] || 0) / wm), colOf(p.c))); ctx.restore();
      const Q = plane(W, H, [1, MAXR], [0.5, 1.0], { l: lw + 46, r: 10, t: 26, b: 32 }); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("accuracy vs rounds", (Q.pad.l + W) / 2, 15); axes(ctx, Q, { nx: 4, ny: 5, xl: "rounds (n_estimators)", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      [[curve.tr, css("--c1")], [curve.te, css("--c2")]].forEach(([c, col]) => { ctx.beginPath(); c.forEach((v, i) => (i ? ctx.lineTo(Q.X(i + 1), Q.Y(v)) : ctx.moveTo(Q.X(1), Q.Y(v)))); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(kk), Q.Y(c[kk - 1]), 5.5, col); });
    });
    function show() {
      const kk = Math.min(K, models.length), tr = curve.tr[kk - 1], te = curve.te[kk - 1];
      out.innerHTML = `data: <b>${ds}</b>${noisy ? " with <b>10% flipped training labels</b>" : ""} · base tree depth = <b>${depth}</b> · learning rate = <b>${lr}</b> · rounds shown: <b>${kk}</b>${stopped ? ` (boosting stopped by itself at ${models.length}: the training data is already fitted perfectly)` : ""}<br>training accuracy <b>${(tr * 100).toFixed(0)}%</b> · test accuracy <b>${(te * 100).toFixed(0)}%</b> · big dots are the points the next stump will be forced to care about<br>` + (kk === 1 ? "One weak learner: a single straight cut." : noisy && tr - te > 0.12 ? "Noisy labels: boosting keeps piling weight onto the mislabelled points and bends the boundary to fit them (overfitting)." : tr - te > 0.15 ? "Training accuracy is well above test accuracy: starting to overfit." : "Many weak cuts combined into a curved boundary."); cv.redraw();
    }
    slider(ctl, { label: "Rounds", min: 1, max: MAXR, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "Learning rate", min: 0.1, max: 1, step: 0.1, value: lr, fmt: (v) => v.toFixed(1), onInput: (v) => { lr = v; boost(); show(); } });
    slider(ctl, { label: "Base tree depth", min: 1, max: 3, step: 1, value: depth, onInput: (v) => { depth = v; boost(); show(); } });
    const bd = btn(ctl, "Data: moons", () => { ds = ds === "moons" ? "circles" : "moons"; bd.textContent = "Data: " + ds; gen(); boost(); show(); }, "primary");
    const bn = btn(ctl, "Label noise: off", () => { noisy = !noisy; bn.textContent = "Label noise: " + (noisy ? "on (10% flipped)" : "off"); gen(); boost(); show(); });
    btn(ctl, "New random data", () => { seed++; gen(); boost(); show(); }); show();
  })();
});
