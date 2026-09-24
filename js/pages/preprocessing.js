/* Demos for 03b-data-preprocessing.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp } = ML;
  const parse = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const uniqSorted = (a) => [...new Set(a)].sort();
  const input = (host, val, w, ph) => { const i = h("input", { type: "text", value: val, placeholder: ph || "" }); i.style.width = w + "px"; host.append(i); return i; };
  const pill = (t, col) => `<span style="display:inline-block;padding:0 10px;border-radius:99px;border:2px solid var(--line);background:${col || "var(--yellow)"};color:#1d1b1a;font-weight:700">${t}</span>`;
  const R = (v) => (v.startsWith("var(") ? css(v.slice(4, -1)) : v);
  const pal = ["var(--coral)", "var(--yellow)", "var(--pink)", "var(--green)", "var(--blue)", "var(--orange)", "var(--purple)"];

  /* ---------- ASCII ---------- */
  (function () {
    const host = $("#demo-ascii"), tbl = $("#asciiTbl"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const inp = input(ctl, "Male", 260, "type a word");
    function render() {
      const s = inp.value.slice(0, 14);
      tbl.innerHTML = "<tr><th>Character</th>" + [...s].map((c) => `<td style="text-align:center;font:700 22px var(--font-display)">${c === " " ? "␣" : c}</td>`).join("") + "</tr>" +
        "<tr><th>Decimal code</th>" + [...s].map((c) => `<td class="num" style="text-align:center">${c.codePointAt(0)}</td>`).join("") + "</tr>" +
        "<tr><th>Binary</th>" + [...s].map((c) => `<td style="text-align:center;font:12.5px var(--font-mono)">${c.codePointAt(0).toString(2).padStart(8, "0")}</td>`).join("") + "</tr>";
      out.innerHTML = s ? `“${s}” is stored as the numbers <b>${[...s].map((c) => c.codePointAt(0)).join(", ")}</b>. Note that <b>M</b> (77) and <b>m</b> (109) are different numbers: capital letters come first in the code table.` : "Type something.";
    }
    inp.oninput = render; render();
  })();

  /* ---------- Label encoder ---------- */
  (function () {
    const host = $("#demo-label"), tbl = $("#labelTbl"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const inp = input(ctl, "Male, Female, Female, Male", 300, "comma-separated values");
    [["Gender", "Male, Female, Female, Male"], ["Cities", "Pune, Delhi, Mumbai, Delhi, Pune"], ["Tie-break", "Pune, Patna, Delhi, Punjab"], ["Capitals", "apple, Zebra, mango, Banana"]].forEach(([l, v]) => btn(ctl, l, () => { inp.value = v; render(); }));
    function render() {
      const vals = parse(inp.value), cls = uniqSorted(vals);
      tbl.innerHTML = "<tr><th class='num'>row</th><th>original</th><th class='num'>encoded</th></tr>" + vals.map((v, i) => `<tr><td class="num">${i}</td><td>${v}</td><td class="num"><b>${cls.indexOf(v)}</b></td></tr>`).join("");
      out.innerHTML = `<code>classes_ = [${cls.map((c) => "'" + c + "'").join(", ")}]</code> → ` + cls.map((c, i) => pill(`${c} → ${i}`, pal[i % pal.length])).join(" ") + `<br>Result column: <b>[${vals.map((v) => cls.indexOf(v)).join(", ")}]</b>`;
    }
    inp.oninput = render; render();
  })();

  /* ---------- Distance: label vs one-hot ---------- */
  (function () {
    const host = $("#demo-dist"), out = $("[data-out]", host), ctl = $("[data-controls]", host), C = ["Delhi", "Mumbai", "Pune"];
    let a = 0, b = 2;
    const mk = (v) => { const s = h("select"); C.forEach((c, i) => s.append(h("option", { value: i }, c))); s.value = v; ctl.append(s); return s; };
    ctl.append(h("span", { class: "ctl-l", style: "font:600 16px var(--font-display)" }, "Distance between")); const sa = mk(a); ctl.append(h("span", {}, "and")); const sb = mk(b);
    const cv = ML.canvas($("[data-canvas]", host), 250, (ctx, W, H) => {
      const half = W / 2;
      ctx.fillStyle = css("--text"); ctx.font = "700 15px Fredoka, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Label encoded (1-D)", half / 2, 22); ctx.fillText("One-hot encoded (3-D, drawn flat)", half + half / 2, 22);
      const X = (i) => half * 0.18 + (i * half * 0.64) / 2, y0 = 140;
      line(ctx, X(0) - 20, y0, X(2) + 20, y0, css("--line"), 3);
      C.forEach((c, i) => { dot(ctx, X(i), y0, 11, R(pal[i])); ctx.fillStyle = css("--text"); ctx.font = "600 14px DM Sans, sans-serif"; ctx.fillText(c, X(i), y0 + 34); ctx.fillStyle = css("--muted"); ctx.fillText("code " + i, X(i), y0 + 52); });
      if (a !== b) { const yy = y0 - 34; line(ctx, X(a), yy, X(b), yy, css("--coral"), 4); line(ctx, X(a), yy, X(a), y0 - 14, css("--coral"), 3); line(ctx, X(b), yy, X(b), y0 - 14, css("--coral"), 3); ctx.fillStyle = css("--coral"); ctx.font = "700 16px Fredoka, sans-serif"; ctx.fillText("|" + a + " − " + b + "| = " + Math.abs(a - b), (X(a) + X(b)) / 2, yy - 10); }
      const cx = half + half / 2, P = [[cx - 90, 170], [cx + 90, 170], [cx, 60]];
      [[0, 1], [1, 2], [0, 2]].forEach(([i, j]) => { const sel = (i === a && j === b) || (i === b && j === a); line(ctx, P[i][0], P[i][1], P[j][0], P[j][1], sel ? css("--coral") : css("--border"), sel ? 5 : 3, sel ? null : [4, 5]); });
      C.forEach((c, i) => { dot(ctx, P[i][0], P[i][1], 11, R(pal[i])); ctx.fillStyle = css("--text"); ctx.font = "600 14px DM Sans, sans-serif"; const v = [0, 0, 0]; v[i] = 1; ctx.fillText(c + " " + "(" + v.join(",") + ")", P[i][0], P[i][1] + (i === 2 ? -22 : 32)); });
      if (a !== b) { const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2]; ctx.fillStyle = css("--coral"); ctx.font = "700 16px Fredoka, sans-serif"; ctx.fillText("√2 = 1.414", m[0] + (m[1] > 150 ? 0 : (m[0] < cx ? -46 : 46)), m[1] + (m[1] > 150 ? 22 : 0)); }
    });
    function show() {
      a = +sa.value; b = +sb.value;
      out.innerHTML = a === b ? "Same city: distance is <b>0</b> in both encodings." : `<b>${C[a]} ↔ ${C[b]}</b>: label-encoded distance = |${a} − ${b}| = <b>${Math.abs(a - b)}</b> · one-hot distance = √((1−0)² + (0−1)² + 0²) = <b>1.414</b>.<br>` + (Math.abs(a - b) === 2 ? "Label encoding says Delhi and Pune are <b>twice as different</b> as neighbouring cities, which is nonsense; one-hot treats every pair equally." : "Compare with the Delhi ↔ Pune pair: label encoding gives it a different distance for no real reason.");
      cv.redraw();
    }
    sa.onchange = show; sb.onchange = show; show();
  })();

  /* ---------- One-hot ---------- */
  (function () {
    const host = $("#demo-ohe"), tbl = $("#oheTbl"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const inp = input(ctl, "Apple, Orange, Grapes, Apple", 280, "values"); const nameI = input(ctl, "fruits", 90, "column");
    let drop = false, ignore = false;
    const bd = btn(ctl, "drop='first': off", () => { drop = !drop; bd.textContent = "drop='first': " + (drop ? "ON" : "off"); bd.classList.toggle("on", drop); render(); });
    const bi = btn(ctl, "handle_unknown='error'", () => { ignore = !ignore; bi.textContent = "handle_unknown='" + (ignore ? "ignore" : "error") + "'"; bi.classList.toggle("on", ignore); render(); });
    ctl.append(h("span", { class: "ctl-l", style: "font:600 16px var(--font-display)" }, "new value:")); const unk = input(ctl, "Mango", 90, "unseen");
    function render() {
      const vals = parse(inp.value), col = nameI.value.trim() || "col", cats = uniqSorted(vals), used = drop ? cats.slice(1) : cats, names = used.map((c) => col + "_" + c);
      const enc = (v) => used.map((c) => (c === v ? "1.0" : "0.0"));
      tbl.innerHTML = `<tr><th>${col}</th>${names.map((n) => `<th>${n}</th>`).join("")}</tr>` + vals.map((v) => `<tr><td><b>${v}</b></td>${enc(v).map((x) => `<td class="num" style="${x === "1.0" ? "background:color-mix(in srgb,var(--green) 40%,transparent);font-weight:800" : "color:var(--muted)"}">${x}</td>`).join("")}</tr>`).join("");
      const u = unk.value.trim(), seen = cats.includes(u);
      out.innerHTML = `<code>get_feature_names_out() → [${names.map((n) => "'" + n + "'").join(", ")}]</code> · shape <b>(${vals.length}, ${used.length})</b> · ${used.length} column${used.length === 1 ? "" : "s"} for ${cats.length} categories` +
        (drop ? `<br>With <code>drop='first'</code>, <b>${cats[0]}</b> has no column of its own: it is the row where <i>all</i> columns are 0.` : "") +
        (u ? `<br>New value <b>“${u}”</b> at prediction time: ` + (seen ? "already known, so it is encoded normally." : ignore ? `unknown but ignored → row becomes <b>${used.map(() => "0.0").join(", ")}</b> (all zeros).` : `<b style="color:var(--bad)">ValueError: Found unknown categories ['${u}'] in column 0 during transform</b>. Use <code>handle_unknown='ignore'</code>.`) : "");
    }
    [inp, nameI, unk].forEach((i) => (i.oninput = render)); render();
  })();

  /* ---------- Ordinal ---------- */
  (function () {
    const host = $("#demo-ord"), tbl = $("#ordTbl"), out = $("[data-out]", host), ctl = $("[data-controls]", host), box = $("#ordOrder");
    const inp = input(ctl, "high, low, medium, low, high", 300, "values"); let order = [];
    const cats = () => uniqSorted(parse(inp.value));
    function reset(kind) { const c = cats(); if (kind === "smart") { const rank = ["very low", "low", "small", "medium", "high", "large", "very high"]; order = c.slice().sort((x, y) => rank.indexOf(x) - rank.indexOf(y)); } else order = c; render(); }
    btn(ctl, "Alphabetical (sklearn default)", () => reset("alpha")); btn(ctl, "low → medium → high", () => reset("smart"), "primary");
    function render() {
      const c = cats(); if (order.length !== c.length || c.some((x) => !order.includes(x))) order = c.slice();
      box.innerHTML = "<b style='font-family:var(--font-display)'>categories=[[</b>";
      order.forEach((o, i) => {
        const chip = h("span", { style: "display:inline-flex;align-items:center;gap:4px" }); chip.innerHTML = pill(`${i}: ${o}`, pal[i % pal.length]);
        const l = h("button", { class: "btn", style: "padding:0 9px;font-size:14px" }, "◀"), r = h("button", { class: "btn", style: "padding:0 9px;font-size:14px" }, "▶");
        l.onclick = () => { if (i > 0) { [order[i - 1], order[i]] = [order[i], order[i - 1]]; render(); } }; r.onclick = () => { if (i < order.length - 1) { [order[i + 1], order[i]] = [order[i], order[i + 1]]; render(); } };
        chip.append(l, r); box.append(chip);
      });
      box.append(h("b", { style: "font-family:var(--font-display)" }, "]]"));
      const vals = parse(inp.value);
      tbl.innerHTML = "<tr><th>salary</th><th class='num'>sal (encoded)</th></tr>" + vals.map((v) => `<tr><td>${v}</td><td class="num"><b>${order.indexOf(v)}.0</b></td></tr>`).join("");
      const ok = order.join() === "low,medium,high";
      out.innerHTML = `<code>OrdinalEncoder(categories=[[${order.map((o) => "'" + o + "'").join(", ")}]])</code> → ` + (ok ? "✅ the ranking <b>low &lt; medium &lt; high</b> is respected, so distances are meaningful (high is 2 steps from low)." : "⚠️ this order does <b>not</b> match reality, so the model would be told, for example, that “medium” is bigger than “high”. Use ◀ ▶ to fix the order.");
    }
    inp.oninput = () => reset("alpha"); reset("alpha");
  })();

  /* ---------- Encoder chooser ---------- */
  (function () {
    const N = {
      start: { q: "What are you encoding?", o: [["The target column y (the thing to predict)", "target"], ["An input feature (a column of X)", "feature"]] },
      feature: { q: "Do the categories have a natural order or rank?", o: [["Yes: low < medium < high, S < M < L, grades…", "ordinal"], ["No: colours, cities, fruits, gender…", "many"]] },
      many: { q: "How many different categories does the column have?", o: [["A handful (fewer than about 15)", "onehot"], ["Hundreds or thousands (zip code, product id)", "high"], ["Few, but I'm using a tree model (Random Forest / XGBoost) and want to save columns", "tree"]] },
      target: { r: "LabelEncoder", d: "Use <code>LabelEncoder</code> on <code>y</code>: it maps each class to 0…n−1. The order doesn't matter because the model predicts a class, not a distance." },
      ordinal: { r: "OrdinalEncoder", d: "Use <code>OrdinalEncoder(categories=[[...]])</code> and <b>state the order yourself</b>, from lowest to highest." },
      onehot: { r: "OneHotEncoder", d: "Use <code>OneHotEncoder(sparse_output=False, handle_unknown='ignore')</code> (add <code>drop='first'</code> for plain linear/logistic regression)." },
      high: { r: "Frequency / target encoding or grouping", d: "One-hot would explode into thousands of columns. Group rare categories (<code>OneHotEncoder(min_frequency=…)</code>), or use frequency encoding / target encoding (fit inside cross-validation to avoid leakage)." },
      tree: { r: "OrdinalEncoder (as arbitrary integers)", d: "Trees split on thresholds, so integer codes work acceptably. Use <code>OrdinalEncoder()</code> for features. One-hot is still the safe choice." },
    };
    const body = $("#chooseBody"); let path = ["start"];
    function render() {
      const n = N[path[path.length - 1]]; body.innerHTML = "";
      if (n.q) { body.append(h("p", { html: "<b>" + n.q + "</b>" })); n.o.forEach(([t, to]) => { const b = h("button", { class: "btn", style: "display:block;margin:8px 0;text-align:left" }, t); b.onclick = () => { path.push(to); render(); }; body.append(b); }); }
      else body.append(h("div", { class: "callout tip", style: "margin:30px 0 4px" }, h("p", { html: "<b>Use: " + n.r + "</b>" }), h("p", { html: n.d })));
    }
    $("#chooseReset").onclick = () => { path = ["start"]; render(); }; render();
  })();

  /* ---------- Scaling changes nearest neighbour ---------- */
  (function () {
    const host = $("#demo-scale-dist"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const S = { age: { min: 18, max: 70, mu: 40, sd: 12 }, sal: { min: 20000, max: 120000, mu: 60000, sd: 25000 } };
    let mode = "none", bobAge = 55, caraSal = 90000; const modes = { none: "No scaling", minmax: "MinMaxScaler", std: "StandardScaler" }, bs = {};
    const T = (v, k) => (mode === "none" ? v : mode === "minmax" ? (v - S[k].min) / (S[k].max - S[k].min) : (v - S[k].mu) / S[k].sd);
    const people = () => [{ n: "Ann", age: 25, sal: 50000 }, { n: "Bob", age: bobAge, sal: 52000 }, { n: "Cara", age: 26, sal: caraSal }].map((p) => ({ ...p, x: T(p.age, "age"), y: T(p.sal, "sal") }));
    const cv = ML.canvas($("[data-canvas]", host), 280, (ctx, W, H) => {
      const P = people(), xs = P.map((p) => p.x), ys = P.map((p) => p.y), mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
      const sp = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1e-9), pad = 50, k = Math.min(W - 2 * pad, H - 2 * pad) / sp, X = (v) => W / 2 + (v - mx) * k, Y = (v) => H / 2 - (v - my) * k;
      const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y), [A, B, C] = P, near = d(A, B) < d(A, C) ? B : C, far = near === B ? C : B;
      ctx.fillStyle = css("--muted"); ctx.font = "600 13px DM Sans, sans-serif"; ctx.textAlign = "left"; ctx.fillText("x → age (" + modes[mode] + ")   ·   y ↑ salary (" + modes[mode] + ")   ·   both axes drawn at the SAME scale", 12, 20);
      line(ctx, X(A.x), Y(A.y), X(far.x), Y(far.y), css("--border"), 3, [6, 6]); line(ctx, X(A.x), Y(A.y), X(near.x), Y(near.y), css("--good"), 5);
      P.forEach((p, i) => { dot(ctx, X(p.x), Y(p.y), 12, [css("--c1"), css("--c2"), css("--c4")][i]); ctx.fillStyle = css("--text"); ctx.font = "700 15px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.n, X(p.x), Y(p.y) - 20 - (i === 0 ? 0 : 0)); });
    });
    function show() {
      const P = people(), d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y), [A, B, C] = P, dab = d(A, B), dac = d(A, C), f = (v) => (mode === "none" ? v.toFixed(1) : v.toFixed(3));
      const fm = (v) => (mode === "none" ? v.toLocaleString() : v.toFixed(3));
      out.innerHTML = `Ann (25 yrs, ₹50k) · Bob (<b>${bobAge}</b> yrs, ₹52k) · Cara (26 yrs, ₹<b>${caraSal / 1000}k</b>)<br>` +
        `d(Ann,Bob) = √((${fm(A.x)} − ${fm(B.x)})² + (${fm(A.y)} − ${fm(B.y)})²) = <b>${f(dab)}</b><br>d(Ann,Cara) = √((${fm(A.x)} − ${fm(C.x)})² + (${fm(A.y)} − ${fm(C.y)})²) = <b>${f(dac)}</b><br>` +
        `Nearest to Ann: <b style="color:var(--good)">${dab < dac ? "Bob" : "Cara"}</b>` + (mode === "none" ? ` : salary differences (thousands) swamp age differences (tens), so age is effectively ignored, and Bob, who is ${bobAge - 25} years older, looks "most similar".` : " : both features now contribute fairly.");
      Object.entries(bs).forEach(([k, b]) => b.classList.toggle("on", k === mode)); cv.redraw();
    }
    Object.entries(modes).forEach(([k, l]) => (bs[k] = btn(ctl, l, () => { mode = k; show(); })));
    slider(ctl, { label: "Bob's age", min: 25, max: 65, step: 1, value: bobAge, onInput: (v) => { bobAge = v; show(); } });
    slider(ctl, { label: "Cara's salary", min: 50000, max: 120000, step: 1000, value: caraSal, fmt: (v) => v / 1000 + "k", onInput: (v) => { caraSal = v; show(); } });
    show();
  })();

  /* ---------- Scalers vs outlier ---------- */
  (function () {
    const host = $("#demo-scalers"), tbl = $("#scTbl"), out = $("[data-out]", host), ctl = $("[data-controls]", host), base = [25, 32, 38, 45, 52]; let extra = 60;
    const quant = (a, q) => { const s = a.slice().sort((x, y) => x - y), p = (s.length - 1) * q, lo = Math.floor(p); return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (p - lo); };
    const stats = () => { const v = base.concat(extra), n = v.length, mu = ML.mean(v), sd = Math.sqrt(ML.mean(v.map((x) => (x - mu) ** 2))), mn = Math.min(...v), mxv = Math.max(...v), med = quant(v, 0.5), iqr = quant(v, 0.75) - quant(v, 0.25); return { v, mu, sd, mn, mxv, med, iqr }; };
    const rows = [["StandardScaler", (x, s) => (x - s.mu) / s.sd, [-3, 3], "var(--c1)"], ["MinMaxScaler", (x, s) => (x - s.mn) / (s.mxv - s.mn), [0, 1], "var(--c2)"], ["RobustScaler", (x, s) => (x - s.med) / s.iqr, [-3, 3], "var(--c3)"]];
    const cv = ML.canvas($("[data-canvas]", host), 250, (ctx, W, H) => {
      const s = stats(), rh = (H - 20) / 3;
      rows.forEach(([name, fn, r, col], i) => {
        const y = 20 + rh * i + rh * 0.62, x0 = 40, x1 = W - 30, X = (v) => x0 + ((clamp(v, r[0], r[1]) - r[0]) / (r[1] - r[0])) * (x1 - x0);
        ctx.fillStyle = css("--text"); ctx.font = "700 14px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillText(name, x0, y - rh * 0.42);
        line(ctx, x0, y, x1, y, css("--line"), 3);
        for (let t = 0; t <= 4; t++) { const v = r[0] + ((r[1] - r[0]) * t) / 4; line(ctx, X(v), y - 5, X(v), y + 5, css("--line"), 2); ctx.fillStyle = css("--muted"); ctx.font = "600 11px DM Sans, sans-serif"; ctx.textAlign = "center"; ctx.fillText(+v.toFixed(2), X(v), y + 20); }
        s.v.forEach((x, k) => { const t = fn(x, s), out = t > r[1] || t < r[0]; dot(ctx, X(t), y, k === s.v.length - 1 ? 9 : 7, k === s.v.length - 1 ? css("--bad") : R(col)); if (out) { ctx.fillStyle = css("--bad"); ctx.font = "700 12px DM Sans"; ctx.textAlign = "right"; ctx.fillText(t.toFixed(1) + " →", X(t) - 12, y - 10); } });
      });
    });
    function render() {
      const s = stats(), f = (v) => v.toFixed(2);
      tbl.innerHTML = "<tr><th class='num'>age x</th><th class='num'>Standard (x−μ)/σ</th><th class='num'>MinMax</th><th class='num'>Robust (x−median)/IQR</th></tr>" + s.v.map((x, i) => `<tr style="${i === s.v.length - 1 ? "background:color-mix(in srgb,var(--bad) 18%,transparent)" : ""}"><td class="num"><b>${x}</b></td>${rows.map(([, fn]) => `<td class="num">${f(fn(x, s))}</td>`).join("")}</tr>`).join("");
      out.innerHTML = `μ = <b>${f(s.mu)}</b> · σ = <b>${f(s.sd)}</b> · min = ${s.mn}, max = ${s.mxv} · median = <b>${f(s.med)}</b>, IQR = <b>${f(s.iqr)}</b><br>Drag the last person's age up: <b>MinMax squeezes</b> everyone else towards 0, <b>Standard</b> is dragged by the outlier (both μ and σ inflate), while <b>Robust</b> keeps the normal people spread out and simply pushes the outlier far away (red dot). Red dots beyond the axis are clipped and labelled with their true value.`;
      cv.redraw();
    }
    slider(ctl, { label: "Last person's age", min: 55, max: 200, step: 1, value: extra, onInput: (v) => { extra = v; render(); } }); render();
  })();
});
