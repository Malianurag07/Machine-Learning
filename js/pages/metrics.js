/* Demos for 03c-evaluation-metrics.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const f3 = (v) => (Number.isFinite(v) ? v.toFixed(3) : "—");

  /* ---------- the threshold, the confusion matrix, ROC and PR ---------- */
  (function () {
    const host = $("#demo-threshold"), out = $("[data-out]", host), ctl = $("[data-controls]", host), N = 400;
    let prev = 0.25, sep = 1.6, thr = 0.8, seed = 2, S, curves;
    function gen() {
      const r = rng(seed * 61), nP = Math.max(4, Math.round(N * prev)); S = []; for (let i = 0; i < N; i++) { const pos = i < nP; S.push({ s: (pos ? sep : 0) + randn(r), y: pos ? 1 : 0 }); }
      const A = S.slice().sort((a, b) => b.s - a.s), P = nP, Ng = N - nP; let tp = 0, fp = 0; const roc = [[0, 0]], pr = [], auc = { v: 0 }; let ap = 0, lastR = 0;
      A.forEach((e) => { if (e.y) { tp++; const rec = tp / P; pr.push([rec, tp / (tp + fp)]); ap += (rec - lastR) * (tp / (tp + fp)); lastR = rec; } else { fp++; auc.v += tp / P / Ng; } roc.push([fp / Ng, tp / P]); });
      curves = { roc, pr, auc: auc.v, ap, P, Ng };
    }
    gen();
    const counts = (t) => { let tp = 0, fp = 0, fn = 0, tn = 0; S.forEach((e) => { const p = e.s >= t; if (e.y && p) tp++; else if (e.y) fn++; else if (p) fp++; else tn++; }); return { tp, fp, fn, tn }; };
    const cv = ML.canvas($("[data-canvas]", host), 370, (ctx, W, H) => {
      const lo = -3.5, hi = sep + 4, B = 34, cn = new Array(B).fill(0), cp = new Array(B).fill(0); S.forEach((e) => { const b = clamp(Math.floor(((e.s - lo) / (hi - lo)) * B), 0, B - 1); (e.y ? cp : cn)[b]++; });
      const mx = Math.max(...cn, ...cp, 1), Hp = plane(W, H, [lo, hi], [0, mx], { l: 44, r: 14, t: 24, b: H - 150 });
      ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("model scores of the " + curves.Ng + " negatives (blue) and " + curves.P + " positives (orange)", W / 2, 14);
      [[cn, css("--c1")], [cp, css("--c2")]].forEach(([cnt, col]) => cnt.forEach((c, b) => { if (!c) return; const x0 = Hp.X(lo + ((hi - lo) * b) / B), x1 = Hp.X(lo + ((hi - lo) * (b + 1)) / B); ctx.globalAlpha = 0.65; ctx.fillStyle = col; ctx.fillRect(x0, Hp.Y(c), x1 - x0, Hp.Y(0) - Hp.Y(c)); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1; ctx.strokeRect(x0, Hp.Y(c), x1 - x0, Hp.Y(0) - Hp.Y(c)); }));
      line(ctx, Hp.pad.l, Hp.Y(0), W - Hp.pad.r, Hp.Y(0), css("--text"), 2); line(ctx, Hp.X(thr), Hp.Y(mx), Hp.X(thr), Hp.Y(0), css("--accent"), 4, [7, 5]); ctx.fillStyle = css("--accent"); ctx.textAlign = "left"; ctx.fillText("threshold: everything to the right is called positive", Hp.X(thr) + 6, Hp.Y(mx) + 12);
      const c = counts(thr), tpr = c.tp / curves.P, fpr = c.fp / curves.Ng, prec = c.tp + c.fp ? c.tp / (c.tp + c.fp) : NaN, hw = Math.round(W / 2);
      const Q = plane(hw, H, [0, 1], [0, 1], { l: 44, r: 12, t: 196, b: 34 }); ctx.save(); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("ROC curve (AUC " + curves.auc.toFixed(3) + ")", hw / 2, 190); axes(ctx, Q, { nx: 4, ny: 4, xl: "false positive rate", yl: "recall (TPR)", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) }); line(ctx, Q.X(0), Q.Y(0), Q.X(1), Q.Y(1), css("--muted"), 2, [5, 5]);
      ctx.beginPath(); curves.roc.forEach(([x, y], i) => (i ? ctx.lineTo(Q.X(x), Q.Y(y)) : ctx.moveTo(Q.X(x), Q.Y(y)))); ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(fpr), Q.Y(tpr), 7, css("--accent")); ctx.restore();
      ctx.save(); ctx.translate(hw, 0); const R = plane(W - hw, H, [0, 1], [0, 1], { l: 44, r: 12, t: 196, b: 34 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("precision–recall curve (AP " + curves.ap.toFixed(3) + ")", (W - hw) / 2, 190); axes(ctx, R, { nx: 4, ny: 4, xl: "recall", yl: "precision", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) }); const base = curves.P / N; line(ctx, R.X(0), R.Y(base), R.X(1), R.Y(base), css("--muted"), 2, [5, 5]);
      ctx.beginPath(); curves.pr.forEach(([x, y], i) => (i ? ctx.lineTo(R.X(x), R.Y(y)) : ctx.moveTo(R.X(x), R.Y(y)))); ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke(); if (Number.isFinite(prec)) dot(ctx, R.X(tpr), R.Y(prec), 7, css("--accent")); ctx.restore();
    });
    function show() {
      const c = counts(thr), n = N, acc = (c.tp + c.tn) / n, prec = c.tp + c.fp ? c.tp / (c.tp + c.fp) : NaN, rec = c.tp / curves.P, spec = c.tn / curves.Ng, f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : NaN;
      out.innerHTML = `Positives are <b>${(prev * 100).toFixed(0)}%</b> of the ${n} cases. At this threshold: <b>TP ${c.tp}</b> (caught) · <b>FP ${c.fp}</b> (false alarms) · <b>FN ${c.fn}</b> (missed) · <b>TN ${c.tn}</b><br>accuracy <b>${f3(acc)}</b> · precision <b>${f3(prec)}</b> · recall (= TPR) <b>${f3(rec)}</b> · specificity <b>${f3(spec)}</b> · false-positive rate <b>${f3(1 - spec)}</b> · F1 <b>${f3(f1)}</b><br>The orange dots on the two curves show where this threshold sits. The dashed grey diagonal (ROC) and horizontal line (PR, at the share of positives) are what a useless model would score.` + (prev <= 0.06 && acc > 0.9 && rec < 0.5 ? "<br>🟥 High accuracy but poor recall: with so few positives, a model that misses most of them can still be 'accurate'. Look at precision, recall and the PR curve." : rec > 0.95 && prec < 0.5 ? "<br>🟨 Almost every positive is caught, but most alarms are false: a low threshold buys recall with precision." : c.tp + c.fp === 0 ? "<br>The threshold is so high that nothing is called positive: no false alarms, no catches." : ""); cv.redraw();
    }
    slider(ctl, { label: "Threshold", min: -3, max: 6, step: 0.05, value: thr, fmt: (v) => v.toFixed(2), onInput: (v) => { thr = v; show(); } });
    slider(ctl, { label: "Model quality (class separation)", min: 0, max: 3.5, step: 0.1, value: sep, fmt: (v) => v.toFixed(1), onInput: (v) => { sep = v; gen(); show(); } });
    slider(ctl, { label: "Share of positive cases", min: 0.02, max: 0.5, step: 0.01, value: prev, fmt: (v) => (v * 100).toFixed(0) + "%", onInput: (v) => { prev = v; gen(); show(); } });
    btn(ctl, "New random cases", () => { seed++; gen(); show(); }, "primary"); show();
  })();

  /* ---------- building the ROC curve by hand ---------- */
  (function () {
    const host = $("#demo-roc"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const D = [[0.95, 1], [0.9, 1], [0.8, 0], [0.7, 1], [0.65, 1], [0.55, 0], [0.45, 1], [0.4, 0], [0.3, 0], [0.1, 0]]; let k = 0;
    const pt = (m) => { let tp = 0, fp = 0; D.slice(0, m).forEach(([, y]) => (y ? tp++ : fp++)); return [fp / 5, tp / 5, tp, fp]; };
    const cv = ML.canvas($("[data-canvas]", host), 310, (ctx, W, H) => {
      const lw = Math.round(W * 0.48); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("cases ranked by model score (highest first)", lw / 2, 16);
      D.forEach(([s, y], i) => { const yy = 28 + i * 27, on = i < k; ctx.beginPath(); ctx.rect(10, yy, lw - 20, 23); ctx.fillStyle = on ? (y ? css("--c2") : css("--c1")) : css("--surface"); ctx.globalAlpha = on ? 0.8 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillText("score " + s.toFixed(2), 18, yy + 16); ctx.textAlign = "right"; ctx.fillText(y ? "really positive" : "really negative", lw - 18, yy + 16); });
      const cutY = 28 + k * 27 - 2; line(ctx, 4, cutY, lw - 4, cutY, css("--accent"), 4, [7, 5]);
      const Q = plane(W - lw, H, [0, 1], [0, 1], { l: 44, r: 14, t: 26, b: 38 }); ctx.save(); ctx.translate(lw, 0); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("the ROC curve so far", (W - lw) / 2, 16); axes(ctx, Q, { nx: 5, ny: 5, xl: "false positive rate", yl: "recall", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) }); line(ctx, Q.X(0), Q.Y(0), Q.X(1), Q.Y(1), css("--muted"), 2, [5, 5]);
      ctx.beginPath(); for (let m = 0; m <= k; m++) { const [x, y] = pt(m); m ? ctx.lineTo(Q.X(x), Q.Y(y)) : ctx.moveTo(Q.X(x), Q.Y(y)); } ctx.strokeStyle = css("--c4"); ctx.lineWidth = 4; ctx.stroke(); for (let m = 0; m <= k; m++) { const [x, y] = pt(m); dot(ctx, Q.X(x), Q.Y(y), m === k ? 7 : 4, m === k ? css("--accent") : css("--c4")); } ctx.restore();
    });
    function show() {
      const [fpr, tpr, tp, fp] = pt(k); let pairs = 0; D.forEach(([s, y]) => { if (y) D.forEach(([s2, y2]) => { if (!y2 && s > s2) pairs++; }); });
      out.innerHTML = `Call the top <b>${k}</b> of the 10 cases positive (threshold just below score ${k ? D[k - 1][0].toFixed(2) : "1.00"}): <b>TP = ${tp}</b>, <b>FP = ${fp}</b>, so recall (TPR) = ${tp} ÷ 5 = <b>${tpr.toFixed(1)}</b> and false-positive rate = ${fp} ÷ 5 = <b>${fpr.toFixed(1)}</b>.<br>` + (k === 0 ? "Start at the bottom-left corner (nothing is called positive)." : D[k - 1][1] ? "The newest case is a real positive: the curve moves <b>up</b> by 1/5." : "The newest case is a real negative: the curve moves <b>right</b> by 1/5.") + (k === 10 ? `<br>Finished at the top-right corner. Area under the curve (AUC) = <b>0.84</b>. Equivalent meaning: of the 5 × 5 = 25 pairs (one positive, one negative), the model scores the positive higher in <b>${pairs}</b> of them: ${pairs} ÷ 25 = ${(pairs / 25).toFixed(2)}.` : "<br>Press the button to lower the threshold by one case at a time."); cv.redraw();
    }
    btn(ctl, "Lower the threshold ▶", () => { k = Math.min(10, k + 1); show(); }, "primary"); btn(ctl, "Run to the end", () => { k = 10; show(); }); btn(ctl, "Reset", () => { k = 0; show(); }); show();
  })();

  /* ---------- regression metrics and outliers ---------- */
  (function () {
    const host = $("#demo-reg"), out = $("[data-out]", host), ctl = $("[data-controls]", host), N = 20;
    let noise = 6, outl = 0, seed = 3, Y, E;
    function gen() { const r = rng(seed * 43); Y = Array.from({ length: N }, () => 20 + 80 * r()); E = Array.from({ length: N }, () => randn(r)); }
    gen();
    const preds = () => Y.map((y, i) => y + noise * E[i] - (i === N - 1 ? outl : 0));
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [0, 130], [-40, 130], { l: 46, r: 14, t: 14, b: 38 }); axes(ctx, P, { nx: 5, ny: 5, xl: "actual value", yl: "predicted value", fx: (v) => Math.round(v), fy: (v) => Math.round(v) }); line(ctx, P.X(0), P.Y(0), P.X(130), P.Y(130), css("--muted"), 2.5, [7, 6]);
      const pr = preds(); Y.forEach((y, i) => { line(ctx, P.X(y), P.Y(y), P.X(y), P.Y(pr[i]), css("--bad"), 1.6); dot(ctx, P.X(y), P.Y(pr[i]), i === N - 1 && outl ? 8 : 5, i === N - 1 && outl ? css("--accent") : css("--c1")); });
    });
    function show() {
      const p = preds(), e = Y.map((y, i) => y - p[i]), mae = mean(e.map(Math.abs)), mse = mean(e.map((v) => v * v)), my = mean(Y), r2 = 1 - e.reduce((s, v) => s + v * v, 0) / Y.reduce((s, y) => s + (y - my) ** 2, 0), mape = mean(e.map((v, i) => Math.abs(v) / Math.abs(Y[i]))), med = [...e.map(Math.abs)].sort((a, b) => a - b)[Math.floor(N / 2) - 0] ;
      const sorted = e.map(Math.abs).sort((a, b) => a - b), medae = (sorted[N / 2 - 1] + sorted[N / 2]) / 2;
      out.innerHTML = `20 predictions. Dashed line = perfect predictions; red segments = the errors.<br>MAE <b>${mae.toFixed(2)}</b> · median absolute error <b>${medae.toFixed(2)}</b> · RMSE <b>${Math.sqrt(mse).toFixed(2)}</b> · MSE <b>${mse.toFixed(1)}</b> · MAPE <b>${(mape * 100).toFixed(1)}%</b> · R² <b>${r2.toFixed(3)}</b><br>` + (outl >= 30 ? "The one big miss (orange dot) drags RMSE and R² much more than MAE, and barely moves the median error: squaring makes large errors count extra." : noise >= 25 ? "With big errors everywhere, R² drops towards 0: the model is barely better than always guessing the average." : "Drag 'outlier size' up and compare how each number reacts. RMSE ≥ MAE always, and the gap between them signals big, uneven errors."); cv.redraw();
    }
    slider(ctl, { label: "Typical error size", min: 1, max: 40, step: 1, value: noise, onInput: (v) => { noise = v; show(); } });
    slider(ctl, { label: "One extra big miss", min: 0, max: 100, step: 5, value: outl, onInput: (v) => { outl = v; show(); } });
    btn(ctl, "New random data", () => { seed++; gen(); show(); }, "primary"); show();
  })();

  /* ---------- how uncertain is a test score? ---------- */
  (function () {
    const host = $("#demo-ci", document), out = $("[data-out]", host), ctl = $("[data-controls]", host), SIM = 500;
    let n = 100, p = 0.9, seed = 1, vals;
    function sim() { const r = rng(seed * 7 + n); vals = Array.from({ length: SIM }, () => { let c = 0; for (let i = 0; i < n; i++) if (r() < p) c++; return c / n; }); }
    sim();
    const cv = ML.canvas($("[data-canvas]", host), 250, (ctx, W, H) => {
      const lo = Math.max(0, p - 0.3), hi = Math.min(1, p + 0.12), B = 30, cnt = new Array(B).fill(0); vals.forEach((v) => { const b = Math.floor(((v - lo) / (hi - lo)) * B); if (b >= 0 && b < B) cnt[b]++; });
      const mx = Math.max(...cnt, 1), P = plane(W, H, [lo, hi], [0, mx], { l: 46, r: 14, t: 24, b: 38 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("accuracy measured on " + SIM + " different test sets of " + n + " cases (true accuracy " + (p * 100).toFixed(0) + "%)", W / 2, 14); axes(ctx, P, { nx: 5, ny: 3, xl: "measured accuracy", fx: (v) => Math.round(v * 100) + "%", fy: (v) => Math.round(v) });
      cnt.forEach((c, b) => { if (!c) return; const x0 = P.X(lo + ((hi - lo) * b) / B), x1 = P.X(lo + ((hi - lo) * (b + 1)) / B); ctx.fillStyle = css("--c1"); ctx.globalAlpha = 0.75; ctx.fillRect(x0, P.Y(c), x1 - x0, P.Y(0) - P.Y(c)); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1.2; ctx.strokeRect(x0, P.Y(c), x1 - x0, P.Y(0) - P.Y(c)); });
      const se = Math.sqrt((p * (1 - p)) / n); [p - 1.96 * se, p + 1.96 * se].forEach((v) => line(ctx, P.X(clamp(v, lo, hi)), P.Y(mx), P.X(clamp(v, lo, hi)), P.Y(0), css("--accent"), 3.5, [7, 5])); line(ctx, P.X(p), P.Y(mx), P.X(p), P.Y(0), css("--text"), 2.5);
    });
    function show() {
      const se = Math.sqrt((p * (1 - p)) / n), lo = p - 1.96 * se, hi = p + 1.96 * se, inside = vals.filter((v) => v >= lo && v <= hi).length / SIM, s = [...vals].sort((a, b) => a - b);
      out.innerHTML = `Test set of <b>${n}</b> cases, true accuracy <b>${(p * 100).toFixed(0)}%</b>. Standard error = √(p × (1 − p) ÷ n) = √(${p.toFixed(2)} × ${(1 - p).toFixed(2)} ÷ ${n}) = <b>${(se * 100).toFixed(1)}%</b>, so the usual 95% range is about <b>±${(1.96 * se * 100).toFixed(1)} points</b> (dashed lines: ${(Math.max(lo, 0) * 100).toFixed(1)}% to ${(Math.min(hi, 1) * 100).toFixed(1)}%).<br>In the simulation, the middle 95% of the ${SIM} measured scores ran from <b>${(s[Math.floor(SIM * 0.025)] * 100).toFixed(1)}%</b> to <b>${(s[Math.floor(SIM * 0.975)] * 100).toFixed(1)}%</b> (${(inside * 100).toFixed(0)}% fell inside the dashed lines).<br>` + (n <= 50 ? "🟥 With so few test cases, two models scoring 90% and 93% cannot be told apart: the luck of the split is bigger than the difference." : n >= 1000 ? "A large test set gives a steady number: differences of a couple of points start to mean something." : "Quadrupling the test set halves the uncertainty."); cv.redraw();
    }
    slider(ctl, { label: "Test-set size", min: 10, max: 2000, step: 10, value: n, onInput: (v) => { n = v; sim(); show(); } });
    slider(ctl, { label: "True accuracy", min: 0.5, max: 0.99, step: 0.01, value: p, fmt: (v) => (v * 100).toFixed(0) + "%", onInput: (v) => { p = v; sim(); show(); } });
    btn(ctl, "Draw new test sets", () => { seed++; sim(); show(); }, "primary"); show();
  })();
});
