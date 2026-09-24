/* Demos for naive-bayes.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp } = ML;

  /* ---------- natural frequencies ---------- */
  (function () {
    const host = $("#demo-nf"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let prev = 1, sens = 90, fpr = 9;
    const counts = () => { const ill = Math.round(10 * prev), healthy = 1000 - ill, tp = Math.round((ill * sens) / 100), fp = Math.round((healthy * fpr) / 100); return { ill, healthy, tp, fn: ill - tp, fp, tn: healthy - fp }; };
    const cv = ML.canvas($("[data-canvas]", host), 230, (ctx, W, H) => {
      const c = counts(), cols = 50, cw = (W - 8) / cols, ch = (H - 8) / 20, r = Math.min(cw, ch) / 2 - 1.2;
      const seq = [[c.tp, css("--bad")], [c.fp, css("--c5")], [c.fn, css("--c2")], [c.tn, css("--surface-2")]]; let idx = 0;
      seq.forEach(([n, col]) => { for (let k = 0; k < n; k++, idx++) { const x = 4 + (idx % cols) * cw + cw / 2, y = 4 + Math.floor(idx / cols) * ch + ch / 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); if (col !== seq[3][1]) { ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1; ctx.stroke(); } } });
    });
    function show() {
      const c = counts(), pos = c.tp + c.fp, p = pos ? c.tp / pos : 0;
      out.innerHTML = `Of 1,000 people: <b>${c.ill}</b> ill (${c.tp} test positive, ${c.fn} missed) and <b>${c.healthy}</b> healthy (${c.fp} false alarms).<br><b>${pos}</b> people test positive, but only <b>${c.tp}</b> of them are really ill → P(ill | positive) = ${c.tp} ÷ ${pos} = <b>${(p * 100).toFixed(1)}%</b>.` + (prev < 5 && p < 0.5 ? "<br>Rare disease → most positives are false alarms. The <i>prior</i> matters more than the test's accuracy." : prev >= 10 ? "<br>When the condition is common, the same test becomes far more trustworthy." : ""); cv.redraw();
    }
    slider(ctl, { label: "How common is the illness (prior)", min: 0.1, max: 30, step: 0.1, value: prev, fmt: (v) => v.toFixed(1) + "%", onInput: (v) => { prev = v; show(); } });
    slider(ctl, { label: "Test sensitivity", min: 50, max: 100, step: 1, value: sens, fmt: (v) => v + "%", onInput: (v) => { sens = v; show(); } });
    slider(ctl, { label: "False-positive rate", min: 0, max: 30, step: 1, value: fpr, fmt: (v) => v + "%", onInput: (v) => { fpr = v; show(); } }); show();
  })();

  /* ---------- spam filter by hand ---------- */
  (function () {
    const host = $("#demo-spam"), out = $("[data-out]", host), ctl = $("[data-controls]", host), tbl = $("#spamTbl");
    const V = ["free", "winner", "money", "meeting"], cs = { free: 3, winner: 3, money: 2, meeting: 0 }, ch = { free: 1, winner: 0, money: 2, meeting: 3 }, TS = 8, TH = 6;
    const sel = new Set(["free", "winner"]); let alpha = 1, prior = 0.5;
    const ps = (w) => (cs[w] + alpha) / (TS + alpha * 4), pf = (w) => (ch[w] + alpha) / (TH + alpha * 4), f = (v) => (v < 0.001 && v > 0 ? v.toExponential(1) : v.toFixed(3));
    function show() {
      tbl.innerHTML = "<tr><th>word</th><th>in the new email?</th><th class='num'>count in spam</th><th class='num'>P(word | spam)</th><th class='num'>count in ham</th><th class='num'>P(word | ham)</th></tr>" + V.map((w) => `<tr style="${sel.has(w) ? "background:color-mix(in srgb,var(--yellow) 35%,transparent);font-weight:700" : "color:var(--muted)"}"><td>${w}</td><td>${sel.has(w) ? "✔ yes" : "no"}</td><td class="num">${cs[w]}</td><td class="num">(${cs[w]}+${alpha}) ÷ (${TS}+${alpha * 4}) = ${f(ps(w))}</td><td class="num">${ch[w]}</td><td class="num">(${ch[w]}+${alpha}) ÷ (${TH}+${alpha * 4}) = ${f(pf(w))}</td></tr>`).join("");
      const ws = [...sel]; let s = prior, hm = 1 - prior; ws.forEach((w) => { s *= ps(w); hm *= pf(w); });
      const es = [prior.toFixed(2), ...ws.map((w) => f(ps(w)))].join(" × "), eh = [(1 - prior).toFixed(2), ...ws.map((w) => f(pf(w)))].join(" × "), tot = s + hm;
      let verdict; if (tot === 0) verdict = `<b style="color:var(--bad)">Both scores are 0, so the answer is undefined (0 ÷ 0).</b> One missing word wiped out every other clue: the <b>zero-frequency problem</b>. Raise the smoothing above 0.`;
      else { const p = s / tot; verdict = `P(spam) = ${f(s)} ÷ ${f(tot)} = <b>${(p * 100).toFixed(1)}%</b> → <b style="color:${p >= 0.5 ? "var(--bad)" : "var(--good)"}">${p >= 0.5 ? "SPAM" : "HAM (normal email)"}</b>` + ((s === 0 || hm === 0) ? `<br><b style="color:var(--bad)">A score of exactly 0 came from a word never seen in that class (no smoothing). One unseen word made the model 100% certain: too extreme.</b>` : ""); }
      out.innerHTML = `email = <b>${ws.join(" + ") || "(no words)"}</b><br>spam score = ${es} = <b>${f(s)}</b><br>ham score = ${eh} = <b>${f(hm)}</b><br>${verdict}`;
    }
    V.forEach((w) => { const b = btn(ctl, w, () => { sel.has(w) ? sel.delete(w) : sel.add(w); b.classList.toggle("on", sel.has(w)); show(); }); b.classList.toggle("on", sel.has(w)); });
    slider(ctl, { label: "Smoothing α", min: 0, max: 3, step: 0.5, value: alpha, fmt: (v) => v.toFixed(1), onInput: (v) => { alpha = v; show(); } });
    slider(ctl, { label: "Prior P(spam)", min: 0.1, max: 0.9, step: 0.05, value: prior, fmt: (v) => v.toFixed(2), onInput: (v) => { prior = v; show(); } }); show();
  })();

  /* ---------- repeated clues ---------- */
  (function () {
    const host = $("#demo-copy"), out = $("[data-out]", host), ctl = $("[data-controls]", host), bars = $("#copyBars"); let m = 2, k = 1, prior = 0.3;
    const post = (n) => { const o = (prior / (1 - prior)) * m ** n; return o / (1 + o); };
    function show() {
      bars.innerHTML = Array.from({ length: 8 }, (_, i) => i + 1).map((n) => `<div style="display:grid;grid-template-columns:110px 1fr 60px;gap:10px;align-items:center;margin:5px 0;${n === k ? "font-weight:800" : "opacity:.65"}"><span>${n} cop${n === 1 ? "y" : "ies"}</span><span style="height:20px;background:var(--surface-2);border:2.5px solid var(--line);border-radius:99px;overflow:hidden;display:block"><i style="display:block;height:100%;width:${post(n) * 100}%;background:${n === k ? "var(--accent)" : "var(--c1)"}"></i></span><span style="font-family:var(--font-mono);text-align:right">${(post(n) * 100).toFixed(0)}%</span></div>`).join("");
      out.innerHTML = `Prior P(spam) = ${prior.toFixed(2)}. Each copy of the clue multiplies the spam odds by <b>${m.toFixed(1)}</b>. With <b>${k}</b> cop${k === 1 ? "y" : "ies"} the model multiplies ${m.toFixed(1)}<sup>${k}</sup> = <b>${(m ** k).toFixed(1)}</b> → P(spam) = <b>${(post(k) * 100).toFixed(1)}%</b>.<br>` + (k > 1 ? "The copies carry <b>no new information</b>, but the naïve model counts them as independent evidence, so its confidence balloons." : "One honest clue gives a moderate probability.");
    }
    slider(ctl, { label: "Clue strength (odds ×)", min: 1, max: 4, step: 0.5, value: m, fmt: (v) => v.toFixed(1), onInput: (v) => { m = v; show(); } });
    slider(ctl, { label: "Copies of the same clue", min: 1, max: 8, step: 1, value: k, onInput: (v) => { k = v; show(); } });
    slider(ctl, { label: "Prior P(spam)", min: 0.05, max: 0.9, step: 0.05, value: prior, fmt: (v) => v.toFixed(2), onInput: (v) => { prior = v; show(); } }); show();
  })();

  /* ---------- Gaussian NB ---------- */
  (function () {
    const host = $("#demo-gauss"), out = $("[data-out]", host), ctl = $("[data-controls]", host); let x = 34, prior = 0.5;
    const A = { m: 30, s: 5, n: "buyers" }, B = { m: 40, s: 6, n: "non-buyers" }, pdf = (v, m, s) => Math.exp(-((v - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const P = plane(W, H, [10, 60], [0, 0.085], { l: 48, r: 14, t: 12, b: 34 }); axes(ctx, P, { nx: 5, ny: 4, xl: "customer age", yl: "prior × bell height", fx: (v) => Math.round(v), fy: (v) => v.toFixed(2) });
      const curve = (c, pr, col) => { ctx.beginPath(); for (let i = 0; i <= 200; i++) { const v = 10 + (50 * i) / 200, y = pr * pdf(v, c.m, c.s); i ? ctx.lineTo(P.X(v), P.Y(y)) : ctx.moveTo(P.X(v), P.Y(y)); } ctx.lineTo(P.X(60), P.Y(0)); ctx.lineTo(P.X(10), P.Y(0)); ctx.globalAlpha = 0.22; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); for (let i = 0; i <= 200; i++) { const v = 10 + (50 * i) / 200, y = pr * pdf(v, c.m, c.s); i ? ctx.lineTo(P.X(v), P.Y(y)) : ctx.moveTo(P.X(v), P.Y(y)); } ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); };
      curve(A, prior, css("--c3")); curve(B, 1 - prior, css("--c2"));
      let bnd = null; for (let v = 10; v < 60; v += 0.1) { const d0 = prior * pdf(v, A.m, A.s) - (1 - prior) * pdf(v, B.m, B.s), d1 = prior * pdf(v + 0.1, A.m, A.s) - (1 - prior) * pdf(v + 0.1, B.m, B.s); if (d0 > 0 && d1 <= 0 && v > 25) { bnd = v; break; } }
      if (bnd) { line(ctx, P.X(bnd), P.Y(0), P.X(bnd), P.Y(0.085), css("--muted"), 2.5, [7, 6]); ctx.fillStyle = css("--muted"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("decision boundary ≈ " + bnd.toFixed(1), P.X(bnd), P.Y(0.085) + 12); }
      line(ctx, P.X(x), P.Y(0), P.X(x), P.Y(0.085), css("--text"), 3); dot(ctx, P.X(x), P.Y(prior * pdf(x, A.m, A.s)), 7, css("--c3")); dot(ctx, P.X(x), P.Y((1 - prior) * pdf(x, B.m, B.s)), 7, css("--c2"));
      ctx.font = "700 14px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = css("--c3"); ctx.fillText("buyers: average 30, spread 5", P.pad.l + 8, P.pad.t + 16); ctx.fillStyle = css("--c2"); ctx.fillText("non-buyers: average 40, spread 6", P.pad.l + 8, P.pad.t + 34);
    });
    function show() {
      const la = pdf(x, A.m, A.s), lb = pdf(x, B.m, B.s), sa = prior * la, sb = (1 - prior) * lb, p = sa / (sa + sb);
      out.innerHTML = `Age <b>${x}</b>: bell height for buyers = <b>${la.toFixed(4)}</b>, for non-buyers = <b>${lb.toFixed(4)}</b><br>score(buyer) = ${prior.toFixed(2)} × ${la.toFixed(4)} = ${sa.toFixed(4)} · score(non-buyer) = ${(1 - prior).toFixed(2)} × ${lb.toFixed(4)} = ${sb.toFixed(4)}<br>P(buyer) = ${sa.toFixed(4)} ÷ ${(sa + sb).toFixed(4)} = <b>${(p * 100).toFixed(1)}%</b> → predict <b style="color:${p >= 0.5 ? "var(--good)" : "var(--c2)"}">${p >= 0.5 ? "buys" : "doesn't buy"}</b>`; cv.redraw();
    }
    slider(ctl, { label: "Customer age", min: 15, max: 55, step: 1, value: x, onInput: (v) => { x = v; show(); } });
    slider(ctl, { label: "Prior P(buyer)", min: 0.05, max: 0.95, step: 0.05, value: prior, fmt: (v) => v.toFixed(2), onInput: (v) => { prior = v; show(); } }); show();
  })();
});
