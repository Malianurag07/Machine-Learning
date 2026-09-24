/* Demos for grid-search-cv.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const pct = (v) => (v * 100).toFixed(1) + "%";
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };

  /* --- a small decision tree, the model whose settings we tune --- */
  const g = (p) => 1 - p * p - (1 - p) * (1 - p);
  function fit(D, depth, minLeaf, d) {
    d = d || 0; const n = D.length, n1 = D.reduce((s, p) => s + p.c, 0), node = { p: n1 / n };
    if (d >= depth || n1 === 0 || n1 === n || n < 2 * minLeaf) return node;
    let best = null; [0, 1].forEach((f) => { const S = D.slice().sort((a, b) => a[f] - b[f]); let l1 = 0; for (let i = 0; i < n - 1; i++) { l1 += S[i].c; if (S[i][f] === S[i + 1][f]) continue; const nl = i + 1, nr = n - nl; if (nl < minLeaf || nr < minLeaf) continue; const sc = (nl * g(l1 / nl) + nr * g((n1 - l1) / nr)) / n; if (!best || sc < best.sc - 1e-12) best = { f, t: (S[i][f] + S[i + 1][f]) / 2, sc }; } });
    if (!best || g(n1 / n) - best.sc <= 1e-12) return node;
    node.f = best.f; node.t = best.t; node.l = fit(D.filter((p) => p[best.f] <= best.t), depth, minLeaf, d + 1); node.r = fit(D.filter((p) => p[best.f] > best.t), depth, minLeaf, d + 1); return node;
  }
  const pred = (n, q) => { while (n.l) n = q[n.f] <= n.t ? n.l : n.r; return n.p >= 0.5 ? 1 : 0; };
  const acc = (T, D) => mean(D.map((p) => (pred(T, p) === p.c ? 1 : 0)));
  const moons = (seed, n, noise) => { const r = rng(seed), a = []; for (let i = 0; i < n; i++) { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push({ 0: Math.cos(t1) + noise * randn(r), 1: Math.sin(t1) + noise * randn(r), c: 1 }); a.push({ 0: 1 - Math.cos(t2) + noise * randn(r), 1: 0.5 - Math.sin(t2) + noise * randn(r), c: 0 }); } return a; };
  /** k-fold cross-validation of one setting (shuffled folds) */
  function cvRun(D, depth, minLeaf, K, seed) {
    const r = rng(seed), idx = D.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const fold = new Array(D.length); idx.forEach((v, k) => (fold[v] = k % K)); const val = [], tr = [];
    for (let f = 0; f < K; f++) { const T = fit(D.filter((_, i) => fold[i] !== f), depth, minLeaf), V = D.filter((_, i) => fold[i] === f); val.push(acc(T, V)); tr.push(acc(T, D.filter((_, i) => fold[i] !== f))); }
    return { val, tr, mean: mean(val), std: sd(val), trMean: mean(tr) };
  }

  /* ---------- how the folds are cut ---------- */
  (function () {
    const host = $("#demo-folds"), out = $("[data-out]", host), ctl = $("[data-controls]", host), N = 20;
    const cls = Array.from({ length: N }, (_, i) => (i < 10 ? 0 : 1)); let K = 5, shuf = false, cur = 0, order;
    const mkOrder = () => { const r = rng(7), o = Array.from({ length: N }, (_, i) => i); if (shuf) for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
    order = mkOrder();
    const foldOf = () => { const f = new Array(N), base = Math.floor(N / K), extra = N % K; let pos = 0; for (let k = 0; k < K; k++) { const sz = base + (k < extra ? 1 : 0); for (let j = 0; j < sz; j++) f[order[pos++]] = k; } return f; };
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const f = foldOf(), left = 64, s = (W - left - 12) / N, rh = Math.min(26, (H - 44) / K), sq = Math.min(s - 3, rh - 4);
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("the 20 rows in their original order · circle colour = class (A/B)", (left + W) / 2, 16);
      for (let k = 0; k < K; k++) {
        const y = 30 + k * rh; ctx.textAlign = "right"; ctx.font = (k === cur ? "800 " : "600 ") + "12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.fillText("fold " + (k + 1), left - 8, y + rh / 2 + 3);
        if (k === cur) { ctx.strokeStyle = css("--accent"); ctx.lineWidth = 3; ctx.strokeRect(left - 3, y - 1, W - left - 6, rh); }
        for (let i = 0; i < N; i++) { const x = left + s * i + s / 2, isVal = f[i] === k; ctx.globalAlpha = isVal ? 1 : 0.35; dot(ctx, x, y + rh / 2, sq / 2, cls[i] ? css("--c1") : css("--c2")); ctx.globalAlpha = 1; if (isVal) { ctx.beginPath(); ctx.arc(x, y + rh / 2, sq / 2 + 2.5, 0, 7); ctx.strokeStyle = css("--text"); ctx.lineWidth = 3; ctx.stroke(); } }
      }
    });
    function show() {
      const f = foldOf(), val = f.map((v, i) => (v === cur ? i : -1)).filter((i) => i >= 0), a = val.filter((i) => !cls[i]).length, b = val.length - a, trn = N - val.length, ta = cls.filter((c, i) => !c && f[i] !== cur).length, tb = trn - ta;
      out.innerHTML = `<b>${K}</b> folds of ${N} rows${K === N ? " (this is <b>leave-one-out</b>)" : ""}. Ringed circles = the validation fold (${val.length} row${val.length === 1 ? "" : "s"}) · faded circles = training (${trn} rows). Every row is validated exactly once and trains in the other ${K - 1} round${K === 2 ? "" : "s"}.<br>Fold ${cur + 1}: validation has <b>${a}</b> × A and <b>${b}</b> × B; training has <b>${ta}</b> × A and <b>${tb}</b> × B.` + (ta === 0 || tb === 0 ? `<br>🟥 The training part contains only one class, so a model cannot learn the other one and this fold's score is meaningless. The data was sorted by class: <b>shuffle the rows</b> (or use stratified folds).` : shuf ? "<br>Shuffled folds mix the classes: fair." : "<br>Unshuffled folds cut the data in its stored order. With rows sorted by class this can go wrong: try 2 folds."); cv.redraw();
    }
    const sK = slider(ctl, { label: "Folds (K)", min: 2, max: N, step: 1, value: K, onInput: (v) => { K = v; cur = Math.min(cur, K - 1); sF.el.max = K; sF.set(cur + 1); show(); } });
    const sF = slider(ctl, { label: "Highlight fold", min: 1, max: K, step: 1, value: 1, onInput: (v) => { cur = Math.min(v - 1, K - 1); show(); } });
    const bs = btn(ctl, "Rows: original order", () => { shuf = !shuf; bs.textContent = "Rows: " + (shuf ? "shuffled" : "original order"); order = mkOrder(); show(); }, "primary");
    btn(ctl, "Leave-one-out (K = 20)", () => { K = N; sK.set(K); cur = Math.min(cur, K - 1); sF.el.max = K; sF.set(cur + 1); show(); }); show();
  })();

  /* ---------- the grid, random search, and the optimism trap ---------- */
  (function () {
    const host = $("#demo-grid", document), out = $("[data-out]", host), ctl = $("[data-controls]", host), DEPTH = [1, 2, 3, 4, 5, 6, 7, 8], LEAF = [1, 2, 3, 5, 8, 12], NOISE = 0.35, TRY = 10;
    let seed = 3, mode = "grid", train, test, res, tried, sel, lastP, rs = 1, exp = null;
    const key = (d, l) => d + "," + l;
    function compute() { train = moons(seed, 30, NOISE); test = moons(seed + 5000, 150, NOISE); res = {}; DEPTH.forEach((d) => LEAF.forEach((l) => (res[key(d, l)] = cvRun(train, d, l, 5, 11)))); pick(); }
    function pick() { const all = []; DEPTH.forEach((d) => LEAF.forEach((l) => all.push([d, l]))); if (mode === "grid") tried = new Set(all.map((c) => key(...c))); else { const r = rng(rs * 977 + seed), a = all.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } tried = new Set(a.slice(0, TRY).map((c) => key(...c))); } sel = bestKey(); }
    function bestKey() { let b = null; tried.forEach((k) => { if (!b || res[k].mean > res[b].mean + 1e-12) b = k; }); return b; }
    compute();
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const left = 78, top = 34, cw = (W - left - 12) / DEPTH.length, ch = (H - top - 40) / LEAF.length, best = bestKey(); lastP = { left, top, cw, ch };
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("5-fold CV accuracy for every combination (click a cell)", (left + W) / 2, 16); ctx.fillText("max_depth", (left + W) / 2, H - 6);
      ctx.save(); ctx.translate(12, top + (ch * LEAF.length) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("min_samples_leaf", 0, 0); ctx.restore();
      DEPTH.forEach((d, i) => { ctx.fillStyle = css("--text"); ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(d, left + cw * (i + 0.5), top - 6 + 0); });
      LEAF.forEach((l, j) => { ctx.fillStyle = css("--text"); ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "right"; ctx.fillText(l, left - 6, top + ch * (j + 0.5) + 4); });
      DEPTH.forEach((d, i) => LEAF.forEach((l, j) => {
        const k = key(d, l), x = left + cw * i, y = top + ch * j, on = tried.has(k), v = res[k].mean, t = clamp((v - 0.6) / 0.35, 0, 1);
        if (on) { ctx.globalAlpha = 0.12 + 0.8 * t; ctx.fillStyle = css("--c3"); ctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3); ctx.globalAlpha = 1; ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText(Math.round(v * 100), x + cw / 2, y + ch / 2 + 4); }
        else { ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.2; ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4); ctx.restore(); }
        if (k === best) { ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4.5; ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2); }
        if (k === sel) { ctx.strokeStyle = css("--text"); ctx.lineWidth = 2.5; ctx.strokeRect(x + 5, y + 5, cw - 10, ch - 10); }
      }));
    });
    function show() {
      const r = res[sel], [d, l] = sel.split(",").map(Number), b = bestKey(), rb = res[b], [bd, bl] = b.split(",").map(Number), T = fit(train, bd, bl), tDef = acc(fit(train, 8, 1), test), n = tried.size;
      out.innerHTML = `<b>${mode === "grid" ? "Grid search" : "Random search"}</b>: ${n} combinations × 5 folds = <b>${n * 5}</b> model fits (+1 final refit). Best (pink frame): <b>max_depth ${bd}, min_samples_leaf ${bl}</b> with CV accuracy <b>${pct(rb.mean)}</b> (± ${pct(rb.std)} across folds).<br>Refit on all 60 training rows and tested on 300 <i>untouched</i> points: <b>${pct(acc(T, test))}</b>. The untuned default tree (depth 8, leaf 1) scores <b>${pct(tDef)}</b> on the same test points.<br>Selected cell (depth ${d}, leaf ${l}): folds = ${r.val.map((v) => Math.round(v * 100)).join("% · ")}% → mean ${pct(r.mean)}, training accuracy ${pct(r.trMean)}.` + (exp ? `<br><b>Repeated on 20 fresh datasets:</b> the best CV score averaged <b>${pct(exp.cv)}</b>, but the chosen setting scored only <b>${pct(exp.te)}</b> on new points (grid) and <b>${pct(exp.ter)}</b> (random search, ${TRY} tries); the untuned default scored <b>${pct(exp.def)}</b>. The CV score of the winner is <b>optimistic</b>: that is why you keep a final test set.` : ""); cv.redraw();
    }
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), i = Math.floor((p.x - lastP.left) / lastP.cw), j = Math.floor((p.y - lastP.top) / lastP.ch); if (i >= 0 && i < DEPTH.length && j >= 0 && j < LEAF.length && tried.has(key(DEPTH[i], LEAF[j]))) { sel = key(DEPTH[i], LEAF[j]); show(); } });
    const bm = btn(ctl, "Mode: grid search (all 48)", () => { mode = mode === "grid" ? "random" : "grid"; bm.textContent = "Mode: " + (mode === "grid" ? "grid search (all 48)" : "random search (10 tries)"); pick(); show(); }, "primary");
    btn(ctl, "New random tries", () => { rs++; if (mode === "grid") { mode = "random"; bm.textContent = "Mode: random search (10 tries)"; } pick(); show(); });
    btn(ctl, "New random data", () => { seed += 3; exp = null; compute(); show(); });
    btn(ctl, "Repeat on 20 fresh datasets", () => {
      const cvs = [], tes = [], ters = [], defs = []; for (let s = 0; s < 20; s++) { const tr = moons(900 + s * 7, 30, NOISE), te = moons(7000 + s * 7, 150, NOISE), R = {}, cells = []; DEPTH.forEach((d) => LEAF.forEach((l) => { R[key(d, l)] = cvRun(tr, d, l, 5, 11); cells.push(key(d, l)); }));
        const bestOf = (ks) => ks.reduce((b, k) => (R[k].mean > R[b].mean + 1e-12 ? k : b), ks[0]), bg = bestOf(cells), rr = rng(s + 1), a = cells.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } const br = bestOf(a.slice(0, TRY)), P = (k) => k.split(",").map(Number);
        cvs.push(R[bg].mean); tes.push(acc(fit(tr, ...P(bg)), te)); ters.push(acc(fit(tr, ...P(br)), te)); defs.push(acc(fit(tr, 8, 1), te)); }
      exp = { cv: mean(cvs), te: mean(tes), ter: mean(ters), def: mean(defs) }; show();
    }); show();
  })();

  /* ---------- validation curve ---------- */
  (function () {
    const host = $("#demo-curve"), out = $("[data-out]", host), ctl = $("[data-controls]", host), MAXD = 12;
    let n = 40, noise = 0.35, seed = 5, curve;
    function compute() { const D = moons(seed, n, noise); curve = []; for (let d = 1; d <= MAXD; d++) curve.push(cvRun(D, d, 1, 5, 3)); }
    compute();
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [1, MAXD], [0.5, 1.0], { l: 46, r: 14, t: 14, b: 36 }); axes(ctx, P, { nx: MAXD - 1, ny: 5, xl: "max_depth", yl: "accuracy", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      ctx.globalAlpha = 0.25; ctx.fillStyle = css("--c2"); ctx.beginPath(); curve.forEach((c, i) => ctx[i ? "lineTo" : "moveTo"](P.X(i + 1), P.Y(clamp(c.mean + c.std, 0.5, 1)))); for (let i = MAXD - 1; i >= 0; i--) ctx.lineTo(P.X(i + 1), P.Y(clamp(curve[i].mean - curve[i].std, 0.5, 1))); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      [["trMean", css("--c1")], ["mean", css("--c2")]].forEach(([k, col]) => { ctx.beginPath(); curve.forEach((c, i) => ctx[i ? "lineTo" : "moveTo"](P.X(i + 1), P.Y(c[k]))); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke(); });
      const bi = curve.reduce((b, c, i) => (c.mean > curve[b].mean + 1e-12 ? i : b), 0); dot(ctx, P.X(bi + 1), P.Y(curve[bi].mean), 8, css("--accent")); ctx.font = "700 18px Fredoka"; ctx.fillStyle = css("--good"); ctx.textAlign = "center"; ctx.fillText("★", P.X(bi + 1), P.Y(curve[bi].mean) - 12);
    });
    function show() {
      const bi = curve.reduce((b, c, i) => (c.mean > curve[b].mean + 1e-12 ? i : b), 0), c = curve[bi], last = curve[MAXD - 1];
      out.innerHTML = `${2 * n} training rows, noise ${noise.toFixed(2)}. Blue = accuracy on the folds' <i>training</i> parts, orange = accuracy on the <i>validation</i> folds (band = ± one standard deviation across the 5 folds).<br>Best validation accuracy at <b>max_depth ${bi + 1}</b>: <b>${pct(c.mean)}</b> (training ${pct(c.trMean)}). At depth ${MAXD}: training <b>${pct(last.trMean)}</b> but validation only <b>${pct(last.mean)}</b>: the gap is overfitting.<br>` + (bi === 0 ? "Even the simplest tree wins here: the data is too noisy or too small for anything more." : "The training curve keeps rising, the validation curve peaks and falls: choose the peak (★). With few rows the band is wide, so nearby depths are practically tied."); cv.redraw();
    }
    slider(ctl, { label: "Training rows", min: 20, max: 300, step: 10, value: 2 * n, onInput: (v) => { n = v / 2; compute(); show(); } });
    slider(ctl, { label: "Noise", min: 0.1, max: 0.6, step: 0.05, value: noise, fmt: (v) => v.toFixed(2), onInput: (v) => { noise = v; compute(); show(); } });
    btn(ctl, "New random data", () => { seed++; compute(); show(); }, "primary"); show();
  })();
});
