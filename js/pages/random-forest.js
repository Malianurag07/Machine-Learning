/* Demos for random-forest.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const gini2 = (a, n) => (n ? 1 - (a / n) ** 2 - ((n - a) / n) ** 2 : 0);

  /* ---------- bootstrap sampling ---------- */
  (function () {
    const host = $("#demo-boot"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let n = 10, seed = 1, cnt = null, hist = [];
    const theory = (m) => 1 - Math.pow(1 - 1 / m, m);
    const sample = () => { const r = rng(seed++ * 7919 + 13), c = new Array(n).fill(0); for (let i = 0; i < n; i++) c[Math.floor(r() * n)]++; return c; };
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const s = (W - 24) / n, rad = clamp(s * 0.4, 6, 19), y0 = 62;
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center";
      ctx.fillText(cnt ? "Filled = picked (×2 = twice) · hollow = out-of-bag" : "The original rows: press the button", W / 2, 20);
      for (let i = 0; i < n; i++) {
        const x = 12 + s * (i + 0.5), k = cnt ? cnt[i] : 1;
        if (k > 0) dot(ctx, x, y0, rad, css("--c1")); else dot(ctx, x, y0, rad, null, css("--muted"));
        ctx.fillStyle = k > 0 && cnt ? "#1d1b1a" : css("--text"); ctx.font = "700 " + Math.round(clamp(rad * 0.85, 9, 13)) + "px Fredoka, sans-serif"; ctx.fillText(i + 1, x, y0 + 4);
        if (cnt && rad >= 9) { ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillText(k > 1 ? "×" + k : k === 0 ? "out" : "", x, y0 + rad + 15); }
      }
      const P = plane(W, H, [2, 30], [0.55, 0.85], { l: 46, r: 14, t: 128, b: 34 });
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("share of distinct rows that make it into a sample", W / 2, 116);
      axes(ctx, P, { nx: 7, ny: 3, xl: "number of rows n", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      line(ctx, P.X(2), P.Y(0.632), P.X(30), P.Y(0.632), css("--muted"), 2, [6, 5]);
      ctx.beginPath(); for (let m = 2; m <= 30; m++) { m > 2 ? ctx.lineTo(P.X(m), P.Y(theory(m))) : ctx.moveTo(P.X(m), P.Y(theory(m))); } ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke();
      hist.forEach((f) => dot(ctx, P.X(n), P.Y(clamp(f, 0.55, 0.85)), 3.5, css("--c2")));
      dot(ctx, P.X(n), P.Y(theory(n)), 7, css("--accent"));
    });
    function show() {
      if (!cnt) { out.innerHTML = `n = <b>${n}</b> rows. Each draw picks ${n} times <i>with replacement</i>. On average <b>${(theory(n) * 100).toFixed(1)}%</b> of the rows appear at least once: 1 − (1 − 1/${n})<sup>${n}</sup> = ${theory(n).toFixed(3)}; as n grows this tends to 1 − 1/e = <b>63.2%</b>.`; cv.redraw(); return; }
      const u = cnt.filter((k) => k > 0).length, avg = mean(hist);
      out.innerHTML = `This draw: <b>${u}</b> distinct rows are in the sample (${((u / n) * 100).toFixed(0)}%), the other <b>${n - u}</b> ${n - u === 1 ? "is" : "are"} out-of-bag. Orange dots = each draw so far (${hist.length}), average <b>${(avg * 100).toFixed(1)}%</b> · theory (pink dot) <b>${(theory(n) * 100).toFixed(1)}%</b>.`; cv.redraw();
    }
    const draw = (times) => { for (let i = 0; i < times; i++) { cnt = sample(); hist.push(cnt.filter((k) => k > 0).length / n); } show(); };
    slider(ctl, { label: "Rows n", min: 5, max: 30, step: 1, value: n, onInput: (v) => { n = v; cnt = null; hist = []; show(); } });
    btn(ctl, "Draw one bootstrap sample", () => draw(1), "primary");
    btn(ctl, "Draw 200 samples", () => draw(200));
    show();
  })();

  /* ---------- the power of a vote ---------- */
  (function () {
    const host = $("#demo-vote"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let p = 0.7, n = 11, rho = 0;
    const maj = (m, q) => { let dp = [1]; for (let i = 0; i < m; i++) { const nx = new Array(dp.length + 1).fill(0); dp.forEach((v, k) => { nx[k] += v * (1 - q); nx[k + 1] += v * q; }); dp = nx; } let s = 0; for (let k = Math.floor(m / 2) + 1; k <= m; k++) s += dp[k]; return s; };
    const acc = (m) => rho * p + (1 - rho) * maj(m, p);
    const cv = ML.canvas($("[data-canvas]", host), 280, (ctx, W, H) => {
      const P = plane(W, H, [1, 101], [0.5, 1.0], { l: 48, r: 14, t: 14, b: 36 }); axes(ctx, P, { nx: 5, ny: 5, xl: "number of trees voting", yl: "accuracy of the vote", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      line(ctx, P.X(1), P.Y(p), P.X(101), P.Y(p), css("--muted"), 2, [6, 5]);
      const curve = (f, col, w) => { ctx.beginPath(); for (let m = 1; m <= 101; m += 2) { m > 1 ? ctx.lineTo(P.X(m), P.Y(f(m))) : ctx.moveTo(P.X(m), P.Y(f(m))); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
      if (rho > 0) curve((m) => maj(m, p), css("--c4"), 2.5);
      curve(acc, css("--accent"), 4.5); dot(ctx, P.X(n), P.Y(acc(n)), 7, css("--c1"));
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = css("--muted"); ctx.fillText("one tree alone", P.X(4), P.Y(p) + 16);
    });
    function show() {
      const a = acc(n);
      out.innerHTML = `Each tree is right <b>${(p * 100).toFixed(0)}%</b> of the time. A vote of <b>${n}</b> tree${n > 1 ? "s" : ""} is right <b>${(a * 100).toFixed(1)}%</b> of the time` + (rho > 0 ? ` (the blue curve is the fully independent case: ${(maj(n, p) * 100).toFixed(1)}%)` : "") + `.<br>` + (n === 1 ? "A single tree: no benefit yet." : rho >= 0.99 ? "Trees that copy each other are just one tree repeated: voting adds nothing." : rho > 0.5 ? "Highly correlated trees: the gain is capped well below 100%. This is why a random forest works so hard to make its trees different." : "Independent-ish trees: the vote climbs quickly towards 100%."); cv.redraw();
    }
    slider(ctl, { label: "Accuracy of one tree", min: 0.55, max: 0.9, step: 0.01, value: p, fmt: (v) => Math.round(v * 100) + "%", onInput: (v) => { p = v; show(); } });
    slider(ctl, { label: "Number of trees", min: 1, max: 101, step: 2, value: n, onInput: (v) => { n = v; show(); } });
    slider(ctl, { label: "Copying between trees", min: 0, max: 1, step: 0.05, value: rho, fmt: (v) => v.toFixed(2), onInput: (v) => { rho = v; show(); } });
    show();
  })();

  /* ---------- the forest on curved 2-D data ---------- */
  (function () {
    const host = $("#demo-forest"), out = $("[data-out]", host), ctl = $("[data-controls]", host), MAXT = 100;
    let seed = 4, K = 25, depth = 8, mf = 1, boot = true, view = "forest", showTest = true, train, test, trees = [], cur = null;
    function gen() { const r = rng(seed * 137), mk = (n) => { const a = []; for (let i = 0; i < n; i++) { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push({ 0: Math.cos(t1) + 0.32 * randn(r), 1: Math.sin(t1) + 0.32 * randn(r), c: 1 }); a.push({ 0: 1 - Math.cos(t2) + 0.32 * randn(r), 1: 0.5 - Math.sin(t2) + 0.32 * randn(r), c: 0 }); } return a; }; train = mk(30); test = mk(30); }
    function bestSplit(D, f) {
      const S = D.slice().sort((a, b) => a[f] - b[f]), n = S.length, tot = D.reduce((s, p) => s + p.c, 0); let l1 = 0, best = null;
      for (let i = 0; i < n - 1; i++) { l1 += S[i].c; if (S[i][f] === S[i + 1][f]) continue; const nl = i + 1, nr = n - nl, w = (nl * gini2(l1, nl) + nr * gini2(tot - l1, nr)) / n; if (!best || w < best.w - 1e-12) best = { f, t: (S[i][f] + S[i + 1][f]) / 2, w }; }
      return best;
    }
    function bld(D, d, r) {
      const n = D.length, n1 = D.reduce((s, p) => s + p.c, 0), node = { p: n1 / n };
      if (d >= depth || n1 === 0 || n1 === n || n < 2) return node;
      let best; if (mf >= 2) { const a = bestSplit(D, 0), b = bestSplit(D, 1); best = a && b ? (b.w < a.w - 1e-12 ? b : a) : a || b; } else { const o = r() < 0.5 ? [0, 1] : [1, 0]; best = bestSplit(D, o[0]) || bestSplit(D, o[1]); }
      if (!best || gini2(n1, n) - best.w <= 1e-12) return node;
      node.f = best.f; node.t = best.t; node.l = bld(D.filter((p) => p[best.f] <= best.t), d + 1, r); node.r = bld(D.filter((p) => p[best.f] > best.t), d + 1, r); return node;
    }
    const pred = (n, q) => { while (n.l) n = q[n.f] <= n.t ? n.l : n.r; return n.p; };
    function rebuild() {
      trees = []; const r = rng(seed * 991 + depth * 13 + mf);
      for (let j = 0; j < MAXT; j++) { const idx = boot ? train.map(() => Math.floor(r() * train.length)) : train.map((_, i) => i), bag = new Set(idx); trees.push({ t: bld(idx.map((i) => train[i]), 0, r), bag }); }
      const sTr = new Array(train.length).fill(0), sTe = new Array(test.length).fill(0), oS = new Array(train.length).fill(0), oC = new Array(train.length).fill(0);
      cur = { tr: [], te: [], oob: [], one: [] }; let oneSum = 0;
      trees.forEach((tr, k) => {
        train.forEach((p, i) => { const v = pred(tr.t, p); sTr[i] += v; if (!tr.bag.has(i)) { oS[i] += v; oC[i]++; } }); test.forEach((p, i) => { sTe[i] += pred(tr.t, p); });
        const kk = k + 1, ac = (s, D) => mean(D.map((p, i) => ((s[i] / kk >= 0.5 ? 1 : 0) === p.c ? 1 : 0)));
        cur.tr.push(ac(sTr, train)); cur.te.push(ac(sTe, test));
        const ii = oC.map((c, i) => i).filter((i) => oC[i] > 0); cur.oob.push(ii.length ? mean(ii.map((i) => ((oS[i] / oC[i] >= 0.5 ? 1 : 0) === train[i].c ? 1 : 0))) : NaN);
        oneSum += mean(test.map((p) => ((pred(tr.t, p) >= 0.5 ? 1 : 0) === p.c ? 1 : 0))); cur.one.push(oneSum / kk);
      });
    }
    gen(); rebuild();
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const lw = Math.round(W * 0.6), yr = [-1.2, 1.8], span = ((lw - 20) / (H - 20)) * (yr[1] - yr[0]), P = plane(lw, H, [0.75 - span / 2, 0.75 + span / 2], yr, { l: 10, r: 6, t: 10, b: 10 }), use = view === "forest" ? trees.slice(0, K) : trees.slice(0, 1);
      const cs = 6; for (let px = P.pad.l; px < lw - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) { const q = [P.iX(px + cs / 2), P.iY(py + cs / 2)]; let s = 0; for (const tr of use) s += pred(tr.t, q); const m = s / use.length; ctx.globalAlpha = 0.08 + 0.3 * Math.abs(m - 0.5) * 2 * 0.75; ctx.fillStyle = m >= 0.5 ? css("--c1") : css("--c2"); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1;
      const col = (p) => (p.c ? css("--c1") : css("--c2")); if (showTest) test.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, null, col(p))); train.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5, col(p)));
      const Q = plane(W, H, [1, MAXT], [0.5, 1.0], { l: lw + 46, r: 10, t: 26, b: 32 }); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("accuracy vs number of trees", (Q.pad.l + W) / 2, 15); axes(ctx, Q, { nx: 4, ny: 5, xl: "number of trees", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      [[cur.tr, css("--c1"), null], [cur.te, css("--c2"), null], [cur.oob, css("--c3"), [6, 5]]].forEach(([c, colr, dash]) => { ctx.save(); if (dash) ctx.setLineDash(dash); ctx.beginPath(); let st = false; c.forEach((v, i) => { if (v !== v) return; st ? ctx.lineTo(Q.X(i + 1), Q.Y(v)) : ctx.moveTo(Q.X(i + 1), Q.Y(v)); st = true; }); ctx.strokeStyle = colr; ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore(); if (c[K - 1] === c[K - 1]) dot(ctx, Q.X(K), Q.Y(c[K - 1]), 5.5, colr); });
    });
    function show() {
      const i = K - 1, f = (v) => (v !== v ? "n/a" : Math.round(v * 100) + "%");
      out.innerHTML = `<b>${K}</b> trees · max_depth = <b>${depth}</b> · max_features = <b>${mf === 1 ? "1 of 2" : "2 of 2 (all)"}</b> · bootstrap <b>${boot ? "on" : "off"}</b> · showing: <b>${view === "forest" ? "the whole forest" : "tree #1 alone"}</b><br>Forest of ${K}: training <b>${f(cur.tr[i])}</b> · test <b>${f(cur.te[i])}</b> · out-of-bag <b>${f(cur.oob[i])}</b>. A single tree: test about <b>${f(cur.one[i])}</b> on average, and tree #1 alone gets <b>${f(cur.te[0])}</b>.<br>` + (!boot && mf === 2 ? "🟥 No bootstrap and every split sees every feature: all the trees come out identical, so the forest is just one tree. Turn a randomness source back on." : depth <= 2 ? "Shallow trees are too simple (underfitting): more trees cannot fix that." : view === "tree" ? "One deep tree: jagged islands chasing individual points." : K === 1 ? "A forest of one is just one tree. Slide the number of trees up and watch the boundary calm down." : "Many different trees averaged: a smoother boundary, and the test accuracy stops swinging as trees are added."); cv.redraw();
    }
    slider(ctl, { label: "Trees (n_estimators)", min: 1, max: MAXT, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "max_depth", min: 1, max: 12, step: 1, value: depth, onInput: (v) => { depth = v; rebuild(); show(); } });
    const bm = btn(ctl, "max_features: 1 of 2", () => { mf = mf === 1 ? 2 : 1; bm.textContent = "max_features: " + (mf === 1 ? "1 of 2" : "2 of 2"); rebuild(); show(); });
    const bb = btn(ctl, "Bootstrap: on", () => { boot = !boot; bb.textContent = "Bootstrap: " + (boot ? "on" : "off"); rebuild(); show(); });
    const bv = btn(ctl, "Showing: whole forest", () => { view = view === "forest" ? "tree" : "forest"; bv.textContent = view === "forest" ? "Showing: whole forest" : "Showing: tree #1 alone"; show(); }, "primary");
    const bt = btn(ctl, "Test points: shown", () => { showTest = !showTest; bt.textContent = "Test points: " + (showTest ? "shown" : "hidden"); cv.redraw(); });
    btn(ctl, "New random data", () => { seed++; gen(); rebuild(); show(); }); show();
  })();

  /* ---------- regression forest ---------- */
  (function () {
    const host = $("#demo-reg"), out = $("[data-out]", host), ctl = $("[data-controls]", host), f = (x) => 2 * Math.sin(0.9 * x) + 0.35 * x, MAXT = 100;
    let seed = 19, K = 15, depth = 6, boot = true, showEach = true, pts, test, trees = [];
    const sse = (a) => { const m = mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0); };
    function gen() { const r = rng(seed), mk = (n) => Array.from({ length: n }, () => { const x = 0.3 + 9.4 * r(); return [x, f(x) + 0.55 * randn(r)]; }); pts = mk(28); test = mk(80); }
    function bld(D, d) { const ys = D.map((p) => p[1]), node = { m: mean(ys) }; if (d >= depth || D.length < 2) return node; const S = D.slice().sort((a, b) => a[0] - b[0]); let best = null; for (let i = 0; i < S.length - 1; i++) { if (S[i][0] === S[i + 1][0]) continue; const e = sse(S.slice(0, i + 1).map((p) => p[1])) + sse(S.slice(i + 1).map((p) => p[1])); if (!best || e < best.e) best = { e, t: (S[i][0] + S[i + 1][0]) / 2 }; } if (!best || sse(ys) - best.e <= 1e-9) return node; node.t = best.t; node.l = bld(D.filter((p) => p[0] <= best.t), d + 1); node.r = bld(D.filter((p) => p[0] > best.t), d + 1); return node; }
    const pred = (n, x) => { while (n.l) n = x <= n.t ? n.l : n.r; return n.m; };
    function rebuild() { trees = []; const r = rng(seed * 31 + depth); for (let j = 0; j < MAXT; j++) trees.push(bld(boot ? pts.map(() => pts[Math.floor(r() * pts.length)]) : pts, 0)); }
    const fp = (x) => mean(trees.slice(0, K).map((t) => pred(t, x)));
    gen(); rebuild();
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [0, 10], [-3, 8], { l: 40, r: 14, t: 12, b: 34 }); axes(ctx, P, { nx: 5, ny: 5, xl: "x", yl: "y", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      const path = (g, col, w, dash, alpha) => { ctx.save(); ctx.globalAlpha = alpha || 1; if (dash) ctx.setLineDash(dash); ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 20, y = g(x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.restore(); };
      path(f, css("--muted"), 2, [7, 6]);
      if (showEach) trees.slice(0, Math.min(K, 30)).forEach((t) => path((x) => pred(t, x), css("--c1"), 1.5, null, 0.4));
      path(fp, css("--accent"), 4.5); pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, css("--c1")));
    });
    function show() {
      const mse = (g) => mean(test.map((p) => (g(p[0]) - p[1]) ** 2)), each = mean(trees.slice(0, K).map((t) => mse((x) => pred(t, x))));
      out.innerHTML = `<b>${K}</b> trees, each with max_depth <b>${depth}</b>, bootstrap <b>${boot ? "on" : "off"}</b> · error on 80 new points (MSE): a typical single tree <b>${each.toFixed(2)}</b> · the forest average <b>${mse(fp).toFixed(2)}</b> · (the noise level itself is about 0.30, so that is the best anyone can do)<br>` + (!boot ? "Without bootstrap every tree sees the same 28 points, so all the trees are identical and averaging does nothing." : K === 1 ? "One tree: a jagged staircase that chases the noise." : "The thin blue lines are individual trees (each wobbly in its own way); the thick orange line is their average: smoother and closer to the dashed truth."); cv.redraw();
    }
    slider(ctl, { label: "Trees (n_estimators)", min: 1, max: MAXT, step: 1, value: K, onInput: (v) => { K = v; show(); } });
    slider(ctl, { label: "max_depth", min: 1, max: 10, step: 1, value: depth, onInput: (v) => { depth = v; rebuild(); show(); } });
    const bb = btn(ctl, "Bootstrap: on", () => { boot = !boot; bb.textContent = "Bootstrap: " + (boot ? "on" : "off"); rebuild(); show(); });
    const be = btn(ctl, "Individual trees: shown", () => { showEach = !showEach; be.textContent = "Individual trees: " + (showEach ? "shown" : "hidden"); cv.redraw(); });
    btn(ctl, "New random data", () => { seed += 7; gen(); rebuild(); show(); }, "primary"); show();
  })();
});
