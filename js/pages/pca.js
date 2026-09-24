/* Demos for pca.html (uses ML.data from pca-data.js) */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const eqPlane = (W, H, xr, yr, w) => { w = w || W; const sc = Math.min((w - 24) / (xr[1] - xr[0]), (H - 24) / (yr[1] - yr[0])), pw = sc * (xr[1] - xr[0]), ph = sc * (yr[1] - yr[0]), l = (w - pw) / 2, t = (H - ph) / 2; return plane(w, H, xr, yr, { l, r: w - l - pw, t, b: H - t - ph }); };
  const frame = (ctx, P) => { ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(P.pad.l, P.pad.t, P.w - P.pad.l - P.pad.r, P.h - P.pad.t - P.pad.b); };
  const pal = (i) => css("--c" + ((i % 4) + 1));

  /** eigen-decomposition of a symmetric matrix by cyclic Jacobi rotations; returns values (descending) and vectors as rows */
  function eigSym(S) {
    const n = S.length, A = S.map((r) => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j]; if (off < 1e-22) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        const apq = A[p][q]; if (Math.abs(apq) < 1e-300) continue; const th = (A[q][q] - A[p][p]) / (2 * apq), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(1 + th * th)), c = 1 / Math.sqrt(1 + t * t), s = t * c;
        for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const idx = A.map((_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
    return { values: idx.map((i) => A[i][i]), vectors: idx.map((i) => V.map((row) => row[i])) };
  }
  /** PCA of rows of X (optionally standardised); returns mean, components (rows), variances, ratios and scores */
  function pca(X, standardise) {
    const n = X.length, d = X[0].length, mu = Array.from({ length: d }, (_, j) => mean(X.map((r) => r[j]))), sd = Array.from({ length: d }, (_, j) => Math.sqrt(mean(X.map((r) => (r[j] - mu[j]) ** 2)) * n / (n - 1)) || 1);
    const Z = X.map((r) => r.map((v, j) => (v - mu[j]) / (standardise ? sd[j] : 1)));
    const C = Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => Z.reduce((s, r) => s + r[a] * r[b], 0) / (n - 1))), e = eigSym(C), tot = e.values.reduce((s, v) => s + v, 0);
    return { mu, comps: e.vectors, vars: e.values, ratio: e.values.map((v) => v / tot), scores: Z.map((r) => e.vectors.map((v) => v.reduce((s, w, j) => s + w * r[j], 0))), total: tot };
  }

  /* ---------- find the best axis: variance kept vs error ---------- */
  (function () {
    const host = $("#demo-axis"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 6, ang = 10, X, mu, best, anim = 0;
    function gen() { const r = rng(seed * 17), a = ((20 + 40 * r()) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); X = Array.from({ length: 40 }, () => { const u = 2.3 * randn(r), v = 0.7 * randn(r); return [c * u - s * v, s * u + c * v]; }); mu = [mean(X.map((p) => p[0])), mean(X.map((p) => p[1]))]; X = X.map((p) => [p[0] - mu[0], p[1] - mu[1]]); mu = [0, 0]; const p = pca(X, false); best = ((Math.atan2(p.comps[0][1], p.comps[0][0]) * 180) / Math.PI + 180) % 180; }
    const stats = (deg) => { const t = (deg * Math.PI) / 180, u = [Math.cos(t), Math.sin(t)], proj = X.map((p) => p[0] * u[0] + p[1] * u[1]), va = mean(proj.map((v) => v * v)), tot = mean(X.map((p) => p[0] * p[0] + p[1] * p[1])); return { va, err: tot - va, tot, u, proj }; };
    gen();
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const lw = Math.round(W * 0.56), P = eqPlane(W, H, [-6, 6], [-4.4, 4.4], lw), st = stats(ang); frame(ctx, P);
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      X.forEach((p, i) => line(ctx, P.X(p[0]), P.Y(p[1]), P.X(st.proj[i] * st.u[0]), P.Y(st.proj[i] * st.u[1]), css("--bad"), 1.6));
      line(ctx, P.X(-9 * st.u[0]), P.Y(-9 * st.u[1]), P.X(9 * st.u[0]), P.Y(9 * st.u[1]), css("--accent"), 4.5);
      X.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5, css("--c1"))); X.forEach((p, i) => dot(ctx, P.X(st.proj[i] * st.u[0]), P.Y(st.proj[i] * st.u[1]), 3, css("--accent"))); ctx.restore();
      const Q = plane(W, H, [0, 180], [0, st.tot * 1.08], { l: lw + 44, r: 10, t: 26, b: 34 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("as the axis rotates", (Q.pad.l + W) / 2, 15); axes(ctx, Q, { nx: 4, ny: 3, xl: "axis angle (degrees)", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      [["va", css("--c1")], ["err", css("--bad")]].forEach(([k, col]) => { ctx.beginPath(); for (let d = 0; d <= 180; d += 2) { const s = stats(d)[k]; d ? ctx.lineTo(Q.X(d), Q.Y(s)) : ctx.moveTo(Q.X(0), Q.Y(s)); } ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(ang), Q.Y(st[k]), 6, col); });
      ctx.font = "700 16px Fredoka"; ctx.fillStyle = css("--good"); ctx.fillText("★", Q.X(best), Q.Y(stats(best).va) - 8);
    });
    function show() {
      const st = stats(ang), b = stats(best);
      out.innerHTML = `Axis at <b>${ang}°</b>. Spread of the projected points along the axis (blue curve): <b>${st.va.toFixed(2)}</b> · average squared distance from the points to the axis, the information lost (red curve, red segments): <b>${st.err.toFixed(2)}</b> · together they always add up to <b>${st.tot.toFixed(2)}</b>, the total spread of the cloud.<br>` + (Math.abs(ang - best) <= 2 || 180 - Math.abs(ang - best) <= 2 ? `🌟 This is the <b>first principal component</b> (★, about ${Math.round(best)}°): it keeps <b>${((b.va / b.tot) * 100).toFixed(0)}%</b> of the spread, the most any single axis can.` : `The best axis is at about <b>${Math.round(best)}°</b> (★): keeping <b>${((b.va / b.tot) * 100).toFixed(0)}%</b> of the spread. This axis keeps ${((st.va / st.tot) * 100).toFixed(0)}%. Rotate to the peak of the blue curve, which is also the bottom of the red one.`); cv.redraw();
    }
    const sl = slider(ctl, { label: "Axis angle", min: 0, max: 179, step: 1, value: ang, fmt: (v) => v + "°", onInput: (v) => { cancelAnimationFrame(anim); ang = v; show(); } });
    btn(ctl, "★ Snap to the principal component", () => { cancelAnimationFrame(anim); const s = ang, tgt = Math.round(best), d = ((tgt - s + 270) % 180) - 90, t0 = performance.now(); (function f(now) { const k = Math.min(1, (now - t0) / 700); ang = Math.round((s + d * (1 - (1 - k) ** 3) + 360) % 180); sl.set(ang); show(); if (k < 1) anim = requestAnimationFrame(f); })(t0); }, "primary");
    btn(ctl, "New random cloud", () => { seed++; gen(); show(); }); show();
  })();

  /* ---------- a 3-D pancake and the best 2-D view ---------- */
  (function () {
    const host = $("#demo-3d"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 3, yaw = 35, pitch = 20, R, X, pc, mode = "manual", tot;
    const rot = () => { const y = (yaw * Math.PI) / 180, p = (pitch * Math.PI) / 180, cy = Math.cos(y), sy = Math.sin(y), cp = Math.cos(p), sp = Math.sin(p); return [[cy, 0, -sy], [sp * sy, cp, sp * cy], [cp * sy, -sp, cp * cy]]; };
    function gen() { const r = rng(seed * 71), e1 = [0.82, 0.42, 0.39], e2 = [-0.5, 0.84, 0.2], e3 = [-0.27, -0.35, 0.9]; X = Array.from({ length: 150 }, () => { const u = 2.2 * randn(r), v = 1.2 * randn(r), w = 0.28 * randn(r); return [0, 1, 2].map((k) => u * e1[k] + v * e2[k] + w * e3[k]); }); pc = pca(X, false); tot = pc.total; R = rot(); }
    gen();
    const view = () => (mode === "pca" ? pc.comps : R);
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const M = view(), P = plane(W, H, [-4.6, 4.6], [-3.6, 3.6], { l: 10, r: 10, t: 10, b: 10 }), sc = Math.min((W - 20) / 9.2, (H - 20) / 7.2), cx = W / 2, cy = H / 2;
      const S = (p) => [M[0][0] * p[0] + M[0][1] * p[1] + M[0][2] * p[2], M[1][0] * p[0] + M[1][1] * p[1] + M[1][2] * p[2], M[2][0] * p[0] + M[2][1] * p[1] + M[2][2] * p[2]];
      ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(6, 6, W - 12, H - 12);
      const pts = X.map((p) => S(p)).sort((a, b) => a[2] - b[2]); pts.forEach((q) => { const d = clamp((q[2] + 4) / 8, 0, 1); ctx.globalAlpha = 0.45 + 0.5 * d; dot(ctx, cx + q[0] * sc, cy - q[1] * sc, 3.2 + 2.6 * d, css("--c1")); }); ctx.globalAlpha = 1;
      [[0, css("--accent")], [1, css("--c3")], [2, css("--c2")]].forEach(([k, col], i) => { const v = pc.comps[k], len = 2 * Math.sqrt(pc.vars[k]) + 0.4, e = S(v.map((z) => z * len)), e2 = S(v.map((z) => -z * len)); line(ctx, cx + e2[0] * sc, cy - e2[1] * sc, cx + e[0] * sc, cy - e[1] * sc, col, 3.5); ctx.fillStyle = col; ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("PC" + (k + 1), cx + e[0] * sc + 4, cy - e[1] * sc - 6); });
    });
    function keptVar() { const M = view(), a = X.map((p) => M[0][0] * p[0] + M[0][1] * p[1] + M[0][2] * p[2]), b = X.map((p) => M[1][0] * p[0] + M[1][1] * p[1] + M[1][2] * p[2]), v = (arr) => { const m = mean(arr); return mean(arr.map((x) => (x - m) ** 2)) * X.length / (X.length - 1); }; return (v(a) + v(b)) / tot; }
    function show() {
      const k = keptVar();
      out.innerHTML = `Principal components of this 150-point cloud: PC1 explains <b>${(pc.ratio[0] * 100).toFixed(1)}%</b> of the total variance, PC2 <b>${(pc.ratio[1] * 100).toFixed(1)}%</b>, PC3 only <b>${(pc.ratio[2] * 100).toFixed(1)}%</b>: the cloud is a thin, tilted pancake.<br>Current view: <b>${mode === "pca" ? "looking straight at the PC1–PC2 plane" : "yaw " + yaw + "°, pitch " + pitch + "°"}</b> keeps <b>${(k * 100).toFixed(1)}%</b> of the variance in the two screen directions (the best any 2-D view can do is <b>${((pc.ratio[0] + pc.ratio[1]) * 100).toFixed(1)}%</b>).` + (mode === "pca" ? "<br>Face-on to the pancake: nearly all the structure is visible. Drag the sliders to leave this view and watch the pancake collapse into an edge-on stripe." : "<br>Rotate the cloud: from some angles it looks like a blob, from others like a thin line. PCA finds the angle that shows the most spread."); cv.redraw();
    }
    slider(ctl, { label: "Rotate (yaw)", min: -180, max: 180, step: 1, value: yaw, fmt: (v) => v + "°", onInput: (v) => { yaw = v; mode = "manual"; R = rot(); show(); } });
    slider(ctl, { label: "Tilt (pitch)", min: -90, max: 90, step: 1, value: pitch, fmt: (v) => v + "°", onInput: (v) => { pitch = v; mode = "manual"; R = rot(); show(); } });
    btn(ctl, "★ Best 2-D view (PC1 × PC2)", () => { mode = "pca"; show(); }, "primary"); btn(ctl, "New random cloud", () => { seed++; gen(); mode = "manual"; show(); }); show();
  })();

  /* ---------- scree plot on real data ---------- */
  (function () {
    const host = $("#demo-scree"), out = $("[data-out]", host), ctl = $("[data-controls]", host), cache = {};
    let ds = "iris", scaled = false, K = 2;
    const get = () => { const key = ds + scaled; return cache[key] || (cache[key] = pca(ML.data[ds].X, scaled)); };
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const p = get(), d = p.ratio.length, lw = Math.round(W * 0.5), Q = plane(lw, H, [0.4, d + 0.6], [0, 1], { l: 42, r: 8, t: 26, b: 34 });
      ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("variance explained per component (bars) and cumulative (line)", lw / 2, 14); axes(ctx, Q, { nx: Math.min(d, 6), ny: 4, xl: "principal component", fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%" });
      p.ratio.forEach((r, i) => { const x0 = Q.X(i + 1 - 0.35), x1 = Q.X(i + 1 + 0.35); ctx.fillStyle = i < K ? css("--accent") : css("--line"); ctx.globalAlpha = 0.95; ctx.fillRect(x0, Q.Y(r), x1 - x0, Q.Y(0) - Q.Y(r)); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1.8; ctx.strokeRect(x0, Q.Y(r), x1 - x0, Q.Y(0) - Q.Y(r)); });
      let c = 0; ctx.beginPath(); p.ratio.forEach((r, i) => { c += r; i ? ctx.lineTo(Q.X(i + 1), Q.Y(c)) : ctx.moveTo(Q.X(1), Q.Y(c)); }); ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke(); c = 0; p.ratio.forEach((r, i) => { c += r; dot(ctx, Q.X(i + 1), Q.Y(c), i + 1 === K ? 7 : 4, i + 1 === K ? css("--accent") : css("--c4")); });
      const sx = p.scores.map((s) => s[0]), sy = p.scores.map((s) => s[1]), rx = [Math.min(...sx), Math.max(...sx)], ry = [Math.min(...sy), Math.max(...sy)], pad = 0.08, P = plane(W - lw, H, [rx[0] - pad * (rx[1] - rx[0]), rx[1] + pad * (rx[1] - rx[0])], [ry[0] - pad * (ry[1] - ry[0]), ry[1] + pad * (ry[1] - ry[0])], { l: 38, r: 10, t: 26, b: 34 });
      ctx.save(); ctx.translate(lw, 0); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("the data on PC1 × PC2 (colour = true class)", (P.pad.l + W - lw) / 2, 14); axes(ctx, P, { nx: 4, ny: 4, xl: "PC1", yl: "PC2", fx: (v) => v.toFixed(v > 50 ? 0 : 1), fy: (v) => v.toFixed(v > 50 ? 0 : 1) });
      p.scores.forEach((s, i) => dot(ctx, P.X(s[0]), P.Y(s[1]), 4, pal(ML.data[ds].y[i]))); ctx.restore();
    });
    function show() {
      const p = get(), D = ML.data[ds], cum = p.ratio.slice(0, K).reduce((s, v) => s + v, 0), top = p.comps[0].map((v, j) => [Math.abs(v), D.names[j], v]).sort((a, b) => b[0] - a[0]).slice(0, 2);
      out.innerHTML = `data: <b>${ds}</b> (${D.X.length} rows, ${D.X[0].length} features) · features <b>${scaled ? "standardised" : "in raw units"}</b><br>PC1 explains <b>${(p.ratio[0] * 100).toFixed(1)}%</b>, PC2 <b>${(p.ratio[1] * 100).toFixed(1)}%</b>, PC3 ${(p.ratio[2] * 100).toFixed(1)}% · keeping <b>${K}</b> component${K === 1 ? "" : "s"} keeps <b>${(cum * 100).toFixed(1)}%</b> of the variance (orange bars)<br>PC1 is built mostly from <b>${top[0][1]}</b> (weight ${top[0][2].toFixed(2)}) and <b>${top[1][1]}</b> (${top[1][2].toFixed(2)}).` + (ds === "wine" && !scaled ? "<br>🟥 Without scaling, one feature (proline, measured in the hundreds and thousands) makes up practically all of PC1: PCA is just re-discovering which column has the biggest numbers. Turn scaling on." : ds === "wine" ? "<br>With standardised features, PC1 is a blend of many chemical measurements, and the three wine types separate well on PC1 × PC2." : scaled ? "<br>Standardising iris changes little because all four measurements are already in centimetres." : "<br>Four features are almost fully summarised by two components; the three species are visible in the picture."); cv.redraw();
    }
    const bd = btn(ctl, "Data: iris (4 features)", () => { ds = ds === "iris" ? "wine" : "iris"; bd.textContent = ds === "iris" ? "Data: iris (4 features)" : "Data: wine (13 features)"; K = Math.min(K, ML.data[ds].X[0].length); sK.el.max = ML.data[ds].X[0].length; show(); }, "primary");
    const bs = btn(ctl, "Standardise: off", () => { scaled = !scaled; bs.textContent = "Standardise: " + (scaled ? "on" : "off"); show(); });
    const sK = slider(ctl, { label: "Components kept", min: 1, max: 4, step: 1, value: K, onInput: (v) => { K = v; show(); } }); show();
  })();
});
