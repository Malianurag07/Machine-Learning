/* Demos for dbscan.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const pal = (i) => (i < 0 ? css("--muted") : i < 4 ? css("--c" + (i + 1)) : i === 4 ? css("--accent") : i === 5 ? css("--yellow") : "hsl(" + ((i * 53) % 360) + ",65%,55%)");
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const cross = (ctx, x, y, col) => { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 4.5, y - 4.5); ctx.lineTo(x + 4.5, y + 4.5); ctx.moveTo(x + 4.5, y - 4.5); ctx.lineTo(x - 4.5, y + 4.5); ctx.stroke(); };
  function dbscan(X, eps, minPts) {
    const n = X.length, e2 = eps * eps, nb = X.map((p) => { const a = []; X.forEach((q, j) => { if (d2(p, q) <= e2) a.push(j); }); return a; }), core = nb.map((a) => a.length >= minPts), lab = new Array(n).fill(-2); let c = 0;
    for (let i = 0; i < n; i++) { if (lab[i] !== -2) continue; if (!core[i]) { lab[i] = -1; continue; } lab[i] = c; const q = nb[i].slice(); while (q.length) { const j = q.pop(); if (lab[j] === -1) lab[j] = c; if (lab[j] !== -2) continue; lab[j] = c; if (core[j]) nb[j].forEach((m) => q.push(m)); } c++; }
    return { lab, core, nb, k: c };
  }
  function ari(a, b) { const c2 = (x) => (x * (x - 1)) / 2, tab = {}, ra = {}, rb = {}; a.forEach((x, i) => { const y = b[i], k = x + "|" + y; tab[k] = (tab[k] || 0) + 1; ra[x] = (ra[x] || 0) + 1; rb[y] = (rb[y] || 0) + 1; }); const sij = Object.values(tab).reduce((s, v) => s + c2(v), 0), sa = Object.values(ra).reduce((s, v) => s + c2(v), 0), sb = Object.values(rb).reduce((s, v) => s + c2(v), 0), ex = (sa * sb) / c2(a.length), mx = (sa + sb) / 2; return mx === ex ? 1 : (sij - ex) / (mx - ex); }
  /** ARI on the real-cluster points only; a real point called noise counts as a miss (each gets its own label) */
  function quality(truth, lab) { const t = [], p = []; truth.forEach((v, i) => { if (v >= 0) { t.push(v); p.push(lab[i] >= 0 ? lab[i] : 1000 + i); } }); return ari(t, p); }

  const DS = ["moons", "blobs", "rings", "varied density"];
  const RANGE = { moons: [[-1.6, 2.6], [-1.2, 1.7]], blobs: [[-2.6, 2.6], [-2.2, 2.6]], rings: [[-1.9, 1.9], [-1.9, 1.9]], "varied density": [[-2.4, 3.2], [-1.7, 2.1]] };
  const DEF = { moons: [0.28, 5], blobs: [0.4, 5], rings: [0.4, 8], "varied density": [0.25, 5] };
  function makeData(ds, seed) {
    const r = rng(seed * 61), X = [], truth = [], R = RANGE[ds];
    if (ds === "moons") for (let i = 0; i < 90; i++) { const a = Math.PI * r(), b = Math.PI * r(); X.push([Math.cos(a) + 0.07 * randn(r), Math.sin(a) + 0.07 * randn(r)]); truth.push(0); X.push([1 - Math.cos(b) + 0.07 * randn(r), 0.5 - Math.sin(b) + 0.07 * randn(r)]); truth.push(1); }
    else if (ds === "blobs") [[-1.3, -1], [1.3, -0.8], [0, 1.4]].forEach((c, g) => { for (let i = 0; i < 50; i++) { X.push([c[0] + 0.33 * randn(r), c[1] + 0.33 * randn(r)]); truth.push(g); } });
    else if (ds === "rings") for (let i = 0; i < 150; i++) { const a = 2 * Math.PI * r(), rad = i < 50 ? 0.45 : 1.3; X.push([rad * Math.cos(a) + 0.05 * randn(r), rad * Math.sin(a) + 0.05 * randn(r)]); truth.push(i < 50 ? 0 : 1); }
    else { for (let i = 0; i < 70; i++) { X.push([-1.4 + 0.16 * randn(r), 0.4 + 0.16 * randn(r)]); truth.push(0); } for (let i = 0; i < 70; i++) { X.push([1.2 + 0.55 * randn(r), -0.2 + 0.55 * randn(r)]); truth.push(1); } }
    for (let i = 0; i < 18; i++) { X.push([R[0][0] + 0.1 + (R[0][1] - R[0][0] - 0.2) * r(), R[1][0] + 0.1 + (R[1][1] - R[1][0] - 0.2) * r()]); truth.push(-1); }
    return { X, truth };
  }

  /* ---------- the algorithm, one point at a time (the hand example) ---------- */
  (function () {
    const host = $("#demo-steps"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const X = [[1.0, 1.0], [1.6, 1.4], [2.2, 1.1], [2.9, 1.6], [3.6, 2.1], [6.0, 5.0], [6.5, 5.6], [7.1, 5.2], [6.6, 4.5], [4.5, 5.0], [9.0, 1.5], [3.6, 3.6]];
    let eps = 1.0, minPts = 3, st, cur, log, lastP;
    const nbOf = (i) => X.map((p, j) => j).filter((j) => d2(X[i], X[j]) <= eps * eps);
    function reset() { st = { lab: X.map(() => -2), expanded: new Set(), queue: [], c: -1, i: 0, done: false }; cur = -1; log = "Nothing visited yet. Press Step: the algorithm looks at the points one by one."; }
    function step() {
      if (st.done) return;
      if (!st.queue.length) {
        while (st.i < X.length && st.lab[st.i] !== -2) st.i++;
        if (st.i >= X.length) { st.done = true; cur = -1; log = "All points have been visited. Done."; return; }
        const i = st.i, nb = nbOf(i); cur = i;
        if (nb.length < minPts) { st.lab[i] = -1; log = `Point ${i + 1} has ${nb.length} point${nb.length === 1 ? "" : "s"} within eps (counting itself): fewer than ${minPts}, so it is not a core point. Marked <b>noise</b> for now (a later cluster may still claim it as a border point).`; st.i++; return; }
        st.c++; st.lab[i] = st.c; st.expanded.add(i); nb.forEach((j) => { if (j !== i) st.queue.push(j); });
        log = `Point ${i + 1} has ${nb.length} points within eps: at least ${minPts}, so it is a <b>core point</b>. A new cluster <b>${st.c + 1}</b> starts here; its ${nb.length - 1} neighbour${nb.length === 2 ? "" : "s"} join the waiting list.`; st.i++; return;
      }
      const j = st.queue.shift(), nb = nbOf(j); cur = j;
      if (st.lab[j] >= 0) { log = `Point ${j + 1} is already in cluster ${st.lab[j] + 1}: skip.`; return; }
      const wasNoise = st.lab[j] === -1; st.lab[j] = st.c;
      if (nb.length >= minPts && !st.expanded.has(j)) { st.expanded.add(j); nb.forEach((m) => { if (st.lab[m] < 0) st.queue.push(m); }); log = `Point ${j + 1} joins cluster ${st.c + 1}${wasNoise ? " (it was marked noise before)" : ""}. It has ${nb.length} points within eps, so it is a <b>core point</b> too: the cluster keeps growing through it.`; }
      else log = `Point ${j + 1} joins cluster ${st.c + 1}${wasNoise ? " (rescued from noise)" : ""}. It has only ${nb.length} point${nb.length === 1 ? "" : "s"} within eps: a <b>border point</b>. The cluster does not grow through it.`;
    }
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const P = eqPlane(W, H, [0, 10], [0, 7]); lastP = P; frame(ctx, P);
      if (cur >= 0) { ctx.beginPath(); ctx.arc(P.X(X[cur][0]), P.Y(X[cur][1]), P.X(eps) - P.X(0), 0, 7); ctx.fillStyle = css("--yellow"); ctx.globalAlpha = 0.28; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--text"); ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]); }
      X.forEach((p, i) => { const l = st.lab[i], x = P.X(p[0]), y = P.Y(p[1]), core = st.expanded.has(i); if (l === -1) cross(ctx, x, y, css("--muted")); else dot(ctx, x, y, core ? 10 : 8, l >= 0 ? pal(l) : css("--surface"), l >= 0 ? null : css("--text")); if (i === cur) { ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.strokeStyle = css("--accent"); ctx.lineWidth = 3.5; ctx.stroke(); } ctx.fillStyle = css("--text"); ctx.font = "700 11px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText(i + 1, x, y - 15); });
    });
    function show() {
      const labelled = st.lab.filter((v) => v !== -2).length, nn = st.lab.filter((v) => v === -1).length;
      out.innerHTML = `eps = <b>${eps.toFixed(1)}</b> · min_samples = <b>${minPts}</b> · visited <b>${labelled}</b> of ${X.length} points · clusters so far: <b>${st.c + 1}</b> · noise so far: <b>${nn}</b><br>${log}<br><span style="opacity:.75">Legend: big solid dot = core point, smaller solid dot = border point, ✕ = noise, hollow = not visited yet, dashed circle = the eps-neighbourhood being examined.</span>`; cv.redraw();
    }
    btn(ctl, "Step ▶", () => { step(); show(); }, "primary"); btn(ctl, "Run to the end", () => { let g = 0; while (!st.done && g++ < 500) step(); show(); }); btn(ctl, "Reset", () => { reset(); show(); });
    slider(ctl, { label: "eps (radius)", min: 0.3, max: 2.4, step: 0.1, value: eps, fmt: (v) => v.toFixed(1), onInput: (v) => { eps = v; reset(); show(); } });
    slider(ctl, { label: "min_samples", min: 2, max: 5, step: 1, value: minPts, onInput: (v) => { minPts = v; reset(); show(); } }); show();
  })();

  /* ---------- explore on bigger data ---------- */
  (function () {
    const host = $("#demo-explore"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let ds = "moons", seed = 3, eps = 0.28, minPts = 5, D, res, sel = -1, lastP;
    const gen = () => { D = makeData(ds, seed); };
    const run = () => { res = dbscan(D.X, eps, minPts); };
    gen(); run();
    const kd = () => D.X.map((p, i) => { const d = D.X.map((q, j) => (j === i ? Infinity : Math.sqrt(d2(p, q)))).sort((a, b) => a - b); return d[minPts - 2] === undefined ? 0 : d[minPts - 2]; }).sort((a, b) => a - b);
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const lw = Math.round(W * 0.6), [xr, yr] = RANGE[ds], P = eqPlane(W, H, xr, yr, lw); lastP = P; frame(ctx, P); ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      D.X.forEach((p, i) => { const x = P.X(p[0]), y = P.Y(p[1]), l = res.lab[i]; if (l === -1) cross(ctx, x, y, css("--muted")); else dot(ctx, x, y, res.core[i] ? 5.5 : 3.5, pal(l)); });
      if (sel >= 0) { const p = D.X[sel]; ctx.beginPath(); ctx.arc(P.X(p[0]), P.Y(p[1]), P.X(eps) - P.X(0), 0, 7); ctx.fillStyle = css("--yellow"); ctx.globalAlpha = 0.28; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--text"); ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]); dot(ctx, P.X(p[0]), P.Y(p[1]), 9, null, css("--accent")); } ctx.restore();
      const K = kd(), top = Math.max(0.6, K[Math.floor(K.length * 0.97)] * 1.6), Q = plane(W, H, [0, K.length], [0, top], { l: lw + 46, r: 10, t: 34, b: 34 });
      ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("k-distance plot (k = " + (minPts - 1) + ")", (Q.pad.l + W) / 2, 14); ctx.fillText("distance to the k-th neighbour", (Q.pad.l + W) / 2, 27); axes(ctx, Q, { nx: 3, ny: 4, xl: "points, sorted", fx: () => "", fy: (v) => v.toFixed(2) });
      ctx.beginPath(); K.forEach((v, i) => { const y = Q.Y(Math.min(v, top)); i ? ctx.lineTo(Q.X(i), y) : ctx.moveTo(Q.X(i), y); }); ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke(); line(ctx, Q.X(0), Q.Y(eps), Q.X(K.length), Q.Y(eps), css("--accent"), 3, [7, 5]);
    });
    function show() {
      const nc = res.k, noise = res.lab.filter((v) => v === -1).length, cores = res.core.filter(Boolean).length, lost = D.truth.filter((t, i) => t >= 0 && res.lab[i] === -1).length, realN = D.truth.filter((t) => t >= 0).length, caught = D.truth.filter((t, i) => t < 0 && res.lab[i] === -1).length, q = quality(D.truth, res.lab);
      out.innerHTML = `data: <b>${ds}</b> (${D.X.length} points, of which 18 are random noise) · eps = <b>${eps.toFixed(2)}</b> · min_samples = <b>${minPts}</b><br>found <b>${nc}</b> cluster${nc === 1 ? "" : "s"} · <b>${cores}</b> core points · <b>${noise}</b> noise points (✕): <b>${caught}</b> of the 18 true noise points caught, but <b>${lost}</b> of ${realN} real cluster points wrongly called noise · agreement on the real clusters (ARI, a lost point counts as a miss): <b>${q.toFixed(2)}</b>` + (sel >= 0 ? `<br>Selected point (pink ring): <b>${res.nb[sel].length}</b> points within eps counting itself, so it is <b>${res.core[sel] ? "a core point" : res.lab[sel] >= 0 ? "a border point" : "noise"}</b> (needs ${minPts}).` : `<br>Click a point to see its eps-neighbourhood.`) + (nc <= 1 && noise < 0.1 * D.X.length ? "<br>Everything merged into one lump: eps is too large (or min_samples too small)." : noise > 0.5 * D.X.length ? "<br>Most points are noise: eps is too small (or min_samples too large). The curve on the right shows why: the dashed eps line sits below most of the sorted distances." : ds === "varied density" && lost > 15 ? "<br>The sparse cluster is being lost as noise: one eps cannot suit both a dense and a sparse cluster. Raise eps to catch it and watch the noise points and the dense cluster start to merge." : "<br>Look for the knee of the k-distance curve: eps just above it is usually a good start."); cv.redraw();
    }
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), P = lastP, q = [P.iX(p.x), P.iY(p.y)]; let b = -1, bd = 0.25 * 0.25 * Math.max(1, (RANGE[ds][0][1] - RANGE[ds][0][0]) / 4); D.X.forEach((pt, i) => { const v = d2(pt, q); if (v < bd) { bd = v; b = i; } }); sel = b; show(); });
    const bd = btn(ctl, "Data: moons", () => { ds = DS[(DS.indexOf(ds) + 1) % DS.length]; bd.textContent = "Data: " + ds; [eps, minPts] = DEF[ds]; sE.set(eps); sM.set(minPts); sel = -1; gen(); run(); show(); }, "primary");
    const sE = slider(ctl, { label: "eps (radius)", min: 0.05, max: 0.8, step: 0.01, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; run(); show(); } });
    const sM = slider(ctl, { label: "min_samples", min: 2, max: 15, step: 1, value: minPts, onInput: (v) => { minPts = v; run(); show(); } });
    btn(ctl, "New random data", () => { seed++; sel = -1; gen(); run(); show(); }); show();
  })();

  /* ---------- the tuning map ---------- */
  (function () {
    const host = $("#demo-grid"), out = $("[data-out]", host), ctl = $("[data-controls]", host), EPS = [0.06, 0.1, 0.14, 0.18, 0.22, 0.26, 0.3, 0.4, 0.5, 0.65], MIN = [3, 4, 5, 7, 10, 15];
    let ds = "moons", seed = 3, D, cells, sel = null, lastG;
    function compute() { D = makeData(ds, seed); cells = {}; EPS.forEach((e, i) => MIN.forEach((m, j) => { const r = dbscan(D.X, e, m); cells[i + "," + j] = { q: quality(D.truth, r.lab), k: r.k, noise: r.lab.filter((v) => v === -1).length }; })); sel = null; let b = null; Object.keys(cells).forEach((k) => { if (!b || cells[k].q > cells[b].q) b = k; }); sel = b; }
    compute();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const left = 70, top = 34, cw = (W - left - 12) / EPS.length, ch = (H - top - 40) / MIN.length; lastG = { left, top, cw, ch };
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("quality for every (eps, min_samples) pair · number = clusters found · click a cell", (left + W) / 2, 16); ctx.fillText("eps (radius)", (left + W) / 2, H - 5);
      ctx.save(); ctx.translate(12, top + (ch * MIN.length) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("min_samples", 0, 0); ctx.restore();
      EPS.forEach((e, i) => { ctx.font = "600 11px DM Sans, sans-serif"; ctx.fillText(e, left + cw * (i + 0.5), top - 6); }); MIN.forEach((m, j) => { ctx.textAlign = "right"; ctx.fillText(m, left - 6, top + ch * (j + 0.5) + 4); ctx.textAlign = "center"; });
      EPS.forEach((e, i) => MIN.forEach((m, j) => { const c = cells[i + "," + j], x = left + cw * i, y = top + ch * j; ctx.globalAlpha = 0.1 + 0.85 * clamp(c.q, 0, 1); ctx.fillStyle = css("--c3"); ctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3); ctx.globalAlpha = 1; ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillText(c.k, x + cw / 2, y + ch / 2 + 4); if (sel === i + "," + j) { ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4.5; ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2); } }));
    });
    function show() {
      const [i, j] = sel.split(",").map(Number), c = cells[sel], best = Math.max(...Object.values(cells).map((v) => v.q)), good = Object.values(cells).filter((v) => v.q > best - 0.1).length;
      out.innerHTML = `data: <b>${ds}</b> · selected: eps = <b>${EPS[i]}</b>, min_samples = <b>${MIN[j]}</b> → <b>${c.k}</b> cluster${c.k === 1 ? "" : "s"}, <b>${c.noise}</b> noise points, quality (ARI on the real clusters) <b>${c.q.toFixed(2)}</b><br>Best quality anywhere on the map: <b>${best.toFixed(2)}</b>. <b>${good}</b> of the ${EPS.length * MIN.length} settings come within 0.1 of it: ` + (good < 8 ? "a <b>narrow sweet spot</b>: DBSCAN is sensitive to eps." : "a comfortable region: several settings work.") + ` Dark green = good, pale = poor. Columns on the far left: eps too small (everything noise, many tiny clusters). Far right: eps so large that clusters merge.`; cv.redraw();
    }
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), i = Math.floor((p.x - lastG.left) / lastG.cw), j = Math.floor((p.y - lastG.top) / lastG.ch); if (i >= 0 && i < EPS.length && j >= 0 && j < MIN.length) { sel = i + "," + j; show(); } });
    const bd = btn(ctl, "Data: moons", () => { ds = DS[(DS.indexOf(ds) + 1) % DS.length]; bd.textContent = "Data: " + ds; compute(); show(); }, "primary"); btn(ctl, "New random data", () => { seed++; compute(); show(); }); show();
  })();
});
