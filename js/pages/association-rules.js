/* Demos for association-rules.html */
ML.ready(function () {
  const { $, h, css, plane, axes, dot, line, slider, btn, clamp, rng, randn, mean } = ML;
  const pop = (m) => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };

  /* ---------- a shop with 8 products: synthetic baskets with a few built-in habits ---------- */
  const ITEMS = [["bread", "🍞"], ["butter", "🧈"], ["milk", "🥛"], ["eggs", "🥚"], ["cola", "🥤"], ["chips", "🥔"], ["beer", "🍺"], ["diapers", "🧷"]], NI = ITEMS.length;
  function baskets(seed, N) {
    const r = rng(seed * 131), out = [];
    while (out.length < N) {
      const has = new Array(NI).fill(false), b = r() < 0.5; has[0] = b; has[1] = r() < (b ? 0.62 : 0.08); has[7] = r() < 0.12; has[6] = r() < 0.2; has[4] = r() < 0.3; has[5] = r() < (has[6] ? 0.65 : 0.16) || (has[4] && r() < 0.25); has[2] = r() < (has[7] ? 0.75 : has[4] ? 0.15 : 0.5); has[3] = r() < 0.28;
      const m = has.reduce((s, v, i) => s + (v ? 1 << i : 0), 0); if (m) out.push(m);
    }
    return out;
  }
  const cnt = (B, mask) => B.reduce((s, b) => s + ((b & mask) === mask ? 1 : 0), 0);
  const names = (mask) => ITEMS.filter((_, i) => mask & (1 << i)).map((x) => x[1] + x[0]).join(" + ");

  /* ---------- support, confidence, lift calculator ---------- */
  (function () {
    const host = $("#demo-calc"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let B = baskets(1, 400), X = 1 << 0, Y = 1 << 1, seed = 1;
    const chips = h("div", { style: "display:contents" }); ctl.append(chips);
    const cv = ML.canvas($("[data-canvas]", host), 240, (ctx, W, H) => {
      const N = B.length, nx = cnt(B, X), ny = cnt(B, Y), nxy = cnt(B, X | Y), sc = (W - 40) / N, y0 = 30, bh = 30;
      ctx.font = "700 13px Fredoka, sans-serif"; ctx.fillStyle = css("--text"); ctx.textAlign = "left"; ctx.fillText("all " + N + " baskets (each bar is scaled to that share of the shop)", 20, 18);
      const bar = (y, w, col, label, x0) => { ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(20 + (x0 || 0), y, Math.max(w, 1), bh); ctx.globalAlpha = 1; ctx.strokeStyle = css("--ink"); ctx.lineWidth = 2; ctx.strokeRect(20 + (x0 || 0), y, Math.max(w, 1), bh); ctx.fillStyle = css("--text"); ctx.font = "700 12px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillText(label, 26 + (x0 || 0) + (w < 150 ? Math.max(w, 1) : 0), y + 19); };
      ctx.strokeStyle = css("--border"); ctx.lineWidth = 2; ctx.strokeRect(20, y0, W - 40, bh); ctx.fillStyle = css("--muted"); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText("everyone", 26, y0 + 19);
      bar(y0 + 44, nx * sc, css("--c3"), "bought X: " + nx, 0); bar(y0 + 88, ny * sc, css("--c2"), "bought Y: " + ny, 0); bar(y0 + 132, nxy * sc, css("--accent"), "bought X and Y: " + nxy, 0);
    });
    function render() {
      chips.innerHTML = ""; ITEMS.forEach(([n, e], i) => { const b = h("button", { class: "btn" + ((X >> i) & 1 || (Y >> i) & 1 ? " primary" : ""), title: "click: none → X (left side) → Y (right side) → none" }, e + " " + n + ((X >> i) & 1 ? "  [X]" : (Y >> i) & 1 ? "  [Y]" : "")); b.onclick = () => { const inX = (X >> i) & 1, inY = (Y >> i) & 1; if (!inX && !inY) X |= 1 << i; else if (inX) { X &= ~(1 << i); Y |= 1 << i; } else Y &= ~(1 << i); render(); show(); }; chips.append(b); });
    }
    function show() {
      const N = B.length, nx = cnt(B, X), ny = cnt(B, Y), nxy = cnt(B, X | Y);
      if (!X || !Y) { out.innerHTML = "Click products to build a rule: first click puts a product on the left side <b>[X]</b> (the antecedent, \"if they buy ...\"), second click moves it to the right side <b>[Y]</b> (the consequent, \"... then they also buy\"), third click removes it."; cv.redraw(); return; }
      const sup = nxy / N, conf = nx ? nxy / nx : 0, lift = ny && nx ? conf / (ny / N) : 0, lev = sup - (nx / N) * (ny / N);
      out.innerHTML = `<b>Rule: ${names(X)} → ${names(Y)}</b> (${N} baskets)<br>support = baskets with both ÷ all baskets = ${nxy} ÷ ${N} = <b>${sup.toFixed(3)}</b><br>confidence = baskets with both ÷ baskets with X = ${nxy} ÷ ${nx} = <b>${conf.toFixed(3)}</b><br>lift = confidence ÷ (share of baskets with Y) = ${conf.toFixed(3)} ÷ ${(ny / N).toFixed(3)} = <b>${lift.toFixed(2)}</b> (leverage ${lev >= 0 ? "+" : ""}${lev.toFixed(3)})<br>` + (nxy < 8 ? "🟨 Very few baskets support this rule: the numbers are unreliable. " : "") + (lift > 1.2 ? "✅ <b>Lift above 1</b>: buyers of X are noticeably more likely than average to buy Y." : lift < 0.85 ? "🟥 <b>Lift below 1</b>: buying X makes Y <em>less</em> likely than usual (they tend not to go together)." : "⚪ <b>Lift about 1</b>: X tells you nothing about Y, however high the confidence looks."); cv.redraw();
    }
    btn(ctl, "New random shop", () => { seed++; B = baskets(seed, 400); show(); }, "primary"); render(); show();
  })();

  /* ---------- Apriori level by level, on the hand example ---------- */
  (function () {
    const host = $("#demo-apriori"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    const names5 = ["bread", "butter", "milk", "eggs", "cola"], T = [[0, 1, 2], [0, 1], [0, 1, 3], [2, 3], [0, 1, 2, 3], [2], [0, 1], [2, 3, 4], [0, 2, 4], [0, 1, 3]].map((t) => t.reduce((s, i) => s + (1 << i), 0));
    let minC = 3, shown = 1, levels;
    const lbl = (mask) => names5.filter((_, i) => mask & (1 << i)).map((n) => n[0].toUpperCase() + n.slice(1, 3)).join("+");
    function mine() {
      levels = []; const c1 = names5.map((_, i) => ({ mask: 1 << i, c: cnt(T, 1 << i), skipped: false })); c1.forEach((x) => (x.freq = x.c >= minC)); levels.push(c1);
      let freqPrev = c1.filter((x) => x.freq), items = freqPrev.map((x) => x.mask);
      for (let k = 2; k <= 5 && freqPrev.length; k++) {
        const combos = []; (function rec(start, mask, size) { if (size === k) { combos.push(mask); return; } for (let i = start; i < items.length; i++) rec(i + 1, mask | items[i], size + 1); })(0, 0, 0);
        const prevSet = new Set(freqPrev.map((x) => x.mask)), lv = combos.map((mask) => { const subs = names5.map((_, i) => i).filter((i) => mask & (1 << i)).map((i) => mask & ~(1 << i)), skipped = subs.some((s) => !prevSet.has(s)), bad = subs.find((s) => !prevSet.has(s)); return { mask, skipped, bad, c: skipped ? cnt(T, mask) : cnt(T, mask), freq: false }; });
        lv.forEach((x) => (x.freq = !x.skipped && x.c >= minC)); if (!lv.length) break; levels.push(lv); freqPrev = lv.filter((x) => x.freq);
      }
    }
    mine();
    const cv = ML.canvas($("[data-canvas]", host), 340, (ctx, W, H) => {
      const cw = (W - 12) / 4, rh = 25;
      levels.forEach((lv, li) => { if (li >= 4) return; const x = 6 + li * cw; ctx.font = "700 13px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = css("--text"); ctx.fillText(li === 0 ? "level 1: single items" : "level " + (li + 1) + ": " + (li + 1) + " items", x + cw / 2 - 2, 16);
        if (li + 1 > shown) { ctx.fillStyle = css("--muted"); ctx.font = "600 12px DM Sans, sans-serif"; ctx.fillText("not reached yet", x + cw / 2, 50); return; }
        lv.slice(0, 11).forEach((c, i) => { const y = 26 + i * (rh + 2), bw = cw - 8; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, bw, rh, 8) : ctx.rect(x, y, bw, rh); ctx.fillStyle = c.skipped ? css("--surface") : c.freq ? css("--c3") : css("--line"); ctx.globalAlpha = c.skipped ? 1 : c.freq ? 0.9 : 0.5; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = c.skipped ? css("--muted") : css("--ink"); ctx.lineWidth = 2; if (c.skipped) ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = c.skipped ? css("--muted") : css("--text"); ctx.font = "700 11px Fredoka, sans-serif"; ctx.textAlign = "left"; ctx.fillText(lbl(c.mask), x + 6, y + 16); ctx.textAlign = "right"; ctx.fillText(c.skipped ? "skipped" : c.c + " (" + Math.round(c.c * 10) + "%)", x + bw - 6, y + 16); });
        if (lv.length > 11) { ctx.fillStyle = css("--muted"); ctx.textAlign = "center"; ctx.fillText("+ " + (lv.length - 11) + " more", x + cw / 2, 26 + 11 * (rh + 2) + 12); } });
    });
    function show() {
      const lv = levels[Math.min(shown, levels.length) - 1], counted = levels.slice(0, shown).reduce((s, l) => s + l.filter((x) => !x.skipped).length, 0), skipped = levels.slice(0, shown).reduce((s, l) => s + l.filter((x) => x.skipped).length, 0), freqAll = levels.slice(0, shown).reduce((s, l) => s + l.filter((x) => x.freq).length, 0), last = shown >= levels.length;
      const ex = lv.find((x) => x.skipped);
      out.innerHTML = `Minimum support: <b>${minC}</b> of 10 baskets (${minC * 10}%). Green = frequent (kept), grey = counted but too rare, dashed = <b>skipped without counting</b> because one of its smaller subsets was already too rare.<br>Level ${Math.min(shown, levels.length)}: ${lv.length} candidate${lv.length === 1 ? "" : "s"}, ${lv.filter((x) => x.freq).length} frequent, ${lv.filter((x) => x.skipped).length} skipped.` + (ex && shown > 1 ? ` For example <b>${lbl(ex.mask)}</b> is never counted: its subset ${lbl(ex.bad)} is already infrequent, so it cannot be frequent either.` : "") + `<br>So far: <b>${freqAll}</b> frequent itemsets found, <b>${counted}</b> itemsets counted against the data, <b>${skipped}</b> skipped (out of the 31 possible non-empty itemsets of 5 products).` + (last ? " <b>Done:</b> no larger candidates can be formed." : " Press the button for the next level."); cv.redraw();
    }
    btn(ctl, "Next level ▶", () => { if (shown < levels.length) shown++; show(); }, "primary"); btn(ctl, "Run all levels", () => { shown = levels.length; show(); }); btn(ctl, "Reset", () => { shown = 1; show(); });
    slider(ctl, { label: "Min support (baskets)", min: 1, max: 7, step: 1, value: minC, onInput: (v) => { minC = v; mine(); shown = Math.min(shown, levels.length); show(); } }); show();
  })();

  /* ---------- every rule of a shop as a dot ---------- */
  (function () {
    const host = $("#demo-rules"), out = $("[data-out]", host), ctl = $("[data-controls]", host);
    let seed = 2, B, rules, minS = 0.05, minC = 0.4, minL = 1.2, sel = null, lastQ, shownRules;
    function mine() {
      B = baskets(seed, 400); const N = B.length; rules = []; const c = new Array(1 << NI).fill(0); for (let m = 1; m < 1 << NI; m++) c[m] = cnt(B, m);
      for (let I = 1; I < 1 << NI; I++) { if (pop(I) < 2 || c[I] / N < 0.02) continue; for (let X = (I - 1) & I; X > 0; X = (X - 1) & I) { const Y = I & ~X; rules.push({ X, Y, sup: c[I] / N, conf: c[I] / c[X], lift: c[I] / c[X] / (c[Y] / N) }); } }
    }
    mine();
    const refilter = () => { shownRules = rules.filter((r) => r.sup >= minS && r.conf >= minC && r.lift >= minL); };
    const cv = ML.canvas($("[data-canvas]", host), 320, (ctx, W, H) => {
      refilter(); const P = plane(W, H, [0, 0.4], [0, 1.02], { l: 46, r: 14, t: 14, b: 38 }); lastQ = P; axes(ctx, P, { nx: 4, ny: 5, xl: "support (how common)", yl: "confidence", fx: (v) => v.toFixed(2), fy: (v) => v.toFixed(1) });
      rules.filter((r) => !shownRules.includes(r)).forEach((r) => { ctx.globalAlpha = 0.18; dot(ctx, P.X(clamp(r.sup, 0, 0.4)), P.Y(r.conf), 3, css("--muted")); }); ctx.globalAlpha = 1;
      shownRules.forEach((r) => { const col = r.lift >= 1.2 ? css("--accent") : r.lift <= 0.85 ? css("--c3") : css("--c1"); dot(ctx, P.X(clamp(r.sup, 0, 0.4)), P.Y(r.conf), 3.5 + 1.8 * Math.min(r.lift, 4), col); if (r === sel) dot(ctx, P.X(clamp(r.sup, 0, 0.4)), P.Y(r.conf), 13, null, css("--text")); });
    });
    const fmt = (r) => `${names(r.X)} → ${names(r.Y)}`;
    function show() {
      refilter(); const top = shownRules.slice().sort((a, b) => b.lift - a.lift || b.sup - a.sup).slice(0, 5);
      out.innerHTML = `400 baskets, ${rules.length} candidate rules (supports above 2%) · filters: support ≥ <b>${minS.toFixed(2)}</b>, confidence ≥ <b>${minC.toFixed(2)}</b>, lift ≥ <b>${minL.toFixed(1)}</b> → <b>${shownRules.length}</b> rules pass (coloured dots; size and pink colour = high lift, grey dots are filtered out).<br>` + (sel ? `<b>Selected:</b> ${fmt(sel)} · support ${sel.sup.toFixed(3)} · confidence ${sel.conf.toFixed(2)} · lift ${sel.lift.toFixed(2)}<br>` : "") + `<b>Top by lift:</b><br>` + (top.length ? top.map((r) => `${fmt(r)}: support ${r.sup.toFixed(2)}, confidence ${r.conf.toFixed(2)}, lift ${r.lift.toFixed(2)}`).join("<br>") : "no rule passes these filters: loosen a threshold.") + `<br><span style="opacity:.75">The shop's hidden habits: bread → butter, beer → chips, diapers → milk; cola and milk tend <i>not</i> to be bought together (lift below 1). Click a dot to inspect a rule.</span>`; cv.redraw();
    }
    cv.c.addEventListener("pointerdown", (e) => { const p = cv.pos(e), P = lastQ; let b = null, bd = 18 * 18; shownRules.forEach((r) => { const d = (P.X(clamp(r.sup, 0, 0.4)) - p.x) ** 2 + (P.Y(r.conf) - p.y) ** 2; if (d < bd) { bd = d; b = r; } }); sel = b; show(); });
    slider(ctl, { label: "Min support", min: 0.02, max: 0.3, step: 0.01, value: minS, fmt: (v) => v.toFixed(2), onInput: (v) => { minS = v; show(); } });
    slider(ctl, { label: "Min confidence", min: 0, max: 1, step: 0.05, value: minC, fmt: (v) => v.toFixed(2), onInput: (v) => { minC = v; show(); } });
    slider(ctl, { label: "Min lift", min: 0, max: 3, step: 0.1, value: minL, fmt: (v) => v.toFixed(1), onInput: (v) => { minL = v; show(); } });
    btn(ctl, "New random shop", () => { seed++; sel = null; mine(); show(); }, "primary"); show();
  })();
});
