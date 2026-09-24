/* Demos for model-based.html: value iteration and policy iteration on tiny MDPs */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const fmt = (v) => (Math.abs(v) < 0.0005 ? "0" : v.toFixed(3));

  /* ---------- the corridor (the hand example) ---------- */
  (function () {
    const host = $("#demo-corridor"), out = $("[data-out]", host), ctl = $("[data-controls]", host), N = 5;
    let left = 5, right = 10, slip = 0.2, live = -1, gamma = 0.9, V, k, hist;
    const q = (V, s, a) => { const d = a === "R" ? 1 : -1; return [[d, 1 - slip], [-d, slip]].reduce((t, [dd, p]) => t + p * (live + gamma * V[clamp(s + dd, 0, N - 1)]), 0); };
    function reset() { V = [left, 0, 0, 0, right]; k = 0; hist = [V.slice()]; }
    function sweep() { const nv = V.slice(); for (let s = 1; s < N - 1; s++) nv[s] = Math.max(q(V, s, "L"), q(V, s, "R")); V = nv; k++; hist.push(V.slice()); }
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 250, (ctx, W, H) => {
      const bw = (W - 40) / N, y = 70, bh = 84;
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.fillText("sweep " + k + " · value V(s) of each state and the best action (arrow)", W / 2, 22);
      for (let s = 0; s < N; s++) {
        const x = 20 + s * bw, term = s === 0 || s === N - 1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x + 4, y, bw - 8, bh, 14) : ctx.rect(x + 4, y, bw - 8, bh); ctx.fillStyle = term ? (s === 0 ? css("--c3") : css("--yellow")) : css("--surface"); ctx.globalAlpha = term ? 0.85 : 1; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.fillText(term ? (s === 0 ? "small prize" : "big prize") : "s" + s, x + bw / 2, y + 20); ctx.font = "700 20px Fredoka, sans-serif"; ctx.fillText(V[s].toFixed(2), x + bw / 2, y + 52);
        if (!term) { const a = q(V, s, "R") > q(V, s, "L") ? "R" : "L"; ctx.font = "700 22px Fredoka, sans-serif"; ctx.fillStyle = css("--accent"); ctx.fillText(a === "R" ? "→" : "←", x + bw / 2, y + 78); }
      }
      ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillStyle = css("--muted"); ctx.fillText("terminal states keep the value of their prize", W / 2, y + bh + 26);
    });
    function show() {
      const qs = [1, 2, 3].map((s) => `s${s}: ←&nbsp;${q(V, s, "L").toFixed(3)} , →&nbsp;${q(V, s, "R").toFixed(3)}`);
      out.innerHTML = `Sweep <b>${k}</b>: V = <b>${V.slice(1, 4).map((v) => v.toFixed(4)).join(" · ")}</b> for s1, s2, s3.<br>Action values Q from these numbers (going left | going right): ${qs.join(" · ")}. The next sweep sets each V(s) to the larger of the two.<br>Best actions now: <b>${[1, 2, 3].map((s) => (q(V, s, "R") > q(V, s, "L") ? "→" : "←")).join(" ")}</b> ` + (k >= 12 ? "(the values have stopped changing: converged)" : "(the values are still changing)") + (Math.abs(live) < 0.2 ? "<br>Cheap steps: walking to the far big prize is worth it from everywhere." : live <= -0.9 && left >= 4 && slip > 0.1 ? "<br>Expensive steps (−1 each): from s1 the near small prize now beats the far big one, even though it is smaller." : ""); cv.redraw();
    }
    btn(ctl, "Sweep ▶", () => { sweep(); show(); }, "primary"); btn(ctl, "Run to convergence", () => { for (let i = 0; i < 200; i++) sweep(); show(); }); btn(ctl, "Reset", () => { reset(); show(); });
    slider(ctl, { label: "Cost per step", min: -2, max: 0, step: 0.1, value: live, fmt: (v) => v.toFixed(1), onInput: (v) => { live = v; reset(); show(); } });
    slider(ctl, { label: "Small prize (left)", min: 0, max: 9, step: 1, value: left, onInput: (v) => { left = v; reset(); show(); } });
    slider(ctl, { label: "Slip probability", min: 0, max: 0.5, step: 0.05, value: slip, fmt: (v) => v.toFixed(2), onInput: (v) => { slip = v; reset(); show(); } });
    slider(ctl, { label: "Discount γ", min: 0.5, max: 0.99, step: 0.01, value: gamma, fmt: (v) => v.toFixed(2), onInput: (v) => { gamma = v; reset(); show(); } }); show();
  })();

  /* ---------- the 4 x 3 gridworld ---------- */
  const ROWS = 3, COLS = 4, WALL = [1, 1], TERM = { "0,3": 1, "1,3": -1 }, ACT = [[-1, 0], [1, 0], [0, -1], [0, 1]], ARROW = ["↑", "↓", "←", "→"], START = [2, 0];
  const isTerm = (r, c) => TERM[r + "," + c] !== undefined, isWall = (r, c) => r === WALL[0] && c === WALL[1];
  const mv = (r, c, a) => { const nr = r + ACT[a][0], nc = c + ACT[a][1]; return nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || isWall(nr, nc) ? [r, c] : [nr, nc]; };
  const sides = (a) => (a < 2 ? [2, 3] : [0, 1]);
  const trans = (r, c, a, slip) => [[a, 1 - slip], [sides(a)[0], slip / 2], [sides(a)[1], slip / 2]].map(([aa, p]) => [...mv(r, c, aa), p]);
  const zeroV = () => Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (isTerm(r, c) ? TERM[r + "," + c] : 0)));
  const Q = (V, r, c, a, live, gamma, slip) => trans(r, c, a, slip).reduce((t, [r2, c2, p]) => t + p * (live + gamma * V[r2][c2]), 0);
  const bestA = (V, r, c, live, gamma, slip) => { let b = 0, bv = -Infinity; for (let a = 0; a < 4; a++) { const v = Q(V, r, c, a, live, gamma, slip); if (v > bv + 1e-12) { bv = v; b = a; } } return b; };
  function drawGrid(ctx, W, H, V, pol, path) {
    const cw = Math.min((W - 20) / COLS, 92), ch = Math.min((H - 20) / ROWS, 84), x0 = (W - cw * COLS) / 2, y0 = (H - ch * ROWS) / 2, cx = (r, c) => [x0 + c * cw + cw / 2, y0 + r * ch + ch / 2];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = x0 + c * cw, y = y0 + r * ch; ctx.beginPath(); ctx.rect(x + 2, y + 2, cw - 4, ch - 4);
      if (isWall(r, c)) { ctx.fillStyle = css("--line"); ctx.fill(); ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.stroke(); continue; }
      const v = V[r][c], t = clamp(Math.abs(v) / 1.2, 0, 1); ctx.fillStyle = v >= 0 ? css("--c3") : css("--c2"); ctx.globalAlpha = isTerm(r, c) ? 0.9 : 0.12 + 0.6 * t; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = isTerm(r, c) ? 4 : 2; ctx.stroke();
      ctx.fillStyle = css("--text"); ctx.textAlign = "center"; ctx.font = "700 14px Fredoka, sans-serif"; ctx.fillText(isTerm(r, c) ? (v > 0 ? "goal +1" : "pit −1") : v.toFixed(2), x + cw / 2, y + ch / 2 - (isTerm(r, c) ? 0 : 6));
      if (!isTerm(r, c) && pol) { ctx.font = "700 22px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.fillText(ARROW[pol[r][c]], x + cw / 2, y + ch / 2 + 22); }
      if (r === START[0] && c === START[1]) { ctx.font = "700 11px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "left"; ctx.fillText("start", x + 6, y + 15); }
    }
    if (path && path.length > 1) { ctx.beginPath(); path.forEach(([r, c], i) => { const [px, py] = cx(r, c); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.strokeStyle = css("--accent"); ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]); const [ex, ey] = cx(...path[path.length - 1]); dot(ctx, ex, ey, 8, css("--accent")); }
  }
  const randStep = (r, c, a, slip, rnd) => { const u = rnd(); const aa = u < 1 - slip ? a : u < 1 - slip / 2 ? sides(a)[0] : sides(a)[1]; return mv(r, c, aa); };
  function simulate(pol, live, gamma, slip, rnd, random) {
    let [r, c] = START, G = 0, disc = 1; const path = [[r, c]];
    for (let t = 0; t < 200; t++) { const a = random ? Math.floor(rnd() * 4) : pol[r][c]; G += disc * live; [r, c] = randStep(r, c, a, slip, rnd); disc *= gamma; path.push([r, c]); if (isTerm(r, c)) { G += disc * TERM[r + "," + c]; break; } }
    return { G, path };
  }

  /* ---------- value iteration on the grid ---------- */
  (function () {
    const host = $("#demo-grid"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let live = -0.04, gamma = 1, slip = 0.2, V, pol, sweeps = 0, delta = 0, path = null, seed = 1, stats = null;
    const policyOf = () => Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (isTerm(r, c) || isWall(r, c) ? 0 : bestA(V, r, c, live, gamma, slip))));
    function reset() { V = zeroV(); sweeps = 0; delta = 0; path = null; stats = null; pol = policyOf(); }
    function sweep() { const nv = V.map((r) => r.slice()); delta = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (isTerm(r, c) || isWall(r, c)) continue; let b = -Infinity; for (let a = 0; a < 4; a++) b = Math.max(b, Q(V, r, c, a, live, gamma, slip)); nv[r][c] = b; delta = Math.max(delta, Math.abs(b - V[r][c])); } V = nv; sweeps++; pol = policyOf(); path = null; stats = null; }
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 280, (ctx, W, H) => drawGrid(ctx, W, H, V, pol, path));
    function show() {
      out.innerHTML = `Sweeps done: <b>${sweeps}</b> · largest change in the last sweep: <b>${sweeps ? delta.toFixed(4) : "—"}</b> · value at the start cell: <b>${V[START[0]][START[1]].toFixed(3)}</b><br>Each cell shows its value V(s) (green = good, pink = bad) and the best action (arrow). The agent moves as intended with probability ${(1 - slip).toFixed(2)} and slips sideways otherwise; each step costs ${(-live).toFixed(2)} and the discount is γ = ${gamma.toFixed(2)}.` + (sweeps >= 1 && live === -0.04 && gamma === 1 && slip === 0.2 && delta < 1e-4 ? "<br>✅ These are the classic textbook values for this problem (0.812, 0.868, 0.918 / 0.762, 0.660 / 0.705, 0.655, 0.611, 0.388)." : "") + (stats ? `<br>Average discounted return over ${stats.n} episodes: <b>following the plan ${stats.opt.toFixed(3)}</b> (the value of the start cell predicts ${V[START[0]][START[1]].toFixed(3)}) · <b>random moves ${stats.rnd.toFixed(3)}</b>.` : "") + (path ? `<br>One episode (dashed line): ${path.length - 1} steps, return ${path.G.toFixed(3)}.` : "") + (live <= -1 ? "<br>Steps are so expensive that the agent hurries to end the episode, even in the pit." : live > 0 ? "<br>Each step pays a reward, so the agent avoids the goal and pit and wanders forever." : ""); cv.redraw();
    }
    btn(ctl, "Sweep ▶", () => { sweep(); show(); }, "primary"); btn(ctl, "Run to convergence", () => { let g = 0; do { sweep(); } while (delta > 1e-6 && g++ < 3000); show(); }); btn(ctl, "Reset", () => { reset(); show(); });
    btn(ctl, "Run one episode", () => { const rnd = rng(seed++ * 977), s = simulate(pol, live, gamma, slip, rnd, false); path = s.path; path.G = s.G; show(); });
    btn(ctl, "Compare over 1000 episodes", () => { const rnd = rng(31), n = 1000; let a = 0, b = 0; for (let i = 0; i < n; i++) { a += simulate(pol, live, gamma, slip, rnd, false).G; b += simulate(pol, live, gamma, slip, rnd, true).G; } stats = { n, opt: a / n, rnd: b / n }; path = null; show(); });
    slider(ctl, { label: "Cost per step", min: -2, max: 0.1, step: 0.02, value: live, fmt: (v) => v.toFixed(2), onInput: (v) => { live = v; reset(); show(); } });
    slider(ctl, { label: "Discount γ", min: 0.5, max: 1, step: 0.01, value: gamma, fmt: (v) => v.toFixed(2), onInput: (v) => { gamma = v; reset(); show(); } });
    slider(ctl, { label: "Slip probability", min: 0, max: 0.5, step: 0.05, value: slip, fmt: (v) => v.toFixed(2), onInput: (v) => { slip = v; reset(); show(); } }); show();
  })();

  /* ---------- policy iteration on the grid ---------- */
  (function () {
    const host = $("#demo-policyit"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let live = -0.04, gamma = 0.9, slip = 0.2, V, pol, rounds, evalSweeps, log;
    function reset() { V = zeroV(); pol = Array.from({ length: ROWS }, () => new Array(COLS).fill(0)); rounds = 0; evalSweeps = 0; log = "We start with a foolish policy: always go up. Its values are all zero because nothing has been evaluated yet."; }
    const evalSweep = () => { const nv = V.map((r) => r.slice()); let d = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (isTerm(r, c) || isWall(r, c)) continue; nv[r][c] = Q(V, r, c, pol[r][c], live, gamma, slip); d = Math.max(d, Math.abs(nv[r][c] - V[r][c])); } V = nv; evalSweeps++; return d; };
    const evalFull = () => { let g = 0, d; do { d = evalSweep(); } while (d > 1e-7 && g++ < 5000); };
    const improve = () => { let changed = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (isTerm(r, c) || isWall(r, c)) continue; const b = bestA(V, r, c, live, gamma, slip); if (Q(V, r, c, b, live, gamma, slip) > Q(V, r, c, pol[r][c], live, gamma, slip) + 1e-9) { pol[r][c] = b; changed++; } } return changed; };
    reset();
    const cv = ML.canvas($("[data-canvas]", host), 280, (ctx, W, H) => drawGrid(ctx, W, H, V, pol, null));
    function show() { out.innerHTML = `Policy-improvement rounds so far: <b>${rounds}</b> · evaluation sweeps so far: <b>${evalSweeps}</b><br>${log}<br>Arrows = the current policy; numbers = the value of each cell <em>if the agent follows this policy</em> (V<sup>π</sup>). Alternate the two moves: <b>evaluate</b> (measure how good the policy is), <b>improve</b> (in every cell switch to the action that looks best given those values).`; cv.redraw(); }
    btn(ctl, "1. Evaluate policy (until stable)", () => { evalFull(); log = "Evaluated the current policy exactly (to 7 decimals). Now improve it."; show(); }, "primary");
    btn(ctl, "2. Improve policy", () => { const ch = improve(); rounds++; log = ch ? `Improved: the policy changed in <b>${ch}</b> cell${ch === 1 ? "" : "s"}. Evaluate it again.` : "✅ <b>No cell wants to change: the policy is stable, hence optimal.</b>"; show(); });
    btn(ctl, "Run automatically", () => { let g = 0, ch; do { evalFull(); ch = improve(); rounds++; } while (ch && g++ < 60); evalFull(); log = `✅ Converged after <b>${rounds}</b> improvement rounds (the last one changed nothing): the optimal policy.`; show(); }); btn(ctl, "Reset", () => { reset(); show(); });
    slider(ctl, { label: "Cost per step", min: -0.5, max: 0, step: 0.02, value: live, fmt: (v) => v.toFixed(2), onInput: (v) => { live = v; reset(); show(); } });
    slider(ctl, { label: "Slip probability", min: 0, max: 0.5, step: 0.05, value: slip, fmt: (v) => v.toFixed(2), onInput: (v) => { slip = v; reset(); show(); } }); show();
  })();
});
