/* Demos for 02-types-of-ml.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn } = ML;
  const pal = () => [css("--c1"), css("--c2"), css("--c3"), css("--c4"), css("--c5"), "#d6549a"];

  /* ---------- Finder ---------- */
  (function () {
    const nodes = {
      start: { q: "Do you have the correct answer (a label) for your training examples?", o: [["Yes, for all of them", "labels"], ["Only for a few", "semi"], ["No labels at all", "nolabel"], ["No dataset: something must learn by acting and getting feedback", "rl"]] },
      labels: { q: "What are you trying to predict?", o: [["A number (price, temperature, marks)", "regression"], ["A category (spam / not spam, species, approve / reject)", "classification"]] },
      nolabel: { q: "What do you want to discover?", o: [["Natural groups of similar items", "clustering"], ["A smaller set of columns that keeps the information", "dimred"], ["Items that frequently occur together", "assoc"]] },
      regression: { r: "Supervised · Regression", d: "Predict a continuous number. Start with Linear Regression, then try Ridge/LASSO, KNN, Random Forest or Gradient Boosting.", c: 1 },
      classification: { r: "Supervised · Classification", d: "Predict a class. Start with Logistic Regression or KNN, then Decision Tree, Random Forest, SVM, Naïve Bayes or boosting.", c: 2 },
      semi: { r: "Semi-supervised learning", d: "Use the few labels plus the structure of the unlabelled data: Label Propagation, Label Spreading, or self-training.", c: 3 },
      clustering: { r: "Unsupervised · Clustering", d: "Group similar samples: K-Means, DBSCAN, Hierarchical Clustering.", c: 0 },
      dimred: { r: "Unsupervised · Dimensionality reduction", d: "Compress features: PCA (unsupervised) or LDA (uses class labels).", c: 0 },
      assoc: { r: "Unsupervised · Association rule learning", d: "Mine 'bought together' patterns with support, confidence and lift (Apriori).", c: 0 },
      rl: { r: "Reinforcement learning", d: "An agent learns a policy from rewards and penalties: model-based or model-free methods such as Q-learning.", c: 4 },
    };
    const body = $("#finderBody"); let path = ["start"];
    function render() {
      const n = nodes[path[path.length - 1]]; body.innerHTML = "";
      if (n.q) {
        body.append(h("p", { html: "<b>" + n.q + "</b>" }));
        n.o.forEach(([t, to]) => { const b = h("button", { class: "btn", style: "display:block;margin:6px 0;text-align:left" }, t); b.onclick = () => { path.push(to); render(); }; body.append(b); });
      } else {
        body.append(h("div", { class: "callout tip", style: "margin:4px 0" }, h("p", { html: "<b>You have a: " + n.r + " problem</b>" }), h("p", {}, n.d)));
      }
    }
    $("#finderReset").onclick = () => { path = ["start"]; render(); }; render();
  })();

  /* ---------- Supervised: regression + classification ---------- */
  (function () {
    const cols = $("#supCols"), out = $("#supOut");
    const A = h("div"), B = h("div"); cols.append(A, B);
    A.append(h("div", { class: "legend", style: "padding:0 0 4px" }, "Regression: house area → price (number)"));
    B.append(h("div", { class: "legend", style: "padding:0 0 4px" }, "Classification: study hours & attendance → pass / fail"));
    // regression data
    const r = rng(21), R = []; for (let i = 0; i < 16; i++) { const x = 600 + r() * 1800; R.push([x, 0.11 * x + 25 + 22 * randn(r)]); }
    const mx = ML.mean(R.map((p) => p[0])), my = ML.mean(R.map((p) => p[1]));
    const m = R.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / R.reduce((s, p) => s + (p[0] - mx) ** 2, 0), c0 = my - m * mx;
    let rp = null, cp = null, P1, P2;
    const c1 = ML.canvas(A, 270, (ctx, W, H) => {
      const P = plane(W, H, [400, 2800], [0, 400], { l: 44, r: 10, t: 10, b: 32 }); P1 = P;
      axes(ctx, P, { nx: 4, ny: 4, xl: "area (sq ft)", yl: "price ($k)", fx: (v) => Math.round(v) });
      line(ctx, P.X(400), P.Y(m * 400 + c0), P.X(2800), P.Y(m * 2800 + c0), css("--accent"), 3);
      R.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, css("--c1")));
      if (rp) { const y = m * rp + c0; line(ctx, P.X(rp), P.Y(0), P.X(rp), P.Y(y), css("--c2"), 1.5, [4, 3]); line(ctx, P.X(400), P.Y(y), P.X(rp), P.Y(y), css("--c2"), 1.5, [4, 3]); dot(ctx, P.X(rp), P.Y(y), 7, css("--c2"), css("--surface")); }
    });
    // classification data
    const C = []; for (let i = 0; i < 16; i++) { C.push([clamp(3 + 1.1 * randn(r), 0.3, 9.7), clamp(60 + 9 * randn(r), 42, 98), 0]); C.push([clamp(7 + 1.1 * randn(r), 0.3, 9.7), clamp(84 + 7 * randn(r), 42, 98), 1]); }
    const cen = [0, 1].map((k) => { const s = C.filter((p) => p[2] === k); return [ML.mean(s.map((p) => p[0])), ML.mean(s.map((p) => p[1]))]; });
    // scale attendance so both axes matter equally
    const dist = (x, y, k) => Math.hypot(x - cen[k][0], (y - cen[k][1]) / 8);
    const cls = (x, y) => (dist(x, y, 1) < dist(x, y, 0) ? 1 : 0);
    const c2 = ML.canvas(B, 270, (ctx, W, H) => {
      const P = plane(W, H, [0, 10], [40, 100], { l: 44, r: 10, t: 10, b: 32 }); P2 = P;
      const step = 10; ctx.globalAlpha = 0.13;
      for (let px = P.pad.l; px < W - P.pad.r; px += step) for (let py = P.pad.t; py < H - P.pad.b; py += step) { ctx.fillStyle = cls(P.iX(px + 5), P.iY(py + 5)) ? css("--c3") : css("--c2"); ctx.fillRect(px, py, step, step); }
      ctx.globalAlpha = 1; axes(ctx, P, { nx: 5, ny: 3, grid: false, xl: "hours studied", yl: "attendance %", fy: (v) => Math.round(v) });
      C.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, p[2] ? css("--c3") : css("--c2")));
      if (cp) dot(ctx, P.X(cp[0]), P.Y(cp[1]), 8, css("--surface"), cls(cp[0], cp[1]) ? css("--c3") : css("--c2"));
      cen.forEach((q, k) => { ctx.fillStyle = k ? css("--c3") : css("--c2"); ctx.font = "bold 12px system-ui"; ctx.textAlign = "center"; ctx.fillText(k ? "PASS" : "FAIL", P.X(q[0]), P.Y(q[1]) + 4); });
    });
    c1.c.addEventListener("pointerdown", (e) => { const p = c1.pos(e); rp = clamp(P1.iX(p.x), 400, 2800); c1.redraw(); out.innerHTML = `Regression: a new house of <b>${Math.round(rp)} sq ft</b> → the model outputs a <b>number</b>: <b>$${(m * rp + c0).toFixed(0)}k</b> (line: price = ${m.toFixed(3)}·area + ${c0.toFixed(1)}).`; });
    c2.c.addEventListener("pointerdown", (e) => { const p = c2.pos(e); cp = [clamp(P2.iX(p.x), 0, 10), clamp(P2.iY(p.y), 40, 100)]; c2.redraw(); out.innerHTML = `Classification: a student with <b>${cp[0].toFixed(1)} h</b> and <b>${cp[1].toFixed(0)}%</b> attendance → the model outputs a <b>category</b>: <b>${cls(cp[0], cp[1]) ? "PASS" : "FAIL"}</b>. (This toy rule picks the nearer class centre; better algorithms come later.)`; });
  })();

  /* ---------- K-means ---------- */
  (function () {
    const host = $("#demo-cluster"), r0 = rng(3), pts = [], centers = [[2.5, 2.5], [7.5, 3], [5, 7.6]];
    centers.forEach((c) => { for (let i = 0; i < 24; i++) pts.push([c[0] + 0.9 * randn(r0), c[1] + 0.9 * randn(r0)]); });
    let K = 3, cent = [], asg = [], phase = "assign", seed = 1, iter = 0, timer = 0, moved = true;
    const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    function init() { const rr = rng(seed * 97 + 5); cent = []; for (let k = 0; k < K; k++) cent.push(pts[Math.floor(rr() * pts.length)].slice()); asg = pts.map(() => -1); phase = "assign"; iter = 0; moved = true; }
    const cv = ML.canvas($("[data-canvas]", host), 300, (ctx, W, H) => {
      const P = plane(W, H, [0, 10], [0, 10], { l: 12, r: 12, t: 10, b: 12 }); const pl = pal();
      ctx.strokeStyle = css("--border"); ctx.strokeRect(P.pad.l, P.pad.t, W - P.pad.l - P.pad.r, H - P.pad.t - P.pad.b);
      pts.forEach((p, i) => { if (asg[i] >= 0) line(ctx, P.X(p[0]), P.Y(p[1]), P.X(cent[asg[i]][0]), P.Y(cent[asg[i]][1]), pl[asg[i]], 0.6); });
      pts.forEach((p, i) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, asg[i] >= 0 ? pl[asg[i]] : css("--muted")));
      cent.forEach((c, k) => { ctx.save(); ctx.translate(P.X(c[0]), P.Y(c[1])); ctx.rotate(Math.PI / 4); ctx.fillStyle = pl[k]; ctx.strokeStyle = css("--text"); ctx.lineWidth = 2; ctx.fillRect(-8, -8, 16, 16); ctx.strokeRect(-8, -8, 16, 16); ctx.restore(); });
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const inertia = () => pts.reduce((s, p, i) => s + (asg[i] >= 0 ? d2(p, cent[asg[i]]) : 0), 0);
    function step() {
      if (phase === "assign") {
        const old = asg.slice(); asg = pts.map((p) => { let b = 0; cent.forEach((c, k) => { if (d2(p, c) < d2(p, cent[b])) b = k; }); return b; });
        moved = old.some((v, i) => v !== asg[i]); phase = "update";
        out.innerHTML = `<b>Assign step:</b> every point joins its nearest centroid (◆). Total squared distance (inertia) = <b>${inertia().toFixed(1)}</b>. Next: <b>update</b> centroids.`;
      } else {
        cent = cent.map((c, k) => { const m = pts.filter((_, i) => asg[i] === k); return m.length ? [ML.mean(m.map((p) => p[0])), ML.mean(m.map((p) => p[1]))] : c; });
        phase = "assign"; iter++;
        out.innerHTML = `<b>Update step (round ${iter}):</b> each centroid moves to the <b>mean</b> of its points. Next: <b>assign</b> again.`;
      }
      cv.redraw();
      if (phase === "assign" && !moved && timer) { stop(); out.innerHTML += " ✅ Converged: no point changed group."; }
    }
    function stop() { clearInterval(timer); timer = 0; runB.textContent = "▶ Run to convergence"; }
    slider(ctl, { label: "Groups K", min: 1, max: 6, step: 1, value: K, onInput: (v) => { stop(); K = v; init(); out.innerHTML = "K changed → new random centroids. Press <b>Step</b>."; cv.redraw(); } });
    btn(ctl, "Step", () => { stop(); step(); }, "primary");
    const runB = btn(ctl, "▶ Run to convergence", () => { if (timer) return stop(); runB.textContent = "❚❚ Pause"; timer = setInterval(step, 500); });
    btn(ctl, "New random start", () => { stop(); seed++; init(); out.innerHTML = "Different starting centroids, and sometimes a different (worse) final answer!"; cv.redraw(); });
    init(); out.innerHTML = "The points have <b>no labels</b> (grey). Press <b>Step</b>: the algorithm alternates <b>assign</b> and <b>update</b>."; cv.redraw();
  })();

  /* ---------- Dimensionality reduction (projection) ---------- */
  (function () {
    const host = $("#demo-dim"), r = rng(9), pts = [];
    for (let i = 0; i < 30; i++) { const a = 2.3 * randn(r); pts.push([a, 0.75 * a + 0.75 * randn(r)]); }
    const mx = ML.mean(pts.map((p) => p[0])), my = ML.mean(pts.map((p) => p[1])); pts.forEach((p) => { p[0] -= mx; p[1] -= my; });
    const va = (f) => ML.mean(pts.map((p) => f(p) ** 2)), tot = va((p) => p[0]) + va((p) => p[1]);
    const sxx = va((p) => p[0]), syy = va((p) => p[1]), sxy = ML.mean(pts.map((p) => p[0] * p[1]));
    const best = ((0.5 * Math.atan2(2 * sxy, sxx - syy)) * 180 / Math.PI + 180) % 180;
    let ang = 20;
    const kept = () => { const t = ang * Math.PI / 180; return va((p) => p[0] * Math.cos(t) + p[1] * Math.sin(t)) / tot; };
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      const side = Math.min(W - 20, H - 16), px = (W - side) / 2, py = (H - side) / 2, R = 6;
      const P = plane(W, H, [-R, R], [-R, R], { l: px, r: px, t: py, b: py });
      ctx.strokeStyle = css("--border"); ctx.strokeRect(px, py, side, side);
      line(ctx, P.X(-R), P.Y(0), P.X(R), P.Y(0), css("--border"), 1); line(ctx, P.X(0), P.Y(-R), P.X(0), P.Y(R), css("--border"), 1);
      const t = ang * Math.PI / 180, u = [Math.cos(t), Math.sin(t)];
      line(ctx, P.X(-8 * u[0]), P.Y(-8 * u[1]), P.X(8 * u[0]), P.Y(8 * u[1]), css("--accent"), 2.5);
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, side, side); ctx.clip();
      pts.forEach((p) => { const s = p[0] * u[0] + p[1] * u[1]; line(ctx, P.X(p[0]), P.Y(p[1]), P.X(s * u[0]), P.Y(s * u[1]), css("--muted"), 1, [3, 3]); });
      pts.forEach((p) => dot(ctx, P.X(p[0]), P.Y(p[1]), 4.5, css("--c1")));
      pts.forEach((p) => { const s = p[0] * u[0] + p[1] * u[1]; dot(ctx, P.X(s * u[0]), P.Y(s * u[1]), 4, css("--c2")); });
      ctx.restore();
      ctx.fillStyle = css("--muted"); ctx.font = "12px system-ui"; ctx.textAlign = "left"; ctx.fillText("blue = original 2D points · orange = their 1D shadow on the line", 10, 14);
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    function show() { const k = kept(); out.innerHTML = `Line angle <b>${ang}°</b> → the 1D version keeps <b>${(k * 100).toFixed(1)}%</b> of the information (variance)<span style="display:block;height:8px;background:var(--surface-2);border-radius:5px;margin-top:6px"><i style="display:block;height:100%;width:${k * 100}%;background:var(--c3);border-radius:5px"></i></span>` + (Math.abs(ang - Math.round(best)) <= 2 ? "<br>✅ This is the best direction, so this is <b>PCA's first principal component</b>." : "<br>Try rotating until the orange dots are as <b>spread out</b> as possible."); cv.redraw(); }
    const sl = slider(ctl, { label: "Rotate line", min: 0, max: 179, step: 1, value: ang, fmt: (v) => v + "°", onInput: (v) => { ang = v; show(); } });
    btn(ctl, "Find the best angle (PCA)", () => { ang = Math.round(best) % 180; sl.set(ang); show(); }, "primary");
    show();
  })();

  /* ---------- Semi-supervised: label propagation on two moons ---------- */
  (function () {
    const host = $("#demo-semi"), r = rng(4), N = 75, pts = [];
    for (let i = 0; i < N; i++) { const t = (Math.PI * i) / (N - 1); pts.push({ x: Math.cos(t) + 0.07 * randn(r), y: Math.sin(t) + 0.07 * randn(r), c: 0 }); }
    for (let i = 0; i < N; i++) { const t = (Math.PI * i) / (N - 1); pts.push({ x: 1 - Math.cos(t) + 0.07 * randn(r), y: 0.5 - Math.sin(t) + 0.07 * randn(r), c: 1 }); }
    const lab = new Map([[37, 0], [N + 37, 1]]), n = pts.length, K = 6;
    const nb = pts.map((p, i) => pts.map((q, j) => [j, (p.x - q.x) ** 2 + (p.y - q.y) ** 2]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, K).map((a) => a[0]));
    const adj = pts.map(() => new Set()); nb.forEach((l, i) => l.forEach((j) => { adj[i].add(j); adj[j].add(i); }));
    let F, mode = "prop", steps = 0, timer = 0;
    function reset() { F = pts.map((_, i) => (lab.has(i) ? (lab.get(i) ? [0, 1] : [1, 0]) : [0, 0])); steps = 0; }
    function prop() {
      F = F.map((f, i) => { if (lab.has(i)) return f; const s = [0, 0]; adj[i].forEach((j) => { s[0] += F[j][0]; s[1] += F[j][1]; }); const d = adj[i].size || 1; return [s[0] / d, s[1] / d]; }); steps++;
    }
    const nn = (i) => { let b = 0, bd = 1e9; [...lab.keys()].forEach((j, k) => { const d = (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2; if (d < bd) { bd = d; b = lab.get(j); } }); return b; };
    const pred = (i) => { if (mode === "nn") return [nn(i), 1]; const f = F[i], s = f[0] + f[1]; return s < 1e-9 ? [-1, 0] : [f[1] > f[0] ? 1 : 0, Math.abs(f[0] - f[1]) / s]; };
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 290, (ctx, W, H) => {
      const yr = [-0.9, 1.4], span = ((W - 20) / (H - 20)) * (yr[1] - yr[0]), P = plane(W, H, [0.5 - span / 2, 0.5 + span / 2], yr, { l: 10, r: 10, t: 10, b: 10 }); const pl = pal();
      pts.forEach((p, i) => { const [c, conf] = pred(i); if (lab.has(i)) return; ctx.globalAlpha = c < 0 ? 1 : 0.35 + 0.65 * conf; dot(ctx, P.X(p.x), P.Y(p.y), 4.2, c < 0 ? css("--muted") : c ? pl[2] : pl[1]); ctx.globalAlpha = 1; });
      lab.forEach((c, i) => { dot(ctx, P.X(pts[i].x), P.Y(pts[i].y), 10, c ? pl[2] : pl[1], css("--text")); ctx.fillStyle = "#fff"; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center"; ctx.fillText("L", P.X(pts[i].x), P.Y(pts[i].y) + 4); });
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    function show() {
      let ok = 0, tot = 0, unk = 0; pts.forEach((p, i) => { if (lab.has(i)) return; const [c] = pred(i); if (c < 0) unk++; else { tot++; if (c === p.c) ok++; } });
      out.innerHTML = (mode === "nn" ? "<b>Only the 2 labels (nearest labelled point wins):</b> " : `<b>Label propagation, step ${steps}:</b> `) + `${tot} points labelled, <b>${tot ? Math.round((ok / tot) * 100) : 0}%</b> correct` + (unk ? `, ${unk} still unknown (grey)` : "") + ".";
      cv.redraw();
    }
    function stop() { clearInterval(timer); timer = 0; runB.textContent = "▶ Run"; }
    btn(ctl, "Spread 1 step", () => { stop(); mode = "prop"; prop(); show(); }, "primary");
    const runB = btn(ctl, "▶ Run", () => { if (timer) return stop(); mode = "prop"; runB.textContent = "❚❚ Pause"; timer = setInterval(() => { prop(); show(); if (steps >= 120) stop(); }, 60); });
    btn(ctl, "Compare: ignore unlabelled structure", () => { stop(); mode = "nn"; show(); });
    btn(ctl, "Reset", () => { stop(); mode = "prop"; reset(); show(); });
    show(); out.innerHTML += " Only the two large circled <b>L</b> points have labels. Press <b>Run</b> and watch labels flow along the moons.";
  })();

  /* ---------- Reinforcement: Q-learning gridworld ---------- */
  (function () {
    const host = $("#demo-rl"), layout = [". . . . . P G", ". # # . # . .", ". . . . # . .", ". # P . . . .", "S # . . . . ."].map((s) => s.split(" "));
    const rows = layout.length, colsN = layout[0].length, dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0], arrow = ["↑", "→", "↓", "←"], an = ["up", "right", "down", "left"];
    let start = [0, 4]; layout.forEach((r, y) => r.forEach((c, x) => { if (c === "S") start = [x, y]; }));
    let Q, agent, alpha = 0.5, gamma = 0.9, eps = 0.2, episodes = 0, lastMsg = "", timer = 0;
    const idx = (x, y) => y * colsN + x, cell = (x, y) => layout[y][x];
    function reset() { Q = Array.from({ length: rows * colsN }, () => [0, 0, 0, 0]); agent = start.slice(); episodes = 0; lastMsg = ""; }
    function move(x, y, a) {
      let nx = x + dx[a], ny = y + dy[a]; if (nx < 0 || ny < 0 || nx >= colsN || ny >= rows || cell(nx, ny) === "#") { nx = x; ny = y; }
      const c = cell(nx, ny); return { nx, ny, r: c === "G" ? 10 : c === "P" ? -10 : -0.2, end: c === "G" || c === "P" };
    }
    const best = (s) => { let b = 0; Q[s].forEach((v, a) => { if (v > Q[s][b]) b = a; }); return b; };
    function act(x, y, rnd) { const s = idx(x, y); return Math.random() < eps ? { a: Math.floor(Math.random() * 4), explore: true } : { a: rnd && Q[s].every((v) => v === Q[s][0]) ? Math.floor(Math.random() * 4) : best(s), explore: false }; }
    function learnStep() {
      const [x, y] = agent, { a, explore } = act(x, y, true), s = idx(x, y), m = move(x, y, a), s2 = idx(m.nx, m.ny);
      const old = Q[s][a], mx = m.end ? 0 : Math.max(...Q[s2]), target = m.r + gamma * mx; Q[s][a] = old + alpha * (target - old);
      lastMsg = `${explore ? "🎲 explored" : "🧠 exploited"}: cell (${x},${y}) action <b>${an[a]}</b> → reward <b>${m.r}</b>, next best Q = ${mx.toFixed(2)}.<br>Target = ${m.r} + ${gamma}×${mx.toFixed(2)} = <b>${target.toFixed(2)}</b> · Q: ${old.toFixed(2)} + ${alpha}×(${target.toFixed(2)} − ${old.toFixed(2)}) = <b>${Q[s][a].toFixed(2)}</b>`;
      agent = m.end ? start.slice() : [m.nx, m.ny]; if (m.end) episodes++;
    }
    function episode() { let p = start.slice(), t = 0; while (t++ < 300) { const { a } = act(p[0], p[1], true), s = idx(p[0], p[1]), m = move(p[0], p[1], a), s2 = idx(m.nx, m.ny); Q[s][a] += alpha * (m.r + gamma * (m.end ? 0 : Math.max(...Q[s2])) - Q[s][a]); p = [m.nx, m.ny]; if (m.end) break; } episodes++; }
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 310, (ctx, W, H) => {
      const cs = Math.min(Math.floor((W - 10) / colsN), Math.floor((H - 10) / rows)), ox = (W - cs * colsN) / 2, oy = (H - cs * rows) / 2;
      for (let y = 0; y < rows; y++) for (let x = 0; x < colsN; x++) {
        const c = cell(x, y), px = ox + x * cs, py = oy + y * cs, s = idx(x, y); let fill = css("--surface"), lbl = "";
        if (c === "#") fill = css("--surface-2"); ctx.fillStyle = fill; ctx.fillRect(px, py, cs, cs);
        if (c === "#") { ctx.fillStyle = css("--muted"); ctx.globalAlpha = 0.35; ctx.fillRect(px + 3, py + 3, cs - 6, cs - 6); ctx.globalAlpha = 1; }
        else if (c === "G" || c === "P") { ctx.fillStyle = c === "G" ? css("--good") : css("--bad"); ctx.globalAlpha = 0.85; ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4); ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.font = "bold 11px system-ui"; ctx.textAlign = "center"; ctx.fillText(c === "G" ? "GOAL +10" : "PIT −10", px + cs / 2, py + cs / 2 + 5); }
        else {
          const mq = Math.max(...Q[s]); if (mq !== 0 || Q[s].some((v) => v !== 0)) { ctx.globalAlpha = clamp(Math.abs(mq) / 8, 0, 0.55); ctx.fillStyle = mq > 0 ? css("--good") : css("--bad"); ctx.fillRect(px, py, cs, cs); ctx.globalAlpha = 1; ctx.fillStyle = css("--text"); ctx.font = "bold 22px system-ui"; ctx.textAlign = "center"; ctx.fillText(arrow[best(s)], px + cs / 2, py + cs / 2 + 8); ctx.font = "10.5px system-ui"; ctx.fillStyle = css("--muted"); ctx.fillText(mq.toFixed(1), px + cs / 2, py + cs - 5); }
          if (c === "S") { ctx.fillStyle = css("--accent"); ctx.font = "bold 11px system-ui"; ctx.textAlign = "left"; ctx.fillText("START", px + 4, py + 12); }
        }
        ctx.strokeStyle = css("--border"); ctx.strokeRect(px, py, cs, cs);
      }
      dot(ctx, ox + agent[0] * cs + cs / 2, oy + agent[1] * cs + cs / 2 - 10, 9, css("--c5"), css("--text"));
    });
    const out = $("[data-out]", host), ctl = $("[data-controls]", host);
    function show() { out.innerHTML = `Episodes trained: <b>${episodes}</b>` + (lastMsg ? "<br>" + lastMsg : episodes ? "<br>Arrows show the best action learned for each cell; colour and number = its value (green good, red bad). Press <b>Watch best path</b>." : "<br>The Q-table is empty: the robot knows nothing. Press <b>One step</b> to see a single update, or train many episodes.") ; cv.redraw(); }
    function stop() { clearInterval(timer); timer = 0; }
    btn(ctl, "One step (see the math)", () => { stop(); learnStep(); show(); }, "primary");
    btn(ctl, "Train 100 episodes", () => { stop(); for (let i = 0; i < 100; i++) episode(); lastMsg = ""; show(); });
    btn(ctl, "Train 1000", () => { stop(); for (let i = 0; i < 1000; i++) episode(); lastMsg = ""; show(); });
    btn(ctl, "🤖 Watch best path", () => {
      stop(); agent = start.slice(); let t = 0; const e0 = eps;
      timer = setInterval(() => { const s = idx(agent[0], agent[1]), m = move(agent[0], agent[1], best(s)); agent = [m.nx, m.ny]; cv.redraw(); if (m.end || ++t > 40) { stop(); lastMsg = m.end ? (cell(m.nx, m.ny) === "G" ? "🎉 Reached the goal following the learned policy." : "💥 Fell in the pit. Train more!") : "Wandering: not trained enough yet."; setTimeout(() => { agent = start.slice(); show(); }, 900); out.innerHTML = lastMsg; } }, 220);
    });
    btn(ctl, "Reset", () => { stop(); reset(); show(); });
    slider(ctl, { label: "Learning rate α", min: 0.1, max: 1, step: 0.1, value: alpha, fmt: (v) => v.toFixed(1), onInput: (v) => (alpha = v) });
    slider(ctl, { label: "Discount γ", min: 0.1, max: 0.99, step: 0.01, value: gamma, fmt: (v) => v.toFixed(2), onInput: (v) => (gamma = v) });
    slider(ctl, { label: "Explore ε", min: 0, max: 1, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => (eps = v) });
    show();
  })();
});
