/* Shared helpers for interactive demos: canvas, axes, controls, RNG, small maths. */
(function () {
  const ML = (window.ML = window.ML || {});

  ML.css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  ML.$ = (s, r) => (r || document).querySelector(s);
  ML.h = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => (k === "class" ? (e.className = v) : k === "html" ? (e.innerHTML = v) : e.setAttribute(k, v)));
    kids.flat().forEach((c) => e.append(c));
    return e;
  };
  /** Run fn once the page shell is built (demos need #lesson elements to exist). */
  ML.ready = (fn) => (document.getElementById("app") ? fn() : document.addEventListener("mlready", fn, { once: true }));

  ML.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  ML.randn = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  ML.clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /** Responsive, HiDPI canvas. draw(ctx, w, h) is re-called on resize / theme change / state.redraw(). */
  ML.canvas = function (host, height, draw) {
    const c = document.createElement("canvas");
    c.className = "viz-canvas"; c.style.height = height + "px";
    host.appendChild(c);
    const st = { c, ctx: c.getContext("2d"), w: 0, h: height, draw };
    st.redraw = () => { st.ctx.clearRect(0, 0, st.w, st.h); st.ctx.lineCap = "round"; st.ctx.lineJoin = "round"; st.draw && st.draw(st.ctx, st.w, st.h); };
    const fit = () => {
      const r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
      if (!r.width) return;
      st.w = r.width; c.width = Math.round(r.width * d); c.height = Math.round(height * d);
      st.ctx.setTransform(d, 0, 0, d, 0, 0); st.redraw();
    };
    new ResizeObserver(fit).observe(c);
    document.addEventListener("themechange", st.redraw);
    st.pos = (ev) => { const r = c.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    fit();
    return st;
  };

  /** Data <-> pixel mapping for a plot area. */
  ML.plane = function (w, h, xr, yr, pad) {
    pad = pad || { l: 42, r: 14, t: 14, b: 32 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    return {
      pad, w, h, xr, yr,
      X: (x) => pad.l + ((x - xr[0]) / (xr[1] - xr[0])) * pw,
      Y: (y) => h - pad.b - ((y - yr[0]) / (yr[1] - yr[0])) * ph,
      iX: (px) => xr[0] + ((px - pad.l) / pw) * (xr[1] - xr[0]),
      iY: (py) => yr[0] + ((h - pad.b - py) / ph) * (yr[1] - yr[0]),
    };
  };
  ML.axes = function (ctx, P, o) {
    o = o || {};
    const border = ML.css("--border"), muted = ML.css("--muted");
    ctx.save(); ctx.lineWidth = 1.2; ctx.setLineDash([2, 5]); ctx.font = "600 12px DM Sans, system-ui"; ctx.fillStyle = muted; ctx.strokeStyle = border;
    const nx = o.nx || 5, ny = o.ny || 4;
    for (let i = 0; i <= nx; i++) {
      const v = P.xr[0] + ((P.xr[1] - P.xr[0]) * i) / nx, x = P.X(v);
      if (o.grid !== false) { ctx.beginPath(); ctx.moveTo(x, P.pad.t); ctx.lineTo(x, P.h - P.pad.b); ctx.stroke(); }
      ctx.textAlign = "center"; ctx.fillText(o.fx ? o.fx(v) : +v.toFixed(2), x, P.h - P.pad.b + 15);
    }
    for (let i = 0; i <= ny; i++) {
      const v = P.yr[0] + ((P.yr[1] - P.yr[0]) * i) / ny, y = P.Y(v);
      if (o.grid !== false) { ctx.beginPath(); ctx.moveTo(P.pad.l, y); ctx.lineTo(P.w - P.pad.r, y); ctx.stroke(); }
      ctx.textAlign = "right"; ctx.fillText(o.fy ? o.fy(v) : +v.toFixed(2), P.pad.l - 6, y + 4);
    }
    ctx.setLineDash([]); ctx.fillStyle = ML.css("--text"); ctx.font = "700 13px Fredoka, DM Sans, system-ui"; ctx.textAlign = "center";
    if (o.xl) ctx.fillText(o.xl, (P.pad.l + P.w - P.pad.r) / 2, P.h - 3);
    if (o.yl) { ctx.save(); ctx.translate(11, (P.pad.t + P.h - P.pad.b) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.yl, 0, 0); ctx.restore(); }
    ctx.restore();
  };
  ML.dot = (ctx, x, y, r, fill, stroke) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2.4; ctx.stroke(); }
    else if (fill && r >= 3) { ctx.strokeStyle = ML.css("--ink"); ctx.lineWidth = 1.6; ctx.stroke(); }
  };
  ML.line = (ctx, x1, y1, x2, y2, col, w, dash) => {
    ctx.save(); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = col; ctx.lineWidth = w || 2;
    if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.restore();
  };

  /** Controls */
  ML.slider = function (host, o) {
    const out = ML.h("output"), inp = ML.h("input", { type: "range", min: o.min, max: o.max, step: o.step || 1, value: o.value });
    const fmt = o.fmt || ((v) => v);
    const upd = () => { out.textContent = fmt(+inp.value); };
    inp.addEventListener("input", () => { upd(); o.onInput && o.onInput(+inp.value); });
    host.append(ML.h("label", { class: "ctl" }, ML.h("span", { class: "ctl-l" }, o.label), inp, out));
    upd();
    return { get: () => +inp.value, set: (v) => { inp.value = v; upd(); }, el: inp };
  };
  ML.btn = (host, text, fn, cls) => { const b = ML.h("button", { class: "btn " + (cls || "") }, text); b.onclick = () => fn(b); host.append(b); return b; };

  /** Solve regularised polynomial least squares. x should be roughly in [-1, 1]. */
  ML.polyfit = function (xs, ys, deg, lam) {
    const n = deg + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
    xs.forEach((x, k) => {
      const p = [1]; for (let i = 1; i < 2 * n; i++) p.push(p[i - 1] * x);
      for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += p[i + j]; A[i][n] += ys[k] * p[i]; }
    });
    for (let i = 0; i < n; i++) A[i][i] += lam || 1e-9;
    for (let i = 0; i < n; i++) {
      let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
      [A[i], A[m]] = [A[m], A[i]];
      for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; }
    }
    const w = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * w[j]; w[i] = s / A[i][i]; }
    return w;
  };
  ML.polyval = (w, x) => { let s = 0, p = 1; for (let i = 0; i < w.length; i++) { s += w[i] * p; p *= x; } return s; };
  ML.mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
})();
