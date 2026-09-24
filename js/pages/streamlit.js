/* Demos for streamlit.html */
ML.ready(function () {
  const { $, h, css, plane, axes, slider, btn, clamp } = ML;
  const T = () => css("--text"), FONT = (s, w) => (w || 700) + " " + s + "px Fredoka, sans-serif";

  /* ---------- 1. what runs when you touch a widget ---------- */
  (function () {
    const host = $("#demo-rerun"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const LINES = ['import streamlit as st', 'model = load_model()', 'n = st.slider("n", 0, 10, 3)', 'if st.button("Predict"):', '    st.write("prediction:", model(n))', 'st.write("n is", n)'];
    let action = 0, step = -1, runs = 0, exec = [], n = 3;
    const ACTIONS = ["Move the slider", "Click the Predict button", "Open the page (first run)"];
    const plan = () => (action === 1 ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 5]);
    const cv = ML.canvas($("[data-canvas]", host), 220, (ctx, W) => {
      ctx.font = FONT(13); ctx.fillStyle = T(); ctx.textAlign = "center"; ctx.fillText("the script, top to bottom (run #" + runs + ")", W / 2, 18);
      LINES.forEach((l, i) => {
        const y = 32 + i * 30, done = exec.indexOf(i) >= 0 && exec.indexOf(i) <= step, now = plan()[step] === i && step >= 0, skipped = step >= plan().length - 1 && exec.indexOf(i) < 0 && runs > 0;
        ctx.beginPath(); ctx.rect(20, y, W - 40, 24); ctx.fillStyle = now ? css("--c2") : done ? css("--c3") : css("--surface"); ctx.globalAlpha = now || done ? 0.85 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = now ? 3 : 1.5; ctx.stroke();
        ctx.fillStyle = skipped ? css("--muted") : T(); ctx.font = "600 13px Consolas, monospace"; ctx.textAlign = "left"; ctx.fillText(l, 30, y + 17);
        ctx.textAlign = "right"; ctx.font = "600 11px DM Sans, sans-serif"; ctx.fillText(now ? "running" : done ? "ran" : skipped ? "skipped (button was False)" : "", W - 30, y + 16);
      });
    });
    function show() {
      const p = plan();
      if (runs === 0) out.innerHTML = "Choose what the user does, then press <b>Start a run</b> and step through it.";
      else if (step >= p.length - 1) out.innerHTML = `Run #${runs} finished: the page is redrawn. ` + (action === 1 ? "The button was <b>True</b> in this run, so the prediction line executed." : "The button is <b>False</b> in this run (it is only True on the run right after a click), so the prediction line was skipped: <b>the earlier result disappears</b>.") + " Notice that <b>every</b> line, including line 2, ran again: that is why loading the model must be cached.";
      else out.innerHTML = `Run #${runs}: executing line ${p[step] + 1}. ` + (p[step] === 2 ? `The slider function does not "wait for" an event: it simply <b>returns the current value</b> (${n}).` : p[step] === 3 ? `<code>st.button</code> returns <b>${action === 1}</b> in this run.` : "");
      cv.redraw();
    }
    const sel = h("select"); ACTIONS.forEach((a, i) => sel.append(h("option", { value: i }, a))); sel.onchange = () => { action = +sel.value; step = -1; runs = 0; exec = []; show(); }; ctl.append(sel);
    const nextStep = () => { step = Math.min(plan().length - 1, step + 1); show(); };
    btn(ctl, "Start a run", () => { runs++; step = -1; exec = plan(); nextStep(); }, "primary");
    btn(ctl, "Next line ▶", () => { if (runs === 0) return; nextStep(); });
    btn(ctl, "Finish run", () => { if (runs === 0) return; step = plan().length - 1; show(); });
    show();
  })();

  /* ---------- 2. caching ---------- */
  (function () {
    const host = $("#demo-cache"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let x = 3, useCache = true, cache = new Set(), log = [];
    const cv = ML.canvas($("[data-canvas]", host), 200, (ctx, W) => {
      ctx.font = FONT(13); ctx.fillStyle = T(); ctx.textAlign = "center"; ctx.fillText("time spent inside slow_function(x) on each run of the script (seconds)", W / 2, 18);
      const P = plane(W, 200, [0, Math.max(8, log.length)], [0, 1.2], { l: 44, r: 14, t: 28, b: 30 }); axes(ctx, P, { nx: 1, ny: 3, fy: (v) => v.toFixed(1), fx: () => "", xl: "run number" });
      const bw = Math.min(40, (P.X(1) - P.X(0)) - 6);
      log.forEach((r, i) => { const x0 = P.X(i) + 3, y = P.Y(r.t); ctx.fillStyle = r.hit ? css("--c3") : css("--c2"); ctx.fillRect(x0, y, bw, P.Y(0) - y); ctx.strokeStyle = css("--ink"); ctx.lineWidth = 1.5; ctx.strokeRect(x0, y, bw, Math.max(1, P.Y(0) - y)); ctx.fillStyle = T(); ctx.font = "600 11px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(r.hit ? "HIT" : "MISS", x0 + bw / 2, Math.min(P.Y(0) - 4, y - 4)); });
    });
    function show() {
      const miss = log.filter((r) => !r.hit).length, tot = log.reduce((s, r) => s + r.t, 0);
      out.innerHTML = log.length ? `Runs: <b>${log.length}</b> · cache misses: <b>${miss}</b> · hits: <b>${log.length - miss}</b> · total waiting time: <b>${tot.toFixed(2)} s</b>.<br>Cache is <b>${useCache ? "ON (@st.cache_data)" : "OFF"}</b>. The cache remembers ${cache.size ? "results for x = " + [...cache].sort().join(", ") : "nothing yet"}. A <em>new</em> argument is always a miss; the same argument is a hit.` : "Press <b>Rerun the script</b> a few times, change x, and switch the cache off to compare. (The one-second cost is simulated; my real test with time.sleep(1) gave 1.00 s then 0.00 s.)";
      cv.redraw();
    }
    slider(ctl, { label: "x (the function's argument)", min: 1, max: 5, step: 1, value: x, onInput: (v) => { x = v; } });
    const cb = h("input", { type: "checkbox" }); cb.checked = true; cb.onchange = () => { useCache = cb.checked; if (!useCache) cache = new Set(); show(); };
    ctl.append(h("label", { style: "display:flex;gap:6px;align-items:center;cursor:pointer" }, cb, h("span", {}, "use @st.cache_data")));
    btn(ctl, "Rerun the script ▶", () => { const hit = useCache && cache.has(x); if (useCache) cache.add(x); log.push({ hit, t: hit ? 0.003 : 1.0 }); if (log.length > 16) log.shift(); show(); }, "primary");
    btn(ctl, "Clear", () => { log = []; cache = new Set(); show(); });
    show();
  })();

  /* ---------- 3. plain variable vs session state ---------- */
  (function () {
    const host = $("#demo-state", document), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let plain = 0, state = 0, clicks = 0, last = "";
    const cv = ML.canvas($("[data-canvas]", host), 150, (ctx, W) => {
      const bw = Math.min(210, (W - 60) / 2);
      [["plain variable  count = 0", plain, css("--c1")], ["st.session_state.n", state, css("--c3")]].forEach(([t, v, col], i) => {
        const x = W / 2 + (i ? 20 : -bw - 20); ctx.beginPath(); ctx.rect(x, 34, bw, 90); ctx.fillStyle = col; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = T(); ctx.textAlign = "center"; ctx.font = FONT(44); ctx.fillText(v, x + bw / 2, 92); ctx.font = "600 12px Consolas, monospace"; ctx.fillText(t, x + bw / 2, 114);
      });
      ctx.font = FONT(13); ctx.fillStyle = T(); ctx.textAlign = "center"; ctx.fillText("what the page shows after the latest run", W / 2, 20);
    });
    function show() { out.innerHTML = `Button clicks so far: <b>${clicks}</b>. ${last}<br>The page always shows the <em>latest</em> run. The plain variable is rebuilt as 0 at the top of each run, so it can never get past 1; the session state keeps counting. (This matches my real run: plain 1 / state 1, 1 / 2, 1 / 3, and plain 0 / state 3 on a run with no click.)`; cv.redraw(); }
    btn(ctl, "Click “add” ▶", () => { clicks++; plain = 0; plain += 1; state += 1; last = "A click starts a new run: <code>count</code> restarts at 0, then +1."; show(); }, "primary");
    btn(ctl, "Rerun without a click (move a slider)", () => { plain = 0; last = "A run without a click: the button is False, so nothing is added and the plain variable is back to 0."; show(); });
    btn(ctl, "Reset", () => { plain = 0; state = 0; clicks = 0; last = ""; show(); });
    show();
  })();

  /* ---------- 4. the iris app ---------- */
  (function () {
    const host = $("#demo-app"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const MU = [5.877679, 3.066071, 3.764286, 1.19375], SD = [0.849444, 0.4417, 1.775772, 0.766868], COEF = [[-1.049416, 1.15349, -1.628645, -1.567816], [0.495376, -0.53076, -0.263881, -0.808387], [0.55404, -0.62273, 1.892526, 2.376203]], B = [-0.148957, 1.770554, -1.621597], NAMES = ["setosa", "versicolor", "virginica"];
    const LO = [4.3, 2.0, 1.0, 0.1], HI = [7.9, 4.4, 6.9, 2.5], LABEL = ["sepal length (cm)", "sepal width (cm)", "petal length (cm)", "petal width (cm)"];
    const v = [5.8, 3.0, 4.3, 1.3]; let res = null, history = [];
    const predict = () => { const z = v.map((a, i) => (a - MU[i]) / SD[i]), lg = COEF.map((c, k) => c.reduce((s, w, i) => s + w * z[i], 0) + B[k]), mx = Math.max(...lg), ex = lg.map((q) => Math.exp(q - mx)), sm = ex.reduce((a, b) => a + b, 0); return ex.map((q) => q / sm); };
    const cv = ML.canvas($("[data-canvas]", host), 150, (ctx, W) => {
      ctx.font = FONT(13); ctx.fillStyle = T(); ctx.textAlign = "center";
      if (!res) { ctx.fillText("no result on the page yet: press Predict", W / 2, 80); return; }
      ctx.fillText("st.bar_chart: predicted probabilities", W / 2, 18);
      const bw = Math.min(70, (W - 80) / 3 - 20);
      res.forEach((p, i) => { const x = W / 2 + (i - 1) * (bw + 30) - bw / 2, hh = p * 90; ctx.fillStyle = [css("--c1"), css("--c2"), css("--c3")][i]; ctx.fillRect(x, 120 - hh, bw, hh); ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.strokeRect(x, 120 - hh, bw, Math.max(1, hh)); ctx.fillStyle = T(); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText((p * 100).toFixed(1) + "%", x + bw / 2, 114 - hh); ctx.fillText(NAMES[i], x + bw / 2, 138); });
    });
    function show() {
      let html = "<b>Sidebar</b> " + v.map((a, i) => LABEL[i] + " = " + a.toFixed(1)).join(" · ") + "<br>";
      if (res) { const k = res.indexOf(Math.max(...res)), outside = v.map((a, i) => (a < LO[i] || a > HI[i] ? LABEL[i] : null)).filter(Boolean); html += `<b>st.metric</b> Predicted species: <b>${NAMES[k]}</b> (${(res[k] * 100).toFixed(1)}% confident)` + (outside.length ? `<br>⚠️ <b>st.warning</b> Outside the range of the training data: ${outside.join(", ")}` : ""); }
      else html += "The page shows no result: the button has not been pressed in the latest run (or a slider moved after it, which started a new run where the button is False).";
      html += `<br><b>History tab</b> (session_state): ${history.length ? history.map((s) => s).join(" → ") : "empty"}`;
      out.innerHTML = html; cv.redraw();
    }
    LABEL.forEach((l, i) => slider(ctl, { label: l, min: i === 0 ? 4 : i === 1 ? 2 : i === 2 ? 1 : 0.1, max: i === 0 ? 8 : i === 1 ? 4.5 : i === 2 ? 7 : 2.5, step: 0.1, value: v[i], fmt: (q) => q.toFixed(1), onInput: (q) => { v[i] = q; res = null; show(); } }));
    btn(ctl, "Predict", () => { res = predict(); const k = res.indexOf(Math.max(...res)); history.push(NAMES[k] + " " + (res[k] * 100).toFixed(1) + "%"); show(); }, "primary");
    [["setosa", [5.1, 3.5, 1.4, 0.2]], ["virginica", [6.7, 3.0, 5.2, 2.3]], ["far outside", [8.0, 3.0, 7.0, 2.5]]].forEach(([n, a]) => btn(ctl, "Try: " + n, () => { a.forEach((q, i) => (v[i] = q)); $$sync(); res = null; show(); }));
    const ranges = $$ranges();
    function $$ranges() { return host.querySelectorAll("input[type=range]"); }
    function $$sync() { ranges.forEach((r, i) => { r.value = v[i]; r.dispatchEvent(new Event("input")); }); }
    show();
  })();
});
