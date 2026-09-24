/* Small kernel SVM (simplified SMO) for the browser demos. Works in Node too (for testing). */
(function () {
  const ML = typeof window !== "undefined" ? (window.ML = window.ML || {}) : module.exports;
  const mulberry = (s) => { let a = s >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const sq = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return s; };

  /** kernel factory: type "linear" | "rbf" | "poly" */
  ML.svmKernel = function (type, gamma, degree) {
    if (type === "rbf") return (a, b) => Math.exp(-gamma * sq(a, b));
    if (type === "poly") return (a, b) => (gamma * dot(a, b) + 1) ** (degree || 3);
    return (a, b) => dot(a, b);
  };

  /** Train. X: array of vectors, y: array of +1 / -1. */
  ML.svmTrain = function (X, y, kern, C, o) {
    o = o || {};
    const n = X.length, tol = o.tol || 1e-3, maxPasses = o.maxPasses || 6, maxSweeps = o.maxSweeps || 300, rnd = mulberry(o.seed || 1);
    const K = Array.from({ length: n }, (_, i) => { const r = new Float64Array(n); for (let j = 0; j < n; j++) r[j] = kern(X[i], X[j]); return r; });
    const a = new Float64Array(n); let b = 0;
    const f = (i) => { let s = b; for (let k = 0; k < n; k++) if (a[k]) s += a[k] * y[k] * K[k][i]; return s; };
    let passes = 0, sweeps = 0;
    while (passes < maxPasses && sweeps++ < maxSweeps) {
      let changed = 0;
      for (let i = 0; i < n; i++) {
        const Ei = f(i) - y[i];
        if ((y[i] * Ei < -tol && a[i] < C) || (y[i] * Ei > tol && a[i] > 0)) {
          let j = Math.floor(rnd() * (n - 1)); if (j >= i) j++;
          const Ej = f(j) - y[j], ai = a[i], aj = a[j]; let L, H;
          if (y[i] !== y[j]) { L = Math.max(0, aj - ai); H = Math.min(C, C + aj - ai); } else { L = Math.max(0, ai + aj - C); H = Math.min(C, ai + aj); }
          if (L === H) continue;
          const eta = 2 * K[i][j] - K[i][i] - K[j][j]; if (eta >= 0) continue;
          let nj = aj - (y[j] * (Ei - Ej)) / eta; nj = Math.min(H, Math.max(L, nj)); if (Math.abs(nj - aj) < 1e-6) continue;
          const ni = ai + y[i] * y[j] * (aj - nj);
          const b1 = b - Ei - y[i] * (ni - ai) * K[i][i] - y[j] * (nj - aj) * K[i][j], b2 = b - Ej - y[i] * (ni - ai) * K[i][j] - y[j] * (nj - aj) * K[j][j];
          a[i] = ni; a[j] = nj; b = ni > 0 && ni < C ? b1 : nj > 0 && nj < C ? b2 : (b1 + b2) / 2; changed++;
        }
      }
      passes = changed === 0 ? passes + 1 : 0;
    }
    const sv = []; for (let i = 0; i < n; i++) if (a[i] > 1e-6) sv.push(i);
    const dec = (x) => { let s = b; for (const k of sv) s += a[k] * y[k] * kern(X[k], x); return s; };
    let w = null; if (X.length && o.linear) { w = new Array(X[0].length).fill(0); sv.forEach((k) => X[k].forEach((v, d) => (w[d] += a[k] * y[k] * v))); }
    return { a, b, sv, dec, w, X, y, C };
  };
})();
