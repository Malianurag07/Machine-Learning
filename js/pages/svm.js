/* Demos for svm.html (uses ML.svmTrain from js/lib/svm.js) */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  /** plane with equal x/y scale, centred in the canvas */
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const clipTo = (ctx, P) => { ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); ctx.clip(); };
  const colOf = (c) => (c > 0 ? css("--c1") : css("--c2"));

  /* ---------- widest street ---------- */
  (function () {
    const host = $("#demo-margin"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const P0 = [[1, 1.2, -1], [1.5, 2.5, -1], [2, 1, -1], [2.4, 2.3, -1], [0.8, 2.2, -1], [1.6, 0.6, -1], [2.8, 1.4, -1], [4, 4, 1], [4.6, 3, 1], [3.6, 4.8, 1], [5, 4.6, 1], [4.2, 2.8, 1], [5.4, 3.6, 1], [3.5, 3.6, 1]];
    let ang = 20, anim = 0, lastP;
    const gapAt = (deg) => { const t = (deg * Math.PI) / 180, n = [Math.cos(t), Math.sin(t)], pr = P0.map((p) => n[0] * p[0] + n[1] * p[1]); const pos = pr.filter((_, i) => P0[i][2] > 0), neg = pr.filter((_, i) => P0[i][2] < 0); const lo = Math.max(...neg), hi = Math.min(...pos); return { n, lo, hi, gap: hi - lo }; };
    const curve = Array.from({ length: 360 }, (_, d) => Math.max(0, gapAt(d).gap)); let bestA = 0; curve.forEach((g, d) => { if (g > curve[bestA]) bestA = d; });
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const lw = Math.round(W * 0.58), P = eqPlane(W, H, [0, 6.5], [0, 6], lw); lastP = P;
      const g = gapAt(ang), ok = g.gap > 0; frame(ctx, P); ctx.save(); clipTo(ctx, P);
      const along = (c) => { const d = [-g.n[1], g.n[0]], p0 = [g.n[0] * c, g.n[1] * c]; return [[p0[0] - 20 * d[0], p0[1] - 20 * d[1]], [p0[0] + 20 * d[0], p0[1] + 20 * d[1]]]; };
      if (ok) { const a = along(g.lo), b = along(g.hi); ctx.beginPath(); ctx.moveTo(P.X(a[0][0]), P.Y(a[0][1])); ctx.lineTo(P.X(a[1][0]), P.Y(a[1][1])); ctx.lineTo(P.X(b[1][0]), P.Y(b[1][1])); ctx.lineTo(P.X(b[0][0]), P.Y(b[0][1])); ctx.closePath(); ctx.fillStyle = css("--yellow"); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; [a, b].forEach((l) => line(ctx, P.X(l[0][0]), P.Y(l[0][1]), P.X(l[1][0]), P.Y(l[1][1]), css("--text"), 2, [7, 6])); const m = along((g.lo + g.hi) / 2); line(ctx, P.X(m[0][0]), P.Y(m[0][1]), P.X(m[1][0]), P.Y(m[1][1]), css("--accent"), 4.5); }
      else { const m = along((g.lo + g.hi) / 2); line(ctx, P.X(m[0][0]), P.Y(m[0][1]), P.X(m[1][0]), P.Y(m[1][1]), css("--bad"), 4, [8, 6]); }
      P0.forEach((p) => { const pr = g.n[0] * p[0] + g.n[1] * p[1]; if (ok && (Math.abs(pr - g.lo) < 1e-9 || Math.abs(pr - g.hi) < 1e-9)) dot(ctx, P.X(p[0]), P.Y(p[1]), 12, null, css("--text")); dot(ctx, P.X(p[0]), P.Y(p[1]), 6.5, colOf(p[2])); }); ctx.restore();
      const Q = plane(W, H, [0, 360], [0, Math.max(...curve) * 1.15], { l: lw + 46, r: 10, t: 26, b: 32 }); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("street width for each angle", (Q.pad.l + W) / 2, 15); axes(ctx, Q, { nx: 4, ny: 3, xl: "line angle (degrees)", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      ctx.beginPath(); curve.forEach((v, d) => (d ? ctx.lineTo(Q.X(d), Q.Y(v)) : ctx.moveTo(Q.X(0), Q.Y(v)))); ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(ang), Q.Y(Math.max(0, g.gap)), 7, ok ? css("--accent") : css("--bad")); ctx.font = "700 18px Fredoka"; ctx.fillStyle = css("--good"); ctx.fillText("★", Q.X(bestA), Q.Y(curve[bestA]) - 8);
    });
    function show() { const g = gapAt(ang); out.innerHTML = g.gap > 0 ? `Angle <b>${ang}°</b>: this line separates the classes with a street of width <b>${g.gap.toFixed(3)}</b> (best possible: <b>${curve[bestA].toFixed(3)}</b> at ${bestA}°) → you have <b>${((g.gap / curve[bestA]) * 100).toFixed(0)}%</b> of the maximum margin. Ringed points are touching the street: the support vectors.` : `Angle <b>${ang}°</b>: <b style="color:var(--bad)">no street possible</b>: some points would end up on the wrong side. Rotate to find a valid angle.`; cv.redraw(); }
    const sl = slider(ctl, { label: "Line angle", min: 0, max: 359, step: 1, value: ang, fmt: (v) => v + "°", onInput: (v) => { cancelAnimationFrame(anim); ang = v; show(); } });
    btn(ctl, "★ Snap to the widest street (the SVM)", () => { cancelAnimationFrame(anim); const s = ang, d = ((bestA - s + 540) % 360) - 180, t0 = performance.now(); (function f(now) { const k = Math.min(1, (now - t0) / 900); ang = Math.round((s + d * (1 - (1 - k) ** 3) + 720) % 360); sl.set(ang); show(); if (k < 1) anim = requestAnimationFrame(f); })(t0); }, "primary"); show();
  })();

  /* ---------- soft margin ---------- */
  (function () {
    const host = $("#demo-soft", document), out = $("[data-out]", host), ctl = $("[data-controls]", host), r = rng(12);
    const mk = () => { const a = []; for (let i = 0; i < 20; i++) { a.push([3.3 + 0.85 * randn(r), 3.3 + 0.85 * randn(r), 1]); a.push([1.7 + 0.85 * randn(r), 1.7 + 0.85 * randn(r), -1]); } return a; };
    let pts = mk(), lv = 0, cls = 1, model, lastP; const base = pts.map((p) => p.slice());
    const fit = () => { model = ML.svmTrain(pts.map((p) => [p[0], p[1]]), pts.map((p) => p[2]), ML.svmKernel("linear"), 10 ** lv, { linear: true, seed: 2 }); };
    fit();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const P = eqPlane(W, H, [-0.5, 5.5], [-0.5, 5.5]); lastP = P; frame(ctx, P); ctx.save(); clipTo(ctx, P);
      const w = model.w, b = model.b, nw = Math.hypot(w[0], w[1]);
      if (nw > 1e-9) [[0, css("--accent"), 5, null], [1, css("--text"), 2.5, [8, 6]], [-1, css("--text"), 2.5, [8, 6]]].forEach(([lvl, c, lwid, dash]) => { const at = (x) => (lvl - b - w[0] * x) / w[1]; if (Math.abs(w[1]) > 1e-9) line(ctx, P.X(-1), P.Y(at(-1)), P.X(6), P.Y(at(6)), c, lwid, dash); else line(ctx, P.X((lvl - b) / w[0]), P.Y(-1), P.X((lvl - b) / w[0]), P.Y(6), c, lwid, dash); });
      const svs = new Set(model.sv); pts.forEach((p, i) => { if (svs.has(i)) dot(ctx, P.X(p[0]), P.Y(p[1]), 12, null, css("--text")); dot(ctx, P.X(p[0]), P.Y(p[1]), 6, colOf(p[2])); }); ctx.restore();
    });
    function show() {
      fit(); const w = model.w, nw = Math.hypot(w[0], w[1]), acc = mean(pts.map((p) => (Math.sign(model.dec([p[0], p[1]])) === p[2] ? 1 : 0)));
      out.innerHTML = `C = <b>${(10 ** lv).toPrecision(2)}</b> · <b>${model.sv.length}</b> support vectors out of ${pts.length} · street width 2 ÷ ‖w‖ = 2 ÷ ${nw.toFixed(3)} = <b>${(2 / nw).toFixed(2)}</b> · training accuracy <b>${(acc * 100).toFixed(0)}%</b><br>w = (${w[0].toFixed(2)}, ${w[1].toFixed(2)}), b = ${model.b.toFixed(2)}<br>` + (lv <= -1.5 ? "Very small C: a very wide, relaxed street. Almost every point leans on it (many support vectors)." : lv >= 2 ? "Large C: a narrow, strict street pulled towards individual points. Add an outlier and watch it swing." : "A balanced setting."); cv.redraw();
    }
    slider(ctl, { label: "log₁₀ C", min: -2, max: 3, step: 0.25, value: lv, fmt: (v) => v.toFixed(2), onInput: (v) => { lv = v; show(); } });
    const tb = btn(ctl, "Click adds: class +1 (blue)", () => { cls = -cls; tb.textContent = "Click adds: class " + (cls > 0 ? "+1 (blue)" : "−1 (orange)"); });
    btn(ctl, "Add outlier: blue deep in orange", () => { pts.push([1, 1.1, 1]); show(); }); btn(ctl, "Reset", () => { pts = base.map((p) => p.slice()); show(); }, "primary");
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), P = lastP; if (p.x > P.pad.l && p.x < P.w - P.pad.r && p.y > P.pad.t && p.y < P.h - P.pad.b) { pts.push([P.iX(p.x), P.iY(p.y), cls]); show(); } });
    show();
  })();

  /* ---------- lift to a higher dimension ---------- */
  (function () {
    const host = $("#demo-lift"), out = $("[data-out]", host), ctl = $("[data-controls]", host), D = [[-3, -1], [-2, -1], [-1, 1], [0, 1], [1, 1], [2, -1], [3, -1]]; let c = 2.5;
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const hw = Math.round(W / 2) - 8, A = plane(hw, H, [-4, 4], [-1, 1], { l: 20, r: 14, t: 30, b: 30 }), yy = H / 2 + 10;
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("Original: one feature x. No single cut works", hw / 2, 16);
      const s = Math.sqrt(c); ctx.globalAlpha = 0.18; ctx.fillStyle = css("--c1"); ctx.fillRect(A.X(-s), yy - 50, A.X(s) - A.X(-s), 100); ctx.globalAlpha = 1;
      line(ctx, A.X(-4), yy, A.X(4), yy, css("--line"), 3); D.forEach(([x, k]) => { dot(ctx, A.X(x), yy, 10, colOf(k)); ctx.fillStyle = css("--text"); ctx.font = "600 12px DM Sans"; ctx.fillText(x, A.X(x), yy + 30); });
      const ox = hw + 16, B = plane(W - ox, H, [-4, 4], [-0.5, 10.5], { l: 34, r: 10, t: 30, b: 30 }); ctx.save(); ctx.translate(ox, 0); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("Lifted: (x, x²). A straight line works", (W - ox) / 2, 16);
      axes(ctx, B, { nx: 4, ny: 5, xl: "x", yl: "x²", fx: (v) => Math.round(v), fy: (v) => Math.round(v) }); line(ctx, B.X(-4), B.Y(c), B.X(4), B.Y(c), css("--accent"), 4.5); D.forEach(([x, k]) => dot(ctx, B.X(x), B.Y(x * x), 8, colOf(k))); ctx.restore();
    });
    function show() { const s = Math.sqrt(c), wrong = D.filter(([x, k]) => (x * x < c ? 1 : -1) !== k).length; out.innerHTML = `Rule in the lifted space: "x² &lt; <b>${c.toFixed(1)}</b> → class +1". In the original line that is the zone <b>−${s.toFixed(2)} &lt; x &lt; ${s.toFixed(2)}</b> (shaded). Mistakes: <b>${wrong}</b> of 7.` + (wrong === 0 ? " ✅ A straight line in the new dimension separates everything: a curved (two-cut) boundary back in the original space." : " Move the line between x² = 1 and x² = 4."); cv.redraw(); }
    slider(ctl, { label: "Height of the separating line (x²)", min: 0, max: 10, step: 0.1, value: c, fmt: (v) => v.toFixed(1), onInput: (v) => { c = v; show(); } }); show();
  })();

  /* ---------- kernels, C and gamma ---------- */
  (function () {
    const host = $("#demo-kernel"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let dsName = "circles", kern = "rbf", lc = 0, lg = 0, seed = 3, showTest = true, train, test, model;
    const ranges = { moons: [[-1.8, 2.8], [-1.3, 1.8]], circles: [[-1.8, 1.8], [-1.8, 1.8]], blobs: [[-1, 5], [-1, 5]] };
    function gen() {
      const r = rng(seed * 211), mk = (n) => { const a = []; for (let i = 0; i < n; i++) {
        if (dsName === "moons") { const t1 = Math.PI * r(), t2 = Math.PI * r(); a.push([Math.cos(t1) + 0.22 * randn(r), Math.sin(t1) + 0.22 * randn(r), 1]); a.push([1 - Math.cos(t2) + 0.22 * randn(r), 0.5 - Math.sin(t2) + 0.22 * randn(r), -1]); }
        else if (dsName === "circles") { const t1 = 2 * Math.PI * r(), t2 = 2 * Math.PI * r(); a.push([0.5 * Math.cos(t1) + 0.12 * randn(r), 0.5 * Math.sin(t1) + 0.12 * randn(r), 1]); a.push([1.2 * Math.cos(t2) + 0.12 * randn(r), 1.2 * Math.sin(t2) + 0.12 * randn(r), -1]); }
        else { a.push([3.2 + 0.85 * randn(r), 3.2 + 0.85 * randn(r), 1]); a.push([1.5 + 0.85 * randn(r), 1.5 + 0.85 * randn(r), -1]); } } return a; };
      train = mk(30); test = mk(30);
    }
    const fit = () => { model = ML.svmTrain(train.map((p) => [p[0], p[1]]), train.map((p) => p[2]), ML.svmKernel(kern, 10 ** lg, 3), 10 ** lc, { linear: false, seed: 1 }); };
    gen(); fit();
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const [xr, yr] = ranges[dsName], P = eqPlane(W, H, xr, yr); frame(ctx, P);
      const cs = 7; for (let px = P.pad.l; px < W - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) { const f = model.dec([P.iX(px + cs / 2), P.iY(py + cs / 2)]); ctx.globalAlpha = 0.09 + 0.16 * Math.min(1, Math.abs(f)); ctx.fillStyle = f > 0 ? css("--c1") : css("--c2"); ctx.fillRect(px, py, cs, cs); } ctx.globalAlpha = 1;
      ctx.save(); clipTo(ctx, P); if (showTest) test.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, null, colOf(p[2]))); const svs = new Set(model.sv); train.forEach((p, i) => { if (svs.has(i)) dot(ctx, P.X(p[0]), P.Y(p[1]), 10, null, css("--text")); dot(ctx, P.X(p[0]), P.Y(p[1]), 5, colOf(p[2])); }); ctx.restore();
    });
    const acc = (D) => mean(D.map((p) => (Math.sign(model.dec([p[0], p[1]])) === p[2] ? 1 : 0)));
    function show() {
      fit(); const tr = acc(train), te = acc(test);
      out.innerHTML = `data: <b>${dsName}</b> · kernel: <b>${kern}</b> · C = <b>${(10 ** lc).toPrecision(2)}</b>` + (kern !== "linear" ? ` · γ = <b>${(10 ** lg).toPrecision(2)}</b>` : "") + ` · support vectors: <b>${model.sv.length}</b> of ${train.length}<br>training accuracy <b>${(tr * 100).toFixed(0)}%</b> · test accuracy <b>${(te * 100).toFixed(0)}%</b><br>` + (kern === "linear" && dsName !== "blobs" ? "A straight line cannot separate this shape: try the RBF kernel." : kern === "rbf" && lg >= 1.5 ? "Huge γ: tiny islands around each point, memorising the training data (compare training and test accuracy)." : kern === "rbf" && lg <= -1.5 ? "Tiny γ: the boundary is almost straight (underfitting)." : tr - te > 0.1 ? "Training accuracy is well above test accuracy: overfitting." : "A reasonable fit."); cv.redraw();
    }
    const bd = btn(ctl, "Data: circles", () => { dsName = dsName === "circles" ? "moons" : dsName === "moons" ? "blobs" : "circles"; bd.textContent = "Data: " + dsName; gen(); show(); }, "primary");
    const bk = btn(ctl, "Kernel: rbf", () => { kern = kern === "rbf" ? "linear" : kern === "linear" ? "poly" : "rbf"; bk.textContent = "Kernel: " + kern; show(); });
    slider(ctl, { label: "log₁₀ C", min: -2, max: 3, step: 0.25, value: lc, fmt: (v) => v.toFixed(2), onInput: (v) => { lc = v; show(); } });
    slider(ctl, { label: "log₁₀ γ", min: -2, max: 2, step: 0.25, value: lg, fmt: (v) => v.toFixed(2), onInput: (v) => { lg = v; show(); } });
    const bt = btn(ctl, "Test points: shown", () => { showTest = !showTest; bt.textContent = "Test points: " + (showTest ? "shown" : "hidden"); cv.redraw(); });
    btn(ctl, "New random data", () => { seed++; gen(); show(); }); show();
  })();
});
