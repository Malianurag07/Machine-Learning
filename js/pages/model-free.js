/* Demos for model-free.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const ARROW = ["↑", "↓", "←", "→"], ACT = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const argmax = (arr, r) => { let b = 0, bv = -Infinity; arr.forEach((v, i) => { if (v > bv + 1e-12 || (Math.abs(v - bv) <= 1e-12 && r && r() < 0.5)) { bv = v; b = i; } }); return b; };

  /* ---------- exploration: a 5-armed bandit ---------- */
  (function () {
    const host = $("#demo-bandit"), out = $("[data-out]", host), ctl = $("[data-controls]", host), K = 5;
    let eps = 0.1, seed = 3, means, Qe, Nn, total, pulls, optPulls, r, show_true = false;
    function reset() { r = rng(seed * 101); means = Array.from({ length: K }, () => randn(r)); Qe = new Array(K).fill(0); Nn = new Array(K).fill(0); total = 0; pulls = 0; optPulls = 0; }
    const pull = () => { const a = r() < eps ? Math.floor(r() * K) : argmax(Qe, r), x = means[a] + randn(r); Nn[a]++; Qe[a] += (x - Qe[a]) / Nn[a]; total += x; pulls++; if (a === means.indexOf(Math.max(...means))) optPulls++; };
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 260, (ctx, W, H) => {
      const P = plane(W, H, [0, K], [-2.5, 2.5], { l: 46, r: 14, t: 24, b: 44 }); axes(ctx, P, { nx: K, ny: 5, grid: true, fx: () => "", fy: (v) => v.toFixed(1) });
      const opt = means.indexOf(Math.max(...means));
      for (let a = 0; a < K; a++) { const x0 = P.X(a + 0.15), x1 = P.X(a + 0.85), e = Qe[a]; ctx.fillStyle = a === opt && show_true ? css("--c3") : css("--c1"); ctx.globalAlpha = 0.85; ctx.fillRect(x0, Math.min(P.Y(0), P.Y(e)), x1 - x0, Math.abs(P.Y(e) - P.Y(0))); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.strokeRect(x0, Math.min(P.Y(0), P.Y(e)), x1 - x0, Math.abs(P.Y(e) - P.Y(0)));
        if (show_true) line(ctx, x0 - 4, P.Y(means[a]), x1 + 4, P.Y(means[a]), css("--accent"), 4); ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("arm " + (a + 1), (x0 + x1) / 2, H - 24); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText(Nn[a] + " pulls", (x0 + x1) / 2, H - 8); }
      ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("blue bars = the agent's estimate of each arm's average reward" + (show_true ? " · pink line = the true average" : ""), W / 2, 14);
    });
    function show() {
      const best = Math.max(...means);
      out.innerHTML = `ε = <b>${eps.toFixed(2)}</b>: with probability ε the agent tries a random arm (<em>explore</em>), otherwise the arm with the best estimate so far (<em>exploit</em>). Pulls: <b>${pulls}</b> · average reward per pull: <b>${pulls ? (total / pulls).toFixed(2) : "—"}</b> (the best arm pays ${show_true ? best.toFixed(2) : "?"} on average) · best arm chosen in <b>${pulls ? ((optPulls / pulls) * 100).toFixed(0) : "—"}%</b> of pulls<br>` + (pulls > 30 && eps === 0 ? "Pure greed: the agent often locks onto the first arm that looked good and never learns that another arm is better." : pulls > 200 && eps >= 0.4 ? "Too much exploration: it keeps wasting pulls on bad arms, so its average reward stays low even though its estimates are good." : "Try ε = 0, 0.1 and 0.4 with 1000 pulls each, and reveal the truth to see which arm each run settled on."); cv.redraw();
    }
    const go = (n) => { for (let i = 0; i < n; i++) pull(); show(); };
    btn(ctl, "Pull 1", () => go(1), "primary"); btn(ctl, "Pull 100", () => go(100)); btn(ctl, "Pull 1000", () => go(1000)); btn(ctl, "Restart (same bandit)", () => { reset(); show(); });
    const bt = btn(ctl, "Reveal true averages", () => { show_true = !show_true; bt.textContent = show_true ? "Hide true averages" : "Reveal true averages"; show(); }); btn(ctl, "New bandit", () => { seed++; reset(); show(); });
    slider(ctl, { label: "ε (exploration)", min: 0, max: 0.6, step: 0.01, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; show(); } }); show();
  })();

  /* ---------- Monte Carlo vs TD on the corridor (prediction) ---------- */
  (function () {
    const host = $("#demo-td"), out = $("[data-out]", host), ctl = $("[data-controls]", host), N = 5, slip = 0.2, gamma = 0.9, EP = 300, RUNS = 30;
    let alpha = 0.1, curves, truth;
    const rew = (s2) => -1 + (s2 === 0 ? 5 : s2 === N - 1 ? 10 : 0);
    // exact value of the policy "always try to go right"
    (function () { let V = new Array(N).fill(0); for (let k = 0; k < 3000; k++) { const nv = V.slice(); for (let s = 1; s <= 3; s++) nv[s] = [[1, 1 - slip], [-1, slip]].reduce((t, [d, p]) => { const s2 = s + d; return t + p * (rew(s2) + (s2 === 0 || s2 === N - 1 ? 0 : gamma * V[s2])); }, 0); V = nv; } truth = V; })();
    const episode = (r, s0) => { const tr = []; let s = s0; while (s !== 0 && s !== N - 1) { const s2 = r() < 1 - slip ? s + 1 : s - 1; tr.push([s, rew(s2), s2]); s = s2; } return tr; };
    function experiment() {
      const mc = new Array(EP).fill(0), td = new Array(EP).fill(0), mcc = new Array(EP).fill(0);
      for (let run = 0; run < RUNS; run++) { const r = rng(run * 17 + 3), Vm = new Array(N).fill(0), cnt = new Array(N).fill(0), Vt = new Array(N).fill(0), Vc = new Array(N).fill(0);
        for (let e = 0; e < EP; e++) { const tr = episode(r, 1 + Math.floor(r() * 3));
          // Monte Carlo: first-visit returns, sample average
          let G = 0; const first = {}; tr.forEach(([s], i) => { if (!(s in first)) first[s] = i; }); const rets = new Array(tr.length); for (let i = tr.length - 1; i >= 0; i--) { G = tr[i][1] + gamma * G; rets[i] = G; } Object.entries(first).forEach(([s, i]) => { cnt[s]++; Vm[s] += (rets[i] - Vm[s]) / cnt[s]; Vc[s] += alpha * (rets[i] - Vc[s]); });
          // TD(0): update after every step
          tr.forEach(([s, rw, s2]) => { const nextV = s2 === 0 || s2 === N - 1 ? 0 : Vt[s2]; Vt[s] += alpha * (rw + gamma * nextV - Vt[s]); });
          mc[e] += Math.sqrt(mean([1, 2, 3].map((s) => (Vm[s] - truth[s]) ** 2))) / RUNS; td[e] += Math.sqrt(mean([1, 2, 3].map((s) => (Vt[s] - truth[s]) ** 2))) / RUNS; mcc[e] += Math.sqrt(mean([1, 2, 3].map((s) => (Vc[s] - truth[s]) ** 2))) / RUNS; } }
      curves = { mc, td, mcc };
    }
    experiment();
    const cv = ML.canvas($("[data-canvas]", host), 270, (ctx, W, H) => {
      const P = plane(W, H, [0, EP], [0, 4], { l: 46, r: 14, t: 24, b: 38 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("average error of the value estimates vs the true values (30 runs)", W / 2, 14); axes(ctx, P, { nx: 5, ny: 4, xl: "episodes experienced", yl: "root-mean-square error", fx: (v) => Math.round(v), fy: (v) => v.toFixed(1) });
      [[curves.mc, css("--c1")], [curves.mcc, css("--c3")], [curves.td, css("--accent")]].forEach(([c, col]) => { ctx.beginPath(); c.forEach((v, i) => { const y = P.Y(Math.min(v, 4)); i ? ctx.lineTo(P.X(i + 1), y) : ctx.moveTo(P.X(1), y); }); ctx.strokeStyle = col; ctx.lineWidth = 3.5; ctx.stroke(); });
      ctx.textAlign = "left"; ctx.fillStyle = css("--c1"); ctx.fillText("Monte Carlo, sample average (α = 1/n)", P.X(EP * 0.3), P.Y(3.6)); ctx.fillStyle = css("--c3"); ctx.fillText("Monte Carlo, constant α = " + alpha.toFixed(2), P.X(EP * 0.3), P.Y(3.2)); ctx.fillStyle = css("--accent"); ctx.fillText("TD(0), constant α = " + alpha.toFixed(2), P.X(EP * 0.3), P.Y(2.8));
    });
    function show() {
      const at = (c, e) => c[e - 1].toFixed(2);
      out.innerHTML = `The policy is "always try to go right"; the true values of s1, s2, s3 under it are <b>${[1, 2, 3].map((s) => truth[s].toFixed(3)).join(" · ")}</b>. Error after 10 / 50 / 300 episodes: Monte Carlo (sample average) <b>${at(curves.mc, 10)} / ${at(curves.mc, 50)} / ${at(curves.mc, 300)}</b> · Monte Carlo (constant α) <b>${at(curves.mcc, 10)} / ${at(curves.mcc, 50)} / ${at(curves.mcc, 300)}</b> · TD <b>${at(curves.td, 10)} / ${at(curves.td, 50)} / ${at(curves.td, 300)}</b>.<br>` + (curves.td[299] < curves.mcc[299] * 0.9 && curves.td[49] < curves.mcc[49] ? "With the same constant α, TD's error is lower than Monte Carlo's: less noise per update (one step of randomness instead of a whole episode's worth) wins." : curves.td[299] > curves.mcc[299] * 1.1 ? "Here TD (which starts from a guess of 0 and bootstraps from wrong neighbours) is behind Monte Carlo with the same α: in a tiny problem with short episodes Monte Carlo has little noise to suffer from." : "TD and constant-α Monte Carlo are close at this learning rate.") + " Note the sample-average Monte Carlo (blue) has no learning rate: it uses 1 ÷ (number of visits), which is hard to beat on a problem this small. Move α to see the trade-off between speed and noise."; cv.redraw();
    }
    slider(ctl, { label: "TD learning rate α", min: 0.01, max: 0.5, step: 0.01, value: alpha, fmt: (v) => v.toFixed(2), onInput: (v) => { alpha = v; experiment(); show(); } }); show();
  })();

  /* ---------- SARSA vs Q-learning on the cliff ---------- */
  (function () {
    const host = $("#demo-cliff"), out = $("[data-out]", host), ctl = $("[data-controls]", host), R = 4, C = 12, START = [3, 0], GOAL = [3, 11];
    let eps = 0.1, alpha = 0.5, seed = 1, algs;
    const isCliff = (r, c) => r === 3 && c >= 1 && c <= 10;
    const mk = (name) => ({ name, Q: Array.from({ length: R }, () => Array.from({ length: C }, () => [0, 0, 0, 0])), rets: [], rnd: rng(seed * 7 + name.length) });
    const reset = () => { algs = [mk("Q-learning"), mk("SARSA")]; };
    const mvp = (r, c, a) => { const nr = r + ACT[a][0], nc = c + ACT[a][1]; return nr < 0 || nr >= R || nc < 0 || nc >= C ? [r, c] : [nr, nc]; };
    function train(A, n, sarsa) {
      const pick = (r, c) => (A.rnd() < eps ? Math.floor(A.rnd() * 4) : argmax(A.Q[r][c], A.rnd));
      for (let e = 0; e < n; e++) { let [r, c] = START, a = pick(r, c), G = 0;
        for (let t = 0; t < 500; t++) { let [r2, c2] = mvp(r, c, a), rw = -1; if (isCliff(r2, c2)) { rw = -100; [r2, c2] = START; } const done = r2 === GOAL[0] && c2 === GOAL[1], a2 = pick(r2, c2); G += rw;
          const target = rw + (done ? 0 : sarsa ? A.Q[r2][c2][a2] : Math.max(...A.Q[r2][c2])); A.Q[r][c][a] += alpha * (target - A.Q[r][c][a]); r = r2; c = c2; a = a2; if (done) break; }
        A.rets.push(G); }
    }
    const greedyPath = (A) => { let [r, c] = START; const path = [[r, c]], seen = new Set([r + "," + c]); for (let t = 0; t < 60; t++) { const a = argmax(A.Q[r][c]); let [r2, c2] = mvp(r, c, a); if (isCliff(r2, c2)) { path.push([r2, c2]); return { path, fell: true }; } r = r2; c = c2; path.push([r, c]); if (r === GOAL[0] && c === GOAL[1]) return { path, fell: false, ok: true }; if (seen.has(r + "," + c)) return { path, loop: true }; seen.add(r + "," + c); } return { path, loop: true }; };
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 400, (ctx, W, H) => {
      const gw = (W - 30) / 2, cw = Math.min(gw / C, 40), chh = cw, gh = chh * R;
      algs.forEach((A, k) => {
        const x0 = 10 + k * (gw + 10) + (gw - cw * C) / 2, y0 = 34; ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText(A.name + " (" + A.rets.length + " episodes)", x0 + (cw * C) / 2, 20);
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { ctx.beginPath(); ctx.rect(x0 + c * cw + 1, y0 + r * chh + 1, cw - 2, chh - 2); ctx.fillStyle = isCliff(r, c) ? css("--c2") : css("--surface"); ctx.globalAlpha = isCliff(r, c) ? 0.55 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--border"); ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.font = "700 11px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.fillText("S", x0 + cw / 2, y0 + 3 * chh + chh / 2 + 4); ctx.fillText("G", x0 + 11 * cw + cw / 2, y0 + 3 * chh + chh / 2 + 4); ctx.fillText("cliff", x0 + 5.5 * cw, y0 + 3 * chh + chh / 2 + 4);
        if (A.rets.length) { const g = greedyPath(A); ctx.beginPath(); g.path.forEach(([r, c], i) => { const x = x0 + c * cw + cw / 2, y = y0 + r * chh + chh / 2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4; ctx.stroke(); }
      });
      const P = plane(W, H, [0, Math.max(100, algs[0].rets.length)], [-120, 0], { l: 50, r: 14, t: 34 + 4 * Math.min(((W - 30) / 2 / C), 40) + 40, b: 34 }); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("reward earned per episode while learning (average of the last 20)", W / 2, P.pad.t - 10); axes(ctx, P, { nx: 4, ny: 4, xl: "episodes", fx: (v) => Math.round(v), fy: (v) => Math.round(v) });
      algs.forEach((A, k) => { ctx.beginPath(); A.rets.forEach((_, i) => { const w = A.rets.slice(Math.max(0, i - 19), i + 1), v = clamp(mean(w), -120, 0); i ? ctx.lineTo(P.X(i + 1), P.Y(v)) : ctx.moveTo(P.X(1), P.Y(v)); }); ctx.strokeStyle = k ? css("--c3") : css("--accent"); ctx.lineWidth = 3.5; ctx.stroke(); });
    });
    function show() {
      const n = algs[0].rets.length, avg = (A) => (A.rets.length > 20 ? mean(A.rets.slice(-100)) : NaN), gp = algs.map(greedyPath), desc = (g) => (g.ok ? `reaches the goal in ${g.path.length - 1} steps` : g.fell ? "walks off the cliff" : "gets stuck in a loop");
      out.innerHTML = `After <b>${n}</b> episodes (ε = ${eps.toFixed(2)}, α = ${alpha.toFixed(2)}, γ = 1; every step −1, falling off the cliff −100 and back to the start).<br><b style="color:var(--accent)">Q-learning</b>: online reward over the last 100 episodes <b>${isNaN(avg(algs[0])) ? "—" : avg(algs[0]).toFixed(1)}</b> · its greedy path (orange line) ${n ? desc(gp[0]) : "—"}<br><b style="color:var(--c3)">SARSA</b>: online reward over the last 100 episodes <b>${isNaN(avg(algs[1])) ? "—" : avg(algs[1]).toFixed(1)}</b> · its greedy path (green line) ${n ? desc(gp[1]) : "—"}<br>` + (n >= 300 ? "Q-learning learns the <b>shortest path along the cliff edge</b> (optimal if it never explored), but because it sometimes explores randomly it keeps stepping off the cliff and earns less <em>while learning</em>. SARSA learns the values of the policy it actually follows, exploration included, so it takes a longer, <b>safer path</b> further from the edge and earns more while learning." : "Train a few hundred episodes to see the two paths appear.") + (eps === 0 && n > 50 ? " With ε = 0 there is no exploring at all, so neither method falls: Q-learning's path looks great." : ""); cv.redraw();
    }
    const go = (n) => { train(algs[0], n, false); train(algs[1], n, true); show(); };
    btn(ctl, "Train +100 episodes", () => go(100), "primary"); btn(ctl, "Train +500 episodes", () => go(500)); btn(ctl, "Reset", () => { reset(); show(); });
    slider(ctl, { label: "ε (exploration)", min: 0, max: 0.3, step: 0.01, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; } });
    slider(ctl, { label: "Learning rate α", min: 0.05, max: 1, step: 0.05, value: alpha, fmt: (v) => v.toFixed(2), onInput: (v) => { alpha = v; } }); show();
  })();

  /* ---------- Q-learning converging to the planner's answer ---------- */
  (function () {
    const host = $("#demo-gridq"), out = $("[data-out]", host), ctl = $("[data-controls]", host), R = 3, C = 4, WALL = [1, 1], TERM = { "0,3": 1, "1,3": -1 }, START = [2, 0], live = -0.04, slip = 0.2;
    let alpha = 0.05, eps = 0.5, Q, eps_done = 0, rnd = rng(11), truth;
    const isTerm = (r, c) => TERM[r + "," + c] !== undefined, isWall = (r, c) => r === WALL[0] && c === WALL[1];
    const mv = (r, c, a) => { const nr = r + ACT[a][0], nc = c + ACT[a][1]; return nr < 0 || nr >= R || nc < 0 || nc >= C || isWall(nr, nc) ? [r, c] : [nr, nc]; };
    const sides = (a) => (a < 2 ? [2, 3] : [0, 1]);
    const realStep = (r, c, a) => { const u = rnd(), aa = u < 1 - slip ? a : u < 1 - slip / 2 ? sides(a)[0] : sides(a)[1]; return mv(r, c, aa); };
    (function () { let V = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (isTerm(r, c) ? TERM[r + "," + c] : 0))); for (let k = 0; k < 400; k++) { const nv = V.map((x) => x.slice()); for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { if (isTerm(r, c) || isWall(r, c)) continue; nv[r][c] = Math.max(...[0, 1, 2, 3].map((a) => [[a, 1 - slip], [sides(a)[0], slip / 2], [sides(a)[1], slip / 2]].reduce((t, [aa, p]) => { const [r2, c2] = mv(r, c, aa); return t + p * (live + V[r2][c2]); }, 0))); } V = nv; } truth = V; })();
    const reset = () => { Q = Array.from({ length: R }, () => Array.from({ length: C }, () => [0, 0, 0, 0])); eps_done = 0; rnd = rng(11); };
    function train(n) { for (let e = 0; e < n; e++) { let [r, c] = START; for (let t = 0; t < 300; t++) { const a = rnd() < eps ? Math.floor(rnd() * 4) : argmax(Q[r][c], rnd); const [r2, c2] = realStep(r, c, a), term = isTerm(r2, c2), tv = term ? TERM[r2 + "," + c2] : 0; Q[r][c][a] += alpha * (live + (term ? tv : Math.max(...Q[r2][c2])) - Q[r][c][a]); r = r2; c = c2; if (term) break; } eps_done++; } }
    const V = (r, c) => (isTerm(r, c) ? TERM[r + "," + c] : Math.max(...Q[r][c]));
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 250, (ctx, W, H) => {
      const cw = Math.min((W - 20) / C, 96), ch = Math.min((H - 20) / R, 76), x0 = (W - cw * C) / 2, y0 = (H - ch * R) / 2;
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const x = x0 + c * cw, y = y0 + r * ch; ctx.beginPath(); ctx.rect(x + 2, y + 2, cw - 4, ch - 4); if (isWall(r, c)) { ctx.fillStyle = css("--line"); ctx.fill(); ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.stroke(); continue; }
        const v = V(r, c), t = clamp(Math.abs(v) / 1.2, 0, 1); ctx.fillStyle = v >= 0 ? css("--c3") : css("--c2"); ctx.globalAlpha = isTerm(r, c) ? 0.9 : 0.12 + 0.6 * t; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = isTerm(r, c) ? 4 : 2; ctx.stroke(); ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.font = "700 14px Fredoka, sans-serif";
        if (isTerm(r, c)) ctx.fillText(v > 0 ? "goal +1" : "pit −1", x + cw / 2, y + ch / 2 + 5); else { ctx.fillText(v.toFixed(2), x + cw / 2, y + ch / 2 - 4); ctx.font = "700 20px Fredoka, sans-serif"; ctx.fillText(ARROW[argmax(Q[r][c])], x + cw / 2, y + ch / 2 + 20); ctx.font = "600 10px DM Sans, sans-serif"; ctx.fillStyle = css("--muted"); ctx.textAlign = "right"; ctx.fillText("(" + truth[r][c].toFixed(2) + ")", x + cw - 6, y + 14); } }
    });
    function show() {
      let err = 0; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (!isTerm(r, c) && !isWall(r, c)) err = Math.max(err, Math.abs(V(r, c) - truth[r][c]));
      out.innerHTML = `Q-learning has experienced <b>${eps_done}</b> episodes of real (slippery) moves, with no knowledge of the slip probabilities. Cells show its current value estimate max<sub>a</sub> Q(s, a) and greedy action; the small grey number in brackets is the answer the <em>planner</em> got in the last lesson (value iteration with the full model).<br>Largest gap to the planner's values: <b>${err.toFixed(3)}</b>` + (eps_done < 200 ? ". Press the training buttons: most of the map is still guesswork." : err < 0.12 ? " ✅ Close: learning from experience alone has nearly recovered what planning with the model computed. (Q-learning is off-policy, so it can explore a lot, here ε = 0.5, and still learn the values of the best policy.)" : ". Getting closer: the estimates improve with every episode (they stay a bit noisy with a constant learning rate).") ; cv.redraw();
    }
    btn(ctl, "Train +100 episodes", () => { train(100); show(); }, "primary"); btn(ctl, "Train +2000 episodes", () => { train(2000); show(); }); btn(ctl, "Reset", () => { reset(); show(); });
    slider(ctl, { label: "Learning rate α", min: 0.01, max: 0.5, step: 0.01, value: alpha, fmt: (v) => v.toFixed(2), onInput: (v) => { alpha = v; } });
    slider(ctl, { label: "ε (exploration)", min: 0, max: 0.5, step: 0.05, value: eps, fmt: (v) => v.toFixed(2), onInput: (v) => { eps = v; } }); show();
  })();
});
