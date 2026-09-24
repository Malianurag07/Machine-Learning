/* Demos for clustering-overview.html: tiny K-Means, single-linkage and DBSCAN for a first look at each family */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const pal = (i) => (i < 0 ? css("--muted") : i < 4 ? css("--c" + (i + 1)) : i === 4 ? css("--accent") : i === 5 ? css("--yellow") : "hsl(" + ((i * 53) % 360) + ",65%,55%)");
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };

  function kmeans(X, k, seed, nInit) {
    const n = X.length; let best = null;
    for (let t = 0; t < (nInit || 4); t++) {
      const r = rng(seed * 31 + t * 7 + k), C = [X[Math.floor(r() * n)]];
      while (C.length < k) { const dd = X.map((p) => Math.min(...C.map((c) => d2(p, c)))), tot = dd.reduce((s, v) => s + v, 0); let u = r() * tot, j = 0; while (j < n - 1 && u > dd[j]) { u -= dd[j]; j++; } C.push(X[j]); }
      let lab = new Array(n).fill(-1);
      for (let it = 0; it < 60; it++) {
        let ch = false; X.forEach((p, i) => { let b = 0, bd = Infinity; C.forEach((c, j) => { const v = d2(p, c); if (v < bd) { bd = v; b = j; } }); if (lab[i] !== b) { lab[i] = b; ch = true; } });
        if (!ch) break; C.forEach((c, j) => { const m = X.filter((_, i) => lab[i] === j); if (m.length) C[j] = [mean(m.map((p) => p[0])), mean(m.map((p) => p[1]))]; });
      }
      const inertia = X.reduce((s, p, i) => s + d2(p, C[lab[i]]), 0); if (!best || inertia < best.inertia) best = { lab: lab.slice(), C: C.map((c) => c.slice()), inertia };
    }
    return best;
  }
  function singleLink(X, k) {
    const n = X.length, par = X.map((_, i) => i), find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, E = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) E.push([d2(X[i], X[j]), i, j]); E.sort((a, b) => a[0] - b[0]);
    let comps = n; for (const [, i, j] of E) { if (comps <= k) break; const a = find(i), b = find(j); if (a !== b) { par[a] = b; comps--; } }
    const ids = {}, lab = X.map((_, i) => { const r = find(i); if (!(r in ids)) ids[r] = Object.keys(ids).length; return ids[r]; }); return lab;
  }
  function dbscan(X, eps, minPts) {
    const n = X.length, e2 = eps * eps, nb = X.map((p) => { const a = []; X.forEach((q, j) => { if (d2(p, q) <= e2) a.push(j); }); return a; }), lab = new Array(n).fill(-2); let c = 0;
    for (let i = 0; i < n; i++) { if (lab[i] !== -2) continue; if (nb[i].length < minPts) { lab[i] = -1; continue; } lab[i] = c; const q = nb[i].slice(); while (q.length) { const j = q.pop(); if (lab[j] === -1) lab[j] = c; if (lab[j] !== -2) continue; lab[j] = c; if (nb[j].length >= minPts) nb[j].forEach((m) => q.push(m)); } c++; }
    return lab;
  }
  function silhouette(X, lab) {
    const ks = [...new Set(lab)], n = X.length, s = new Array(n).fill(0); if (ks.length < 2) return s;
    X.forEach((p, i) => { const sums = {}, cnt = {}; X.forEach((q, j) => { if (j === i) return; const d = Math.sqrt(d2(p, q)); sums[lab[j]] = (sums[lab[j]] || 0) + d; cnt[lab[j]] = (cnt[lab[j]] || 0) + 1; }); if (!cnt[lab[i]]) { s[i] = 0; return; } const a = sums[lab[i]] / cnt[lab[i]]; let b = Infinity; ks.forEach((k) => { if (k !== lab[i] && cnt[k]) b = Math.min(b, sums[k] / cnt[k]); }); s[i] = (b - a) / Math.max(a, b); });
    return s;
  }
  function ari(a, b) {
    const c2 = (x) => (x * (x - 1)) / 2, tab = {}, ra = {}, rb = {}; a.forEach((x, i) => { const y = b[i], k = x + "|" + y; tab[k] = (tab[k] || 0) + 1; ra[x] = (ra[x] || 0) + 1; rb[y] = (rb[y] || 0) + 1; });
    const sij = Object.values(tab).reduce((s, v) => s + c2(v), 0), sa = Object.values(ra).reduce((s, v) => s + c2(v), 0), sb = Object.values(rb).reduce((s, v) => s + c2(v), 0), ex = (sa * sb) / c2(a.length), mx = (sa + sb) / 2; return mx === ex ? 1 : (sij - ex) / (mx - ex);
  }
  const zs = (X) => { const m = [0, 1].map((k) => mean(X.map((p) => p[k]))), s = [0, 1].map((k) => Math.sqrt(mean(X.map((p) => (p[k] - m[k]) ** 2)))); return X.map((p) => [(p[0] - m[0]) / s[0], (p[1] - m[1]) / s[1]]); };

  /* ---------- units and scaling ---------- */
  (function () {
    const host = $("#demo-scale"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 3, K = 3, scaled = false, X, grp, res;
    function gen() { const r = rng(seed * 101); X = []; grp = []; [[40000, 25], [52000, 50], [64000, 75]].forEach(([mi, ms], g) => { for (let i = 0; i < 50; i++) { X.push([mi + 6000 * randn(r), ms + 7 * randn(r)]); grp.push(g); } }); }
    function run() { res = kmeans(scaled ? zs(X) : X, K, seed + 1, 6); }
    gen(); run();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const P = plane(W, H, [15000, 90000], [-5, 105], { l: 52, r: 14, t: 14, b: 40 }); axes(ctx, P, { nx: 5, ny: 5, xl: "annual income ($)", yl: "spending score (0 to 100)", fx: (v) => Math.round(v / 1000) + "k", fy: (v) => Math.round(v) });
      X.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5, pal(res.lab[i])));
    });
    function show() {
      const va = [0, 1].map((k) => { const m = mean(X.map((p) => p[k])); return mean(X.map((p) => (p[k] - m) ** 2)); }), a = ari(grp, res.lab);
      out.innerHTML = `Features are <b>${scaled ? "standardised" : "in their raw units"}</b> when clustering (the picture always shows raw units). Agreement with the 3 hidden customer groups (adjusted Rand index, 1 = perfect, about 0 = random): <b>${a.toFixed(2)}</b><br>` + (scaled ? "Now income and score both count about equally, and the clusters follow both." : `Squared spread of income ≈ ${Math.round(va[0]).toLocaleString()}, of score ≈ ${Math.round(va[1])}: income is about <b>${Math.round(va[0] / va[1]).toLocaleString()}× larger</b>, so the distance is almost entirely income. The clusters are vertical slices and the spending score is ignored.`); cv.redraw();
    }
    const bs = btn(ctl, "Scale features: off", () => { scaled = !scaled; bs.textContent = "Scale features: " + (scaled ? "on (standardised)" : "off"); run(); show(); }, "primary");
    slider(ctl, { label: "Clusters (k)", min: 2, max: 5, step: 1, value: K, onInput: (v) => { K = v; run(); show(); } });
    btn(ctl, "New random customers", () => { seed++; gen(); run(); show(); }); show();
  })();

  /* ---------- which algorithm fits which shape ---------- */
  (function () {
    const host = $("#demo-shapes"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const names = ["blobs", "moons", "rings", "stretched"], dflt = { blobs: 0.4, moons: 0.2, rings: 0.4, stretched: 0.5 }, ranges = { blobs: [[-2.6, 2.6], [-2.2, 2.4]], moons: [[-1.6, 2.6], [-1.1, 1.6]], rings: [[-1.8, 1.8], [-1.8, 1.8]], stretched: [[-3, 3], [-3, 3]] }, trueK = { blobs: 3, moons: 2, rings: 2, stretched: 3 };
    let ds = "blobs", algo = "kmeans", K = 3, eps = 0.4, minPts = 5, seed = 4, X, truth, lab;
    function gen() {
      const r = rng(seed * 57); X = []; truth = [];
      if (ds === "blobs") [[-1.3, -1], [1.3, -0.8], [0, 1.4]].forEach((c, g) => { for (let i = 0; i < 40; i++) { X.push([c[0] + 0.38 * randn(r), c[1] + 0.38 * randn(r)]); truth.push(g); } });
      else if (ds === "moons") for (let i = 0; i < 90; i++) { const a = Math.PI * r(), b = Math.PI * r(); X.push([Math.cos(a) + 0.07 * randn(r), Math.sin(a) + 0.07 * randn(r)]); truth.push(0); X.push([1 - Math.cos(b) + 0.07 * randn(r), 0.5 - Math.sin(b) + 0.07 * randn(r)]); truth.push(1); }
      else if (ds === "rings") for (let i = 0; i < 180; i++) { const a = 2 * Math.PI * r(), rad = i < 60 ? 0.45 : 1.3; X.push([rad * Math.cos(a) + 0.05 * randn(r), rad * Math.sin(a) + 0.05 * randn(r)]); truth.push(i < 60 ? 0 : 1); }
      else [[-1.2, 1.2], [0, 0], [1.2, -1.2]].forEach((c, g) => { for (let i = 0; i < 60; i++) { const u = 0.9 * randn(r), v = 0.22 * randn(r); X.push([c[0] + 0.85 * u - v, c[1] + 0.85 * u + v]); truth.push(g); } });
    }
    function run() { lab = algo === "kmeans" ? kmeans(X, K, seed, 6).lab : algo === "hier" ? singleLink(X, K) : dbscan(X, eps, minPts); }
    gen(); run();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const [xr, yr] = ranges[ds], P = eqPlane(W, H, xr, yr); frame(ctx, P); ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      X.forEach((p, i) => { if (lab[i] === -1) { ctx.strokeStyle = css("--muted"); ctx.lineWidth = 2.5; const x = P.X(p[0]), y = P.Y(p[1]); ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); } else dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, pal(lab[i])); }); ctx.restore();
    });
    function show() {
      const a = ari(truth, lab), nc = new Set(lab.filter((v) => v >= 0)).size, noise = lab.filter((v) => v === -1).length;
      const verdict = a > 0.9 ? "✅ It recovers the true groups almost perfectly." : a > 0.5 ? "🟨 Partly right: some points are put with the wrong group." : "🟥 It misses the real structure of this shape.";
      out.innerHTML = `data: <b>${ds}</b> (${X.length} points, ${trueK[ds]} true groups) · algorithm: <b>${algo === "kmeans" ? "K-Means, k = " + K : algo === "hier" ? "hierarchical (single linkage), k = " + K : "DBSCAN, eps = " + eps.toFixed(2) + ", min_samples = " + minPts}</b><br>found <b>${nc}</b> cluster${nc === 1 ? "" : "s"}${algo === "dbscan" ? " and <b>" + noise + "</b> noise point" + (noise === 1 ? "" : "s") + " (grey ×)" : ""} · agreement with the true groups (adjusted Rand index): <b>${a.toFixed(2)}</b> ${verdict}`; cv.redraw();
    }
    const bd = btn(ctl, "Data: blobs", () => { ds = names[(names.indexOf(ds) + 1) % 4]; bd.textContent = "Data: " + ds; K = trueK[ds]; eps = dflt[ds]; sK.set(K); sE.set(eps); gen(); run(); show(); }, "primary");
    const ba = btn(ctl, "Algorithm: K-Means", () => { algo = algo === "kmeans" ? "hier" : algo === "hier" ? "dbscan" : "kmeans"; ba.textContent = "Algorithm: " + (algo === "kmeans" ? "K-Means" : algo === "hier" ? "Hierarchical (single link)" : "DBSCAN"); run(); show(); });
    const sK = slider(ctl, { label: "k (K-Means, hierarchical)", min: 2, max: 6, step: 1, value: K, onInput: (v) => { K = v; run(); show(); } });
    const sE = slider(ctl, { label: "eps (DBSCAN radius)", min: 0.05, max: 0.8, step: 0.01, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; run(); show(); } });
    slider(ctl, { label: "min_samples (DBSCAN)", min: 2, max: 12, step: 1, value: minPts, onInput: (v) => { minPts = v; run(); show(); } });
    btn(ctl, "New random data", () => { seed++; gen(); run(); show(); }); show();
  })();

  /* ---------- how many clusters? elbow and silhouette ---------- */
  (function () {
    const host = $("#demo-eval"), out = $("[data-out]", host), ctl = $("[data-controls]", host), KS = [2, 3, 4, 5, 6, 7, 8];
    let seed = 6, spread = 0.7, K = 4, X, runs, sil;
    function compute() {
      const r = rng(seed * 43); X = []; [[-2.2, -2], [2.2, -1.8], [-1.8, 2.2], [2.0, 2.3]].forEach((c) => { for (let i = 0; i < 45; i++) X.push([c[0] + spread * randn(r), c[1] + spread * randn(r)]); });
      runs = {}; sil = {}; KS.forEach((k) => { runs[k] = kmeans(X, k, seed, 3); sil[k] = silhouette(X, runs[k].lab); });
    }
    compute();
    const avg = (k) => mean(sil[k]);
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const lw = Math.round(W * 0.5), P = eqPlane(W, H, [-4.4, 4.4], [-4.4, 4.4], lw); frame(ctx, P); const res = runs[K], s = sil[K];
      X.forEach((p, i) => { if (s[i] < 0.2) dot(ctx, P.X(p[0]), P.Y(p[1]), 9, null, css("--text")); dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, pal(res.lab[i])); }); res.C.forEach((c) => { dot(ctx, P.X(c[0]), P.Y(c[1]), 8, css("--text")); });
      const iMax = runs[2].inertia, A = plane(W, H, [2, 8], [0, iMax * 1.05], { l: lw + 44, r: 12, t: 22, b: H / 2 + 6 }), B = plane(W, H, [2, 8], [0, 1], { l: lw + 44, r: 12, t: H / 2 + 22, b: 34 });
      ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("inertia (lower = tighter) · the elbow", (A.pad.l + W) / 2, 13); ctx.fillText("mean silhouette (higher = better)", (B.pad.l + W) / 2, H / 2 + 13);
      axes(ctx, A, { nx: 6, ny: 3, fx: (v) => Math.round(v), fy: (v) => Math.round(v) }); axes(ctx, B, { nx: 6, ny: 4, xl: "number of clusters k", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      ctx.beginPath(); KS.forEach((k, i) => (i ? ctx.lineTo(A.X(k), A.Y(runs[k].inertia)) : ctx.moveTo(A.X(k), A.Y(runs[k].inertia)))); ctx.strokeStyle = css("--c1"); ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, A.X(K), A.Y(runs[K].inertia), 7, css("--accent"));
      ctx.beginPath(); KS.forEach((k, i) => (i ? ctx.lineTo(B.X(k), B.Y(clamp(avg(k), 0, 1))) : ctx.moveTo(B.X(k), B.Y(clamp(avg(k), 0, 1))))); ctx.strokeStyle = css("--c3"); ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, B.X(K), B.Y(clamp(avg(K), 0, 1)), 7, css("--accent"));
      const bk = KS.reduce((b, k) => (avg(k) > avg(b) ? k : b), KS[0]); ctx.font = "700 16px Fredoka"; ctx.fillStyle = css("--good"); ctx.fillText("★", B.X(bk), B.Y(clamp(avg(bk), 0, 1)) - 9);
    });
    function show() {
      const bk = KS.reduce((b, k) => (avg(k) > avg(b) ? k : b), KS[0]), low = sil[K].filter((v) => v < 0.2).length;
      out.innerHTML = `k = <b>${K}</b>: inertia <b>${runs[K].inertia.toFixed(0)}</b> · mean silhouette <b>${avg(K).toFixed(3)}</b> · <b>${low}</b> point${low === 1 ? "" : "s"} with silhouette below 0.2 (ringed). The silhouette peaks at k = <b>${bk}</b> (★); the data was generated from 4 blobs.<br>` + (spread > 1.1 ? "The blobs now overlap: the silhouette curve flattens and the elbow is hard to see. Real data often looks like this: the tools give a hint, not an answer." : K < 4 ? "Too few clusters: real groups are merged (inertia still falling steeply)." : K > 4 ? "Too many: a real group is cut in two, so the silhouette falls and inertia barely improves." : "Inertia has stopped dropping steeply (the elbow) and the silhouette is at its best."); cv.redraw();
    }
    slider(ctl, { label: "Clusters (k)", min: 2, max: 8, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "Blob spread", min: 0.4, max: 1.6, step: 0.1, value: spread, fmt: (v) => v.toFixed(1), onInput: (v) => { spread = v; compute(); show(); } });
    btn(ctl, "New random data", () => { seed++; compute(); show(); }, "primary"); show();
  })();
});
