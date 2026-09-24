/* Demos for linear-regression.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const ols = (xs, ys) => { const mx = mean(xs), my = mean(ys); let n = 0, d = 0; xs.forEach((x, i) => { n += (x - mx) * (ys[i] - my); d += (x - mx) ** 2; }); const b1 = d ? n / d : 0; return [my - b1 * mx, b1]; };
  const costJ = (xs, ys, a, b) => xs.reduce((s, x, i) => s + (a + b * x - ys[i]) ** 2, 0) / (2 * xs.length);

  /* ---------- Slope & intercept ---------- */
  (function () {
    const host = $("#demo-si"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let t0 = 2, t1 = 1;
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [-1, 6], [-2, 10], { l: 46, r: 14, t: 12, b: 34 });
      axes(ctx, P, { nx: 7, ny: 6, xl: "x (input)", yl: "prediction ŷ" });
      line(ctx, P.X(0), P.Y(-2), P.X(0), P.Y(10), css("--line"), 2.5); line(ctx, P.X(-1), P.Y(0), P.X(6), P.Y(0), css("--line"), 2.5);
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      line(ctx, P.X(-1), P.Y(t0 - t1), P.X(6), P.Y(t0 + 6 * t1), css("--accent"), 5); ctx.restore();
      const y2 = t0 + 2 * t1, y3 = y2 + t1;
      if (y2 > -2 && y3 < 10 && y3 > -2 && y2 < 10) { line(ctx, P.X(2), P.Y(y2), P.X(3), P.Y(y2), css("--c1"), 4); line(ctx, P.X(3), P.Y(y2), P.X(3), P.Y(y3), css("--c2"), 4); ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--c1"); ctx.textAlign = "center"; ctx.fillText("run = 1", P.X(2.5), P.Y(y2) + (t1 >= 0 ? 16 : -8)); ctx.fillStyle = css("--c2"); ctx.textAlign = "left"; ctx.fillText("rise = θ₁ = " + t1.toFixed(1), P.X(3) + 8, P.Y((y2 + y3) / 2) + 4); }
      if (t0 > -2 && t0 < 10) { dot(ctx, P.X(0), P.Y(t0), 9, css("--c5")); ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillText("intercept θ₀ = " + t0.toFixed(1), P.X(0) + 14, P.Y(t0) - 10); }
    });
    const sg = (v) => (v < 0 ? "−" : "+") + " " + Math.abs(v).toFixed(1);
    const upd = () => { out.innerHTML = `<b>ŷ = ${t0.toFixed(1)} ${sg(t1)}·x</b>. At x = 0 the prediction is <b>${t0.toFixed(1)}</b> (the intercept). Each +1 in x changes the prediction by <b>${t1.toFixed(1)}</b> (the slope), e.g. x = 4 → ${t0.toFixed(1)} + (${t1.toFixed(1)})×4 = <b>${(t0 + 4 * t1).toFixed(1)}</b>.`; cv.redraw(); };
    slider(ctl, { label: "Intercept θ₀", min: -1, max: 6, step: 0.1, value: t0, fmt: (v) => v.toFixed(1), onInput: (v) => { t0 = v; upd(); } });
    slider(ctl, { label: "Slope θ₁", min: -1.5, max: 2.5, step: 0.1, value: t1, fmt: (v) => v.toFixed(1), onInput: (v) => { t1 = v; upd(); } }); upd();
  })();

  /* ---------- Fit by hand ---------- */
  (function () {
    const host = $("#demo-fit"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const r = rng(8); let pts = []; const reset = () => { pts = []; for (let i = 0; i < 10; i++) { const x = 0.5 + i * 0.55; pts.push([x, 1.5 * x + 1 + 0.75 * randn(r)]); } };
    reset(); let t0 = 6, t1 = -0.5, showBest = false, lastP, anim = 0;
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const P = plane(W, H, [0, 6], [-2, 12], { l: 42, r: 14, t: 12, b: 32 }); lastP = P;
      axes(ctx, P, { nx: 6, ny: 7, xl: "x", yl: "y", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      if (showBest) { const [a, b] = ols(pts.map((p) => p[0]), pts.map((p) => p[1])); line(ctx, P.X(0), P.Y(a), P.X(6), P.Y(a + 6 * b), css("--good"), 4, [10, 7]); }
      pts.forEach((p) => line(ctx, P.X(p[0]), P.Y(p[1]), P.X(p[0]), P.Y(t0 + t1 * p[0]), css("--bad"), 2.2, [4, 4]));
      line(ctx, P.X(0), P.Y(t0), P.X(6), P.Y(t0 + 6 * t1), css("--accent"), 5);
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 6, css("--c1"))); ctx.restore();
    });
    const sl0 = slider(ctl, { label: "Intercept θ₀", min: -2, max: 8, step: 0.05, value: t0, fmt: (v) => v.toFixed(2), onInput: (v) => { t0 = v; show(); } });
    const sl1 = slider(ctl, { label: "Slope θ₁", min: -2, max: 4, step: 0.05, value: t1, fmt: (v) => v.toFixed(2), onInput: (v) => { t1 = v; show(); } });
    function show() {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), n = xs.length, sse = xs.reduce((s, x, i) => s + (t0 + t1 * x - ys[i]) ** 2, 0), J = sse / (2 * n), [a, b] = ols(xs, ys), Jb = costJ(xs, ys, a, b);
      const good = J < Jb * 1.05 + 1e-9;
      out.innerHTML = `Your line: <b>ŷ = ${t0.toFixed(2)} ${t1 < 0 ? "−" : "+"} ${Math.abs(t1).toFixed(2)}x</b> · Σ(error²) = ${sse.toFixed(2)} · <b>J = ${sse.toFixed(2)} ÷ (2×${n}) = <span style="color:${good ? "var(--good)" : "var(--bad)"}">${J.toFixed(3)}</span></b><br>Best possible line: ŷ = ${a.toFixed(2)} ${b < 0 ? "−" : "+"} ${Math.abs(b).toFixed(2)}x with J = <b>${Jb.toFixed(3)}</b>. ` + (good ? "🎉 You're at (or extremely close to) the global minimum." : `Your cost is ${(J / Jb).toFixed(1)}× the minimum: keep tuning, or press <b>Snap to best fit</b>.`);
      cv.redraw();
    }
    btn(ctl, "🎯 Snap to best fit", () => { cancelAnimationFrame(anim); const [a, b] = ols(pts.map((p) => p[0]), pts.map((p) => p[1])), s0 = t0, s1 = t1, t = performance.now(); (function f(now) { const k = Math.min(1, (now - t) / 900), e = 1 - (1 - k) ** 3; t0 = s0 + (clamp(a, -2, 8) - s0) * e; t1 = s1 + (clamp(b, -2, 4) - s1) * e; sl0.set(t0); sl1.set(t1); show(); if (k < 1) anim = requestAnimationFrame(f); })(t); }, "primary");
    const sb = btn(ctl, "Show best line", () => { showBest = !showBest; sb.textContent = showBest ? "Hide best line" : "Show best line"; sb.classList.toggle("on", showBest); cv.redraw(); });
    btn(ctl, "Add an outlier", () => { pts.push([1.2, 10]); show(); });
    btn(ctl, "Reset points", () => { reset(); show(); });
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e); if (p.x > lastP.pad.l && p.y < lastP.h - lastP.pad.b) { pts.push([clamp(lastP.iX(p.x), 0, 6), clamp(lastP.iY(p.y), -2, 12)]); show(); } });
    show();
  })();

  /* ---------- Cost by hand (notes example) ---------- */
  (function () {
    const host = $("#demo-cost"), out = $("[data-out]", host), ctl = $("[data-controls]", host), tbl = $("#costTbl"), X = [1, 2, 3], Y = [1, 2, 3]; let t1 = 0;
    const Jf = (b) => costJ(X, Y, 0, b);
    const cv = ML.canvas($("[data-canvas]", host), 260, (ctx, W, H) => {
      const lw = Math.round(W * 0.48), P = plane(lw, H, [0, 4], [0, 6.5], { l: 34, r: 8, t: 18, b: 30 });
      ctx.fillStyle = css("--text"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("Data and the line ŷ = θ₁·x", lw / 2, 13);
      axes(ctx, P, { nx: 4, ny: 3, xl: "x", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      X.forEach((x, i) => line(ctx, P.X(x), P.Y(Y[i]), P.X(x), P.Y(t1 * x), css("--bad"), 2.5, [4, 4])); line(ctx, P.X(0), P.Y(0), P.X(4), P.Y(4 * t1), css("--accent"), 5); ctx.restore();
      X.forEach((x, i) => dot(ctx, P.X(x), P.Y(Y[i]), 7, css("--c1")));
      const ox = lw + 14, Q = plane(W - ox, H, [-0.1, 2.1], [0, 3.2], { l: 34, r: 8, t: 18, b: 30 });
      ctx.save(); ctx.translate(ox, 0); ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("Cost J as θ₁ changes (θ₀ = 0)", (W - ox) / 2, 13);
      axes(ctx, Q, { nx: 4, ny: 4, xl: "θ₁", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) });
      ctx.beginPath(); for (let i = 0; i <= 80; i++) { const b = -0.1 + (2.2 * i) / 80; i ? ctx.lineTo(Q.X(b), Q.Y(Jf(b))) : ctx.moveTo(Q.X(b), Q.Y(Jf(b))); } ctx.strokeStyle = css("--c4"); ctx.lineWidth = 4; ctx.stroke();
      [0, 0.5, 1, 1.5, 2].forEach((b) => dot(ctx, Q.X(b), Q.Y(Jf(b)), 4, css("--muted")));
      dot(ctx, Q.X(t1), Q.Y(Jf(t1)), 9, css("--accent")); ctx.restore();
    });
    function show() {
      const e = X.map((x, i) => t1 * x - Y[i]), s = e.reduce((a, v) => a + v * v, 0), J = s / 6;
      tbl.innerHTML = "<tr><th class='num'>x</th><th class='num'>y (actual)</th><th class='num'>hθ(x) = θ₁·x</th><th class='num'>error hθ − y</th><th class='num'>error²</th></tr>" + X.map((x, i) => `<tr><td class="num">${x}</td><td class="num">${Y[i]}</td><td class="num">${(t1 * x).toFixed(2)}</td><td class="num">${e[i].toFixed(2)}</td><td class="num">${(e[i] ** 2).toFixed(2)}</td></tr>`).join("") + `<tr><th colspan="4">Sum of squared errors</th><th class="num">${s.toFixed(2)}</th></tr>`;
      out.innerHTML = `θ₀ = 0, θ₁ = <b>${t1.toFixed(1)}</b> → J = ${s.toFixed(2)} ÷ (2 × 3) = <b>${J.toFixed(2)}</b> ` + (J < 0.005 ? "→ <b>0: a perfect model</b> (the global minimum)." : J < 0.7 ? "→ a good model, getting close." : "→ still a poor model."); cv.redraw();
    }
    const sl = slider(ctl, { label: "θ₁", min: 0, max: 2, step: 0.1, value: t1, fmt: (v) => v.toFixed(1), onInput: (v) => { t1 = v; show(); } });
    [0, 0.5, 1, 1.5, 2].forEach((v) => btn(ctl, "θ₁ = " + v, () => { t1 = v; sl.set(v); show(); })); show();
  })();

  /* ---------- 1-D gradient descent ---------- */
  (function () {
    const host = $("#demo-gd1"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let th = 0, lr = 0.1, hist = [0], timer = 0, lastP, start = 0;
    const J = (b) => (7 / 3) * (b - 1) ** 2, g = (b) => (14 / 3) * (b - 1);
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [-0.6, 2.6], [0, 6], { l: 44, r: 14, t: 12, b: 34 }); lastP = P;
      axes(ctx, P, { nx: 8, ny: 6, xl: "θ₁", yl: "cost J", fx: (v) => v.toFixed(1), fy: (v) => Math.round(v) });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      ctx.beginPath(); for (let i = 0; i <= 120; i++) { const b = -0.6 + (3.2 * i) / 120; i ? ctx.lineTo(P.X(b), P.Y(J(b))) : ctx.moveTo(P.X(b), P.Y(J(b))); } ctx.strokeStyle = css("--c4"); ctx.lineWidth = 5; ctx.stroke();
      for (let i = 0; i < hist.length - 1; i++) line(ctx, P.X(hist[i]), P.Y(J(hist[i])), P.X(hist[i + 1]), P.Y(J(hist[i + 1])), css("--accent"), 2, [4, 4]);
      hist.forEach((b, i) => dot(ctx, P.X(b), P.Y(J(b)), i === hist.length - 1 ? 0 : 4, css("--accent")));
      const s = g(th), x0 = th - 0.4, x1 = th + 0.4; line(ctx, P.X(x0), P.Y(J(th) - s * 0.4), P.X(x1), P.Y(J(th) + s * 0.4), css("--c5"), 3);
      dot(ctx, P.X(th), P.Y(J(th)), 11, css("--accent")); ctx.restore();
      dot(ctx, P.X(1), P.Y(0), 8, css("--good"));
      ctx.fillStyle = css("--good"); ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("global minimum", P.X(1), P.Y(0) - 14);
    });
    function show(msg) {
      const rho = Math.abs(1 - lr * (14 / 3));
      out.innerHTML = `step <b>${hist.length - 1}</b> · θ₁ = <b>${th.toFixed(4)}</b> · J = <b>${J(th).toFixed(4)}</b> · slope of the curve here = 4.67·(θ₁−1) = <b>${g(th).toFixed(3)}</b> (yellow tangent)` + (msg ? "<br>" + msg : "") + `<br>Each step multiplies the distance to the bottom by |1 − α·4.67| = <b>${rho.toFixed(2)}</b> → ` + (rho < 1 ? "it converges." : "<b style='color:var(--bad)'>≥ 1, so it diverges!</b>"); cv.redraw();
    }
    function step() { const old = th, s = g(th); th = th - lr * s; hist.push(th); show(`θ₁ ← ${old.toFixed(4)} − ${lr} × ${s.toFixed(3)} = <b>${th.toFixed(4)}</b>`); }
    function stop() { clearInterval(timer); timer = 0; rb.textContent = "▶ Run"; }
    btn(ctl, "Step", () => { stop(); step(); }, "primary");
    const rb = btn(ctl, "▶ Run", () => { if (timer) return stop(); rb.textContent = "❚❚ Pause"; timer = setInterval(() => { step(); if (Math.abs(th - 1) < 1e-4 || hist.length > 120 || Math.abs(th) > 1e4) stop(); }, 350); });
    btn(ctl, "Reset", () => { stop(); th = start; hist = [th]; show(); });
    slider(ctl, { label: "Learning rate α", min: 0.01, max: 0.5, step: 0.01, value: lr, fmt: (v) => v.toFixed(2), onInput: (v) => { lr = v; show(); } });
    cv.c.addEventListener("pointerdown", (e) => { stop(); start = clamp(lastP.iX(cv.pos(e).x), -0.5, 2.5); th = start; hist = [th]; show("Start point moved. Press Step or Run."); });
    show("Click on the curve area to choose a different start point.");
  })();

  /* ---------- 2-D contour gradient descent ---------- */
  (function () {
    const host = $("#demo-contour"), out = $("[data-out]", host), ctl = $("[data-controls]", host), X0 = [1, 2, 3], Y = [1, 2, 3], SD = Math.sqrt(2 / 3);
    let scaled = false, lr = 0.1, th = [-1.5, 2.5], hist = [th.slice()], timer = 0, lastP, hm = null;
    const xs = () => (scaled ? X0.map((v) => (v - 2) / SD) : X0), R = () => (scaled ? [[-1, 4], [-1.5, 2.5]] : [[-2, 3.5], [-0.5, 3]]), best = () => (scaled ? [2, SD] : [0, 1]);
    const J = (a, b) => costJ(xs(), Y, a, b), grad = (a, b) => { const x = xs(); let ga = 0, gb = 0; x.forEach((v, i) => { const e = a + b * v - Y[i]; ga += e / 3; gb += (e * v) / 3; }); return [ga, gb]; };
    const lerp = (c1, c2, t) => c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
    function heat(W, H, P) {
      const key = scaled + "|" + W + "|" + H; if (hm && hm.key === key) return hm.c;
      const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"), cs = 4;
      for (let px = P.pad.l; px < W - P.pad.r; px += cs) for (let py = P.pad.t; py < H - P.pad.b; py += cs) {
        const v = Math.log10(J(P.iX(px + cs / 2), P.iY(py + cs / 2)) + 0.002), t = clamp((v + 2.5) / 3.7, 0, 1), band = Math.floor(v * 4) % 2 === 0 ? 0 : 0.10;
        const col = t < 0.5 ? lerp([255, 214, 70], [255, 120, 96], t * 2) : lerp([255, 120, 96], [130, 92, 240], (t - 0.5) * 2);
        g.fillStyle = `rgb(${col.map((v) => Math.round(v * (1 - band))).join(",")})`; g.fillRect(px, py, cs, cs);
      }
      hm = { key, c }; return c;
    }
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const [r0, r1] = R(), P = plane(W, H, r0, r1, { l: 46, r: 14, t: 12, b: 36 }); lastP = P;
      ctx.drawImage(heat(W, H, P), 0, 0, W, H);
      axes(ctx, P, { nx: 5, ny: 4, grid: false, xl: "θ₀ (intercept)", yl: "θ₁ (slope)", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) });
      const b = best(); ctx.font = "700 20px Fredoka, sans-serif"; ctx.fillStyle = "#1d1b1a"; ctx.textAlign = "center"; ctx.fillText("★", P.X(b[0]), P.Y(b[1]) + 7);
      ctx.beginPath(); hist.forEach((p, i) => (i ? ctx.lineTo(P.X(p[0]), P.Y(p[1])) : ctx.moveTo(P.X(p[0]), P.Y(p[1])))); ctx.strokeStyle = "#1d1b1a"; ctx.lineWidth = 3; ctx.stroke();
      hist.forEach((p, i) => { if (i % Math.ceil(hist.length / 40) === 0) dot(ctx, P.X(p[0]), P.Y(p[1]), 3.2, "#fffaf0"); });
      dot(ctx, P.X(hist[0][0]), P.Y(hist[0][1]), 7, "#1d1b1a", "#fffaf0"); dot(ctx, P.X(th[0]), P.Y(th[1]), 8, "#fffaf0", "#1d1b1a");
    });
    function show(extra) {
      const j = J(th[0], th[1]), n = hist.length - 1, b = best(), dist = Math.hypot(th[0] - b[0], th[1] - b[1]);
      out.innerHTML = `step <b>${n}</b> · (θ₀, θ₁) = <b>(${th[0].toFixed(3)}, ${th[1].toFixed(3)})</b> · J = <b>${j < 1e5 ? j.toFixed(5) : "exploding"}</b> · distance to ★ = ${dist.toFixed(3)}` + (extra ? "<br>" + extra : "") + (scaled ? "<br>Standardized x: round bowl → the gradient points straight at ★." : "<br>Raw x: long narrow valley → the path zig-zags and crawls along the valley floor (needs hundreds of steps).");
      cv.redraw();
    }
    function step() { const g = grad(th[0], th[1]); th = [th[0] - lr * g[0], th[1] - lr * g[1]]; hist.push(th.slice()); if (!isFinite(th[0]) || Math.abs(th[0]) > 1e3 || Math.abs(th[1]) > 1e3) { stop(); show("<b style='color:var(--bad)'>Diverged: α is too large for this landscape. Reset and lower α.</b>"); return false; } return true; }
    function stop() { clearInterval(timer); timer = 0; rb.textContent = "▶ Run"; }
    function reset(start) { stop(); th = start || (scaled ? [-0.5, -1] : [-1.5, 2.5]); hist = [th.slice()]; show(); }
    btn(ctl, "Step ×1", () => { stop(); step(); show(); }, "primary");
    const rb = btn(ctl, "▶ Run", () => { if (timer) return stop(); rb.textContent = "❚❚ Pause"; timer = setInterval(() => { for (let i = 0; i < (scaled ? 1 : 4); i++) if (!step()) return; show(); if (hist.length > 4000 || Math.hypot(...grad(th[0], th[1])) < 1e-4) { stop(); show("✅ Converged: the gradient is ≈ 0, so we are at the global minimum."); } }, 40); });
    btn(ctl, "Reset", () => reset());
    const sb = btn(ctl, "Standardize x: off", () => { scaled = !scaled; sb.textContent = "Standardize x: " + (scaled ? "ON" : "off"); sb.classList.toggle("on", scaled); hm = null; reset(); });
    slider(ctl, { label: "Learning rate α", min: 0.01, max: 0.9, step: 0.01, value: lr, fmt: (v) => v.toFixed(2), onInput: (v) => (lr = v) });
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), P = lastP; if (p.x > P.pad.l && p.x < P.w - P.pad.r && p.y > P.pad.t && p.y < P.h - P.pad.b) reset([P.iX(p.x), P.iY(p.y)]); });
    show("Click anywhere on the map to choose the starting point (large ● marks the start).");
  })();

  /* ---------- Multiple regression calculator ---------- */
  (function () {
    const host = $("#demo-multi"), out = $("[data-out]", host), ctl = $("[data-controls]", host), bars = $("#multiBars"), st = { area: 1500, bed: 3, age: 10 };
    function show() {
      const t = [["intercept θ₀", 20, "var(--muted)", "20"], ["area × 0.11", 0.11 * st.area, "var(--c1)", `0.11 × ${st.area}`], ["bedrooms × 6", 6 * st.bed, "var(--c3)", `6 × ${st.bed}`], ["age × (−1.3)", -1.3 * st.age, "var(--bad)", `−1.3 × ${st.age}`]], tot = t.reduce((s, r) => s + r[1], 0), mx = Math.max(...t.map((r) => Math.abs(r[1])), 1);
      bars.innerHTML = t.map(([l, v, c, f]) => `<div style="display:grid;grid-template-columns:150px 1fr 90px;gap:10px;align-items:center;margin:6px 0"><span style="font-weight:600">${l}</span><span style="height:22px;background:var(--surface-2);border:2.5px solid var(--line);border-radius:99px;overflow:hidden;display:block"><i style="display:block;height:100%;width:${(Math.abs(v) / mx) * 100}%;background:${c};border-right:2.5px solid var(--line)"></i></span><span style="font:700 15px var(--font-mono);text-align:right">${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}</span></div>`).join("") + `<div style="text-align:right;font:700 30px var(--font-display);margin-top:8px">predicted price ≈ ₹${tot.toFixed(1)}k</div>`;
      out.innerHTML = `ŷ = 20 + 0.11×${st.area} + 6×${st.bed} − 1.3×${st.age} = 20 + ${(0.11 * st.area).toFixed(1)} + ${6 * st.bed} − ${(1.3 * st.age).toFixed(1)} = <b>${tot.toFixed(1)}</b>. Change <b>one</b> slider at a time: each coefficient is the effect of that feature <i>with the others held fixed</i>, e.g. +1 bedroom adds exactly 6.`;
    }
    slider(ctl, { label: "Area (sq ft)", min: 500, max: 3000, step: 50, value: st.area, onInput: (v) => { st.area = v; show(); } });
    slider(ctl, { label: "Bedrooms", min: 1, max: 6, step: 1, value: st.bed, onInput: (v) => { st.bed = v; show(); } });
    slider(ctl, { label: "Age (yrs)", min: 0, max: 50, step: 1, value: st.age, onInput: (v) => { st.age = v; show(); } }); show();
  })();

  /* ---------- Residual plot ---------- */
  (function () {
    const host = $("#demo-resid"), out = $("[data-out]", host), ctl = $("[data-controls]", host), cols = $("#residCols"), A = h("div"), B = h("div"); cols.append(A, B);
    const legend = (t) => h("div", { class: "legend", style: "padding:0 0 4px" }, t); A.append(legend("Data and fitted model")); B.append(legend("Residuals (actual − predicted) vs x"));
    const r = rng(6), N = 26, xs = Array.from({ length: N }, (_, i) => 0.2 + (i * 5.6) / (N - 1)), noise = xs.map(() => randn(r));
    let curved = false, quad = false;
    const ys = () => xs.map((x, i) => (curved ? 0.35 * x * x + 0.5 : 2 * x + 1) + (curved ? 0.6 : 1.0) * noise[i]);
    const model = () => { const y = ys(), w = ML.polyfit(xs, y, quad ? 2 : 1, 1e-9); return { y, w, pred: xs.map((x) => ML.polyval(w, x)) }; };
    const c1 = ML.canvas(A, 260, (ctx, W, H) => {
      const m = model(), P = plane(W, H, [0, 6], [-1, 15], { l: 36, r: 8, t: 10, b: 30 }); axes(ctx, P, { nx: 6, ny: 4, xl: "x", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      ctx.beginPath(); for (let i = 0; i <= 100; i++) { const x = (6 * i) / 100, y = ML.polyval(m.w, x); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); } ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4.5; ctx.stroke();
      xs.forEach((x, i) => dot(ctx, P.X(x), P.Y(m.y[i]), 5, css("--c1")));
    });
    const c2 = ML.canvas(B, 260, (ctx, W, H) => {
      const m = model(), P = plane(W, H, [0, 6], [-4, 4], { l: 36, r: 8, t: 10, b: 30 }); axes(ctx, P, { nx: 6, ny: 4, xl: "x", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      line(ctx, P.X(0), P.Y(0), P.X(6), P.Y(0), css("--line"), 2.5);
      xs.forEach((x, i) => { const e = m.y[i] - m.pred[i]; line(ctx, P.X(x), P.Y(0), P.X(x), P.Y(e), css("--bad"), 2, [3, 3]); dot(ctx, P.X(x), P.Y(e), 5, css("--c2")); });
    });
    function show() {
      const m = model(), my = mean(m.y), sst = m.y.reduce((s, v) => s + (v - my) ** 2, 0), sse = m.y.reduce((s, v, i) => s + (v - m.pred[i]) ** 2, 0), r2 = 1 - sse / sst;
      out.innerHTML = `${quad ? "Model: ŷ = θ₀ + θ₁x + θ₂x² (still <i>linear regression</i>, just an extra feature)" : "Model: ŷ = θ₀ + θ₁x"} · R² = <b>${r2.toFixed(3)}</b><br>` + (curved && !quad ? "⚠️ The residuals form a clear <b>U-shape</b>: the straight line under-predicts the middle and over-predicts the ends. R² looks decent, but the pattern says the linear assumption is violated. Add x²." : quad && curved ? "✅ Residuals look like random noise around 0: the model now captures the curve." : "✅ Residuals are a shapeless cloud around 0, which is what a good linear fit looks like.");
      c1.redraw(); c2.redraw();
    }
    btn(ctl, "Linear pattern", () => { curved = false; quad = false; show(); }, "primary"); btn(ctl, "Curved pattern", () => { curved = true; quad = false; show(); }, "primary");
    btn(ctl, "+ add x² feature", () => { quad = true; show(); }); show();
  })();
});
