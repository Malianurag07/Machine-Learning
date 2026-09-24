/* Demos for label-propagation.html (also reused by label-spreading.js with a copy of the helpers) */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const cA = () => css("--c2"), cB = () => css("--c1");
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

  /* ---------- the hand example: a chain of four points ---------- */
  (function () {
    const host = $("#demo-chain", document), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let w1 = 2, w2 = 1, w3 = 1, it = 0, p;
    const reset = () => { p = [1, 0, 0, 0]; it = 0; };
    const step = () => { const q = [1, (w1 * p[0] + w2 * p[2]) / (w1 + w2), (w2 * p[1] + w3 * p[3]) / (w2 + w3), 0]; p = q; it++; };
    const exact = () => { const p1 = w1 / (w1 + w2 - (w2 * w2) / (w2 + w3)), p2 = (w2 * p1) / (w2 + w3); return [p1, p2]; };
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 230, (ctx, W, H) => {
      const xs = [0.12, 0.38, 0.62, 0.88].map((f) => f * W), y = 105, w = [w1, w2, w3];
      for (let i = 0; i < 3; i++) { line(ctx, xs[i], y, xs[i + 1], y, css("--text"), 2 + 3 * w[i]); ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("weight " + w[i], (xs[i] + xs[i + 1]) / 2, y - 22 - w[i] * 1.5); }
      const names = ["labelled: A", "unlabelled", "unlabelled", "labelled: B"];
      xs.forEach((x, i) => { const r = 30; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = cB(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * p[i]); ctx.closePath(); ctx.fillStyle = cA(); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.strokeStyle = css("--ink"); ctx.lineWidth = i === 0 || i === 3 ? 5 : 2.5; ctx.stroke(); ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText(p[i].toFixed(3), x, y + r + 20); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText(names[i], x, y + r + 38); });
      ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillText("each circle: share of class A (orange) vs class B (blue) · iteration " + it, W / 2, 24);
    });
    function show() {
      const e = exact();
      out.innerHTML = `After <b>${it}</b> iteration${it === 1 ? "" : "s"}: the first unlabelled point is <b>${(p[1] * 100).toFixed(1)}%</b> class A, the second <b>${(p[2] * 100).toFixed(1)}%</b> class A.<br>Each update: a point's new share = the weighted average of its neighbours' shares (e.g. point 2: (${w1} × ${p[0].toFixed(3)} + ${w2} × ${p[2].toFixed(3)}) ÷ ${w1 + w2}), then the two labelled ends are reset to 100% A and 0% A ("clamping").<br>Where it settles (exact fixed point): <b>${(e[0] * 100).toFixed(1)}%</b> and <b>${(e[1] * 100).toFixed(1)}%</b> → predicted <b>${e[0] > 0.5 ? "A" : "B"}</b> and <b>${e[1] > 0.5 ? "A" : "B"}</b>. ` + (Math.abs(p[1] - e[0]) < 0.005 && Math.abs(p[2] - e[1]) < 0.005 ? "✅ Converged." : "Keep pressing Step: the values creep towards the fixed point."); cv.redraw();
    }
    btn(ctl, "Step ▶", () => { step(); show(); }, "primary"); btn(ctl, "Run 50 steps", () => { for (let i = 0; i < 50; i++) step(); show(); }); btn(ctl, "Reset", () => { reset(); show(); });
    slider(ctl, { label: "Weight A — point 2", min: 1, max: 5, step: 1, value: w1, onInput: (v) => { w1 = v; reset(); show(); } });
    slider(ctl, { label: "Weight point 3 — B", min: 1, max: 5, step: 1, value: w3, onInput: (v) => { w3 = v; reset(); show(); } }); show();
  })();

  /* ---------- data and the propagation engine ---------- */
  const DS = ["moons", "circles", "overlapping blobs"];
  const RANGE = { moons: [[-1.5, 2.5], [-1.1, 1.6]], circles: [[-1.6, 1.6], [-1.6, 1.6]], "overlapping blobs": [[-2.6, 2.6], [-2.2, 2.2]] };
  function makeData(ds, seed) {
    const r = rng(seed * 83), X = [], y = [];
    if (ds === "moons") for (let i = 0; i < 100; i++) { const a = Math.PI * r(), b = Math.PI * r(); X.push([Math.cos(a) + 0.08 * randn(r), Math.sin(a) + 0.08 * randn(r)]); y.push(0); X.push([1 - Math.cos(b) + 0.08 * randn(r), 0.5 - Math.sin(b) + 0.08 * randn(r)]); y.push(1); }
    else if (ds === "circles") for (let i = 0; i < 100; i++) { const a = 2 * Math.PI * r(), b = 2 * Math.PI * r(); X.push([0.5 * Math.cos(a) + 0.05 * randn(r), 0.5 * Math.sin(a) + 0.05 * randn(r)]); y.push(0); X.push([1.3 * Math.cos(b) + 0.05 * randn(r), 1.3 * Math.sin(b) + 0.05 * randn(r)]); y.push(1); }
    else for (let i = 0; i < 100; i++) { X.push([-0.9 + 0.9 * randn(r), 0.6 * randn(r)]); y.push(0); X.push([0.9 + 0.9 * randn(r), 0.6 * randn(r)]); y.push(1); }
    return { X, y };
  }
  /** row-normalised similarity graph: 'knn' (symmetrised k nearest neighbours) or 'rbf' (exp(-gamma d^2)) */
  function graph(X, kind, k, gamma) {
    const n = X.length, rows = Array.from({ length: n }, () => new Map());
    if (kind === "knn") { X.forEach((p, i) => { const order = X.map((q, j) => [d2(p, q), j]).filter((e) => e[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, k); order.forEach(([, j]) => { rows[i].set(j, 1); rows[j].set(i, 1); }); }); }
    else X.forEach((p, i) => X.forEach((q, j) => { if (j !== i) { const w = Math.exp(-gamma * d2(p, q)); if (w > 1e-4) rows[i].set(j, w); } }));
    return rows.map((m) => { const e = [...m.entries()], s = e.reduce((a, [, w]) => a + w, 0) || 1; return e.map(([j, w]) => [j, w / s]); });
  }
  /** propagate, clamping labelled points; snapshots[t] = {lab, conf} after t iterations */
  function propagate(T, labelled, y, iters) {
    const n = T.length; let Y = Array.from({ length: n }, () => [0, 0]); labelled.forEach((i) => (Y[i][y[i]] = 1)); const snaps = [];
    const snap = () => snaps.push(Y.map((r) => { const s = r[0] + r[1]; return s > 1e-12 ? { l: r[1] > r[0] ? 1 : 0, c: Math.abs(r[1] - r[0]) / s, s } : { l: -1, c: 0, s: 0 }; }));
    snap(); const isL = new Set(labelled);
    for (let t = 0; t < iters; t++) { const N = T.map((row) => { const v = [0, 0]; row.forEach(([j, w]) => { v[0] += w * Y[j][0]; v[1] += w * Y[j][1]; }); return v; }); labelled.forEach((i) => { N[i] = [y[i] === 0 ? 1 : 0, y[i] === 1 ? 1 : 0]; }); Y = N.map((v, i) => { if (isL.has(i)) return v; const s = v[0] + v[1]; return s > 1e-12 ? [v[0] / s, v[1] / s] : v; }); snap(); }
    return snaps;
  }
  const pickLabelled = (y, m, seed) => { const r = rng(seed * 977 + 5), out = []; [0, 1].forEach((c) => { const idx = y.map((v, i) => (v === c ? i : -1)).filter((i) => i >= 0); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } out.push(...idx.slice(0, m)); }); return out; };

  /* ---------- watch the labels spread ---------- */
  (function () {
    const host = $("#demo-spread"), out = $("[data-out]", host), ctl = $("[data-controls]", host), MAXIT = 150;
    let ds = "moons", seed = 3, m = 1, kind = "rbf", k = 7, gamma = 20, t = 30, D, lab, snaps, sup;
    function run() {
      D = makeData(ds, seed); lab = pickLabelled(D.y, m, seed); const T = graph(D.X, kind, k, gamma); snaps = propagate(T, lab, D.y, MAXIT);
      sup = D.X.map((p) => { let b = -1, bd = Infinity; lab.forEach((i) => { const v = d2(p, D.X[i]); if (v < bd) { bd = v; b = i; } }); return D.y[b]; });
    }
    run();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const hw = Math.round(W / 2), [xr, yr] = RANGE[ds], S = snaps[Math.min(t, snaps.length - 1)];
      [["supervised: nearest labelled point", 0], ["propagation after " + t + " iterations", 1]].forEach(([title, side]) => {
        const P = eqPlane(W, H, xr, yr, hw); ctx.save(); ctx.translate(side * hw, 0); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText(title, hw / 2, 13); frame(ctx, P);
        D.X.forEach((p, i) => { const isL = lab.includes(i), l = side ? S[i].l : sup[i], conf = side ? S[i].c : 1; if (l < 0) dot(ctx, P.X(p[0]), P.Y(p[1]), 4, css("--muted")); else { ctx.globalAlpha = isL ? 1 : 0.3 + 0.7 * conf; dot(ctx, P.X(p[0]), P.Y(p[1]), isL ? 9 : 4.4, l ? cA() : cB()); ctx.globalAlpha = 1; } if (isL) dot(ctx, P.X(p[0]), P.Y(p[1]), 12, null, css("--text")); });
        ctx.restore();
      });
    });
    function show() {
      const S = snaps[Math.min(t, snaps.length - 1)], un = D.X.map((_, i) => i).filter((i) => !lab.includes(i)), accS = mean(un.map((i) => (sup[i] === D.y[i] ? 1 : 0))), accP = mean(un.map((i) => (S[i].l === D.y[i] ? 1 : 0))), unl = un.filter((i) => S[i].l < 0).length;
      out.innerHTML = `data: <b>${ds}</b> · ${lab.length} labelled points (ringed) among ${D.X.length} · graph: <b>${kind === "rbf" ? "RBF, γ = " + gamma : "k nearest neighbours, k = " + k}</b><br>accuracy on the ${un.length} unlabelled points: supervised only <b>${(accS * 100).toFixed(1)}%</b> · label propagation <b>${(accP * 100).toFixed(1)}%</b>` + (unl ? ` · <b>${unl}</b> point${unl === 1 ? "" : "s"} not reached yet by any label (grey)` : "") + `<br>` + (t < 10 ? "Early iterations: the labels have only travelled a few steps from the ringed points; pale dots are not yet certain." : accP > accS + 0.05 ? "✅ The unlabelled points show the shape of each class, and the labels have flowed along it." : ds === "overlapping blobs" ? "The classes overlap: there is no empty gap for the labels to respect, so propagation gains little over the simple nearest-labelled rule and can even be worse." : "Similar to the supervised rule here. Try fewer labels, another graph setting, or more iterations.") + (kind === "knn" && k <= 7 && ds !== "overlapping blobs" ? " (A sparse kNN graph can have gaps that labels cannot cross, or shortcuts between the classes.)" : ""); cv.redraw();
    }
    const bd = btn(ctl, "Data: moons", () => { ds = DS[(DS.indexOf(ds) + 1) % 3]; bd.textContent = "Data: " + ds; run(); show(); }, "primary");
    const bk = btn(ctl, "Graph: RBF", () => { kind = kind === "rbf" ? "knn" : "rbf"; bk.textContent = "Graph: " + (kind === "rbf" ? "RBF" : "kNN"); run(); show(); });
    slider(ctl, { label: "Iterations", min: 0, max: MAXIT, step: 1, value: t, onInput: (v) => { t = v; show(); } });
    slider(ctl, { label: "Labels per class", min: 1, max: 8, step: 1, value: m, onInput: (v) => { m = v; run(); show(); } });
    slider(ctl, { label: "γ (RBF width)", min: 2, max: 100, step: 1, value: gamma, onInput: (v) => { gamma = v; run(); show(); } });
    slider(ctl, { label: "k (kNN graph)", min: 2, max: 15, step: 1, value: k, onInput: (v) => { k = v; run(); show(); } });
    btn(ctl, "New labelled points", () => { seed++; run(); show(); }); show();
  })();

  /* ---------- how much do the labels help? ---------- */
  (function () {
    const host = $("#demo-curve"), out = $("[data-out]", host), ctl = $("[data-controls]", host), MS = [1, 2, 3, 4, 6, 8, 10], TR = 8;
    let ds = "moons", curve;
    function compute() {
      const acc = { sup: MS.map(() => []), lp: MS.map(() => []) }, D = makeData(ds, 5), T = graph(D.X, "rbf", 0, ds === "overlapping blobs" ? 3 : 20);
      MS.forEach((m, mi) => { for (let s = 0; s < TR; s++) { const lab = pickLabelled(D.y, m, s + 1 + mi * 31), un = D.X.map((_, i) => i).filter((i) => !lab.includes(i)), snaps = propagate(T, lab, D.y, 80), S = snaps[snaps.length - 1]; acc.lp[mi].push(mean(un.map((i) => (S[i].l === D.y[i] ? 1 : 0)))); acc.sup[mi].push(mean(un.map((i) => { let b = -1, bd = Infinity; lab.forEach((j) => { const v = d2(D.X[i], D.X[j]); if (v < bd) { bd = v; b = j; } }); return D.y[b] === D.y[i] ? 1 : 0; }))); } });
      curve = { sup: acc.sup.map(mean), lp: acc.lp.map(mean) };
    }
    compute();
    const cv = ML.canvas($("[data-canvas]", host), 280, (ctx, W, H) => {
      const P = plane(W, H, [0, 11], [0.4, 1.02], { l: 46, r: 14, t: 14, b: 38 }); axes(ctx, P, { nx: 5, ny: 6, xl: "labelled points per class", yl: "accuracy on the rest", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      [[curve.sup, css("--c1")], [curve.lp, css("--accent")]].forEach(([c, col]) => { ctx.beginPath(); c.forEach((v, i) => (i ? ctx.lineTo(P.X(MS[i]), P.Y(v)) : ctx.moveTo(P.X(MS[i]), P.Y(v)))); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke(); c.forEach((v, i) => dot(ctx, P.X(MS[i]), P.Y(v), 5, col)); });
    });
    function show() {
      out.innerHTML = `data: <b>${ds}</b> · averages of ${TR} random choices of labelled points per setting, same graph as before (RBF)<br><b style="color:var(--c1)">blue</b>: supervised only (nearest labelled point) · <b style="color:var(--accent)">pink</b>: label propagation.<br>With 1 label per class: supervised ${(curve.sup[0] * 100).toFixed(0)}% vs propagation ${(curve.lp[0] * 100).toFixed(0)}%; with 10 per class: ${(curve.sup[MS.length - 1] * 100).toFixed(0)}% vs ${(curve.lp[MS.length - 1] * 100).toFixed(0)}%.` + (ds === "overlapping blobs" ? "<br>On overlapping classes the unlabelled points cannot help much, and with very few labels propagation can be worse than the simple rule: there is no clean gap to follow." : "<br>The fewer labels you have, the more the unlabelled data helps. With many labels the supervised rule catches up."); cv.redraw();
    }
    const bd = btn(ctl, "Data: moons", () => { ds = DS[(DS.indexOf(ds) + 1) % 3]; bd.textContent = "Data: " + ds; compute(); show(); }, "primary"); show();
  })();
});
