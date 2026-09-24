/* Demos for knn.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };
  const dist = (a, b, metric) => (metric === "manhattan" ? Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) : Math.hypot(a[0] - b[0], a[1] - b[1]));
  /** neighbours sorted by distance; returns [{i, d}] */
  const neigh = (q, P, metric) => P.map((p, i) => ({ i, d: dist(q, p, metric) })).sort((a, b) => a.d - b.d);
  const vote = (ns, P, k, weighted, classes) => { const w = {}; classes.forEach((c) => (w[c] = 0)); ns.slice(0, k).forEach((n) => { w[P[n.i].c] += weighted ? 1 / Math.max(n.d, 1e-9) : 1; }); let best = classes[0]; classes.forEach((c) => { if (w[c] > w[best] + 1e-12) best = c; }); const top = classes.filter((c) => Math.abs(w[c] - w[best]) < 1e-12); if (top.length > 1) best = P[ns[0].i].c; return { w, best, tie: top.length > 1 }; };

  /* ---------- step-by-step by hand ---------- */
  (function () {
    const host = $("#demo-step"), out = $("[data-out]", host), ctl = $("[data-controls]", host), tbl = $("#stepTbl");
    const P = [["A", 7, 8, "Blue"], ["B", 4, 1, "Blue"], ["C", 4, 2, "Blue"], ["D", 8, 6, "Blue"], ["E", 4, 3, "Red"], ["F", 8, 8, "Red"], ["G", 8, 5, "Red"], ["H", 1, 6, "Red"]].map((r) => ({ n: r[0], 0: r[1], 1: r[2], c: r[3] }));
    let Q = [4, 4], K = 3, metric = "euclidean", weighted = false, lastP; const col = (c) => (c === "Blue" ? css("--c1") : css("--bad"));
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const side = Math.min(W - 40, H - 30), px = (W - side) / 2, py = (H - side) / 2, S = plane(W, H, [0, 9], [0, 9], { l: px, r: px, t: py, b: py }); lastP = S;
      ctx.strokeStyle = css("--border"); ctx.strokeRect(px, py, side, side); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillStyle = css("--muted");
      for (let v = 0; v <= 9; v++) { ctx.textAlign = "center"; ctx.fillText(v, S.X(v), py + side + 15); ctx.textAlign = "right"; ctx.fillText(v, px - 6, S.Y(v) + 4); if (v) { line(ctx, S.X(v), py, S.X(v), py + side, css("--border"), 1, [2, 5]); line(ctx, px, S.Y(v), px + side, S.Y(v), css("--border"), 1, [2, 5]); } }
      const ns = neigh(Q, P, metric), dk = ns[Math.min(K, ns.length) - 1].d;
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, side, side); ctx.clip();
      ctx.beginPath(); if (metric === "manhattan") { ctx.moveTo(S.X(Q[0] + dk), S.Y(Q[1])); ctx.lineTo(S.X(Q[0]), S.Y(Q[1] + dk)); ctx.lineTo(S.X(Q[0] - dk), S.Y(Q[1])); ctx.lineTo(S.X(Q[0]), S.Y(Q[1] - dk)); ctx.closePath(); } else ctx.arc(S.X(Q[0]), S.Y(Q[1]), dk * (S.X(1) - S.X(0)), 0, 7);
      ctx.fillStyle = css("--yellow"); ctx.globalAlpha = 0.2; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--text"); ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      ns.slice(0, K).forEach((n) => line(ctx, S.X(Q[0]), S.Y(Q[1]), S.X(P[n.i][0]), S.Y(P[n.i][1]), col(P[n.i].c), 3));
      P.forEach((p, i) => { dot(ctx, S.X(p[0]), S.Y(p[1]), 9, col(p.c)); ctx.fillStyle = "#fff"; ctx.font = "700 11px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.n, S.X(p[0]), S.Y(p[1]) + 4); });
      ctx.font = "700 24px Fredoka"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("★", S.X(Q[0]), S.Y(Q[1]) + 8);
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillText("Q", S.X(Q[0]) + 14, S.Y(Q[1]) - 8);
    });
    const f = (v) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(1)), r3 = (v) => v.toFixed(3);
    function show() {
      const ns = neigh(Q, P, metric), v = vote(ns, P, K, weighted, ["Blue", "Red"]);
      tbl.innerHTML = "<tr><th class='num'>rank</th><th>point</th><th>class</th><th>distance calculation from Q = (" + f(Q[0]) + ", " + f(Q[1]) + ")</th><th class='num'>distance</th><th>one of the K?</th></tr>" + ns.map((n, r) => { const p = P[n.i], dx = p[0] - Q[0], dy = p[1] - Q[1], inK = r < K; const calc = metric === "manhattan" ? `|${f(p[0])}−${f(Q[0])}| + |${f(p[1])}−${f(Q[1])}| = ${f(Math.abs(dx))} + ${f(Math.abs(dy))}` : `√[(${f(p[0])}−${f(Q[0])})² + (${f(p[1])}−${f(Q[1])})²] = √(${r3(dx * dx).replace(/\.?0+$/, "")} + ${r3(dy * dy).replace(/\.?0+$/, "")})`; return `<tr style="${inK ? "background:color-mix(in srgb,var(--yellow) 32%,transparent);font-weight:700" : "color:var(--muted)"}"><td class="num">${r + 1}</td><td>${p.n} (${p[0]}, ${p[1]})</td><td style="color:${col(p.c)}">${p.c}</td><td>${calc}</td><td class="num">${r3(n.d)}</td><td>${inK ? "✔ neighbour" : ""}</td></tr>`; }).join("");
      const parts = ns.slice(0, K).map((n) => `${P[n.i].n}: ${P[n.i].c}` + (weighted ? ` (weight 1÷${r3(n.d)} = ${r3(1 / Math.max(n.d, 1e-9))})` : "")).join(" · ");
      out.innerHTML = `K = <b>${K}</b>, ${metric} distance, ${weighted ? "distance-weighted" : "plain"} vote.<br>Neighbours: ${parts}<br>` + (weighted ? `Blue total = <b>${r3(v.w.Blue)}</b> · Red total = <b>${r3(v.w.Red)}</b>` : `Blue votes = <b>${v.w.Blue}</b> · Red votes = <b>${v.w.Red}</b>`) + ` → predicted class: <b style="color:${col(v.best)}">${v.best}</b>` + (v.tie ? " (tie: broken by the nearest neighbour)" : "");
      cv.redraw();
    }
    slider(ctl, { label: "K", min: 1, max: 8, step: 1, value: K, onInput: (x) => { K = x; show(); } });
    const bm = btn(ctl, "Distance: Euclidean", () => { metric = metric === "euclidean" ? "manhattan" : "euclidean"; bm.textContent = "Distance: " + (metric === "euclidean" ? "Euclidean" : "Manhattan"); bm.classList.toggle("on", metric === "manhattan"); show(); });
    const bw = btn(ctl, "Vote: plain", () => { weighted = !weighted; bw.textContent = "Vote: " + (weighted ? "weighted by 1 ÷ distance" : "plain"); bw.classList.toggle("on", weighted); show(); });
    btn(ctl, "Reset Q to (4, 4)", () => { Q = [4, 4]; show(); }, "primary");
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e); if (p.x > lastP.pad.l && p.x < lastP.w - lastP.pad.r && p.y > lastP.pad.t && p.y < lastP.h - lastP.pad.b) { Q = [Math.round(clamp(lastP.iX(p.x), 0, 9) * 10) / 10, Math.round(clamp(lastP.iY(p.y), 0, 9) * 10) / 10]; show(); } });
    show();
  })();

  /* ---------- decision regions and accuracy vs K ---------- */
  (function () {
    const host = $("#demo-regions"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 6, K = 5, metric = "euclidean", weighted = false, showTest = true, train, test, curves, lastP;
    function gen() { const r = rng(seed * 101), mk = (n) => { const a = []; for (let i = 0; i < n; i++) { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push({ 0: Math.cos(t1) + 0.3 * randn(r), 1: Math.sin(t1) + 0.3 * randn(r), c: "A" }); a.push({ 0: 1 - Math.cos(t2) + 0.3 * randn(r), 1: 0.5 - Math.sin(t2) + 0.3 * randn(r), c: "B" }); } return a; }; train = mk(30); test = mk(30); compute(); }
    function compute() { curves = []; const evalSet = (D, useSelf) => { const ns = D.map((q) => neigh(q, train, metric)); return Array.from({ length: 40 }, (_, k0) => { const k = k0 + 1; return mean(D.map((q, i) => (vote(ns[i], train, k, weighted, ["A", "B"]).best === q.c ? 1 : 0))); }); }; curves = { tr: evalSet(train), te: evalSet(test) }; }
    gen();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const lw = Math.round(W * 0.6), yr = [-1.1, 1.7], span = ((lw - 20) / (H - 20)) * (yr[1] - yr[0]), P = plane(lw, H, [0.75 - span / 2, 0.75 + span / 2], yr, { l: 10, r: 6, t: 10, b: 10 }); lastP = P;
      const cs = 8; for (let px = P.pad.l; px < lw - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) { const q = [P.iX(px + cs / 2), P.iY(py + cs / 2)]; const v = vote(neigh(q, train, metric), train, K, weighted, ["A", "B"]); ctx.globalAlpha = 0.2; ctx.fillStyle = v.best === "A" ? css("--c1") : css("--c2"); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1;
      if (showTest) test.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, null, p.c === "A" ? css("--c1") : css("--c2")));
      train.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5, p.c === "A" ? css("--c1") : css("--c2")));
      const Q = plane(W, H, [1, 40], [0.5, 1.02], { l: lw + 46, r: 10, t: 26, b: 32 }); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("accuracy vs K", (Q.pad.l + W) / 2, 15);
      axes(ctx, Q, { nx: 4, ny: 4, xl: "K", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      [[curves.tr, css("--c1")], [curves.te, css("--c2")]].forEach(([c, colr]) => { ctx.beginPath(); c.forEach((v, i) => (i ? ctx.lineTo(Q.X(i + 1), Q.Y(v)) : ctx.moveTo(Q.X(1), Q.Y(v)))); ctx.strokeStyle = colr; ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(K), Q.Y(c[K - 1]), 6, colr); });
      let bi = 0; curves.te.forEach((v, i) => { if (v > curves.te[bi] + 1e-9) bi = i; }); ctx.font = "700 18px Fredoka"; ctx.fillStyle = css("--good"); ctx.fillText("★", Q.X(bi + 1), Q.Y(curves.te[bi]) - 8);
    });
    function show() { const tr = curves.tr[K - 1], te = curves.te[K - 1]; let bi = 0; curves.te.forEach((v, i) => { if (v > curves.te[bi] + 1e-9) bi = i; });
      out.innerHTML = `K = <b>${K}</b> · training accuracy <b>${(tr * 100).toFixed(0)}%</b> · test accuracy <b>${(te * 100).toFixed(0)}%</b> · best test accuracy at K = <b>${bi + 1}</b> (★, ${(curves.te[bi] * 100).toFixed(0)}%)<br>` + (K <= 2 ? "Very small K: jagged islands around individual points, near-perfect on training data but shakier on new data (overfitting)." : K >= 25 ? "Very large K: the boundary is almost a straight blur; it starts to ignore real structure (underfitting)." : "A moderate K gives a smooth boundary that generalises well."); cv.redraw(); }
    slider(ctl, { label: "K", min: 1, max: 40, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    const bm = btn(ctl, "Distance: Euclidean", () => { metric = metric === "euclidean" ? "manhattan" : "euclidean"; bm.textContent = "Distance: " + (metric === "euclidean" ? "Euclidean" : "Manhattan"); compute(); show(); });
    const bw = btn(ctl, "Vote: plain", () => { weighted = !weighted; bw.textContent = "Vote: " + (weighted ? "weighted" : "plain"); compute(); show(); });
    const bt = btn(ctl, "Test points: shown", () => { showTest = !showTest; bt.textContent = "Test points: " + (showTest ? "shown" : "hidden"); cv.redraw(); });
    btn(ctl, "New random data", () => { seed++; gen(); show(); }, "primary"); show();
  })();

  /* ---------- scaling matters ---------- */
  (function () {
    const host = $("#demo-scale"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const D = [[22, 95, 1], [25, 40, 1], [28, 110, 1], [30, 100, 1], [33, 88, 1], [24, 115, 1], [45, 62, 0], [50, 58, 0], [55, 65, 0], [42, 60, 0], [48, 68, 0], [38, 56, 0]].map((r) => ({ 0: r[0], 1: r[1], c: r[2] }));
    const ma = mean(D.map((p) => p[0])), sa = sd(D.map((p) => p[0])), mi = mean(D.map((p) => p[1])), si = sd(D.map((p) => p[1]));
    let age = 27, inc = 62, scaled = false, K = 3;
    const tr = (p) => (scaled ? [(p[0] - ma) / sa, (p[1] - mi) / si] : [p[0], p[1]]);
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [15, 60], [20, 130], { l: 50, r: 14, t: 12, b: 34 }); axes(ctx, P, { nx: 5, ny: 5, xl: "age (years)", yl: "income (₹ thousand)", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      const q = [age, inc], tq = tr(q), ns = D.map((p, i) => ({ i, d: Math.hypot(tr(p)[0] - tq[0], tr(p)[1] - tq[1]) })).sort((a, b) => a.d - b.d).slice(0, K);
      ns.forEach((n) => line(ctx, P.X(age), P.Y(inc), P.X(D[n.i][0]), P.Y(D[n.i][1]), D[n.i].c ? css("--c3") : css("--c2"), 3));
      D.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 7, p.c ? css("--c3") : css("--c2")));
      ctx.font = "700 24px Fredoka"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("★", P.X(age), P.Y(inc) + 8);
    });
    function show() {
      const q = [age, inc], tq = tr(q), ns = D.map((p, i) => ({ i, d: Math.hypot(tr(p)[0] - tq[0], tr(p)[1] - tq[1]) })).sort((a, b) => a.d - b.d).slice(0, K), buys = ns.filter((n) => D[n.i].c).length, res = buys * 2 > K ? 1 : 0;
      out.innerHTML = `Query: age <b>${age}</b>, income <b>₹${inc}k</b> · space: <b>${scaled ? "standardised" : "raw units"}</b><br>${K} nearest: ` + ns.map((n) => `(${D[n.i][0]}, ₹${D[n.i][1]}k, ${D[n.i].c ? "buys" : "no"}) at distance ${n.d.toFixed(scaled ? 2 : 1)}`).join(" · ") + `<br>${buys} of ${K} neighbours buy → predict <b style="color:${res ? "var(--good)" : "var(--c2)"}">${res ? "BUYS" : "DOESN'T BUY"}</b>` + (!scaled ? "<br>In raw units the income gaps (tens of thousands) dwarf the age gaps (tens of years), so the neighbours are picked almost purely by income, and age, the feature that actually matters, is ignored." : "<br>After standardising, age and income get a fair say. Young customers now count as similar, and the prediction reflects the true pattern (young people buy)."); cv.redraw();
    }
    const bs = btn(ctl, "Space: raw units", () => { scaled = !scaled; bs.textContent = "Space: " + (scaled ? "standardised" : "raw units"); bs.classList.toggle("on", scaled); show(); }, "primary");
    slider(ctl, { label: "Query age", min: 20, max: 58, step: 1, value: age, onInput: (v) => { age = v; show(); } });
    slider(ctl, { label: "Query income (₹k)", min: 25, max: 120, step: 1, value: inc, onInput: (v) => { inc = v; show(); } });
    slider(ctl, { label: "K", min: 1, max: 7, step: 2, value: K, onInput: (v) => { K = v; show(); } }); show();
  })();

  /* ---------- KNN regression ---------- */
  (function () {
    const host = $("#demo-reg"), out = $("[data-out]", host), ctl = $("[data-controls]", host), f = (x) => 2 * Math.sin(0.9 * x) + 0.35 * x;
    const r = rng(9); let pts = Array.from({ length: 24 }, () => { const x = 0.3 + 9.4 * r(); return [x, f(x) + 0.55 * randn(r)]; }), test = Array.from({ length: 80 }, () => { const x = 0.3 + 9.4 * r(); return [x, f(x) + 0.55 * randn(r)]; });
    let K = 1, weighted = false, lastP;
    const pred = (x, k, D) => { const ns = D.map((p) => ({ p, d: Math.abs(p[0] - x) })).sort((a, b) => a.d - b.d).slice(0, k); if (!weighted) return mean(ns.map((n) => n.p[1])); let sw = 0, s = 0; ns.forEach((n) => { const w = 1 / Math.max(n.d, 1e-9); sw += w; s += w * n.p[1]; }); return s / sw; };
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [0, 10], [-3, 8], { l: 40, r: 14, t: 12, b: 34 }); lastP = P; axes(ctx, P, { nx: 5, ny: 5, xl: "x", yl: "y", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 20; i ? ctx.lineTo(P.X(x), P.Y(f(x))) : ctx.moveTo(P.X(x), P.Y(f(x))); } ctx.setLineDash([7, 6]); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); for (let i = 0; i <= 300; i++) { const x = i / 30, y = pred(x, K, pts); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4.5; ctx.stroke();
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, css("--c1")));
    });
    function show() { const mse = (D) => mean(D.map((p) => (pred(p[0], K, pts) - p[1]) ** 2)); out.innerHTML = `K = <b>${K}</b> · ${weighted ? "distance-weighted" : "plain"} average · training MSE <b>${mse(pts).toFixed(2)}</b> · MSE on 80 new points <b>${mse(test).toFixed(2)}</b> (dashed = the true pattern)<br>` + (K === 1 ? "K = 1 passes through every training point (training error ≈ 0) but chases the noise." : K >= 12 ? "Large K: a smooth, almost flat curve that misses the wave (underfitting)." : "Moderate K: the staircase follows the pattern without chasing noise."); cv.redraw(); }
    slider(ctl, { label: "K", min: 1, max: 20, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    const bw = btn(ctl, "Average: plain", () => { weighted = !weighted; bw.textContent = "Average: " + (weighted ? "weighted by 1 ÷ distance" : "plain"); show(); });
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), P = lastP; if (p.x > P.pad.l && p.y < P.h - P.pad.b) { pts.push([clamp(P.iX(p.x), 0, 10), clamp(P.iY(p.y), -3, 8)]); show(); } });
    btn(ctl, "Reset points", () => { const r2 = rng(9); pts = Array.from({ length: 24 }, () => { const x = 0.3 + 9.4 * r2(); return [x, f(x) + 0.55 * randn(r2)]; }); show(); }); show();
  })();
});
