/* Demos for 03a-ml-workflow.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn } = ML;

  /* ---------- 10-step explorer ---------- */
  (function () {
    const S = [
      { t: "Problem statement", e: "🎯", what: "Defines the objective of the ML task, the context in which it is applied and the expected outcome. It specifies the type of ML problem, the input data used and the output to be predicted, and outlines how success will be measured using appropriate evaluation metrics. It also highlights constraints such as performance, cost and computability.",
        do: ["Write the goal in one sentence a non-technical person understands.", "Decide the ML type: regression, classification, clustering…", "Choose the success metric and the minimum acceptable value.", "List constraints: response time, budget, privacy, explainability.", "Define a simple baseline to beat."], ex: "\"Predict the selling price of a house from its features (regression). Success: RMSE under ₹5 lakh on unseen houses. Must answer in under 1 second.\"", tools: "Stakeholder interviews, business KPIs, whiteboard.", bad: "A vague goal (\"use AI on our data\"), no metric, or predicting something nobody can act on." },
      { t: "Data collection", e: "📥", what: "Gathering relevant data from multiple sources such as databases, sensors, logs, APIs, web content and user interactions. The data must be high quality: accurate, complete, consistent and free from noise. Adequate quantity matters too: too little data leads to a poor model, while excessive irrelevant data increases complexity and cost.",
        do: ["Identify where the data lives (SQL, CSV, API, sensors, web scraping).", "Make sure you have the <b>label</b> for supervised problems.", "Check the sample is representative of the real-world population.", "Record where each column came from; respect privacy and licences."], ex: "5,000 sold-house records from the company database, plus locality crime and school ratings from public APIs.", tools: "pandas <code>read_csv</code>, <code>read_sql</code>, <code>requests</code>, BeautifulSoup, cloud storage.", bad: "Sampling bias (only luxury listings), missing labels, silently changing data sources." },
      { t: "Data cleaning", e: "🧹", what: "Correcting the errors in raw data by handling missing values, duplicates, inconsistencies and noise. It improves data quality and ensures better model accuracy and reliability.",
        do: ["Find and treat missing values (drop / fill with mean, median, most frequent).", "Remove duplicate rows.", "Fix inconsistent labels (Pune / pune / PUNE) and wrong data types.", "Detect outliers (IQR or z-score) and decide: fix, cap or keep.", "Validate ranges (age can't be −5)."], ex: "A house of 25,000 sq ft is a typo for 2,500; two rows are identical; the bedrooms column has blanks. (Try it in the demo below.)", tools: "pandas <code>isna</code>, <code>drop_duplicates</code>, <code>fillna</code>; sklearn <code>SimpleImputer</code>.", bad: "Deleting too much data, filling using the whole dataset before splitting (leakage), removing genuine extreme values." },
      { t: "Feature engineering", e: "🛠️", what: "Creating new columns based on the existing features in order to improve model performance. It helps the model learn meaningful patterns by reducing noise and enhancing important information.",
        do: ["Derive: age = current year − year built; area_per_bedroom.", "Extract from dates: month, weekday, hour.", "Transform: log of skewed values, binning, ratios.", "Encode categories and scale numbers (see Data Pre-processing).", "Drop useless or redundant columns."], ex: "From <i>year_built</i> make <i>age</i>; from <i>area</i> and <i>bedrooms</i> make <i>area_per_bedroom</i>.", tools: "pandas, <code>PolynomialFeatures</code>, <code>OneHotEncoder</code>, <code>StandardScaler</code>.", bad: "Features that secretly contain the answer (leakage) or that won't exist at prediction time." },
      { t: "Exploratory data analysis", e: "🔍", what: "Analysing and visualising data to understand its structure, patterns, relationships and anomalies. It helps in detecting trends, outliers and data issues before model building.",
        do: ["Summary statistics: mean, spread, min/max.", "Histograms for each column's distribution.", "Scatter plots and correlations against the target.", "Check class balance for classification.", "Look for surprises and confirm them with domain experts."], ex: "Area has the strongest positive correlation with price; age has a negative one; price is right-skewed.", tools: "<code>df.describe()</code>, <code>df.corr()</code>, matplotlib, seaborn.", bad: "Skipping it, or mistaking correlation for causation." },
      { t: "Model selection", e: "🧭", what: "The process of choosing the most suitable ML algorithm for a given problem and dataset. It is based on factors such as data type, model performance, complexity and evaluation metrics. The goal is to pick a model that generalises well to unseen data.",
        do: ["Match the algorithm family to the problem type.", "Start with a simple baseline.", "Shortlist 2–4 candidates and compare with cross-validation.", "Weigh accuracy against speed, memory and interpretability."], ex: "Baseline: Linear Regression. Candidates: Ridge, Random Forest, Gradient Boosting.", tools: "sklearn estimators, <code>cross_val_score</code>, <code>GridSearchCV</code>.", bad: "Picking the fanciest model by default, or choosing by training score instead of validation score." },
      { t: "Training", e: "🏋️", what: "The process of teaching an ML model to learn patterns from the dataset by adjusting its parameters. The model learns to minimise errors on the training data so it can make accurate predictions on new, unseen data.",
        do: ["Split the data (train / test).", "Call <code>model.fit(X_train, y_train)</code>.", "Tune hyperparameters using validation data or cross-validation.", "Watch for overfitting: training score much higher than validation score."], ex: "Fit a Random Forest with 200 trees on 4,000 houses; compare to the baseline.", tools: "<code>fit</code>, <code>train_test_split</code>, <code>GridSearchCV</code>.", bad: "Tuning on the test set; forgetting a fixed <code>random_state</code>; training on data that will not look like production data." },
      { t: "Testing", e: "✅", what: "The process of evaluating a trained ML model on unseen data to measure its performance and generalisation ability. It ensures the model makes accurate and reliable predictions.",
        do: ["Predict on the held-out test set.", "Compute the metrics chosen in step 1 (RMSE, F1…).", "Inspect the errors: where does it fail? Which groups?", "Compare with the baseline; decide whether to iterate or ship."], ex: "Test RMSE ₹4.2 lakh vs baseline ₹7.9 lakh, so the target is met.", tools: "<code>predict</code>, <code>sklearn.metrics</code>.", bad: "Peeking at the test set repeatedly (it stops being unseen)." },
      { t: "Deployment", e: "🚀", what: "The process of integrating a trained ML model into a real-world system so it can make predictions on new data. It ensures the model is accessible, scalable and usable for end-users.",
        do: ["Save the whole pipeline (<code>joblib.dump</code>).", "Expose it: REST API, web app (Streamlit), batch job, mobile or edge.", "Version the model and the data it was trained on.", "Test latency, load and failure handling."], ex: "A Streamlit page where an agent types area, bedrooms and city and instantly sees the predicted price.", tools: "joblib, FastAPI / Flask, Streamlit, Docker, cloud platforms.", bad: "Different preprocessing in production than in training (\"training-serving skew\")." },
      { t: "Maintenance", e: "🔧", what: "Involves monitoring a deployed model to ensure it continues to perform well, updating it as needed to handle new data, changing patterns or performance drift.",
        do: ["Log inputs, predictions and (when known) actual outcomes.", "Track the metric over time and alert on drops.", "Detect data drift and concept drift.", "Retrain on fresh data on a schedule or trigger; keep the old model to roll back."], ex: "After interest rates jump, error climbs from ₹4 to ₹7 lakh, so the model is retrained on the last 6 months.", tools: "Monitoring dashboards, scheduled retraining jobs, MLflow.", bad: "\"Deploy and forget.\" Silent decay is the most common production failure." },
    ];
    const row = $("#stepRow"), body = $("#stepBody"); let cur = 0; const btns = [];
    S.forEach((s, i) => { const b = h("button", { class: "btn", style: "min-width:44px" }, (i + 1) + " " + s.e); b.title = s.t; b.onclick = () => go(i); row.append(b); btns.push(b); });
    function go(i) {
      cur = i; btns.forEach((b, k) => b.classList.toggle("on", k === i)); const s = S[i];
      body.innerHTML = `<h3 style="margin:8px 0 4px">${i + 1}. ${s.t} ${s.e}</h3><p>${s.what}</p>
        <div class="two-col" style="align-items:start"><div><b>What you do</b><ul>${s.do.map((d) => `<li>${d}</li>`).join("")}</ul></div>
        <div><b>Our house-price example</b><p style="margin-top:4px">${s.ex}</p><b>Tools</b><p style="margin-top:4px">${s.tools}</p><b style="color:var(--bad)">Common mistakes</b><p style="margin-top:4px">${s.bad}</p></div></div>`;
      $("#stepPrev").disabled = i === 0; $("#stepNext").disabled = i === S.length - 1;
    }
    $("#stepPrev").onclick = () => go(cur - 1); $("#stepNext").onclick = () => go(cur + 1); go(0);
  })();

  /* ---------- Cleaning demo ---------- */
  (function () {
    const host = $("#demo-clean"), tbl = $("#cleanTbl"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const orig = [
      { id: 1, area: 1200, bed: 2, age: 10, city: "Pune", price: 210 }, { id: 2, area: 1500, bed: 3, age: 5, city: "Mumbai", price: 285 },
      { id: 3, area: 1500, bed: 3, age: 5, city: "Mumbai", price: 285 }, { id: 4, area: 900, bed: null, age: 30, city: "Pune", price: 140 },
      { id: 5, area: 2000, bed: 4, age: 2, city: "Delhi", price: 410 }, { id: 6, area: 1700, bed: 3, age: null, city: "Pune", price: 295 },
      { id: 7, area: 1100, bed: 2, age: 12, city: "pune ", price: 190 }, { id: 8, area: 25000, bed: 3, age: 8, city: "Delhi", price: 300 },
    ];
    let rows, log;
    const med = (a) => { const s = a.filter((v) => v != null).sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    const quant = (a, q) => { const s = a.slice().sort((x, y) => x - y), p = (s.length - 1) * q, lo = Math.floor(p); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (p - lo); };
    const fences = () => { const a = rows.map((r) => r.area), q1 = quant(a, 0.25), q3 = quant(a, 0.75), i = q3 - q1; return [q1 - 1.5 * i, q3 + 1.5 * i, q1, q3]; };
    function render() {
      const [lo, hi] = fences(), seen = new Set();
      tbl.innerHTML = "<tr><th>id</th><th class='num'>area</th><th class='num'>bedrooms</th><th class='num'>age</th><th>city</th><th class='num'>price (₹ lakh)</th></tr>" + rows.map((r) => {
        const key = [r.area, r.bed, r.age, r.city, r.price].join("|"), dup = seen.has(key); seen.add(key);
        const bad = "background:color-mix(in srgb,var(--bad) 22%,transparent)", warn = "background:color-mix(in srgb,var(--c5) 30%,transparent)";
        return `<tr style="${dup ? warn : ""}"><td>${r.id}${dup ? " (dup)" : ""}</td><td class="num" style="${r.area > hi || r.area < lo ? bad : ""}">${r.area}</td><td class="num" style="${r.bed == null ? bad : ""}">${r.bed == null ? "NaN" : r.bed}</td><td class="num" style="${r.age == null ? bad : ""}">${r.age == null ? "NaN" : r.age}</td><td style="${r.city !== r.city.trim().replace(/^./, (c) => c.toUpperCase()) ? bad : ""}">"${r.city}"</td><td class="num">${r.price}</td></tr>`;
      }).join("");
      out.innerHTML = log;
    }
    function reset() { rows = orig.map((r) => ({ ...r })); log = "Problems: 🟧 duplicate row · 🟥 missing values (NaN), the outlier area, and the inconsistent city text <code>\"pune \"</code>. Apply the fixes in any order."; render(); }
    btn(ctl, "1 · Drop duplicates", () => { const seen = new Set(), n = rows.length; rows = rows.filter((r) => { const k = [r.area, r.bed, r.age, r.city, r.price].join("|"); if (seen.has(k)) return false; seen.add(k); return true; }); log = `Removed <b>${n - rows.length}</b> duplicate row(s) with <code>drop_duplicates()</code>.`; render(); }, "primary");
    btn(ctl, "2 · Fix city text", () => { rows.forEach((r) => (r.city = r.city.trim().replace(/^./, (c) => c.toUpperCase()).replace(/(?<=.)./g, (c) => c.toLowerCase()))); log = "Applied <code>str.strip().str.title()</code>: <code>\"pune \"</code> → <code>\"Pune\"</code> so the model doesn't think they're two different cities."; render(); }, "primary");
    btn(ctl, "3 · Fill missing (median)", () => { const mb = med(rows.map((r) => r.bed)), ma = med(rows.map((r) => r.age)); rows.forEach((r) => { if (r.bed == null) r.bed = mb; if (r.age == null) r.age = ma; }); log = `Filled bedrooms with its median <b>${mb}</b> and age with its median <b>${ma}</b> (<code>SimpleImputer(strategy="median")</code>).`; render(); }, "primary");
    btn(ctl, "4 · Cap the outlier (IQR)", () => { const [lo, hi, q1, q3] = fences(); let n = 0; rows.forEach((r) => { if (r.area > hi) { r.area = Math.round(hi); n++; } else if (r.area < lo) { r.area = Math.round(lo); n++; } }); log = `Q1 = ${q1}, Q3 = ${q3}, IQR = ${q3 - q1}. Fences: [${lo.toFixed(0)}, ${hi.toFixed(0)}]. Clipped <b>${n}</b> value(s) to the fence (a domain expert may prefer fixing the typo to 2500).`; render(); }, "primary");
    btn(ctl, "↺ Reset", reset); reset();
  })();

  /* ---------- Feature engineering demo ---------- */
  (function () {
    const host = $("#demo-fe"), tbl = $("#feTbl"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const base = [[1998, 1200, 2, 210], [2015, 1500, 3, 285], [1985, 900, 2, 140], [2022, 2000, 4, 410], [2008, 1700, 3, 295]];
    const on = { age: false, apb: false, big: false };
    function render() {
      tbl.innerHTML = "<tr><th class='num'>year_built</th><th class='num'>area</th><th class='num'>bedrooms</th><th class='num'>price</th>" + (on.age ? "<th class='num' style='background:color-mix(in srgb,var(--c3) 30%,var(--surface-2))'>age</th>" : "") + (on.apb ? "<th class='num' style='background:color-mix(in srgb,var(--c3) 30%,var(--surface-2))'>area_per_bedroom</th>" : "") + (on.big ? "<th class='num' style='background:color-mix(in srgb,var(--c3) 30%,var(--surface-2))'>is_large</th>" : "") + "</tr>" +
        base.map((r) => "<tr>" + r.map((v) => `<td class="num">${v}</td>`).join("") + (on.age ? `<td class="num">${2026 - r[0]}</td>` : "") + (on.apb ? `<td class="num">${(r[1] / r[2]).toFixed(0)}</td>` : "") + (on.big ? `<td class="num">${r[1] >= 1600 ? 1 : 0}</td>` : "") + "</tr>").join("");
      const notes = [];
      if (on.age) notes.push("<b>age = 2026 − year_built</b>: now \"older = cheaper\" is a direct pattern (2026 − 1998 = 28).");
      if (on.apb) notes.push("<b>area_per_bedroom = area ÷ bedrooms</b>: 1200 ÷ 2 = 600 tells how spacious each room is.");
      if (on.big) notes.push("<b>is_large = area ≥ 1600</b>: a binary flag (binning) the model can use directly.");
      out.innerHTML = notes.length ? notes.join("<br>") : "Toggle the buttons to add new columns derived from existing ones.";
    }
    [["age", "+ age (from year)"], ["apb", "+ area_per_bedroom (ratio)"], ["big", "+ is_large (flag)"]].forEach(([k, l]) => { const b = btn(ctl, l, () => { on[k] = !on[k]; b.classList.toggle("on", on[k]); render(); }); });
    render();
  })();

  /* ---------- EDA demo ---------- */
  (function () {
    const host = $("#demo-eda"), r = rng(31), D = [];
    for (let i = 0; i < 80; i++) { const area = 600 + r() * 1900, age = Math.floor(r() * 40), bed = clamp(Math.round(area / 650 + 0.9 * randn(r)), 1, 6); D.push({ area, age, bed, price: 0.11 * area - 1.3 * age + 6 * bed + 20 + 22 * randn(r) }); }
    const F = { area: "area (sq ft)", age: "age (years)", bed: "bedrooms" }; let f = "area";
    const corr = (k) => { const x = D.map((d) => d[k]), y = D.map((d) => d.price), mx = ML.mean(x), my = ML.mean(y); let n = 0, a = 0, b = 0; x.forEach((v, i) => { n += (v - mx) * (y[i] - my); a += (v - mx) ** 2; b += (y[i] - my) ** 2; }); return n / Math.sqrt(a * b); };
    const cv = ML.canvas($("[data-canvas]", host), 270, (ctx, W, H) => {
      const x = D.map((d) => d[f]), lo = Math.min(...x), hi = Math.max(...x), half = Math.floor(W / 2) - 6, bins = 10, cnt = new Array(bins).fill(0);
      x.forEach((v) => cnt[Math.min(bins - 1, Math.floor(((v - lo) / (hi - lo || 1)) * bins))]++);
      const P = plane(half, H, [lo, hi], [0, Math.max(...cnt) + 1], { l: 34, r: 6, t: 22, b: 30 });
      ctx.fillStyle = css("--muted"); ctx.font = "12px system-ui"; ctx.textAlign = "center"; ctx.fillText("Histogram of " + F[f], half / 2, 14);
      axes(ctx, P, { nx: 4, ny: 3, fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      cnt.forEach((c, i) => { const x0 = lo + ((hi - lo) * i) / bins, x1 = lo + ((hi - lo) * (i + 1)) / bins; ctx.fillStyle = css("--c1"); ctx.fillRect(P.X(x0) + 1, P.Y(c), P.X(x1) - P.X(x0) - 2, P.Y(0) - P.Y(c)); });
      const ox = half + 12, Q0 = plane(W - ox, H, [lo, hi], [0, 400], { l: 34, r: 6, t: 22, b: 30 });
      ctx.save(); ctx.translate(ox, 0); ctx.fillStyle = css("--muted"); ctx.textAlign = "center"; ctx.fillText(F[f] + " vs price ($k)", (W - ox) / 2, 14);
      axes(ctx, Q0, { nx: 4, ny: 4, fx: (v) => Math.round(v), fy: (v) => Math.round(v) }); D.forEach((d) => dot(ctx, Q0.X(d[f]), Q0.Y(d.price), 3.6, css("--c2"))); ctx.restore();
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host), bs = {};
    function show() { const c = corr(f), s = Math.abs(c) > 0.7 ? "strong" : Math.abs(c) > 0.35 ? "moderate" : "weak"; out.innerHTML = `Correlation of <b>${F[f]}</b> with price: <b>r = ${c.toFixed(2)}</b> → a <b>${s} ${c > 0 ? "positive" : "negative"}</b> relationship. ` + (f === "area" ? "Bigger houses cost more: a very useful feature." : f === "age" ? "Older houses tend to cost less, so it is useful but noisier." : "Bedrooms track area, so they add less <i>new</i> information (features can be correlated with each other too)."); Object.entries(bs).forEach(([k, b]) => b.classList.toggle("on", k === f)); cv.redraw(); }
    Object.keys(F).forEach((k) => (bs[k] = btn(ctl, F[k], () => { f = k; show(); }))); show();
  })();

  /* ---------- Split demo ---------- */
  (function () {
    const host = $("#demo-split"), dots = $("#splitDots"), out = $("[data-out]", host), ctl = $("[data-controls]", host), N = 40;
    let pct = 20, seed = 42; let order;
    function shuffle() { const r = rng(seed * 7919), a = [...Array(N).keys()]; for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } order = a; }
    function render() {
      const nt = Math.round((N * pct) / 100), test = new Set(order.slice(0, nt));
      dots.innerHTML = `<div style="display:grid;grid-template-columns:repeat(20,1fr);gap:5px">${[...Array(N).keys()].map((i) => `<div style="aspect-ratio:1;border-radius:6px;display:grid;place-items:center;font-size:11px;color:#fff;background:${test.has(i) ? "var(--c2)" : "var(--c1)"}">${i}</div>`).join("")}</div>`;
      out.innerHTML = `<code>test_size=${pct / 100}, random_state=${seed}</code> → <b style="color:var(--c1)">${N - nt} training rows</b> and <b style="color:var(--c2)">${nt} test rows</b>. Same <code>random_state</code> = same split every run (reproducible); change it and different rows are held out.`;
    }
    slider(ctl, { label: "test_size", min: 10, max: 50, step: 5, value: pct, fmt: (v) => v + "%", onInput: (v) => { pct = v; render(); } });
    btn(ctl, "🔀 Change random_state", () => { seed = seed === 42 ? 7 : seed === 7 ? 123 : 42; shuffle(); render(); }); shuffle(); render();
  })();

  /* ---------- Regression metrics ---------- */
  (function () {
    const host = $("#demo-reg"), tbl = $("#regTbl"), out = $("[data-out]", host), y = [3, 5, 2.5, 7, 4], p = [2.5, 5, 3, 8, 4.5];
    function render() {
      const n = y.length, ym = ML.mean(y); let ae = 0, se = 0, st = 0;
      const rows = y.map((v, i) => { const e = v - p[i]; ae += Math.abs(e); se += e * e; st += (v - ym) ** 2; return `<tr><td class="num">${v}</td><td><input type="range" min="0" max="10" step="0.5" value="${p[i]}" data-i="${i}" style="width:110px;accent-color:var(--accent)"> <b>${p[i]}</b></td><td class="num">${e.toFixed(1)}</td><td class="num">${Math.abs(e).toFixed(1)}</td><td class="num">${(e * e).toFixed(2)}</td></tr>`; }).join("");
      tbl.innerHTML = `<tr><th class="num">actual y</th><th>predicted ŷ (drag)</th><th class="num">error y−ŷ</th><th class="num">|error|</th><th class="num">error²</th></tr>${rows}<tr><th colspan="3">Sum</th><th class="num">${ae.toFixed(1)}</th><th class="num">${se.toFixed(2)}</th></tr>`;
      tbl.querySelectorAll("input").forEach((el) => el.oninput = () => { p[+el.dataset.i] = +el.value; render(); });
      const mse = se / n, r2 = 1 - se / st;
      out.innerHTML = `MAE = ${ae.toFixed(1)} ÷ ${n} = <b>${(ae / n).toFixed(2)}</b> &nbsp;·&nbsp; MSE = ${se.toFixed(2)} ÷ ${n} = <b>${mse.toFixed(3)}</b> &nbsp;·&nbsp; RMSE = √${mse.toFixed(3)} = <b>${Math.sqrt(mse).toFixed(3)}</b><br>R² = 1 − ${se.toFixed(2)} ÷ ${st.toFixed(2)} (spread around the mean ${ym.toFixed(2)}) = <b>${r2.toFixed(3)}</b>. Predicting the mean (${ym.toFixed(2)}) for every row would give R² = 0, so anything above 0 beats that lazy strategy.`;
    }
    render();
  })();

  /* ---------- Confusion matrix ---------- */
  (function () {
    const host = $("#demo-cls"), cm = $("#cm"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const v = { tp: 8, fp: 2, fn: 4, tn: 86 }, sl = {};
    function render() {
      const { tp, fp, fn, tn } = v, tot = tp + fp + fn + tn, acc = (tp + tn) / tot, pr = tp + fp ? tp / (tp + fp) : 0, rc = tp + fn ? tp / (tp + fn) : 0, f1 = pr + rc ? (2 * pr * rc) / (pr + rc) : 0;
      const c = (t, n, col) => `<td style="text-align:center;background:color-mix(in srgb,${col} 24%,transparent)"><b style="font-size:22px">${n}</b><br><small>${t}</small></td>`;
      cm.innerHTML = `<div class="tw"><table style="max-width:420px;margin:auto"><tr><th></th><th>Predicted Positive</th><th>Predicted Negative</th></tr><tr><th>Actual Positive</th>${c("TP (caught)", tp, "var(--good)")}${c("FN (missed)", fn, "var(--bad)")}</tr><tr><th>Actual Negative</th>${c("FP (false alarm)", fp, "var(--bad)")}${c("TN (correct)", tn, "var(--good)")}</tr></table></div>`;
      const m = (n, x) => `${n} <b>${(x * 100).toFixed(1)}%</b>`;
      out.innerHTML = `${m("Accuracy", acc)} = ${tp + tn}/${tot} &nbsp;·&nbsp; ${m("Precision", pr)} = ${tp}/${tp + fp} &nbsp;·&nbsp; ${m("Recall", rc)} = ${tp}/${tp + fn} &nbsp;·&nbsp; ${m("F1", f1)}` + (acc > 0.9 && rc < 0.3 ? "<br>⚠️ <b>High accuracy but terrible recall</b>: the model looks good only because negatives dominate. This is why accuracy alone can mislead." : "");
    }
    [["tp", "TP", 0, 100], ["fp", "FP", 0, 100], ["fn", "FN", 0, 100], ["tn", "TN", 0, 1000]].forEach(([k, l, a, b]) => (sl[k] = slider(ctl, { label: l, min: a, max: b, step: 1, value: v[k], onInput: (x) => { v[k] = x; render(); } })));
    btn(ctl, "Fraud: always says 'legit'", () => { Object.assign(v, { tp: 0, fp: 0, fn: 10, tn: 990 }); Object.keys(sl).forEach((k) => sl[k].set(v[k])); render(); }, "primary");
    btn(ctl, "Reset", () => { Object.assign(v, { tp: 8, fp: 2, fn: 4, tn: 86 }); Object.keys(sl).forEach((k) => sl[k].set(v[k])); render(); }); render();
  })();

  /* ---------- Drift / monitoring ---------- */
  (function () {
    const host = $("#demo-drift"), r = rng(17), noise = []; for (let i = 0; i < 37; i++) noise.push(randn(r) * 0.006);
    let month = 3, events = [0]; const T = 0.85;
    const acc = (m) => { const last = Math.max(...events.filter((e) => e <= m)); return clamp(0.93 - 0.02 * Math.max(0, m - last - 4) + noise[m], 0.4, 0.99); };
    const cv = ML.canvas($("[data-canvas]", host), 260, (ctx, W, H) => {
      const P = plane(W, H, [0, 36], [0.6, 1], { l: 44, r: 10, t: 12, b: 30 });
      axes(ctx, P, { nx: 6, ny: 4, fx: (v) => Math.round(v), fy: (v) => Math.round(v * 100) + "%", xl: "months since first deployment" });
      line(ctx, P.X(0), P.Y(T), P.X(36), P.Y(T), css("--bad"), 1.5, [6, 4]); ctx.fillStyle = css("--bad"); ctx.font = "12px system-ui"; ctx.textAlign = "right"; ctx.fillText("minimum acceptable 85%", P.X(36) - 4, P.Y(T) - 5);
      events.forEach((e) => { if (e > 0 && e <= month) { line(ctx, P.X(e), P.Y(1), P.X(e), P.Y(0.6), css("--c3"), 1.5, [3, 3]); ctx.fillStyle = css("--c3"); ctx.textAlign = "left"; ctx.fillText("retrained", P.X(e) + 3, P.Y(0.98)); } });
      ctx.beginPath(); for (let m = 0; m <= month; m++) m ? ctx.lineTo(P.X(m), P.Y(acc(m))) : ctx.moveTo(P.X(m), P.Y(acc(m))); ctx.strokeStyle = css("--accent"); ctx.lineWidth = 2.5; ctx.stroke();
      dot(ctx, P.X(month), P.Y(acc(month)), 5.5, acc(month) < T ? css("--bad") : css("--accent"));
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    function show() { const a = acc(month); out.innerHTML = `Month <b>${month}</b>: live accuracy <b>${(a * 100).toFixed(1)}%</b> ` + (a < T ? "🚨 <b>Alert:</b> below the 85% limit → retrain on fresh data." : month - Math.max(...events.filter((e) => e <= month)) > 4 ? "⚠️ Slowly decaying: the world is drifting away from the training data." : "✅ Healthy."); cv.redraw(); }
    const sl = slider(ctl, { label: "Time", min: 0, max: 36, step: 1, value: month, fmt: (v) => v + " mo", onInput: (v) => { month = v; show(); } });
    btn(ctl, "🔁 Retrain now", () => { if (!events.includes(month)) events.push(month); show(); }, "primary");
    btn(ctl, "Reset", () => { events = [0]; month = 3; sl.set(3); show(); }); show();
  })();
});
