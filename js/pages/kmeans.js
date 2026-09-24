/* Demos for kmeans.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const pal = (i) => (i < 0 ? css("--muted") : i < 4 ? css("--c" + (i + 1)) : i === 4 ? css("--accent") : css("--yellow"));
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const nearest = (p, C) => { let b = 0, bd = Infinity; C.forEach((c, j) => { const v = d2(p, c); if (v < bd - 1e-12) { bd = v; b = j; } }); return b; };
  const inertia = (X, C, lab) => X.reduce((s, p, i) => s + d2(p, C[lab[i]]), 0);
  const centroids = (X, lab, C) => C.map((c, j) => { const m = X.filter((_, i) => lab[i] === j); return m.length ? [mean(m.map((p) => p[0])), mean(m.map((p) => p[1]))] : c; });
  function pickInit(X, k, mode, r) {
    if (mode === "random") { const idx = new Set(); while (idx.size < k) idx.add(Math.floor(r() * X.length)); return [...idx].map((i) => X[i].slice()); }
    const C = [X[Math.floor(r() * X.length)].slice()];
    while (C.length < k) { const dd = X.map((p) => Math.min(...C.map((c) => d2(p, c)))), tot = dd.reduce((s, v) => s + v, 0); let u = r() * tot, j = 0; while (j < X.length - 1 && u > dd[j]) { u -= dd[j]; j++; } C.push(X[j].slice()); }
    return C;
  }
  function lloyd(X, C0) { let C = C0.map((c) => c.slice()), lab = X.map((p) => nearest(p, C)); for (let it = 0; it < 100; it++) { C = centroids(X, lab, C); const nl = X.map((p) => nearest(p, C)); if (nl.every((v, i) => v === lab[i])) break; lab = nl; } return { C, lab, inertia: inertia(X, C, lab) }; }
  const blobs = (r, spec) => { const X = [], truth = []; spec.forEach(([cx, cy, sx, sy, n], g) => { for (let i = 0; i < n; i++) { X.push([cx + sx * randn(r), cy + (sy || sx) * randn(r)]); truth.push(g); } }); return { X, truth }; };
  function ari(a, b) { const c2 = (x) => (x * (x - 1)) / 2, tab = {}, ra = {}, rb = {}; a.forEach((x, i) => { const y = b[i], k = x + "|" + y; tab[k] = (tab[k] || 0) + 1; ra[x] = (ra[x] || 0) + 1; rb[y] = (rb[y] || 0) + 1; }); const sij = Object.values(tab).reduce((s, v) => s + c2(v), 0), sa = Object.values(ra).reduce((s, v) => s + c2(v), 0), sb = Object.values(rb).reduce((s, v) => s + c2(v), 0), ex = (sa * sb) / c2(a.length), mx = (sa + sb) / 2; return mx === ex ? 1 : (sij - ex) / (mx - ex); }
  function shade(ctx, P, C, alpha) { const cs = 8; for (let px = P.pad.l; px < P.w - P.pad.r; px += cs) for (let py = P.pad.t; py < P.h - P.pad.b; py += cs) { ctx.globalAlpha = alpha; ctx.fillStyle = pal(nearest([P.iX(px + cs / 2), P.iY(py + cs / 2)], C)); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1; }
  function centroidMark(ctx, x, y, col) { ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 11, y); ctx.lineTo(x, y + 11); ctx.lineTo(x - 11, y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2.5; ctx.stroke(); }

  /* ---------- the loop, step by step ---------- */
  (function () {
    const host = $("#demo-steps"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 2, K = 3, mode = "random", X, C, lab, phase, it, hist, done, lastP, rs = 0;
    const gen = () => { X = blobs(rng(seed * 19), [[2.2, 2.2, 0.9, 0.9, 16], [6.6, 2.6, 0.9, 0.9, 16], [4.2, 6.6, 0.9, 0.9, 16]]).X; };
    function init() { C = pickInit(X, K, mode, rng(seed * 7 + rs * 101 + K)); lab = X.map(() => -1); phase = "assign"; it = 0; hist = []; done = false; }
    function step() {
      if (done) return;
      if (phase === "assign") { const nl = X.map((p) => nearest(p, C)), changed = nl.some((v, i) => v !== lab[i]); lab = nl; hist.push({ v: inertia(X, C, lab), kind: "assign" }); if (!changed) done = true; else phase = "update"; }
      else { C = centroids(X, lab, C); hist.push({ v: inertia(X, C, lab), kind: "update" }); phase = "assign"; it++; }
    }
    gen(); init();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const lw = Math.round(W * 0.64), P = eqPlane(W, H, [-0.5, 9], [-0.5, 9.2], lw); lastP = P; frame(ctx, P);
      shade(ctx, P, C, 0.12); ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      if (lab[0] >= 0) X.forEach((p, i) => line(ctx, P.X(p[0]), P.Y(p[1]), P.X(C[lab[i]][0]), P.Y(C[lab[i]][1]), pal(lab[i]), 1.2));
      X.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, lab[i] >= 0 ? pal(lab[i]) : css("--muted"))); C.forEach((c, j) => centroidMark(ctx, P.X(c[0]), P.Y(c[1]), pal(j))); ctx.restore();
      const Q = plane(W, H, [0, Math.max(6, hist.length)], [0, Math.max(10, hist.length ? hist[0].v * 1.05 : 10)], { l: lw + 44, r: 10, t: 26, b: 34 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("inertia after each step", (Q.pad.l + W) / 2, 15);
      axes(ctx, Q, { nx: 3, ny: 3, xl: "step", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      ctx.beginPath(); hist.forEach((s, i) => (i ? ctx.lineTo(Q.X(i + 1), Q.Y(s.v)) : ctx.moveTo(Q.X(1), Q.Y(s.v)))); ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3; ctx.stroke(); hist.forEach((s, i) => dot(ctx, Q.X(i + 1), Q.Y(s.v), 4.5, s.kind === "assign" ? css("--c1") : css("--c2")));
    });
    function show() {
      const cur = hist.length ? hist[hist.length - 1].v : null;
      out.innerHTML = `k = <b>${K}</b> · init: <b>${mode === "random" ? "random data points" : "k-means++"}</b> · iteration <b>${it}</b>` + (done ? ` · <b style="color:var(--good)">converged</b>: the assignments stopped changing, so the centroids would not move either.` : ` · next step: <b>${phase === "assign" ? "ASSIGN every point to its nearest centroid" : "UPDATE each centroid to the mean of its points"}</b>`) + `<br>` + (cur === null ? "Diamonds are the starting centroids. Nothing is assigned yet: press Step." : `inertia (sum of squared distances to the assigned centroid) = <b>${cur.toFixed(1)}</b>. Blue dots in the chart = after an assign step, orange = after an update step: the inertia can only go down or stay the same.`) + `<br>Tip: click on the plot to add a point, then press Step to watch the clusters react.`; cv.redraw();
    }
    btn(ctl, "Step ▶", () => { step(); show(); }, "primary"); btn(ctl, "Run to the end", () => { let g = 0; while (!done && g++ < 200) step(); show(); });
    const bm = btn(ctl, "Init: random points", () => { mode = mode === "random" ? "kmeans++" : "random"; bm.textContent = "Init: " + (mode === "random" ? "random points" : "k-means++"); rs++; init(); show(); });
    btn(ctl, "New starting centroids", () => { rs++; init(); show(); });
    slider(ctl, { label: "Clusters (k)", min: 2, max: 6, step: 1, value: K, onInput: (v) => { K = v; init(); show(); } });
    btn(ctl, "New random data", () => { seed++; gen(); init(); show(); });
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), P = lastP; if (p.x > P.pad.l && p.x < P.w - P.pad.r && p.y > P.pad.t && p.y < P.h - P.pad.b) { X.push([P.iX(p.x), P.iY(p.y)]); lab.push(-1); if (done) { done = false; phase = "assign"; } show(); } });
    show();
  })();

  /* ---------- local minima: many starts ---------- */
  (function () {
    const host = $("#demo-init"), out = $("[data-out]", host), ctl = $("[data-controls]", host), RUNS = 200;
    let seed = 4, K = 5, X, res;
    const gen = () => { X = blobs(rng(seed * 23), [[2, 2, 0.8, 0.8, 30], [7, 2, 0.8, 0.8, 30], [4.5, 4.6, 0.8, 0.8, 30], [2, 7, 0.8, 0.8, 30], [7, 7, 0.8, 0.8, 30]]).X; };
    function run() { res = {}; ["random", "kmeans++"].forEach((mode) => { const r = rng(seed * 991 + K), a = []; for (let i = 0; i < RUNS; i++) a.push(lloyd(X, pickInit(X, K, mode, r)).inertia); res[mode] = a; }); res.best = Math.min(...res.random, ...res["kmeans++"]); res.worst = Math.max(...res.random, ...res["kmeans++"]); }
    gen(); run();
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const B = 14, lo = res.best * 0.99, hi = Math.max(res.worst * 1.01, lo * 1.05), bw = (hi - lo) / B, rowH = (H - 60) / 2;
      ["random", "kmeans++"].forEach((mode, m) => {
        const cnt = new Array(B).fill(0); res[mode].forEach((v) => cnt[Math.min(B - 1, Math.floor((v - lo) / bw))]++); const P = plane(W, H, [lo, hi], [0, RUNS], { l: 46, r: 14, t: 22 + m * (rowH + 22), b: H - (22 + m * (rowH + 22) + rowH) });
        ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "left"; ctx.fillText(mode === "random" ? "random starting points: final inertia over " + RUNS + " runs" : "k-means++ starting points: final inertia over " + RUNS + " runs", P.pad.l, P.pad.t - 7);
        cnt.forEach((c, b) => { if (!c) return; const x0 = P.X(lo + b * bw), x1 = P.X(lo + (b + 1) * bw); ctx.fillStyle = b === 0 ? css("--c3") : css("--c2"); ctx.fillRect(x0 + 1, P.Y(c), x1 - x0 - 2, P.Y(0) - P.Y(c)); ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1.6; ctx.strokeRect(x0 + 1, P.Y(c), x1 - x0 - 2, P.Y(0) - P.Y(c)); ctx.fillStyle = css("--text"); ctx.font = "700 11px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText(c, (x0 + x1) / 2, P.Y(c) - 3); });
        line(ctx, P.pad.l, P.Y(0), W - P.pad.r, P.Y(0), css("--text"), 2); if (m === 1) { ctx.fillStyle = css("--text"); ctx.font = "600 12px DM Sans, sans-serif"; ctx.textAlign = "center"; for (let i = 0; i <= 4; i++) { const v = lo + ((hi - lo) * i) / 4; ctx.fillText(Math.round(v), P.X(v), P.Y(0) + 15); } ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillText("final inertia (lower = better; green bars = within 1% of the best found)", (P.pad.l + W) / 2, H - 2); }
      });
    });
    function show() {
      const good = (a) => a.filter((v) => v <= res.best * 1.01).length / a.length, bad = (a) => a.filter((v) => v > res.best * 1.3).length;
      out.innerHTML = `${X.length} points from 5 blobs, k = <b>${K}</b>, ${RUNS} runs of the algorithm from different single starts each. Best inertia found: <b>${res.best.toFixed(0)}</b>, worst: <b>${res.worst.toFixed(0)}</b>.<br>random starts: <b>${(good(res.random) * 100).toFixed(0)}%</b> of runs end within 1% of the best, <b>${bad(res.random)}</b> runs got stuck more than 30% above it · k-means++ starts: <b>${(good(res["kmeans++"]) * 100).toFixed(0)}%</b> within 1%, <b>${bad(res["kmeans++"])}</b> stuck.<br>` + (K === 5 ? "With k = 5 and 5 real blobs, a bad start can leave one centroid stranded between two blobs and another sharing a blob: a <b>local minimum</b>." : K < 5 ? "With fewer clusters than blobs there are several equally reasonable ways to merge blobs, so the runs often end in different but similar-quality solutions." : "With more clusters than blobs some blob is split, and where it is split depends on the start."); cv.redraw();
    }
    slider(ctl, { label: "Clusters (k)", min: 2, max: 7, step: 1, value: K, onInput: (v) => { K = v; run(); show(); } });
    btn(ctl, "New random data", () => { seed++; gen(); run(); show(); }, "primary"); show();
  })();

  /* ---------- where K-Means struggles ---------- */
  (function () {
    const host = $("#demo-limits"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const names = ["even blobs", "different sizes", "different spreads", "an outlier", "elongated"], tk = { "even blobs": 3, "different sizes": 3, "different spreads": 2, "an outlier": 3, elongated: 3 }, kd = { "even blobs": 3, "different sizes": 3, "different spreads": 2, "an outlier": 2, elongated: 3 }, rg = { "even blobs": [[-1, 9], [-1, 9]], "different sizes": [[-2, 10], [-1, 9]], "different spreads": [[-2, 9], [-1, 9]], "an outlier": [[-1, 14], [-1, 13]], elongated: [[-3, 3], [-3, 3]] };
    let ds = "even blobs", K = 3, seed = 3, showTruth = false, D, res;
    function gen() {
      const r = rng(seed * 37);
      if (ds === "even blobs") D = blobs(r, [[2, 2, 0.6, 0.6, 40], [6.5, 2.5, 0.6, 0.6, 40], [4, 6.5, 0.6, 0.6, 40]]);
      else if (ds === "different sizes") D = blobs(r, [[2.2, 4, 1.3, 1.3, 110], [6.6, 5.1, 0.35, 0.35, 15], [7.2, 3.1, 0.35, 0.35, 15]]);
      else if (ds === "different spreads") D = blobs(r, [[1.4, 4, 1.7, 1.7, 90], [5.4, 4, 0.3, 0.3, 50]]);
      else if (ds === "an outlier") { D = blobs(r, [[2, 2, 0.6, 0.6, 50], [6.5, 2.5, 0.6, 0.6, 50]]); [[12.5, 11.5], [12, 11], [13, 10.5], [11.5, 12], [12.8, 12.2], [11.8, 10.2]].forEach((p) => { D.X.push(p); D.truth.push(2); }); }
      else { D = { X: [], truth: [] }; [[-1.2, 1.2], [0, 0], [1.2, -1.2]].forEach((c, g) => { for (let i = 0; i < 60; i++) { const u = 0.9 * randn(r), v = 0.22 * randn(r); D.X.push([c[0] + 0.85 * u - v, c[1] + 0.85 * u + v]); D.truth.push(g); } }); }
    }
    function run() { let b = null; for (let t = 0; t < 8; t++) { const s = lloyd(D.X, pickInit(D.X, K, "kmeans++", rng(seed * 13 + t))); if (!b || s.inertia < b.inertia) b = s; } res = b; }
    gen(); run();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const [xr, yr] = rg[ds], P = eqPlane(W, H, xr, yr); frame(ctx, P); shade(ctx, P, res.C, 0.12); ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      D.X.forEach((p, i) => { if (showTruth) dot(ctx, P.X(p[0]), P.Y(p[1]), 8, null, [css("--text"), css("--bad"), css("--good")][D.truth[i]]); dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, pal(res.lab[i])); }); res.C.forEach((c, j) => centroidMark(ctx, P.X(c[0]), P.Y(c[1]), pal(j))); ctx.restore();
    });
    function show() {
      const a = ari(D.truth, res.lab), notes = { "even blobs": "The situation K-Means is built for: round, similar-sized, similarly spread groups.", "different sizes": "The big cluster pulls: K-Means prefers to cut the big blob in two and merge the two small ones, because that lowers the total squared distance.", "different spreads": "The boundary sits halfway between the two centres, so the outer part of the wide blob is stolen by the tight one.", "an outlier": "A few far-away points are a small cluster of their own (the true groups are the two blobs plus the outliers). With k = 2 K-Means is misled: it may merge the two blobs so that one centroid can serve the far-away points, because the outliers' huge squared distances dominate the inertia. Try k = 3.", elongated: "Long thin clusters: K-Means slices them across because its clusters are always the region nearest to a centre (round-ish cells)." };
      out.innerHTML = `data: <b>${ds}</b> (${D.X.length} points, ${tk[ds]} true groups) · k = <b>${K}</b> · inertia <b>${res.inertia.toFixed(1)}</b> · agreement with the true groups (adjusted Rand index): <b>${a.toFixed(2)}</b><br>${notes[ds]}` + (showTruth ? "<br>Coloured outlines show the TRUE groups; filled dots show K-Means' answer." : ""); cv.redraw();
    }
    const bd = btn(ctl, "Data: even blobs", () => { ds = names[(names.indexOf(ds) + 1) % names.length]; bd.textContent = "Data: " + ds; K = kd[ds]; sK.set(K); gen(); run(); show(); }, "primary");
    const sK = slider(ctl, { label: "Clusters (k)", min: 2, max: 6, step: 1, value: K, onInput: (v) => { K = v; run(); show(); } });
    const bt = btn(ctl, "True groups: hidden", () => { showTruth = !showTruth; bt.textContent = "True groups: " + (showTruth ? "outlined" : "hidden"); show(); });
    btn(ctl, "New random data", () => { seed++; gen(); run(); show(); }); show();
  })();
});
