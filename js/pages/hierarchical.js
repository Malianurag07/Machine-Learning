/* Demos for hierarchical.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const pal = (i) => (i < 4 ? css("--c" + (i + 1)) : i === 4 ? css("--accent") : i === 5 ? css("--yellow") : "hsl(" + ((i * 53) % 360) + ",65%,55%)");
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const METHODS = ["single", "complete", "average", "ward"];

  /** agglomerative clustering with the Lance-Williams update. Returns merges [{a, b, h, size}] with new node id = n + step. */
  function agglo(X, method) {
    const n = X.length, sq = method === "ward", D = X.map((p, i) => X.map((q, j) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); return sq ? d * d : d; })), act = X.map(() => true), size = X.map(() => 1), id = X.map((_, i) => i), M = [];
    for (let s = 0; s < n - 1; s++) {
      let bi = -1, bj = -1, bd = Infinity; for (let i = 0; i < n; i++) { if (!act[i]) continue; for (let j = i + 1; j < n; j++) if (act[j] && D[i][j] < bd - 1e-12) { bd = D[i][j]; bi = i; bj = j; } }
      M.push({ a: id[bi], b: id[bj], h: sq ? Math.sqrt(bd) : bd, size: size[bi] + size[bj] });
      for (let k = 0; k < n; k++) { if (!act[k] || k === bi || k === bj) continue; let v; const ni = size[bi], nj = size[bj], nk = size[k];
        if (method === "single") v = Math.min(D[bi][k], D[bj][k]); else if (method === "complete") v = Math.max(D[bi][k], D[bj][k]); else if (method === "average") v = (ni * D[bi][k] + nj * D[bj][k]) / (ni + nj); else v = ((ni + nk) * D[bi][k] + (nj + nk) * D[bj][k] - nk * bd) / (ni + nj + nk);
        D[bi][k] = D[k][bi] = v; }
      act[bj] = false; size[bi] += size[bj]; id[bi] = n + s;
    }
    return M;
  }
  /** labels after applying the first m merges */
  function labelsAfter(n, M, m) { const par = Array.from({ length: n + M.length }, (_, i) => i), find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }; for (let s = 0; s < m; s++) { par[find(M[s].a)] = n + s; par[find(M[s].b)] = n + s; } const ids = {}; return Array.from({ length: n }, (_, i) => { const r = find(i); if (!(r in ids)) ids[r] = Object.keys(ids).length; return ids[r]; }); }
  const members = (n, M, node) => (node < n ? [node] : [...members(n, M, M[node - n].a), ...members(n, M, M[node - n].b)]);
  const leafOrder = (n, M) => members(n, M, n + M.length - 1);
  function ari(a, b) { const c2 = (x) => (x * (x - 1)) / 2, tab = {}, ra = {}, rb = {}; a.forEach((x, i) => { const y = b[i], k = x + "|" + y; tab[k] = (tab[k] || 0) + 1; ra[x] = (ra[x] || 0) + 1; rb[y] = (rb[y] || 0) + 1; }); const sij = Object.values(tab).reduce((s, v) => s + c2(v), 0), sa = Object.values(ra).reduce((s, v) => s + c2(v), 0), sb = Object.values(rb).reduce((s, v) => s + c2(v), 0), ex = (sa * sb) / c2(a.length), mx = (sa + sb) / 2; return mx === ex ? 1 : (sij - ex) / (mx - ex); }
  /** draw a dendrogram; xOf(leafIndex) gives the pixel x of each leaf; Y maps height to pixels */
  function drawTree(ctx, n, M, upTo, xOf, Y, colorOf) {
    const pos = {}; for (let i = 0; i < n; i++) pos[i] = { x: xOf(i), y: Y(0) };
    for (let s = 0; s < upTo; s++) { const m = M[s], A = pos[m.a], B = pos[m.b], y = Y(m.h); const col = colorOf ? colorOf(s) : css("--text"); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x, y); ctx.lineTo(B.x, y); ctx.lineTo(B.x, B.y); ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.stroke(); pos[n + s] = { x: (A.x + B.x) / 2, y }; }
    return pos;
  }

  /* ---------- merge by merge on a number line (the hand example) ---------- */
  (function () {
    const host = $("#demo-build"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const xs = [0, 1, 2.1, 3.3, 4.6, 8, 8.5], X = xs.map((x) => [x, 0]), n = X.length; let mi = 0, s = 0, M = agglo(X, METHODS[mi]);
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const P = plane(W, H, [-0.8, 9.3], [0, 1], { l: 40, r: 20, t: 10, b: H - 92 }), maxH = Math.max(...M.map((m) => m.h)) * 1.1, Q = plane(W, H, [-0.8, 9.3], [0, maxH], { l: 40, r: 20, t: 122, b: 30 });
      const lab = labelsAfter(n, M, s); ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("the data on a line (colour = current cluster)", W / 2, 18);
      line(ctx, P.X(-0.8), 56, P.X(9.3), 56, css("--line"), 3); xs.forEach((x, i) => { dot(ctx, P.X(x), 56, 11, pal(lab[i])); ctx.fillStyle = css("--text"); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText(x, P.X(x), 84); });
      if (s < n - 1) { const m = M[s]; [m.a, m.b].forEach((nd) => { const mem = members(n, M, nd), lo = Math.min(...mem.map((i) => xs[i])), hi = Math.max(...mem.map((i) => xs[i])); ctx.strokeStyle = css("--accent"); ctx.lineWidth = 3.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(P.X(lo) - 16, 36, P.X(hi) - P.X(lo) + 32, 40, 14) : ctx.rect(P.X(lo) - 16, 36, P.X(hi) - P.X(lo) + 32, 40); ctx.stroke(); ctx.setLineDash([]); }); }
      ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillText("the dendrogram so far (height = distance at which the merge happened)", W / 2, 114);
      axes(ctx, Q, { nx: 4, ny: 4, grid: false, fx: () => "", fy: (v) => v.toFixed(1) }); const pos = drawTree(ctx, n, M, s, (i) => Q.X(xs[i]), (v) => Q.Y(v), () => css("--c4"));
      xs.forEach((x, i) => dot(ctx, Q.X(x), Q.Y(0), 5, pal(lab[i])));
      Object.keys(pos).filter((k) => +k >= n).forEach((k) => { const st = +k - n; ctx.fillStyle = css("--text"); ctx.font = "700 11px Fredoka, sans-serif"; ctx.fillText(M[st].h.toFixed(M[st].h % 1 === 0 || M[st].h < 3 ? 1 : 2), pos[k].x, pos[k].y - 6); });
    });
    function show() {
      const done = s >= n - 1, m = M[s], f = (nd) => "{" + members(n, M, nd).map((i) => xs[i]).join(", ") + "}";
      const how = { single: "the <b>smallest</b> distance between a point of one cluster and a point of the other", complete: "the <b>largest</b> distance between a point of one cluster and a point of the other", average: "the <b>average</b> of all distances between the two clusters' points", ward: "the increase in total squared spread the merge would cause (shown here on the height scale √(2·increase))" }[METHODS[mi]];
      out.innerHTML = `linkage: <b>${METHODS[mi]}</b> (cluster distance = ${how})<br>` + (done ? `All points are merged into one cluster: the full tree is drawn. Merge heights: <b>${M.map((q) => q.h.toFixed(2).replace(/\.?0+$/, "")).join(" → ")}</b>. Now switch the linkage and compare the heights (single = 3.4 at the top, complete = 8.5).` : `Step ${s + 1} of ${n - 1}: the two closest clusters are <b>${f(m.a)}</b> and <b>${f(m.b)}</b>, at distance <b>${m.h.toFixed(2).replace(/\.?0+$/, "")}</b>. Merge them (dashed boxes).`) + (s > 0 ? `<br>Merges so far: ${M.slice(0, s).map((q) => q.h.toFixed(2).replace(/\.?0+$/, "")).join(" → ")}` : ""); cv.redraw();
    }
    btn(ctl, "Merge next pair ▶", () => { if (s < n - 1) s++; show(); }, "primary"); btn(ctl, "Run to the end", () => { s = n - 1; show(); }); btn(ctl, "Reset", () => { s = 0; show(); });
    const bl = btn(ctl, "Linkage: single", () => { mi = (mi + 1) % 4; bl.textContent = "Linkage: " + METHODS[mi]; M = agglo(X, METHODS[mi]); show(); }); show();
  })();

  /* ---------- linkage on different shapes ---------- */
  (function () {
    const host = $("#demo-link", document), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const names = ["blobs", "moons", "rings", "bridge"], ranges = { blobs: [[-3, 3.4], [-2.4, 2.9]], moons: [[-1.6, 2.6], [-1.2, 1.6]], rings: [[-1.8, 1.8], [-1.8, 1.8]], bridge: [[-3, 3], [-2, 2]] }, tk = { blobs: 3, moons: 2, rings: 2, bridge: 2 };
    let ds = "blobs", mi = 3, K = 3, seed = 2, X, truth, M;
    function gen() {
      const r = rng(seed * 43); X = []; truth = [];
      if (ds === "blobs") [[-1.5, -0.8, 0.4, 40], [1.5, -0.8, 0.95, 40], [0, 1.7, 0.5, 40]].forEach(([cx, cy, sd, cnt], g) => { for (let i = 0; i < cnt; i++) { X.push([cx + sd * randn(r), cy + sd * randn(r)]); truth.push(g); } });
      else if (ds === "moons") for (let i = 0; i < 60; i++) { const a = Math.PI * r(), b = Math.PI * r(); X.push([Math.cos(a) + 0.07 * randn(r), Math.sin(a) + 0.07 * randn(r)]); truth.push(0); X.push([1 - Math.cos(b) + 0.07 * randn(r), 0.5 - Math.sin(b) + 0.07 * randn(r)]); truth.push(1); }
      else if (ds === "rings") for (let i = 0; i < 120; i++) { const a = 2 * Math.PI * r(), rad = i < 40 ? 0.45 : 1.3; X.push([rad * Math.cos(a) + 0.05 * randn(r), rad * Math.sin(a) + 0.05 * randn(r)]); truth.push(i < 40 ? 0 : 1); }
      else { [[-1.6, 0], [1.6, 0]].forEach(([cx, cy], g) => { for (let i = 0; i < 50; i++) { X.push([cx + 0.4 * randn(r), cy + 0.4 * randn(r)]); truth.push(g); } }); for (let i = 0; i < 6; i++) { X.push([-1.0 + (2.0 * (i + 0.5)) / 6 + 0.02 * randn(r), 0.02 * randn(r)]); truth.push(-1); } }
    }
    function run() { M = agglo(X, METHODS[mi]); }
    gen(); run();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const [xr, yr] = ranges[ds], P = eqPlane(W, H, xr, yr), lab = labelsAfter(X.length, M, X.length - K); frame(ctx, P); ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      X.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.6, pal(lab[i]))); ctx.restore();
    });
    function show() {
      const lab = labelsAfter(X.length, M, X.length - K), t = [], p = []; truth.forEach((v, i) => { if (v >= 0) { t.push(v); p.push(lab[i]); } }); const a = ari(t, p), sizes = Array.from({ length: K }, (_, c) => lab.filter((v) => v === c).length).sort((x, y) => y - x);
      out.innerHTML = `data: <b>${ds}</b> · linkage: <b>${METHODS[mi]}</b> · cut into k = <b>${K}</b> clusters (true number ${tk[ds]}) · cluster sizes: <b>${sizes.join(", ")}</b> · agreement with the true groups (ARI${ds === "bridge" ? ", ignoring the 6 bridge points" : ""}): <b>${a.toFixed(2)}</b><br>` + (sizes[0] > 0.9 * X.length && K > 1 ? "🟥 One giant cluster plus crumbs: the classic <b>chaining</b> of single linkage (or an outlier taking its own cluster)." : a > 0.9 ? "✅ Recovers the true groups." : a > 0.5 ? "🟨 Partly right." : "🟥 Misses the structure of this shape with this linkage."); cv.redraw();
    }
    const bd = btn(ctl, "Data: blobs", () => { ds = names[(names.indexOf(ds) + 1) % 4]; bd.textContent = "Data: " + ds; K = tk[ds]; sK.set(K); gen(); run(); show(); }, "primary");
    const bl = btn(ctl, "Linkage: ward", () => { mi = (mi + 1) % 4; bl.textContent = "Linkage: " + METHODS[mi]; run(); show(); });
    const sK = slider(ctl, { label: "Clusters (k)", min: 2, max: 6, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    btn(ctl, "New random data", () => { seed++; gen(); run(); show(); }); show();
  })();

  /* ---------- cutting the dendrogram ---------- */
  (function () {
    const host = $("#demo-cut"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 4, mi = 3, X, M, order, cut, maxH, lastQ;
    function gen() { const r = rng(seed * 29); X = []; [[-1.6, -1, 0.42], [1.6, -0.8, 0.42], [0, 1.7, 0.42]].forEach(([cx, cy, sd]) => { for (let i = 0; i < 12; i++) X.push([cx + sd * randn(r), cy + sd * randn(r)]); }); run(); }
    function run() { M = agglo(X, METHODS[mi]); order = leafOrder(X.length, M); maxH = M[M.length - 1].h * 1.05; cut = (M[M.length - 3].h + M[M.length - 2].h) / 2; }
    gen();
    const kAt = (c) => X.length - M.filter((m) => m.h <= c).length;
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const n = X.length, lw = Math.round(W * 0.58), Q = plane(lw, H, [-0.5, n - 0.5], [0, maxH], { l: 40, r: 8, t: 12, b: 14 }), Y = (v) => Q.Y(v); lastQ = Q;
      const m = M.filter((q) => q.h <= cut).length, lab = labelsAfter(n, M, m), xOf = (i) => Q.X(order.indexOf(i));
      axes(ctx, Q, { nx: 1, ny: 5, grid: false, fx: () => "", fy: (v) => v.toFixed(1) });
      const colOf = (s) => { const mem = members(n, M, n + s); const c = lab[mem[0]]; return M[s].h <= cut ? pal(c) : css("--muted"); };
      drawTree(ctx, n, M, n - 1, xOf, Y, colOf); X.forEach((p, i) => dot(ctx, xOf(i), Q.Y(0) + 0, 3.5, pal(lab[i])));
      line(ctx, Q.pad.l, Y(cut), lw - Q.pad.r, Y(cut), css("--accent"), 3.5, [8, 6]); ctx.fillStyle = css("--accent"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillText("cut", Q.pad.l + 4, Y(cut) - 5);
      const P = eqPlane(W, H, [-2.9, 3.0], [-2.1, 2.8], W - lw); ctx.save(); ctx.translate(lw, 0); frame(ctx, P); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); ctx.clip(); X.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, pal(lab[i]))); ctx.restore();
    });
    function show() {
      const hs = M.map((q) => q.h), gaps = hs.slice(1).map((v, i) => v - hs[i]), gi = gaps.indexOf(Math.max(...gaps)), k = kAt(cut), sugg = X.length - (gi + 1);
      out.innerHTML = `linkage <b>${METHODS[mi]}</b> · cut at height <b>${cut.toFixed(2)}</b> → the horizontal line crosses <b>${k}</b> vertical line${k === 1 ? "" : "s"} → <b>${k}</b> cluster${k === 1 ? "" : "s"}.<br>The biggest jump between successive merge heights is <b>${hs[gi].toFixed(2)} → ${hs[gi + 1].toFixed(2)}</b>: cutting inside that gap gives <b>${sugg}</b> clusters. A long vertical line means the clusters below it were far apart before they merged, so they are probably real. (The data has 3 blobs of 12 points.)`; cv.redraw();
    }
    const sc = slider(ctl, { label: "Cut height", min: 0.5, max: 100, step: 0.5, value: 50, fmt: (v) => ((v / 100) * maxH).toFixed(2), onInput: (v) => { cut = (v / 100) * maxH; show(); } });
    const setSl = () => sc.set(clamp((cut / maxH) * 100, 0.5, 100));
    const bl = btn(ctl, "Linkage: ward", () => { mi = (mi + 1) % 4; bl.textContent = "Linkage: " + METHODS[mi]; run(); setSl(); show(); }, "primary");
    btn(ctl, "New random data", () => { seed++; gen(); setSl(); show(); }); setSl(); show();
  })();
});
