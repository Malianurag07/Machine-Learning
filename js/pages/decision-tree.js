/* Demos for decision-tree.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const R = (c) => (c.startsWith("var(") ? css(c.slice(4, -1)) : c);
  const impurity = (counts, crit) => { const n = counts.reduce((a, b) => a + b, 0); if (!n) return 0; return crit === "entropy" ? counts.reduce((s, c) => (c ? s - (c / n) * Math.log2(c / n) : s), 0) : 1 - counts.reduce((s, c) => s + (c / n) ** 2, 0); };

  /* ---------- impurity meters ---------- */
  (function () {
    const host = $("#demo-imp"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let p = 0.6;
    const g = (q) => 1 - q * q - (1 - q) ** 2, e = (q) => (q <= 0 || q >= 1 ? 0 : -q * Math.log2(q) - (1 - q) * Math.log2(1 - q));
    const cv = ML.canvas($("[data-canvas]", host), 260, (ctx, W, H) => {
      const P = plane(W, H, [0, 1], [0, 1.05], { l: 44, r: 14, t: 12, b: 34 }); axes(ctx, P, { nx: 5, ny: 4, xl: "share of 'Yes' in the group (p)", yl: "impurity", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(2) });
      [[g, css("--c1")], [e, css("--c2")]].forEach(([f, col]) => { ctx.beginPath(); for (let i = 0; i <= 100; i++) { const q = i / 100; i ? ctx.lineTo(P.X(q), P.Y(f(q))) : ctx.moveTo(P.X(q), P.Y(f(q))); } ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.stroke(); dot(ctx, P.X(p), P.Y(f(p)), 8, col); });
      line(ctx, P.X(p), P.Y(0), P.X(p), P.Y(1.05), css("--muted"), 2, [5, 5]); ctx.font = "700 14px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = css("--c1"); ctx.fillText("Gini", P.X(0.06), P.Y(0.42)); ctx.fillStyle = css("--c2"); ctx.fillText("Entropy", P.X(0.06), P.Y(0.86));
    });
    function show() { const y = Math.round(p * 10); out.innerHTML = `A group of 10 with <b>${y} Yes</b> and <b>${10 - y} No</b> (p = ${p.toFixed(2)}):<br>Gini = 1 − ${p.toFixed(2)}² − ${(1 - p).toFixed(2)}² = <b>${g(p).toFixed(3)}</b> · Entropy = <b>${e(p).toFixed(3)}</b> · ` + (p === 0 || p === 1 ? "perfectly <b>pure</b>." : Math.abs(p - 0.5) < 0.06 ? "as <b>mixed</b> as it gets." : p > 0.85 || p < 0.15 ? "nearly pure." : "moderately mixed."); cv.redraw(); }
    slider(ctl, { label: "Share of Yes (p)", min: 0, max: 1, step: 0.01, value: p, fmt: (v) => v.toFixed(2), onInput: (v) => { p = v; show(); } }); show();
  })();

  /* ---------- categorical tree builder ---------- */
  (function () {
    const host = $("#demo-tree"), out = $("[data-out]", host), ctl = $("[data-controls]", host), tbl = $("#treeTbl");
    const names = ["Outlook", "Temperature", "Humidity", "Wind"], rows = [["Sunny", "Hot", "High", "Weak", "No"], ["Sunny", "Hot", "High", "Strong", "No"], ["Overcast", "Hot", "High", "Weak", "Yes"], ["Rain", "Mild", "High", "Weak", "Yes"], ["Rain", "Cool", "Normal", "Weak", "Yes"], ["Rain", "Cool", "Normal", "Strong", "No"], ["Overcast", "Cool", "Normal", "Strong", "Yes"], ["Sunny", "Mild", "High", "Weak", "No"], ["Sunny", "Cool", "Normal", "Weak", "Yes"], ["Rain", "Mild", "Normal", "Weak", "Yes"], ["Sunny", "Mild", "Normal", "Strong", "Yes"], ["Overcast", "Mild", "High", "Strong", "Yes"], ["Overcast", "Hot", "Normal", "Weak", "Yes"], ["Rain", "Mild", "High", "Strong", "No"]];
    let crit = "entropy", levels = 3, sel = { Outlook: "Overcast", Humidity: "High", Wind: "Strong" };
    const cnt = (r) => [r.filter((x) => x[4] === "Yes").length, r.filter((x) => x[4] === "No").length];
    const gains = (r, feats) => feats.map((j) => { const vals = [...new Set(r.map((x) => x[j]))], base = impurity(cnt(r), crit); const parts = vals.map((v) => r.filter((x) => x[j] === v)); const after = parts.reduce((s, p) => s + (p.length / r.length) * impurity(cnt(p), crit), 0); return { j, vals, parts, after, gain: base - after }; });
    function build(r, feats, lvl, max) {
      const c = cnt(r), node = { c, n: r.length, imp: impurity(c, crit), pred: c[0] >= c[1] ? "Yes" : "No" };
      if (c[0] === 0 || c[1] === 0 || lvl >= max || !feats.length) return node;
      const gs = gains(r, feats); let best = gs[0]; gs.forEach((g) => { if (g.gain > best.gain + 1e-12) best = g; }); if (best.gain <= 1e-12) return node;
      node.feature = best.j; node.gain = best.gain; node.kids = best.vals.map((v, i) => ({ v, node: build(best.parts[i], feats.filter((f) => f !== best.j), lvl + 1, max) })); return node;
    }
    let tree = build(rows, [0, 1, 2, 3], 0, levels);
    const layout = (n, d, st) => { n.d = d; if (!n.kids) { n.x = st.next++; return; } n.kids.forEach((k) => layout(k.node, d + 1, st)); n.x = mean(n.kids.map((k) => k.node.x)); };
    const walk = (n) => { const path = [n]; while (n.kids) { const v = sel[names[n.feature]]; const k = n.kids.find((k) => k.v === v); if (!k) break; n = k.node; path.push(n); } return path; };
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const st = { next: 0 }; layout(tree, 0, st); const slots = Math.max(st.next, 1), sw = W / slots, bw = Math.min(150, sw - 12), bh = 54, top = 14, gap = 96, path = new Set(walk(tree));
      const X = (n) => sw * (n.x + 0.5), Y = (n) => top + n.d * gap + bh / 2;
      const edges = (n) => { if (!n.kids) return; n.kids.forEach((k) => { line(ctx, X(n), Y(n) + bh / 2, X(k.node), Y(k.node) - bh / 2, path.has(n) && path.has(k.node) ? css("--accent") : css("--muted"), path.has(n) && path.has(k.node) ? 4 : 2); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText(k.v, (X(n) + X(k.node)) / 2 + (X(k.node) < X(n) ? -18 : X(k.node) > X(n) ? 18 : 0), (Y(n) + Y(k.node)) / 2 + 2); edges(k.node); }); };
      edges(tree);
      const nodes = (n) => { const on = path.has(n), leaf = !n.kids, x = X(n) - bw / 2, y = Y(n) - bh / 2;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw, bh, 12) : ctx.rect(x, y, bw, bh); ctx.fillStyle = leaf ? (n.pred === "Yes" ? css("--c3") : css("--c2")) : css("--surface"); ctx.globalAlpha = leaf ? 0.9 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = on ? css("--accent") : css("--line"); ctx.lineWidth = on ? 4 : 2.5; ctx.stroke();
        ctx.textAlign = "center"; ctx.fillStyle = leaf ? "#1d1b1a" : css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillText(leaf ? (n.c[0] && n.c[1] ? "predict " : "") + n.pred : names[n.feature] + "?", X(n), y + 21); ctx.font = "600 11.5px DM Sans, sans-serif"; ctx.fillText(`${n.c[0]} Yes · ${n.c[1]} No`, X(n), y + 39);
        if (n.kids) n.kids.forEach((k) => nodes(k.node)); };
      nodes(tree);
    });
    function show() {
      tree = build(rows, [0, 1, 2, 3], 0, levels);
      const gs = gains(rows, [0, 1, 2, 3]), bi = gs.reduce((b, g, i) => (g.gain > gs[b].gain ? i : b), 0), base = impurity(cnt(rows), crit);
      tbl.innerHTML = `<tr><th>Root question</th><th>Groups (Yes/No)</th><th class='num'>${crit} before</th><th class='num'>weighted ${crit} after</th><th class='num'>gain</th></tr>` + gs.map((g, i) => `<tr style="${i === bi ? "background:color-mix(in srgb,var(--yellow) 35%,transparent);font-weight:800" : ""}"><td>${names[g.j]}</td><td>${g.vals.map((v, k) => `${v} ${cnt(g.parts[k])[0]}/${cnt(g.parts[k])[1]}`).join(" · ")}</td><td class="num">${base.toFixed(3)}</td><td class="num">${g.after.toFixed(3)}</td><td class="num">${g.gain.toFixed(3)}${i === bi ? " ★ best" : ""}</td></tr>`).join("");
      const path = walk(tree), leaf = path[path.length - 1];
      out.innerHTML = `Levels grown: <b>${levels}</b> · criterion: <b>${crit}</b>. Root split: <b>${names[bi === 0 ? 0 : gs[bi].j]}</b> (gain ${gs[bi].gain.toFixed(3)}).<br>Forecast: <b>${sel.Outlook}</b>, humidity <b>${sel.Humidity}</b>, wind <b>${sel.Wind}</b> → the highlighted path ends at <b style="color:${leaf.pred === "Yes" ? "var(--good)" : "var(--c2)"}">${leaf.pred === "Yes" ? "PLAY" : "DON'T PLAY"}</b>` + (leaf.kids ? "" : leaf.c[0] && leaf.c[1] ? ` (an impure leaf: ${leaf.c[0]} Yes / ${leaf.c[1]} No, so the tree just takes the majority)` : ""); cv.redraw();
    }
    slider(ctl, { label: "Levels grown", min: 0, max: 3, step: 1, value: levels, onInput: (v) => { levels = v; show(); } });
    const bc = btn(ctl, "Criterion: entropy", () => { crit = crit === "entropy" ? "gini" : "entropy"; bc.textContent = "Criterion: " + crit; show(); });
    [["Outlook", ["Sunny", "Overcast", "Rain"]], ["Humidity", ["High", "Normal"]], ["Wind", ["Weak", "Strong"]]].forEach(([k, opts]) => { const s = h("select"); opts.forEach((o) => s.append(h("option", { value: o }, k + ": " + o))); s.value = sel[k]; s.onchange = () => { sel[k] = s.value; show(); }; ctl.append(s); });
    show();
  })();

  /* ---------- threshold slider ---------- */
  (function () {
    const host = $("#demo-thr"), out = $("[data-out]", host), ctl = $("[data-controls]", host), X = [1, 2, 3, 4, 5, 6], Y = [0, 0, 1, 0, 1, 1]; let t = 2.5;
    const gini = (a) => impurity([a.filter((v) => v).length, a.filter((v) => !v).length], "gini");
    const eval_ = (tt) => { const L = Y.filter((_, i) => X[i] <= tt), Rr = Y.filter((_, i) => X[i] > tt); const w = (L.length / 6) * gini(L) + (Rr.length / 6) * gini(Rr); return { L, Rr, w, gain: 0.5 - w }; };
    const cv = ML.canvas($("[data-canvas]", host), 250, (ctx, W, H) => {
      const P = plane(W, H, [0.5, 6.5], [0, 1], { l: 40, r: 14, t: 10, b: 30 });
      ctx.globalAlpha = 0.1; ctx.fillStyle = css("--c1"); ctx.fillRect(P.X(0.5), 10, P.X(t) - P.X(0.5), 100); ctx.fillStyle = css("--c2"); ctx.fillRect(P.X(t), 10, P.X(6.5) - P.X(t), 100); ctx.globalAlpha = 1;
      line(ctx, P.X(0.5), 60, P.X(6.5), 60, css("--line"), 3); X.forEach((x, i) => { dot(ctx, P.X(x), 60, 12, Y[i] ? css("--c3") : css("--c2")); ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText(x, P.X(x), 88); });
      line(ctx, P.X(t), 14, P.X(t), 106, css("--text"), 4, [8, 6]); ctx.fillText("x ≤ " + t.toFixed(1) + " ?", P.X(t), 10);
      const B = plane(W, H, [0.5, 6.5], [0, 0.3], { l: 40, r: 14, t: 130, b: 30 }); axes(ctx, B, { nx: 6, ny: 3, grid: false, fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(2), xl: "candidate threshold", yl: "Gini gain" });
      [1.5, 2.5, 3.5, 4.5, 5.5].forEach((c) => { const g = eval_(c).gain; ctx.fillStyle = Math.abs(c - t) < 0.05 ? css("--accent") : css("--c1"); ctx.fillRect(B.X(c) - 14, B.Y(g), 28, B.Y(0) - B.Y(g)); ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.strokeRect(B.X(c) - 14, B.Y(g), 28, B.Y(0) - B.Y(g)); });
    });
    function show() { const e = eval_(t), gl = gini(e.L), gr = gini(e.Rr); out.innerHTML = `Split x ≤ ${t.toFixed(1)}: left ${e.L.length} points (${e.L.filter((v) => v).length} pass) Gini = ${gl.toFixed(3)} · right ${e.Rr.length} points (${e.Rr.filter((v) => v).length} pass) Gini = ${gr.toFixed(3)}<br>weighted Gini = (${e.L.length}/6)(${gl.toFixed(3)}) + (${e.Rr.length}/6)(${gr.toFixed(3)}) = <b>${e.w.toFixed(3)}</b> → gain = 0.500 − ${e.w.toFixed(3)} = <b>${e.gain.toFixed(3)}</b>` + (Math.abs(e.gain - 0.25) < 0.001 ? " ★ one of the two best thresholds." : ""); cv.redraw(); }
    slider(ctl, { label: "Threshold t", min: 1.5, max: 5.5, step: 0.1, value: t, fmt: (v) => v.toFixed(1), onInput: (v) => { t = v; show(); } }); show();
  })();

  /* ---------- 2-D CART ---------- */
  (function () {
    const host = $("#demo-2d"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 4, depth = 3, minLeaf = 1, crit = "gini", showTest = true, train, test, curves;
    function gen() { const r = rng(seed * 137), mk = (n) => { const a = []; for (let i = 0; i < n; i++) { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push({ 0: Math.cos(t1) + 0.32 * randn(r), 1: Math.sin(t1) + 0.32 * randn(r), c: "A" }); a.push({ 0: 1 - Math.cos(t2) + 0.32 * randn(r), 1: 0.5 - Math.sin(t2) + 0.32 * randn(r), c: "B" }); } return a; }; train = mk(30); test = mk(30); }
    const cnts = (D) => [D.filter((p) => p.c === "A").length, D.filter((p) => p.c === "B").length];
    function bld(D, d, opt) {
      const c = cnts(D), node = { c, pred: c[0] >= c[1] ? "A" : "B" };
      if (d >= opt.depth || D.length < 2 * opt.minLeaf || c[0] === 0 || c[1] === 0) return node;
      const base = impurity(c, opt.crit); let best = null;
      [0, 1].forEach((f) => { const S = D.slice().sort((a, b) => a[f] - b[f]); const left = [0, 0]; for (let i = 0; i < S.length - 1; i++) { left[S[i].c === "A" ? 0 : 1]++; if (S[i][f] === S[i + 1][f]) continue; const nl = i + 1, nr = S.length - nl; if (nl < opt.minLeaf || nr < opt.minLeaf) continue; const rc = [c[0] - left[0], c[1] - left[1]], w = (nl / S.length) * impurity(left, opt.crit) + (nr / S.length) * impurity(rc, opt.crit); if (!best || w < best.w - 1e-12) best = { f, t: (S[i][f] + S[i + 1][f]) / 2, w }; } });
      if (!best || base - best.w <= 1e-12) return node;
      node.f = best.f; node.t = best.t; node.l = bld(D.filter((p) => p[best.f] <= best.t), d + 1, opt); node.r = bld(D.filter((p) => p[best.f] > best.t), d + 1, opt); return node;
    }
    const pred = (n, q) => { while (n.l) n = q[n.f] <= n.t ? n.l : n.r; return n.pred; };
    const leaves = (n) => (n.l ? leaves(n.l) + leaves(n.r) : 1), dep = (n) => (n.l ? 1 + Math.max(dep(n.l), dep(n.r)) : 0), acc = (T, D) => mean(D.map((p) => (pred(T, p) === p.c ? 1 : 0)));
    const compute = () => { curves = { tr: [], te: [] }; for (let d = 1; d <= 12; d++) { const T = bld(train, 0, { depth: d, minLeaf, crit }); curves.tr.push(acc(T, train)); curves.te.push(acc(T, test)); } };
    gen(); compute(); let tree = bld(train, 0, { depth, minLeaf, crit });
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const lw = Math.round(W * 0.6), yr = [-1.2, 1.8], span = ((lw - 20) / (H - 20)) * (yr[1] - yr[0]), P = plane(lw, H, [0.75 - span / 2, 0.75 + span / 2], yr, { l: 10, r: 6, t: 10, b: 10 });
      const cs = 6; for (let px = P.pad.l; px < lw - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) { ctx.globalAlpha = 0.22; ctx.fillStyle = pred(tree, [P.iX(px + cs / 2), P.iY(py + cs / 2)]) === "A" ? css("--c1") : css("--c2"); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1;
      if (showTest) test.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, null, p.c === "A" ? css("--c1") : css("--c2"))); train.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5, p.c === "A" ? css("--c1") : css("--c2")));
      const Q = plane(W, H, [1, 12], [0.5, 1.02], { l: lw + 46, r: 10, t: 26, b: 32 }); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("accuracy vs max_depth", (Q.pad.l + W) / 2, 15); axes(ctx, Q, { nx: 4, ny: 4, xl: "max_depth", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      [[curves.tr, css("--c1")], [curves.te, css("--c2")]].forEach(([c, col]) => { ctx.beginPath(); c.forEach((v, i) => (i ? ctx.lineTo(Q.X(i + 1), Q.Y(v)) : ctx.moveTo(Q.X(1), Q.Y(v)))); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(depth), Q.Y(c[depth - 1]), 6, col); });
    });
    function show() { tree = bld(train, 0, { depth, minLeaf, crit }); const tr = acc(tree, train), te = acc(tree, test); out.innerHTML = `max_depth = <b>${depth}</b> (actual depth ${dep(tree)}) · min_samples_leaf = <b>${minLeaf}</b> · ${leaves(tree)} leaves · training accuracy <b>${(tr * 100).toFixed(0)}%</b> · test accuracy <b>${(te * 100).toFixed(0)}%</b><br>` + (depth <= 1 ? "One cut only: too simple (underfitting)." : tr > 0.97 && te < tr - 0.08 ? "🟥 Memorised: near-perfect on training data, clearly worse on the test set (overfitting). Try raising <b>min_samples_leaf</b> or lowering the depth." : "Reasonable balance between fitting and generalising."); cv.redraw(); }
    slider(ctl, { label: "max_depth", min: 1, max: 12, step: 1, value: depth, onInput: (v) => { depth = v; show(); } });
    slider(ctl, { label: "min_samples_leaf", min: 1, max: 15, step: 1, value: minLeaf, onInput: (v) => { minLeaf = v; compute(); show(); } });
    const bc = btn(ctl, "Criterion: gini", () => { crit = crit === "gini" ? "entropy" : "gini"; bc.textContent = "Criterion: " + crit; compute(); show(); });
    const bt = btn(ctl, "Test points: shown", () => { showTest = !showTest; bt.textContent = "Test points: " + (showTest ? "shown" : "hidden"); cv.redraw(); });
    btn(ctl, "New random data", () => { seed++; gen(); compute(); show(); }, "primary"); show();
  })();

  /* ---------- regression tree ---------- */
  (function () {
    const host = $("#demo-reg"), out = $("[data-out]", host), ctl = $("[data-controls]", host), f = (x) => 2 * Math.sin(0.9 * x) + 0.35 * x;
    const r = rng(19), mk = (n) => Array.from({ length: n }, () => { const x = 0.3 + 9.4 * r(); return [x, f(x) + 0.55 * randn(r)]; });
    let pts = mk(28), test = mk(80), depth = 2, minLeaf = 1, lastP;
    const sse = (a) => { const m = mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0); };
    function bld(D, d) { const ys = D.map((p) => p[1]), node = { m: mean(ys) }; if (d >= depth || D.length < 2 * minLeaf) return node; const S = D.slice().sort((a, b) => a[0] - b[0]); let best = null; for (let i = minLeaf - 1; i < S.length - minLeaf; i++) { if (S[i][0] === S[i + 1][0]) continue; const e = sse(S.slice(0, i + 1).map((p) => p[1])) + sse(S.slice(i + 1).map((p) => p[1])); if (!best || e < best.e) best = { e, t: (S[i][0] + S[i + 1][0]) / 2 }; } if (!best || sse(ys) - best.e <= 1e-9) return node; node.t = best.t; node.l = bld(D.filter((p) => p[0] <= best.t), d + 1); node.r = bld(D.filter((p) => p[0] > best.t), d + 1); return node; }
    const pred = (n, x) => { while (n.l) n = x <= n.t ? n.l : n.r; return n.m; }, splits = (n) => (n.l ? [n.t, ...splits(n.l), ...splits(n.r)] : []);
    let tree = bld(pts, 0);
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [0, 10], [-3, 8], { l: 40, r: 14, t: 12, b: 34 }); lastP = P; axes(ctx, P, { nx: 5, ny: 5, xl: "x", yl: "y", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      splits(tree).forEach((s) => line(ctx, P.X(s), P.Y(-3), P.X(s), P.Y(8), css("--muted"), 1.5, [3, 5]));
      ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 20; i ? ctx.lineTo(P.X(x), P.Y(f(x))) : ctx.moveTo(P.X(x), P.Y(f(x))); } ctx.setLineDash([7, 6]); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); for (let i = 0; i <= 400; i++) { const x = i / 40, y = pred(tree, x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4.5; ctx.stroke();
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, css("--c1")));
    });
    function show() { tree = bld(pts, 0); const mse = (D) => mean(D.map((p) => (pred(tree, p[0]) - p[1]) ** 2)); out.innerHTML = `max_depth = <b>${depth}</b> · min_samples_leaf = <b>${minLeaf}</b> · ${splits(tree).length + 1} leaves (dotted lines = the split points) · training MSE <b>${mse(pts).toFixed(2)}</b> · MSE on 80 new points <b>${mse(test).toFixed(2)}</b><br>` + (depth === 1 ? "Depth 1: one split, two flat levels: far too simple." : depth >= 6 && minLeaf === 1 ? "Deep tree with tiny leaves: it passes through almost every training point and chases noise." : "Each leaf predicts the average of its points, so the curve is a staircase."); cv.redraw(); }
    slider(ctl, { label: "max_depth", min: 1, max: 8, step: 1, value: depth, onInput: (v) => { depth = v; show(); } });
    slider(ctl, { label: "min_samples_leaf", min: 1, max: 8, step: 1, value: minLeaf, onInput: (v) => { minLeaf = v; show(); } });
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e); if (p.x > lastP.pad.l && p.y < lastP.h - lastP.pad.b) { pts.push([clamp(lastP.iX(p.x), 0, 10), clamp(lastP.iY(p.y), -3, 8)]); show(); } });
    btn(ctl, "Reset points", () => { const r2 = rng(19); pts = Array.from({ length: 28 }, () => { const x = 0.3 + 9.4 * r2(); return [x, f(x) + 0.55 * randn(r2)]; }); show(); }); show();
  })();
});
