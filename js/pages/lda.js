/* Demos for lda.html (uses ML.data from pca-data.js) */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const cls = (k) => (k === 0 ? css("--c1") : k === 1 ? css("--c2") : css("--c3"));
  const pctf = (v) => (v * 100).toFixed(1) + "%";

  function eigSym(S) {
    const n = S.length, A = S.map((r) => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j]; if (off < 1e-24) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { const apq = A[p][q]; if (Math.abs(apq) < 1e-300) continue; const th = (A[q][q] - A[p][p]) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(1 + th * th)), c = 1 / Math.sqrt(1 + t * t), s = t * c;
        for (let k = 0; k < n; k++) { const a = A[k][p], b = A[k][q]; A[k][p] = c * a - s * b; A[k][q] = s * a + c * b; } for (let k = 0; k < n; k++) { const a = A[p][k], b = A[q][k]; A[p][k] = c * a - s * b; A[q][k] = s * a + c * b; } for (let k = 0; k < n; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; } }
    }
    const idx = A.map((_, i) => i).sort((a, b) => A[b][b] - A[a][a]); return { values: idx.map((i) => A[i][i]), vectors: idx.map((i) => V.map((row) => row[i])) };
  }
  const matMul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  /** LDA projections for a labelled table (rows X, labels y): returns directions (rows), eigenvalue shares and 2-D scores */
  function ldaFit(X, y, standardise) {
    const n = X.length, d = X[0].length, cs = [...new Set(y)], mu = Array.from({ length: d }, (_, j) => mean(X.map((r) => r[j]))), sd = Array.from({ length: d }, (_, j) => Math.sqrt(mean(X.map((r) => (r[j] - mu[j]) ** 2))) || 1);
    const Z = X.map((r) => r.map((v, j) => (v - mu[j]) / (standardise ? sd[j] : 1))), Sw = Array.from({ length: d }, () => new Array(d).fill(0)), Sb = Array.from({ length: d }, () => new Array(d).fill(0));
    cs.forEach((c) => { const rows = Z.filter((_, i) => y[i] === c), m = Array.from({ length: d }, (_, j) => mean(rows.map((r) => r[j]))); rows.forEach((r) => { for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) Sw[a][b] += (r[a] - m[a]) * (r[b] - m[b]); }); for (let a = 0; a < d; a++) for (let b = 0; b < d; b++) Sb[a][b] += rows.length * m[a] * m[b]; });
    const e = eigSym(Sw), Wm = matMul(matMul(transpose(e.vectors), e.values.map((l, i) => e.values.map((_, j) => (i === j ? 1 / Math.sqrt(l) : 0)))), e.vectors), M = matMul(matMul(Wm, Sb), Wm), f = eigSym(M), tot = f.values.reduce((s, v) => s + Math.max(v, 0), 0), dirs = f.vectors.slice(0, cs.length - 1).map((u) => Wm.map((row) => row.reduce((s, v, j) => s + v * u[j], 0)));
    return { dirs, share: f.values.slice(0, cs.length - 1).map((v) => Math.max(v, 0) / tot), scores: Z.map((r) => dirs.map((w) => w.reduce((s, v, j) => s + v * r[j], 0))) };
  }
  const transpose = (A) => A[0].map((_, j) => A.map((r) => r[j]));
  function pcaFit(X, standardise) {
    const n = X.length, d = X[0].length, mu = Array.from({ length: d }, (_, j) => mean(X.map((r) => r[j]))), sd = Array.from({ length: d }, (_, j) => Math.sqrt(mean(X.map((r) => (r[j] - mu[j]) ** 2))) || 1), Z = X.map((r) => r.map((v, j) => (v - mu[j]) / (standardise ? sd[j] : 1)));
    const C = Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => Z.reduce((s, r) => s + r[a] * r[b], 0) / (n - 1))), e = eigSym(C), tot = e.values.reduce((s, v) => s + v, 0);
    return { share: e.values.map((v) => v / tot), scores: Z.map((r) => e.vectors.slice(0, 2).map((v) => v.reduce((s, w, j) => s + w * r[j], 0))) };
  }
  const loo5 = (S, y) => { let ok = 0; S.forEach((p, i) => { const d = S.map((q, j) => [j === i ? Infinity : (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2, y[j]]).sort((a, b) => a[0] - b[0]).slice(0, 5), v = {}; d.forEach(([, c]) => (v[c] = (v[c] || 0) + 1)); const best = Object.keys(v).sort((a, b) => v[b] - v[a])[0]; if (+best === y[i]) ok++; }); return ok / S.length; };

  /* ---------- which direction separates the classes? ---------- */
  (function () {
    const host = $("#demo-project"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 4, ang = 30, X, Y, anim = 0, pcaA, ldaA;
    function gen() {
      const r = rng(seed * 29), a = ((25 + 40 * r()) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); X = []; Y = [];
      for (let k = 0; k < 2; k++) for (let i = 0; i < 50; i++) { const u = 1.7 * randn(r), v = 0.5 * randn(r) + (k ? 0.95 : -0.95); X.push([c * u - s * v, s * u + c * v]); Y.push(k); }
      const m = [mean(X.map((p) => p[0])), mean(X.map((p) => p[1]))]; X = X.map((p) => [p[0] - m[0], p[1] - m[1]]);
      const sxx = mean(X.map((p) => p[0] * p[0])), syy = mean(X.map((p) => p[1] * p[1])), sxy = mean(X.map((p) => p[0] * p[1])); pcaA = ((0.5 * Math.atan2(2 * sxy, sxx - syy) * 180) / Math.PI + 180) % 180;
      const mu = [0, 1].map((k) => [mean(X.filter((_, i) => Y[i] === k).map((p) => p[0])), mean(X.filter((_, i) => Y[i] === k).map((p) => p[1]))]), Sw = [[0, 0], [0, 0]]; X.forEach((p, i) => { const dx = p[0] - mu[Y[i]][0], dy = p[1] - mu[Y[i]][1]; Sw[0][0] += dx * dx; Sw[0][1] += dx * dy; Sw[1][1] += dy * dy; }); Sw[1][0] = Sw[0][1];
      const det = Sw[0][0] * Sw[1][1] - Sw[0][1] ** 2, dl = [mu[1][0] - mu[0][0], mu[1][1] - mu[0][1]], w = [(Sw[1][1] * dl[0] - Sw[0][1] * dl[1]) / det, (-Sw[0][1] * dl[0] + Sw[0][0] * dl[1]) / det]; ldaA = ((Math.atan2(w[1], w[0]) * 180) / Math.PI + 180) % 180;
    }
    const stats = (deg) => { const t = (deg * Math.PI) / 180, u = [Math.cos(t), Math.sin(t)], p = X.map((q) => q[0] * u[0] + q[1] * u[1]), g = [0, 1].map((k) => p.filter((_, i) => Y[i] === k)), m = g.map(mean), v = g.map((a, k) => mean(a.map((z) => (z - m[k]) ** 2))), J = (m[1] - m[0]) ** 2 / (v[0] + v[1]), cut = (m[0] + m[1]) / 2, ok = p.filter((z, i) => (m[1] > m[0] ? z > cut : z < cut) === (Y[i] === 1)).length / p.length; return { u, p, m, v, J, ok, cut }; };
    gen();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const lw = Math.round(W * 0.5), P = eqPlane(W, H, [-5.2, 5.2], [-4, 4], lw), st = stats(ang); frame(ctx, P); ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      line(ctx, P.X(-9 * st.u[0]), P.Y(-9 * st.u[1]), P.X(9 * st.u[0]), P.Y(9 * st.u[1]), css("--accent"), 4);
      X.forEach((q, i) => { line(ctx, P.X(q[0]), P.Y(q[1]), P.X(st.p[i] * st.u[0]), P.Y(st.p[i] * st.u[1]), cls(Y[i]), 1); dot(ctx, P.X(q[0]), P.Y(q[1]), 4.6, cls(Y[i])); }); X.forEach((q, i) => dot(ctx, P.X(st.p[i] * st.u[0]), P.Y(st.p[i] * st.u[1]), 2.6, cls(Y[i]))); ctx.restore();
      const rx = [-5, 5], T = plane(W, H, rx, [0, 1], { l: lw + 16, r: 10, t: 26, b: Math.round(H / 2) + 6 }), B = 26, cnt = [0, 1].map(() => new Array(B).fill(0)); st.p.forEach((z, i) => { const b = clamp(Math.floor(((z - rx[0]) / (rx[1] - rx[0])) * B), 0, B - 1); cnt[Y[i]][b]++; }); const mx = Math.max(...cnt[0], ...cnt[1], 1);
      ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("the classes as seen along the axis (1-D)", (T.pad.l + W) / 2, 15);
      [0, 1].forEach((k) => cnt[k].forEach((c, b) => { if (!c) return; const x0 = T.X(rx[0] + ((rx[1] - rx[0]) * b) / B), x1 = T.X(rx[0] + ((rx[1] - rx[0]) * (b + 1)) / B); ctx.globalAlpha = 0.6; ctx.fillStyle = cls(k); ctx.fillRect(x0, T.Y(c / mx), x1 - x0, T.Y(0) - T.Y(c / mx)); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1.2; ctx.strokeRect(x0, T.Y(c / mx), x1 - x0, T.Y(0) - T.Y(c / mx)); }));
      line(ctx, T.pad.l, T.Y(0), W - T.pad.r, T.Y(0), css("--text"), 2);
      const Q = plane(W, H, [0, 180], [0, Math.max(...Array.from({ length: 90 }, (_, i) => stats(i * 2).J)) * 1.1], { l: lw + 40, r: 10, t: Math.round(H / 2) + 26, b: 34 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("separation score J at every angle", (Q.pad.l + W) / 2, Math.round(H / 2) + 15); axes(ctx, Q, { nx: 4, ny: 2, xl: "axis angle (degrees)", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      ctx.beginPath(); for (let d = 0; d <= 180; d += 2) { const j = stats(d).J; d ? ctx.lineTo(Q.X(d), Q.Y(j)) : ctx.moveTo(Q.X(0), Q.Y(j)); } ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(ang), Q.Y(st.J), 6, css("--accent")); ctx.font = "700 12px Fredoka"; ctx.fillStyle = css("--good"); ctx.fillText("LDA", Q.X(ldaA), Q.Y(stats(ldaA).J) - 7); ctx.fillStyle = css("--bad"); ctx.fillText("PCA", Q.X(pcaA), Q.Y(stats(pcaA).J) - 7);
    });
    function show() {
      const st = stats(ang), sp = stats(pcaA), sl = stats(ldaA), near = (a) => Math.min(Math.abs(ang - a), 180 - Math.abs(ang - a)) <= 2;
      out.innerHTML = `Axis at <b>${ang}°</b>: the two class averages along it are ${st.m[0].toFixed(2)} and ${st.m[1].toFixed(2)}; separation score J = (gap between averages)² ÷ (spread of class 1 + spread of class 2) = <b>${st.J.toFixed(2)}</b>; a single cut on this axis classifies <b>${(st.ok * 100).toFixed(0)}%</b> correctly.<br><b style="color:var(--bad)">PCA's axis</b> (${Math.round(pcaA)}°, the direction of most total spread): J = ${sp.J.toFixed(2)}, ${(sp.ok * 100).toFixed(0)}% correct · <b style="color:var(--good)">LDA's axis</b> (${Math.round(ldaA)}°, the direction that best separates the classes): J = ${sl.J.toFixed(2)}, ${(sl.ok * 100).toFixed(0)}% correct.` + (near(ldaA) ? "<br>🌟 You are on the LDA direction: the two histograms barely overlap." : near(pcaA) ? "<br>🟥 You are on the PCA direction: the long axis of the cloud, where both classes are smeared on top of each other." : "<br>Rotate the axis and watch the two histograms (top right) slide over each other or apart."); cv.redraw();
    }
    const sl = slider(ctl, { label: "Axis angle", min: 0, max: 179, step: 1, value: ang, fmt: (v) => v + "°", onInput: (v) => { cancelAnimationFrame(anim); ang = v; show(); } });
    const go = (tgt) => { cancelAnimationFrame(anim); const s = ang, t = Math.round(tgt) % 180, d = ((t - s + 270) % 180) - 90, t0 = performance.now(); (function f(now) { const k = Math.min(1, (now - t0) / 700); ang = Math.round((s + d * (1 - (1 - k) ** 3) + 360) % 180); sl.set(ang); show(); if (k < 1) anim = requestAnimationFrame(f); })(t0); };
    btn(ctl, "Snap to PCA direction", () => go(pcaA)); btn(ctl, "★ Snap to LDA direction", () => go(ldaA), "primary"); btn(ctl, "New random data", () => { seed++; gen(); show(); }); show();
  })();

  /* ---------- PCA vs LDA on real data ---------- */
  (function () {
    const host = $("#demo-compare"), out = $("[data-out]", host), ctl = $("[data-controls]", host), cache = {};
    let ds = "iris", std = false;
    const get = () => { const k = ds + std; if (!cache[k]) { const D = ML.data[ds]; const p = pcaFit(D.X, std), l = ldaFit(D.X, D.y, std); cache[k] = { p, l, accP: loo5(p.scores, D.y), accL: loo5(l.scores, D.y) }; } return cache[k]; };
    const panel = (ctx, sc, x0, w, H, title, labels) => { const xs = sc.map((s) => s[0]), ys = sc.map((s) => s[1]), rx = [Math.min(...xs), Math.max(...xs)], ry = [Math.min(...ys), Math.max(...ys)], pd = 0.08, P = plane(w, H, [rx[0] - pd * (rx[1] - rx[0]), rx[1] + pd * (rx[1] - rx[0])], [ry[0] - pd * (ry[1] - ry[0]), ry[1] + pd * (ry[1] - ry[0])], { l: 40, r: 10, t: 28, b: 34 }); ctx.save(); ctx.translate(x0, 0); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText(title, w / 2, 16); axes(ctx, P, { nx: 3, ny: 3, xl: labels[0], yl: labels[1], fx: (v) => (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1)), fy: (v) => (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1)) }); sc.forEach((s, i) => dot(ctx, P.X(s[0]), P.Y(s[1]), 4.2, cls(ML.data[ds].y[i]))); ctx.restore(); };
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => { const g = get(), hw = Math.round(W / 2); panel(ctx, g.p.scores, 0, hw, H, "PCA: PC1 × PC2 (labels ignored)", ["PC1", "PC2"]); panel(ctx, g.l.scores, hw, W - hw, H, "LDA: LD1 × LD2 (labels used)", ["LD1", "LD2"]); });
    function show() {
      const g = get(), D = ML.data[ds];
      out.innerHTML = `data: <b>${ds}</b> (${D.X.length} rows, ${D.X[0].length} features, ${D.classes.length} classes: ${D.classes.join(", ")}) · features <b>${std ? "standardised" : "in raw units"}</b><br>PCA: the two axes keep <b>${pctf(g.p.share[0] + g.p.share[1])}</b> of the total variance; 5-nearest-neighbour accuracy inside the picture (leave-one-out) <b>${pctf(g.accP)}</b>.<br>LDA: LD1 carries <b>${pctf(g.l.share[0])}</b> and LD2 <b>${pctf(g.l.share[1])}</b> of the class-separating power; the same accuracy inside the picture is <b>${pctf(g.accL)}</b>. (LDA's axes were computed from all the labels, so this comparison flatters LDA a little; the fair, cross-validated numbers are in the code section.)` + (ds === "wine" && !std ? "<br>🟥 Unscaled PCA is dominated by proline (huge numbers) and the classes are mixed. LDA is <b>unaffected by scaling</b>: switch scaling on and its picture stays exactly the same, while PCA's picture improves." : std && ds === "wine" ? "<br>With scaling, PCA now separates the wines fairly well, but LDA's picture (identical to the unscaled one) is still tighter." : "<br>LDA pulls the classes apart on purpose; PCA only shows whatever direction has the most spread."); cv.redraw();
    }
    const bd = btn(ctl, "Data: iris", () => { ds = ds === "iris" ? "wine" : "iris"; bd.textContent = "Data: " + ds; show(); }, "primary"); const bs = btn(ctl, "Standardise: off", () => { std = !std; bs.textContent = "Standardise: " + (std ? "on" : "off"); show(); }); show();
  })();

  /* ---------- LDA vs QDA boundaries and priors ---------- */
  (function () {
    const host = $("#demo-boundary"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let mode = "same", model = "LDA", pri = 0.5, seed = 3, X, Y, est;
    function gen() {
      const r = rng(seed * 47); X = []; Y = []; const mk = (m, S, n, k) => { const l11 = Math.sqrt(S[0][0]), l21 = S[0][1] / l11, l22 = Math.sqrt(Math.max(S[1][1] - l21 * l21, 1e-9)); for (let i = 0; i < n; i++) { const a = randn(r), b = randn(r); X.push([m[0] + l11 * a, m[1] + l21 * a + l22 * b]); Y.push(k); } };
      if (mode === "same") { mk([-1.1, -0.6], [[1.3, 0.8], [0.8, 1.3]], 100, 0); mk([1.1, 0.6], [[1.3, 0.8], [0.8, 1.3]], 100, 1); } else { mk([-0.3, 0], [[0.8, 0], [0, 0.8]], 100, 0); mk([0.6, 0.1], [[4, 1.4], [1.4, 1]], 100, 1); }
      const stats = [0, 1].map((k) => { const P = X.filter((_, i) => Y[i] === k), m = [mean(P.map((p) => p[0])), mean(P.map((p) => p[1]))], n = P.length, S = [[0, 0], [0, 0]]; P.forEach((p) => { S[0][0] += (p[0] - m[0]) ** 2; S[0][1] += (p[0] - m[0]) * (p[1] - m[1]); S[1][1] += (p[1] - m[1]) ** 2; }); S[1][0] = S[0][1]; return { m, S, n }; });
      const pooled = [[0, 0], [0, 0]]; stats.forEach((s) => { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) pooled[a][b] += s.S[a][b]; }); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) pooled[a][b] /= X.length - 2; est = { stats: stats.map((s) => ({ m: s.m, C: [[s.S[0][0] / (s.n - 1), s.S[0][1] / (s.n - 1)], [s.S[1][0] / (s.n - 1), s.S[1][1] / (s.n - 1)]] })), pooled };
    }
    const inv = (C) => { const d = C[0][0] * C[1][1] - C[0][1] ** 2; return [[C[1][1] / d, -C[0][1] / d], [-C[1][0] / d, C[0][0] / d], d]; };
    const disc = (p, k) => { const s = est.stats[k], C = model === "LDA" ? est.pooled : s.C, I = inv(C), dx = p[0] - s.m[0], dy = p[1] - s.m[1], q = I[0][0] * dx * dx + 2 * I[0][1] * dx * dy + I[1][1] * dy * dy; return -0.5 * q - 0.5 * Math.log(inv(C)[2]) + Math.log(k ? pri : 1 - pri); };
    const predict = (p) => (disc(p, 1) > disc(p, 0) ? 1 : 0);
    const ellipse = (ctx, P, m, C, col) => { const a = C[0][0], b = C[0][1], c = C[1][1], tr = a + c, dt = a * c - b * b, l1 = tr / 2 + Math.sqrt(Math.max(tr * tr / 4 - dt, 0)), l2 = tr / 2 - Math.sqrt(Math.max(tr * tr / 4 - dt, 0)), th = 0.5 * Math.atan2(2 * b, a - c); ctx.beginPath(); for (let i = 0; i <= 60; i++) { const t = (i / 60) * 2 * Math.PI, u = 2 * Math.sqrt(l1) * Math.cos(t), v = 2 * Math.sqrt(Math.max(l2, 1e-9)) * Math.sin(t), x = m[0] + u * Math.cos(th) - v * Math.sin(th), y = m[1] + u * Math.sin(th) + v * Math.cos(th); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); };
    gen();
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const P = eqPlane(W, H, [-6, 6], [-4, 4]); frame(ctx, P); const cs = 8; for (let px = P.pad.l; px < W - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) { ctx.globalAlpha = 0.15; ctx.fillStyle = predict([P.iX(px + cs / 2), P.iY(py + cs / 2)]) ? css("--c2") : css("--c1"); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1;
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip(); X.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.2, Y[i] ? css("--c2") : css("--c1"))); [0, 1].forEach((k) => ellipse(ctx, P, est.stats[k].m, model === "LDA" ? est.pooled : est.stats[k].C, k ? css("--c2") : css("--c1"))); est.stats.forEach((s) => dot(ctx, P.X(s.m[0]), P.Y(s.m[1]), 7, css("--text"))); ctx.restore();
    });
    function show() {
      const acc = mean(X.map((p, i) => (predict(p) === Y[i] ? 1 : 0))), a1 = mean(X.filter((_, i) => Y[i] === 1).map((p) => (predict(p) === 1 ? 1 : 0))), a0 = mean(X.filter((_, i) => Y[i] === 0).map((p) => (predict(p) === 0 ? 1 : 0)));
      out.innerHTML = `data: <b>${mode === "same" ? "both classes have the same shape (same covariance)" : "the classes have different shapes (different covariances)"}</b> · model: <b>${model}</b> · prior of the orange class: <b>${pri.toFixed(2)}</b><br>accuracy on these 200 points: <b>${(acc * 100).toFixed(1)}%</b> (blue class ${(a0 * 100).toFixed(0)}% right, orange class ${(a1 * 100).toFixed(0)}% right) · ellipses show the shape each model assumes (2 standard deviations)<br>` + (model === "LDA" ? "LDA forces one shared shape on both classes, so the boundary is always a <b>straight line</b>." : "QDA lets each class have its own shape, so the boundary can <b>curve</b>.") + (mode === "diff" && model === "LDA" ? " Here the shared-shape assumption is wrong: the straight line cannot separate the tight blue class from the wide orange one well. Try QDA." : mode === "same" && model === "QDA" ? " With truly equal shapes QDA has no advantage and estimates more numbers from the same data (it can overfit on small samples)." : "") + (Math.abs(pri - 0.5) > 0.15 ? " A prior different from 0.5 moves the boundary towards the less likely class: the model demands more evidence before predicting it." : ""); cv.redraw();
    }
    const bm = btn(ctl, "Data: same shape", () => { mode = mode === "same" ? "diff" : "same"; bm.textContent = "Data: " + (mode === "same" ? "same shape" : "different shapes"); gen(); show(); }, "primary"); const bq = btn(ctl, "Model: LDA", () => { model = model === "LDA" ? "QDA" : "LDA"; bq.textContent = "Model: " + model; show(); });
    slider(ctl, { label: "Prior of orange class", min: 0.05, max: 0.95, step: 0.05, value: pri, fmt: (v) => v.toFixed(2), onInput: (v) => { pri = v; show(); } }); btn(ctl, "New random data", () => { seed++; gen(); show(); }); show();
  })();
});
