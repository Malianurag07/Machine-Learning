/* Demos for label-spreading.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const cA = () => css("--c2"), cB = () => css("--c1");
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

  /* ---------- the hand example with soft clamping ---------- */
  (function () {
    const host = $("#demo-chain"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let alpha = 0.5, w1 = 2, w2 = 1, w3 = 1, it = 0, F, S;
    function build() { const W = [[0, w1, 0, 0], [w1, 0, w2, 0], [0, w2, 0, w3], [0, 0, w3, 0]], d = W.map((r) => r.reduce((a, b) => a + b, 0)); S = W.map((r, i) => r.map((v, j) => v / Math.sqrt(d[i] * d[j]))); }
    const Y0 = [[1, 0], [0, 0], [0, 0], [0, 1]], reset = () => { build(); F = Y0.map((r) => r.slice()); it = 0; };
    const step = () => { F = F.map((_, i) => [0, 1].map((c) => alpha * S[i].reduce((s, v, j) => s + v * F[j][c], 0) + (1 - alpha) * Y0[i][c])); it++; };
    const share = (r) => (r[0] + r[1] > 1e-12 ? r[0] / (r[0] + r[1]) : 0);
    const exact = () => { let G = Y0.map((r) => r.slice()); for (let k = 0; k < 4000; k++) G = G.map((_, i) => [0, 1].map((c) => alpha * S[i].reduce((s, v, j) => s + v * G[j][c], 0) + (1 - alpha) * Y0[i][c])); return G.map(share); };
    const lp = () => { const p1 = w1 / (w1 + w2 - (w2 * w2) / (w2 + w3)), p2 = (w2 * p1) / (w2 + w3); return [1, p1, p2, 0]; };
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 250, (ctx, W, H) => {
      const xs = [0.12, 0.38, 0.62, 0.88].map((f) => f * W), y = 105, w = [w1, w2, w3];
      for (let i = 0; i < 3; i++) { line(ctx, xs[i], y, xs[i + 1], y, css("--text"), 2 + 3 * w[i]); ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("weight " + w[i], (xs[i] + xs[i + 1]) / 2, y - 22 - w[i] * 1.5); }
      const names = ["labelled: A", "unlabelled", "unlabelled", "labelled: B"];
      xs.forEach((x, i) => { const r = 30, s = share(F[i]); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = cB(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * s); ctx.closePath(); ctx.fillStyle = cA(); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.strokeStyle = css("--ink"); ctx.lineWidth = i === 0 || i === 3 ? 5 : 2.5; ctx.stroke(); ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText((s * 100).toFixed(1) + "% A", x, y + r + 20); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText(names[i], x, y + r + 38); });
      ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillText("share of class A (orange) vs B (blue) · iteration " + it + " · α = " + alpha.toFixed(2), W / 2, 24);
    });
    function show() {
      const e = exact(), l = lp(), fs = F.map(share);
      out.innerHTML = `Now: <b>${fs.map((v) => (v * 100).toFixed(1) + "%").join(" · ")}</b> class A at the four points (iteration ${it}).<br>Final answer with α = ${alpha.toFixed(2)}: <b>${e.map((v) => (v * 100).toFixed(1) + "%").join(" · ")}</b> → labels <b>${e.map((v) => (v > 0.5 ? "A" : "B")).join(" ")}</b>. Label propagation (hard clamp) would give: <b>${l.map((v) => (v * 100).toFixed(1) + "%").join(" · ")}</b>.<br>` + (alpha <= 0.15 ? "Small α: the points trust their own original label (or lack of one) and hardly listen to neighbours: little spreading. The unlabelled middle points stay undecided." : alpha >= 0.9 ? "Large α: the points listen almost only to neighbours. Notice that even the two labelled end points are now far from 100% and 0%: the original labels count for little." : "Medium α: the labelled points keep most of their own label but can be pulled a little by their neighbours (compare with 100% and 0% under hard clamping)."); cv.redraw();
    }
    btn(ctl, "Step ▶", () => { step(); show(); }, "primary"); btn(ctl, "Run 200 steps", () => { for (let i = 0; i < 200; i++) step(); show(); }); btn(ctl, "Reset", () => { reset(); show(); });
    slider(ctl, { label: "α (0 = keep own label, 1 = follow neighbours)", min: 0.05, max: 0.99, step: 0.01, value: alpha, fmt: (v) => v.toFixed(2), onInput: (v) => { alpha = v; reset(); show(); } });
    slider(ctl, { label: "Weight A — point 2", min: 1, max: 5, step: 1, value: w1, onInput: (v) => { w1 = v; reset(); show(); } }); show();
  })();

  /* ---------- graph engine (symmetric weights) ---------- */
  function adjacency(X, kind, k, gamma) {
    const n = X.length, rows = Array.from({ length: n }, () => new Map());
    if (kind === "knn") X.forEach((p, i) => { X.map((q, j) => [d2(p, q), j]).filter((e) => e[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, k).forEach(([, j]) => { rows[i].set(j, 1); rows[j].set(i, 1); }); });
    else X.forEach((p, i) => X.forEach((q, j) => { if (j !== i) { const w = Math.exp(-gamma * d2(p, q)); if (w > 3e-2) rows[i].set(j, w); } }));
    const A = rows.map((m) => [...m.entries()]), deg = A.map((r) => r.reduce((s, [, w]) => s + w, 0) || 1); return { A, deg };
  }
  /** hard-clamped label propagation */
  function runLP(G, lab, yl, iters) {
    const n = G.A.length; let Y = Array.from({ length: n }, () => [0, 0]); lab.forEach((i, t) => (Y[i][yl[t]] = 1)); const isL = new Map(lab.map((i, t) => [i, yl[t]]));
    for (let s = 0; s < iters; s++) { const N = G.A.map((row, i) => { const v = [0, 0]; row.forEach(([j, w]) => { v[0] += (w / G.deg[i]) * Y[j][0]; v[1] += (w / G.deg[i]) * Y[j][1]; }); return v; }); Y = N.map((v, i) => { if (isL.has(i)) return isL.get(i) === 0 ? [1, 0] : [0, 1]; const s2 = v[0] + v[1]; return s2 > 1e-12 ? [v[0] / s2, v[1] / s2] : v; }); }
    return Y.map((r) => (r[0] + r[1] < 1e-12 ? -1 : r[1] > r[0] ? 1 : 0));
  }
  /** label spreading with soft clamping alpha */
  function runLS(G, lab, yl, alpha) {
    const n = G.A.length, Y0 = Array.from({ length: n }, () => [0, 0]); lab.forEach((i, t) => (Y0[i][yl[t]] = 1)); let F = Y0.map((r) => r.slice()); const iters = Math.min(700, Math.ceil(Math.log(1e-4) / Math.log(alpha)) + 5);
    for (let s = 0; s < iters; s++) F = G.A.map((row, i) => { const v = [(1 - alpha) * Y0[i][0], (1 - alpha) * Y0[i][1]]; row.forEach(([j, w]) => { const c = (alpha * w) / Math.sqrt(G.deg[i] * G.deg[j]); v[0] += c * F[j][0]; v[1] += c * F[j][1]; }); return v; });
    return F.map((r) => (r[0] + r[1] < 1e-12 ? -1 : r[1] > r[0] ? 1 : 0));
  }
  const moons = (seed) => { const r = rng(seed * 83), X = [], y = []; for (let i = 0; i < 100; i++) { const a = Math.PI * r(), b = Math.PI * r(); X.push([Math.cos(a) + 0.08 * randn(r), Math.sin(a) + 0.08 * randn(r)]); y.push(0); X.push([1 - Math.cos(b) + 0.08 * randn(r), 0.5 - Math.sin(b) + 0.08 * randn(r)]); y.push(1); } return { X, y }; };
  const pick = (y, m, seed) => { const r = rng(seed * 977 + 5), out = []; [0, 1].forEach((c) => { const idx = y.map((v, i) => (v === c ? i : -1)).filter((i) => i >= 0); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } out.push(...idx.slice(0, m)); }); return out; };
  const withNoise = (y, lab, f, seed) => { const r = rng(seed * 313 + 7), idx = lab.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } const flipped = new Set(idx.slice(0, f)); return { yl: lab.map((i, t) => (flipped.has(t) ? 1 - y[i] : y[i])), flipped: lab.filter((_, t) => flipped.has(t)) }; };

  /* ---------- wrong labels: hard clamp vs soft clamp ---------- */
  (function () {
    const host = $("#demo-noise"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 2, m = 6, f = 2, alpha = 0.9, D, G, lab, yl, flipped, pLP, pLS;
    const RG = [[-1.5, 2.5], [-1.1, 1.6]];
    function run() { D = moons(seed); G = adjacency(D.X, "rbf", 0, 20); lab = pick(D.y, m, seed); const nz = withNoise(D.y, lab, f, seed); yl = nz.yl; flipped = nz.flipped; pLP = runLP(G, lab, yl, 150); pLS = runLS(G, lab, yl, alpha); }
    run();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const hw = Math.round(W / 2);
      [["hard clamp (Label Propagation)", pLP, 0], ["soft clamp (Label Spreading, α = " + alpha.toFixed(2) + ")", pLS, 1]].forEach(([title, pred, side]) => {
        const P = eqPlane(W, H, RG[0], RG[1], hw); ctx.save(); ctx.translate(side * hw, 0); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText(title, hw / 2, 13); frame(ctx, P);
        D.X.forEach((p, i) => { const isL = lab.includes(i); if (pred[i] < 0) dot(ctx, P.X(p[0]), P.Y(p[1]), 4, css("--muted")); else dot(ctx, P.X(p[0]), P.Y(p[1]), isL ? 8 : 4.2, pred[i] ? cA() : cB()); if (isL) { dot(ctx, P.X(p[0]), P.Y(p[1]), 11.5, null, css("--text")); if (flipped.includes(i)) { ctx.strokeStyle = css("--bad"); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(P.X(p[0]) - 9, P.Y(p[1]) - 9); ctx.lineTo(P.X(p[0]) + 9, P.Y(p[1]) + 9); ctx.moveTo(P.X(p[0]) + 9, P.Y(p[1]) - 9); ctx.lineTo(P.X(p[0]) - 9, P.Y(p[1]) + 9); ctx.stroke(); } } });
        ctx.restore();
      });
    });
    function show() {
      const un = D.X.map((_, i) => i).filter((i) => !lab.includes(i)), acc = (p) => mean(un.map((i) => (p[i] === D.y[i] ? 1 : 0))), fixed = (p) => (flipped.length ? flipped.filter((i) => p[i] === D.y[i]).length : 0);
      out.innerHTML = `${lab.length} labelled points (ringed), <b>${flipped.length}</b> of them deliberately wrong (red ✕) · RBF graph γ = 20<br>accuracy on the unlabelled points: hard clamp <b>${(acc(pLP) * 100).toFixed(1)}%</b> · soft clamp <b>${(acc(pLS) * 100).toFixed(1)}%</b>` + (flipped.length ? `<br>wrong labels overruled by the neighbours: hard clamp <b>${fixed(pLP)}</b> of ${flipped.length} (it can never change a label) · soft clamp <b>${fixed(pLS)}</b> of ${flipped.length}` : "<br>No wrong labels now: raise the slider to introduce some.") + `<br>` + (flipped.length && fixed(pLS) > 0 ? "✅ With enough correct neighbours and a large α the soft clamp lets the crowd overrule a wrong label." : flipped.length ? "A wrong label surrounded by few correct labelled neighbours is hard to overrule; try a larger α or more labels per class." : ""); cv.redraw();
    }
    slider(ctl, { label: "Labels per class", min: 2, max: 10, step: 1, value: m, onInput: (v) => { m = v; run(); show(); } });
    slider(ctl, { label: "Wrong labels", min: 0, max: 4, step: 1, value: f, onInput: (v) => { f = v; run(); show(); } });
    slider(ctl, { label: "α", min: 0.05, max: 0.99, step: 0.01, value: alpha, fmt: (v) => v.toFixed(2), onInput: (v) => { alpha = v; pLS = runLS(G, lab, yl, alpha); show(); } });
    btn(ctl, "New labelled points", () => { seed++; run(); show(); }, "primary"); show();
  })();

  /* ---------- how big should alpha be? ---------- */
  (function () {
    const host = $("#demo-alpha"), out = $("[data-out]", host), ctl = $("[data-controls]", host), AL = [0.05, 0.2, 0.5, 0.8, 0.9, 0.95, 0.99], TR = 5;
    let f = 2, curve;
    function compute() {
      const acc = { lp: [], ls: AL.map(() => []) };
      for (let s = 0; s < TR; s++) { const D = moons(20 + s), G = adjacency(D.X, "rbf", 0, 20), lab = pick(D.y, 6, s + 1), nz = withNoise(D.y, lab, f, s + 1), un = D.X.map((_, i) => i).filter((i) => !lab.includes(i)), a = (p) => mean(un.map((i) => (p[i] === D.y[i] ? 1 : 0))); acc.lp.push(a(runLP(G, lab, nz.yl, 100))); AL.forEach((al, k) => acc.ls[k].push(a(runLS(G, lab, nz.yl, al)))); }
      curve = { lp: mean(acc.lp), ls: acc.ls.map(mean) };
    }
    compute();
    const cv = ML.canvas($("[data-canvas]", host), 280, (ctx, W, H) => {
      const P = plane(W, H, [0, 1], [0.4, 1.02], { l: 46, r: 14, t: 14, b: 38 }); axes(ctx, P, { nx: 5, ny: 6, xl: "α", yl: "accuracy on the unlabelled points", fx: (v) => v.toFixed(1), fy: (v) => Math.round(v * 100) + "%" });
      line(ctx, P.X(0), P.Y(curve.lp), P.X(1), P.Y(curve.lp), css("--c1"), 3, [8, 6]); ctx.beginPath(); AL.forEach((a, i) => (i ? ctx.lineTo(P.X(a), P.Y(curve.ls[i])) : ctx.moveTo(P.X(a), P.Y(curve.ls[i])))); ctx.strokeStyle = css("--accent"); ctx.lineWidth = 3.5; ctx.stroke(); AL.forEach((a, i) => dot(ctx, P.X(a), P.Y(curve.ls[i]), 5, css("--accent")));
      ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--c1"); ctx.textAlign = "left"; ctx.fillText("hard clamp (Label Propagation)", P.X(0.03), P.Y(curve.lp) - 8);
    });
    function show() {
      const bi = curve.ls.indexOf(Math.max(...curve.ls));
      out.innerHTML = `two moons, 6 labelled points per class, <b>${f}</b> of the 12 labels wrong · average over ${TR} random datasets<br>hard clamp: <b>${(curve.lp * 100).toFixed(1)}%</b> · soft clamp: ` + AL.map((a, i) => `α ${a}: <b>${(curve.ls[i] * 100).toFixed(1)}%</b>`).join(" · ") + `<br>best α here: <b>${AL[bi]}</b>. ` + (f === 0 ? "With clean labels a very large α tends to be fine; the soft clamp gains little." : "With wrong labels, a larger α lets the neighbours overrule the mistakes, but as α approaches 1 the original labels are almost ignored, and accuracy eventually drops."); cv.redraw();
    }
    slider(ctl, { label: "Wrong labels (of 12)", min: 0, max: 4, step: 1, value: f, onInput: (v) => { f = v; compute(); show(); } }); show();
  })();
});
