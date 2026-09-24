/* Demos for 01-introduction.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn } = ML;

  /* ---------- 1. Threshold: hand-written rule vs learned rule ---------- */
  (function () {
    const host = $("#demo-threshold");
    const r = rng(7), pts = [];
    for (let i = 0; i < 26; i++) pts.push({ x: clamp(2.6 + 1.4 * randn(r), 0.2, 9.8), spam: 0, j: r() });
    for (let i = 0; i < 26; i++) pts.push({ x: clamp(6.6 + 1.6 * randn(r), 0.2, 9.8), spam: 1, j: r() });
    const acc = (t) => pts.filter((p) => (p.x > t ? 1 : 0) === p.spam).length / pts.length;
    const T = []; for (let t = 0; t <= 10.001; t += 0.1) T.push([t, acc(t)]);
    let thr = 3.0, lastP;
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, w, hh) => {
      const P = plane(w, hh, [0, 10], [0, 1], { l: 46, r: 14, t: 10, b: 30 });
      const split = 150;
      // top: strip of emails
      ctx.fillStyle = css("--c1"); ctx.globalAlpha = 0.07; ctx.fillRect(P.X(0), 10, P.X(thr) - P.X(0), split - 20);
      ctx.fillStyle = css("--c2"); ctx.fillRect(P.X(thr), 10, P.X(10) - P.X(thr), split - 20); ctx.globalAlpha = 1;
      ctx.font = "12px system-ui"; ctx.fillStyle = css("--muted"); ctx.textAlign = "left";
      ctx.fillText("predict: NOT spam", P.X(0) + 6, 24); ctx.textAlign = "right"; ctx.fillText("predict: SPAM", P.X(10) - 6, 24);
      pts.forEach((p) => {
        const x = P.X(p.x), y = 44 + p.j * (split - 74), wrong = (p.x > thr ? 1 : 0) !== p.spam;
        if (wrong) dot(ctx, x, y, 9, null, css("--bad"));
        dot(ctx, x, y, 5, p.spam ? css("--c2") : css("--c1"));
      });
      line(ctx, P.X(thr), 6, P.X(thr), split - 6, css("--text"), 2, [5, 4]);
      // bottom: accuracy curve
      const Q = plane(w, hh, [0, 10], [0.4, 1], { l: 46, r: 14, t: split + 14, b: 30 });
      axes(ctx, Q, { nx: 5, ny: 3, fy: (v) => Math.round(v * 100) + "%", xl: "suspicious words in the email (feature x)" });
      ctx.beginPath(); T.forEach(([t, a], i) => (i ? ctx.lineTo(Q.X(t), Q.Y(a)) : ctx.moveTo(Q.X(t), Q.Y(a))));
      ctx.strokeStyle = css("--accent"); ctx.lineWidth = 2; ctx.stroke();
      dot(ctx, Q.X(thr), Q.Y(acc(thr)), 6, css("--accent"), css("--surface"));
      ctx.fillStyle = css("--muted"); ctx.textAlign = "left"; ctx.font = "12px system-ui"; ctx.fillText("accuracy if the threshold were here", Q.pad.l + 6, Q.pad.t + 12);
      lastP = P;
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const sl = slider(ctl, { label: "Threshold", min: 0, max: 10, step: 0.1, value: thr, fmt: (v) => v.toFixed(1), onInput: (v) => set(v) });
    let anim = 0;
    function set(v) {
      thr = v; cv.redraw();
      const wrong = pts.filter((p) => (p.x > thr ? 1 : 0) !== p.spam).length;
      out.innerHTML = `Rule: <b>"if suspicious words &gt; ${thr.toFixed(1)} → spam"</b> &nbsp;·&nbsp; accuracy <b>${(acc(thr) * 100).toFixed(0)}%</b> &nbsp;·&nbsp; mistakes (red rings): <b>${wrong}</b> of ${pts.length}`;
    }
    btn(ctl, "🤖 Let the machine learn", () => {
      cancelAnimationFrame(anim);
      const best = Math.max(...T.map((t) => t[1])), goods = T.filter((t) => t[1] === best).map((t) => t[0]);
      const target = (goods[0] + goods[goods.length - 1]) / 2, t0 = performance.now();
      (function step(now) {
        const f = Math.min(1, (now - t0) / 2600);
        if (f < 1) { const v = f * 10; sl.set(v.toFixed(1)); set(+v.toFixed(1)); anim = requestAnimationFrame(step); }
        else { sl.set(target.toFixed(1)); set(+target.toFixed(1)); }
      })(t0);
    }, "primary");
    cv.c.addEventListener("pointerdown", (e) => { cancelAnimationFrame(anim); const mv = (ev) => { const v = clamp(lastP.iX(cv.pos(ev).x), 0, 10); sl.set(v.toFixed(1)); set(+v.toFixed(1)); }; mv(e); const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); }; addEventListener("pointermove", mv); addEventListener("pointerup", up); });
    set(thr);
  })();

  /* ---------- 2. Nesting rings ---------- */
  (function () {
    const info = {
      ai: "<b>Artificial Intelligence</b> — the broadest idea. Includes rule-based expert systems, search algorithms (GPS routing), planning, and everything below.",
      ml: "<b>Machine Learning</b> — AI that learns its behaviour from data. Linear regression, KNN, decision trees, SVM, random forests, k-means and PCA are all classical ML.",
      dl: "<b>Deep Learning</b> — ML using neural networks with many layers. Powers image recognition, speech and modern language models.",
    };
    const out = $("#nestOut"); out.innerHTML = "Click any ring above.";
    document.querySelectorAll("#nest .ring").forEach((el) => el.addEventListener("click", (e) => { e.stopPropagation(); out.innerHTML = info[el.dataset.k]; }));
  })();

  /* ---------- 3. Vocabulary table ---------- */
  (function () {
    const cols = ["Area (sq ft)", "Bedrooms", "Age (yrs)", "Price ($k)"];
    const rows = [[1200, 2, 10, 210], [1500, 3, 5, 285], [900, 2, 30, 140], [2000, 4, 2, 410], [1700, 3, 15, 295]];
    const t = $("#vocabTbl");
    const draw = (mode) => {
      t.innerHTML = "<tr>" + cols.map((c, i) => `<th class="num ${i < 3 ? "f" : "l"}">${c}</th>`).join("") + "</tr>" +
        rows.map((r, ri) => `<tr class="${mode === "sample" && ri === 1 ? "s" : ""}">` + r.map((v, i) => `<td class="num ${mode === "features" && i < 3 ? "f" : ""} ${mode === "label" && i === 3 ? "l" : ""} ${mode === "dataset" ? "f l" : ""}">${v}</td>`).join("") + "</tr>").join("");
      if (mode === "features" || mode === "dataset") t.querySelectorAll("th.f").forEach((e) => e.classList.add("f")); else t.querySelectorAll("th").forEach((e) => (e.className = "num"));
      if (mode === "label") t.querySelector("th.l").classList.add("l");
    };
    const text = {
      none: "Click a term.",
      features: "<b>Features (X)</b>: the first three columns. The model looks at these to make a prediction.",
      label: "<b>Label / target (y)</b>: the Price column, the answer we want to predict. In supervised learning every training row has one.",
      sample: "<b>Sample</b>: one row = one house (here the highlighted 1500 sq ft house). 5 rows → 5 samples.",
      dataset: "<b>Dataset</b>: the whole table: 5 samples × 4 columns (3 features + 1 label).",
      model: "<b>Model</b>: a function learned from this table, e.g. <code>price ≈ θ₀ + θ₁·area + θ₂·bedrooms + θ₃·age</code>. The θ values are the <b>parameters</b>, found during <b>training</b>.",
      infer: "<b>Inference</b>: a new house arrives (1400 sq ft, 3 bed, 8 yrs) with <i>no price</i>. The trained model computes the predicted price from the features alone.",
    };
    const bx = $("#vocabBtns"), out = $("#vocabOut"); const bs = {};
    [["features", "Features (X)"], ["label", "Label (y)"], ["sample", "Sample"], ["dataset", "Dataset"], ["model", "Model & parameters"], ["infer", "Inference"]].forEach(([k, l]) => {
      bs[k] = btn(bx, l, () => { Object.values(bs).forEach((b) => b.classList.remove("on")); bs[k].classList.add("on"); draw(k); out.innerHTML = text[k]; });
    });
    draw("none"); out.innerHTML = text.none;
  })();

  /* ---------- 4. Gradient descent line ---------- */
  (function () {
    const host = $("#demo-gd"), r = rng(11), X = [], Y = [];
    for (let i = 0; i < 14; i++) { const x = 0.2 + (i / 13) * 4.6; X.push(x); Y.push(2 * x + 1 + 0.7 * randn(r)); }
    const n = X.length; let w = 0, b = 0, step = 0, lr = 0.03, run = 0; const hist = [];
    const loss = () => X.reduce((s, x, i) => s + (w * x + b - Y[i]) ** 2, 0) / n;
    hist.push(loss());
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const lw = Math.round(W * 0.6), P = plane(lw, H, [0, 5], [0, 12], { l: 38, r: 8, t: 12, b: 30 });
      axes(ctx, P, { nx: 5, ny: 4, xl: "x" });
      X.forEach((x, i) => line(ctx, P.X(x), P.Y(Y[i]), P.X(x), P.Y(w * x + b), css("--bad"), 1, [3, 3]));
      line(ctx, P.X(0), P.Y(b), P.X(5), P.Y(w * 5 + b), css("--accent"), 3);
      X.forEach((x, i) => dot(ctx, P.X(x), P.Y(Y[i]), 5, css("--c1")));
      // loss curve
      const ox = lw + 20, Q = plane(W, H, [0, Math.max(30, step)], [0, Math.max(hist[0], 1)], { l: ox + 30, r: 8, t: 12, b: 30 });
      ctx.save(); ctx.font = "12px system-ui"; ctx.fillStyle = css("--muted"); ctx.textAlign = "center"; ctx.fillText("loss J over steps", (Q.pad.l + W) / 2, 12); ctx.restore();
      Q.pad.t = 22; const Q2 = plane(W, H, Q.xr, Q.yr, Q.pad);
      axes(ctx, Q2, { nx: 3, ny: 3, fx: (v) => Math.round(v), fy: (v) => v.toFixed(1), xl: "step" });
      ctx.beginPath(); hist.forEach((v, i) => (i ? ctx.lineTo(Q2.X(i), Q2.Y(v)) : ctx.moveTo(Q2.X(i), Q2.Y(v)))); ctx.strokeStyle = css("--c2"); ctx.lineWidth = 2; ctx.stroke();
      dot(ctx, Q2.X(step), Q2.Y(hist[step]), 5, css("--c2"));
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    function show(extra) {
      out.innerHTML = `step <b>${step}</b> · line: <b>ŷ = ${w.toFixed(2)}·x + ${b.toFixed(2)}</b> · loss (MSE) <b>${hist[step].toFixed(3)}</b>` + (extra ? "<br>" + extra : "");
      cv.redraw();
    }
    function once() {
      let gw = 0, gb = 0; X.forEach((x, i) => { const e = w * x + b - Y[i]; gw += (2 / n) * e * x; gb += (2 / n) * e; });
      const ow = w, ob = b; w -= lr * gw; b -= lr * gb; step++; hist.push(loss());
      show(`slopes of the loss: for w = ${gw.toFixed(2)}, for b = ${gb.toFixed(2)} → w: ${ow.toFixed(2)} − ${lr}×${gw.toFixed(2)} = ${w.toFixed(2)}; b: ${ob.toFixed(2)} − ${lr}×${gb.toFixed(2)} = ${b.toFixed(2)}`);
    }
    btn(ctl, "Step", () => { pause(); once(); }, "primary");
    const runB = btn(ctl, "▶ Run", () => { if (run) return pause(); runB.textContent = "❚❚ Pause"; run = setInterval(() => { once(); if (step > 400 || !isFinite(w)) pause(); }, 60); });
    function pause() { clearInterval(run); run = 0; runB.textContent = "▶ Run"; }
    btn(ctl, "Reset", () => { pause(); w = 0; b = 0; step = 0; hist.length = 0; hist.push(loss()); show(); });
    slider(ctl, { label: "Learning rate α", min: 0.005, max: 0.14, step: 0.005, value: lr, fmt: (v) => v.toFixed(3), onInput: (v) => (lr = v) });
    show("Press <b>Step</b> a few times, then <b>Run</b>. Try α = 0.14: the steps overshoot, so the loss bounces or explodes.");
  })();

  /* ---------- 5. Under/overfitting ---------- */
  (function () {
    const host = $("#demo-fit"), f = (x) => Math.sin(2 * Math.PI * x) * 0.85;
    const r = rng(5), tr = [], te = [];
    for (let i = 0; i < 10; i++) { const x = (i + 0.5) / 10 + (r() - 0.5) * 0.06; tr.push([x, f(x) + 0.2 * randn(r)]); }
    for (let i = 0; i < 40; i++) { const x = r(); te.push([x, f(x) + 0.2 * randn(r)]); }
    const sx = (x) => 2 * x - 1;
    const fit = (d) => ML.polyfit(tr.map((p) => sx(p[0])), tr.map((p) => p[1]), d, 1e-9);
    const mse = (w, D) => ML.mean(D.map((p) => (ML.polyval(w, sx(p[0])) - p[1]) ** 2));
    const errs = []; for (let d = 1; d <= 9; d++) { const w = fit(d); errs.push([mse(w, tr), mse(w, te)]); }
    let deg = 1, showTest = true;
    const cv = ML.canvas($("[data-canvas]", host), 310, (ctx, W, H) => {
      const lw = Math.round(W * 0.58), P = plane(lw, H, [0, 1], [-1.6, 1.6], { l: 36, r: 6, t: 10, b: 28 });
      axes(ctx, P, { nx: 4, ny: 4, xl: "x" });
      ctx.save(); ctx.beginPath(); ctx.rect(P.pad.l, P.pad.t, lw - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b); ctx.clip();
      ctx.beginPath(); for (let i = 0; i <= 100; i++) { const x = i / 100; i ? ctx.lineTo(P.X(x), P.Y(f(x))) : ctx.moveTo(P.X(x), P.Y(f(x))); }
      ctx.setLineDash([5, 4]); ctx.strokeStyle = css("--muted"); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      const w = fit(deg);
      ctx.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200, y = ML.polyval(w, sx(x)); i ? ctx.lineTo(P.X(x), P.Y(y)) : ctx.moveTo(P.X(x), P.Y(y)); }
      ctx.strokeStyle = css("--accent"); ctx.lineWidth = 3; ctx.stroke();
      if (showTest) te.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4, null, css("--c2")));
      tr.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 5.5, css("--c1")));
      ctx.restore();
      // U-curve, log scale
      const lg = (v) => Math.log10(Math.max(v, 1e-4)), Q = plane(W, H, [1, 9], [-3, 1.5], { l: lw + 44, r: 8, t: 26, b: 28 });
      ctx.save(); ctx.font = "12px system-ui"; ctx.fillStyle = css("--muted"); ctx.textAlign = "center"; ctx.fillText("error vs. flexibility (log scale)", (Q.pad.l + W) / 2, 14); ctx.restore();
      axes(ctx, Q, { nx: 8, ny: 3, fx: (v) => Math.round(v), fy: (v) => (v > 0 ? "10^" + Math.round(v) : "10^" + Math.round(v)), xl: "polynomial degree" });
      [[0, css("--c1")], [1, css("--c2")]].forEach(([k, col]) => {
        ctx.beginPath(); errs.forEach((e, i) => (i ? ctx.lineTo(Q.X(i + 1), Q.Y(lg(e[k]))) : ctx.moveTo(Q.X(1), Q.Y(lg(e[k]))))); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        dot(ctx, Q.X(deg), Q.Y(lg(errs[deg - 1][k])), 5, col);
      });
      ctx.fillStyle = css("--c1"); ctx.textAlign = "left"; ctx.fillText("train", Q.X(6.4), Q.Y(-2.4)); ctx.fillStyle = css("--c2"); ctx.fillText("test", Q.X(7.6), Q.Y(1.1));
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    function show() {
      const [a, b] = errs[deg - 1];
      let v = a > 0.05 ? "🟦 <b>Underfitting</b>: too simple; even the training points are missed." : b > 3 * a && b > 0.08 ? "🟥 <b>Overfitting</b>: hugs the training points (tiny training error) but the test error is much larger." : "🟩 <b>Good fit</b>: follows the real pattern and test error ≈ training error.";
      out.innerHTML = `degree <b>${deg}</b> · train MSE <b>${a.toFixed(4)}</b> · test MSE <b>${b.toFixed(4)}</b><br>${v}`; cv.redraw();
    }
    slider(ctl, { label: "Polynomial degree", min: 1, max: 9, step: 1, value: 1, onInput: (v) => { deg = v; show(); } });
    const tb = btn(ctl, "Hide test points", () => { showTest = !showTest; tb.textContent = showTest ? "Hide test points" : "Show test points"; cv.redraw(); });
    show();
  })();
});
