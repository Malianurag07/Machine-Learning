/* Demos for deployment.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;

  /* ---------- the life of one prediction request ---------- */
  (function () {
    const host = $("#demo-request"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const FEAT = ["sepal_length", "sepal_width", "petal_length", "petal_width"], MU = [5.877679, 3.066071, 3.764286, 1.19375], SD = [0.849444, 0.4417, 1.775772, 0.766868], COEF = [[-1.049416, 1.15349, -1.628645, -1.567816], [0.495376, -0.53076, -0.263881, -0.808387], [0.55404, -0.62273, 1.892526, 2.376203]], B = [-0.148957, 1.770554, -1.621597], NAMES = ["setosa", "versicolor", "virginica"];
    const PRESETS = [["Valid: a setosa", { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 }], ["Valid: a virginica", { sepal_length: 6.7, sepal_width: 3.0, petal_length: 5.2, petal_width: 2.3 }], ["Valid: hard to tell", { sepal_length: 5.9, sepal_width: 3.0, petal_length: 4.2, petal_width: 1.5 }], ["Missing a field", { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4 }], ["Text instead of a number", { sepal_length: "abc", sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 }], ["Impossible value (−5)", { sepal_length: -5, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 }], ["Valid but absurd (19 cm)", { sepal_length: 5.1, sepal_width: 3.5, petal_length: 19, petal_width: 0.2 }]];
    const STAGES = ["Client sends JSON", "1 · Validate", "2 · Pre-process", "3 · Model", "4 · Post-process", "5 · Respond + log"];
    let pi = 1, step = 0, result;
    function run(inp) {
      const trace = { input: JSON.stringify(inp) }, errs = [];
      FEAT.forEach((f) => { if (!(f in inp)) errs.push({ type: "missing", loc: ["body", f], msg: "Field required" }); else if (typeof inp[f] !== "number") errs.push({ type: "float_parsing", loc: ["body", f], msg: "Input should be a valid number, unable to parse string as a number" }); else if (!(inp[f] > 0)) errs.push({ type: "greater_than", loc: ["body", f], msg: "Input should be greater than 0" }); else if (!(inp[f] < 20)) errs.push({ type: "less_than", loc: ["body", f], msg: "Input should be less than 20" }); });
      if (errs.length) { trace.fail = 1; trace.status = 422; trace.error = errs; return trace; }
      trace.x = FEAT.map((f) => inp[f]); trace.z = trace.x.map((v, i) => (v - MU[i]) / SD[i]); const lg = COEF.map((c, k) => c.reduce((s, w, i) => s + w * trace.z[i], 0) + B[k]), mx = Math.max(...lg), ex = lg.map((v) => Math.exp(v - mx)), sm = ex.reduce((a, b) => a + b, 0); trace.p = ex.map((v) => v / sm); const k = trace.p.indexOf(Math.max(...trace.p)); trace.answer = { species: NAMES[k], probability: +trace.p[k].toFixed(4) }; trace.status = 200; trace.warn = Math.max(...trace.z.map(Math.abs)); return trace;
    }
    result = run(PRESETS[pi][1]);
    const cv = ML.canvas($("[data-canvas]", host), 130, (ctx, W, H) => {
      const n = STAGES.length, bw = (W - 20) / n;
      STAGES.forEach((s, i) => { const x = 10 + i * bw, done = i <= step, failedHere = result.fail === i && step >= i, beyond = result.fail && i > result.fail; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x + 3, 30, bw - 14, 56, 12) : ctx.rect(x + 3, 30, bw - 14, 56); ctx.fillStyle = failedHere ? css("--bad") : done && !beyond ? css("--c3") : css("--surface"); ctx.globalAlpha = failedHere || (done && !beyond) ? 0.85 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = i === step ? 4 : 2; ctx.stroke(); ctx.fillStyle = css("--text"); ctx.font = "700 " + (W < 560 ? 10 : 12) + "px Fredoka, sans-serif"; ctx.textAlign = "center"; const words = s.split(" "); const mid = Math.ceil(words.length / 2); ctx.fillText(words.slice(0, mid).join(" "), x + bw / 2 - 4, 55); ctx.fillText(words.slice(mid).join(" "), x + bw / 2 - 4, 71); if (i < n - 1) { ctx.fillStyle = css("--muted"); ctx.fillText("→", x + bw - 5, 62); } });
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("what happens inside a prediction service, for the request you choose below", W / 2, 20); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillStyle = css("--muted"); ctx.fillText(result.fail ? "the request is stopped at the validation step: the model never sees it" : "every stage of the pipeline runs", W / 2, 112);
    });
    const explain = [
      () => `The client sends: <code>${result.input}</code>`,
      () => result.fail ? `❌ Validation fails → HTTP <b>${result.status}</b>. The service replies <code>${JSON.stringify({ detail: result.error }).slice(0, 260)}</code> The bad request is rejected <em>politely and safely</em>, and the model is never run on garbage.` : `✅ Validation passes: all four fields are present, numeric and inside 0 to 20 (a range chosen from what is physically plausible).`,
      () => `The <b>same</b> preprocessing as in training is applied (the saved scaler): z = (x − mean) ÷ std → <b>${result.z.map((v) => v.toFixed(2)).join(", ")}</b>.` + (result.warn > 4 ? ` ⚠️ One value is <b>${result.warn.toFixed(1)}</b> standard deviations from the training average: this request is far outside anything the model has seen.` : ""),
      () => `The model turns the scaled numbers into probabilities: <b>${NAMES.map((n, i) => n + " " + (result.p[i] * 100).toFixed(1) + "%").join(" · ")}</b>.` + (result.warn > 4 ? " The model is extrapolating wildly, yet it is still 'confident': a range check or out-of-distribution alert would catch this." : ""),
      () => `Post-processing turns the numbers into what the caller needs: the most likely class and its probability.`,
      () => `Response: <b>HTTP 200</b> <code>${JSON.stringify(result.answer)}</code>. The service also <b>logs</b> the input, the output, the model version and the time: this log is the raw material for monitoring (drift, errors, latency).`,
    ];
    function show() { const i = Math.min(step, result.fail ? result.fail : 5); out.innerHTML = `<b>${STAGES[i]}</b><br>${explain[i]()}` + (result.fail && step >= result.fail ? "" : step >= 5 ? "" : "<br><span style='opacity:.75'>Press Next step to follow the request.</span>"); cv.redraw(); }
    const sel = h("select"); PRESETS.forEach(([n], i) => sel.append(h("option", { value: i }, n))); sel.value = pi; sel.onchange = () => { pi = +sel.value; result = run(PRESETS[pi][1]); step = 0; show(); }; ctl.append(sel);
    btn(ctl, "Next step ▶", () => { const last = result.fail ? result.fail : 5; step = Math.min(last, step + 1); show(); }, "primary"); btn(ctl, "Run all", () => { step = result.fail ? result.fail : 5; show(); }); btn(ctl, "Reset", () => { step = 0; show(); }); show();
  })();

  /* ---------- drift monitor ---------- */
  (function () {
    const host = $("#demo-drift", document), out = $("[data-out]", host), ctl = $("[data-controls]", host), NREF = 2000, NLIVE = 1000;
    let shift = 0.6, wid = 1, rref, ref, edges;
    const mix = (n, sh, w, seed) => { const r = rng(seed), lab = [], x = []; for (let i = 0; i < n; i++) { const c = r() < 0.5 ? 0 : 1; lab.push(c); x.push((c ? 1 : -1) + w * randn(r) + sh); } return { x, lab }; };
    const R = mix(NREF, 0, 1, 11); ref = R.x.slice().sort((a, b) => a - b); edges = Array.from({ length: 9 }, (_, i) => ref[Math.floor(((i + 1) * NREF) / 10)]);
    const binOf = (v) => { let b = 0; while (b < 9 && v > edges[b]) b++; return b; };
    const psi = (x) => { const c = new Array(10).fill(0); x.forEach((v) => c[binOf(v)]++); return c.reduce((s, ct) => { const l = Math.max(ct / x.length, 1e-4), rf = 0.1; return s + (l - rf) * Math.log(l / rf); }, 0); };
    const ks = (x) => { const a = ref, b = x.slice().sort((p, q) => p - q); let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { const v = Math.min(a[i], b[j]); while (i < a.length && a[i] <= v) i++; while (j < b.length && b[j] <= v) j++; d = Math.max(d, Math.abs(i / a.length - j / b.length)); } return d; };
    const stats = (sh, w) => { const L = mix(NLIVE, sh, w, 23), acc = L.x.filter((v, i) => (v > 0 ? 1 : 0) === L.lab[i]).length / NLIVE; return { x: L.x, acc, psi: psi(L.x), ks: ks(L.x) }; };
    const grid = []; for (let s = 0; s <= 2.001; s += 0.1) grid.push([s, stats(s, 1)]);
    const cv = ML.canvas($("[data-canvas]", host), 330, (ctx, W, H) => {
      const st = stats(shift, wid), lo = -5, hi = 6, B = 32, cr = new Array(B).fill(0), cl = new Array(B).fill(0); ref.forEach((v) => { const b = Math.floor(((v - lo) / (hi - lo)) * B); if (b >= 0 && b < B) cr[b]++; }); st.x.forEach((v) => { const b = Math.floor(((v - lo) / (hi - lo)) * B); if (b >= 0 && b < B) cl[b]++; });
      const P = plane(W, H, [lo, hi], [0, 0.2], { l: 44, r: 14, t: 24, b: H - 150 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("one input feature: at training time (blue) vs in production now (orange)", W / 2, 14);
      [[cr, NREF, css("--c1")], [cl, NLIVE, css("--c2")]].forEach(([c, n, col]) => c.forEach((v, b) => { const y = v / n; if (!y) return; const x0 = P.X(lo + ((hi - lo) * b) / B), x1 = P.X(lo + ((hi - lo) * (b + 1)) / B); ctx.globalAlpha = 0.55; ctx.fillStyle = col; ctx.fillRect(x0, P.Y(y), x1 - x0, P.Y(0) - P.Y(y)); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1; ctx.strokeRect(x0, P.Y(y), x1 - x0, P.Y(0) - P.Y(y)); })); line(ctx, P.pad.l, P.Y(0), W - P.pad.r, P.Y(0), css("--text"), 2);
      const hw = Math.round(W / 2), Q = plane(hw, H, [0, 2], [0.5, 1], { l: 44, r: 10, t: H - 116, b: 34 }); ctx.save(); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("model accuracy (unseen in production!) vs shift", hw / 2, Q.pad.t - 8); axes(ctx, Q, { nx: 4, ny: 2, xl: "shift of the feature", fx: (v) => v.toFixed(1), fy: (v) => Math.round(v * 100) + "%" });
      ctx.beginPath(); grid.forEach(([s, g], i) => (i ? ctx.lineTo(Q.X(s), Q.Y(g.acc)) : ctx.moveTo(Q.X(s), Q.Y(g.acc)))); ctx.strokeStyle = css("--c3"); ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, Q.X(clamp(shift, 0, 2)), Q.Y(st.acc), 6, css("--accent")); ctx.restore();
      ctx.save(); ctx.translate(hw, 0); const S2 = plane(W - hw, H, [0, 2], [0, 1], { l: 44, r: 14, t: H - 116, b: 34 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("drift score PSI (measurable!) vs shift", (W - hw) / 2, S2.pad.t - 8); axes(ctx, S2, { nx: 4, ny: 2, xl: "shift of the feature", fx: (v) => v.toFixed(1), fy: (v) => v.toFixed(1) }); [0.1, 0.25].forEach((t) => line(ctx, S2.X(0), S2.Y(t), S2.X(2), S2.Y(t), t === 0.1 ? css("--yellow") : css("--bad"), 2, [5, 5]));
      ctx.beginPath(); grid.forEach(([s, g], i) => { const y = S2.Y(Math.min(g.psi, 1)); i ? ctx.lineTo(S2.X(s), y) : ctx.moveTo(S2.X(s), y); }); ctx.strokeStyle = css("--c4"); ctx.lineWidth = 3.5; ctx.stroke(); dot(ctx, S2.X(clamp(shift, 0, 2)), S2.Y(Math.min(st.psi, 1)), 6, css("--accent")); ctx.restore();
    });
    function show() {
      const st = stats(shift, wid), verdict = st.psi < 0.1 ? "🟢 stable (PSI below 0.1)" : st.psi < 0.25 ? "🟡 moderate drift: watch closely (PSI 0.1 to 0.25)" : "🔴 significant drift: investigate and consider retraining (PSI above 0.25)";
      out.innerHTML = `Live data shifted by <b>${shift.toFixed(2)}</b> and spread ×<b>${wid.toFixed(1)}</b>. <b>PSI = ${st.psi.toFixed(3)}</b> · KS statistic = <b>${st.ks.toFixed(3)}</b> · ${verdict}<br>A model trained on the blue data and using the fixed rule "positive if the feature is above 0" is right <b>${(st.acc * 100).toFixed(1)}%</b> of the time on this live data (it was ${(grid[0][1].acc * 100).toFixed(1)}% with no shift). In real life you would <em>not</em> see this accuracy immediately, because true labels arrive late or never; the drift score is the early warning you can compute today.` + (Math.abs(shift) < 0.05 && Math.abs(wid - 1) < 0.05 ? "" : "<br>PSI (population stability index) compares the share of live data in each of 10 bins that held 10% of the training data each. The thresholds 0.1 and 0.25 are common rules of thumb, not laws."); cv.redraw();
    }
    slider(ctl, { label: "Shift of the feature", min: -1, max: 2, step: 0.05, value: shift, fmt: (v) => v.toFixed(2), onInput: (v) => { shift = v; show(); } });
    slider(ctl, { label: "Spread of the feature (×)", min: 0.5, max: 2, step: 0.1, value: wid, fmt: (v) => v.toFixed(1), onInput: (v) => { wid = v; show(); } }); show();
  })();

  /* ---------- readiness checklist ---------- */
  (function () {
    const host = $("#demo-check"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const ITEMS = [["Model", [["Evaluated on unseen data with a metric that matches the real cost", 1], ["Compared against a simple baseline", 0], ["Preprocessing + model saved together as one pipeline", 1], ["Library versions pinned and recorded", 0], ["Model file comes from a trusted source (never load unknown pickles)", 1]]], ["Serving", [["Inputs validated (types, ranges, required fields)", 1], ["Same preprocessing as training, guaranteed by the pipeline", 1], ["Latency and load tested", 0], ["Health-check endpoint", 0], ["Errors handled without leaking internals; authentication and rate limits", 1]]], ["Monitoring", [["Inputs, predictions and model version logged", 1], ["Data-drift monitoring with alerts to a person", 1], ["Performance tracked when true labels arrive", 1], ["Latency and error rates tracked", 0]]], ["Operations", [["Reproducible build (requirements file or container)", 0], ["Previous version kept and a rollback plan tested", 1], ["Staged rollout (shadow, canary or A/B test)", 0], ["Retraining plan and owner", 0], ["Documentation: what it is for, what it is not for (model card)", 0]]], ["Safety and privacy", [["Personal data protected or removed", 1], ["Performance checked on subgroups", 0], ["Human fallback for low-confidence or high-stakes cases", 0]]]];
    const state = {}; const all = []; ITEMS.forEach(([cat, items]) => items.forEach(([t, c]) => all.push({ cat, t, crit: c })));
    all.forEach((a, i) => (state[i] = false));
    const rows = h("div", { style: "display:contents" }); ctl.append(rows); const boxes = [];
    let last = "";
    all.forEach((a, i) => { if (a.cat !== last) { rows.append(h("div", { style: "flex-basis:100%;font-weight:800;margin-top:6px" }, a.cat)); last = a.cat; } const cb = h("input", { type: "checkbox" }), lb = h("label", { style: "flex-basis:100%;display:flex;gap:8px;align-items:center;cursor:pointer" }, cb, h("span", {}, (a.crit ? "★ " : "") + a.t)); cb.onchange = () => { state[i] = cb.checked; show(); }; boxes.push(cb); rows.append(lb); });
    function show() {
      const done = all.filter((_, i) => state[i]).length, crit = all.filter((a) => a.crit), critDone = crit.filter((a) => state[all.indexOf(a)]).length, missing = crit.filter((a) => !state[all.indexOf(a)]);
      out.innerHTML = `Checked <b>${done}</b> of ${all.length} items · <b>${critDone}</b> of ${crit.length} critical (★) items.<br>` + (critDone === crit.length ? "✅ All critical items are covered. Work through the rest before scaling up." : `🟥 <b>Not ready for real users.</b> Missing critical items: ${missing.slice(0, 4).map((m) => "<i>" + m.t + "</i>").join("; ")}${missing.length > 4 ? "; and " + (missing.length - 4) + " more" : ""}.`) + `<br><span style="opacity:.75">Tick what your project already has. A model is not "deployed" when it runs once; it is deployed when it keeps working, safely, and you would notice if it stopped.</span>`;
    }
    show();
  })();
});
