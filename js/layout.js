/* Builds the site shell (journey sidebar, top bar, TOC, pager), highlights code, loads fonts + KaTeX.
   Classic script: works from file://. Content of pages is never modified, only decorated. */
(function () {
  const ML = (window.ML = window.ML || {});
  const root = document.body.dataset.root || "";
  const current = document.body.dataset.topic || "";
  const safe = (fn, d) => { try { return fn(); } catch (e) { return d; } };
  const getDone = () => safe(() => JSON.parse(localStorage.getItem("ml-done") || "[]"), []);
  const setDone = (a) => safe(() => localStorage.setItem("ml-done", JSON.stringify(a)));
  const NS = "http://www.w3.org/2000/svg";

  // ---- theme ----
  const savedTheme = safe(() => localStorage.getItem("ml-theme"));
  const prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = savedTheme || "light";

  const all = ML.topics.flatMap((s) => s.items);
  const readyList = all.filter((t) => t.ready);
  const HEAD_COLORS = ["var(--coral)", "var(--yellow)", "var(--pink)", "var(--green)", "var(--blue)", "var(--orange)", "var(--purple)"];

  /** Smooth Catmull-Rom path through points. */
  function smooth(pts) {
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }
  ML.smoothPath = smooth;

  function bgDeco() {
    const s = document.createElementNS(NS, "svg");
    s.id = "bgdeco"; s.setAttribute("width", "100%"); s.setAttribute("height", "100%"); s.setAttribute("aria-hidden", "true");
    s.innerHTML = `<defs><pattern id="doodle" width="380" height="380" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="62" cy="70" r="11" stroke-width="7" stroke-dasharray="5 5.2"/><circle cx="62" cy="70" r="4"/>
        <path d="M180 50 q18 -30 36 0 t36 0 t36 0"/><path d="M310 40 l0 24 M298 52 l24 0"/>
        <circle cx="120" cy="190" r="4"/><circle cx="150" cy="170" r="4"/><circle cx="176" cy="204" r="4"/><circle cx="208" cy="160" r="4"/><path d="M104 214 L226 148" stroke-dasharray="3 7"/>
        <path d="M300 170 l16 28 l-32 0 z"/><rect x="40" y="290" width="26" height="26" rx="6"/><path d="M40 303 h26 M53 290 v26"/>
        <circle cx="270" cy="300" r="7"/><circle cx="320" cy="270" r="7"/><circle cx="320" cy="330" r="7"/><path d="M277 297 L313 273 M277 303 L313 327"/>
        <path d="M120 320 q20 -34 40 0 t40 0" stroke-dasharray="2 8"/>
      </g>
      <g fill="currentColor" font-family="Fredoka, Trebuchet MS, sans-serif" font-weight="700"><text x="20" y="160" font-size="34">∑</text><text x="330" y="130" font-size="30">θ</text><text x="230" y="250" font-size="30">∂</text><text x="150" y="110" font-size="28">π</text><text x="40" y="360" font-size="26">ŷ</text><text x="340" y="220" font-size="26">×</text></g>
    </pattern></defs><rect width="100%" height="100%" fill="url(#doodle)"/>`;
    document.body.insertBefore(s, document.body.firstChild);
  }

  function titleDeco() {
    const d = document.createElement("div");
    d.className = "title-deco";
    d.innerHTML = `<svg viewBox="0 0 150 130" width="150" height="130" aria-hidden="true">
      <g class="fl" style="--d:.2s"><circle cx="100" cy="42" r="26" fill="#ffd23f" stroke="#1d1b1a" stroke-width="4"/><circle cx="100" cy="42" r="26" fill="none" stroke="#1d1b1a" stroke-width="9" stroke-dasharray="6 6.1" transform="rotate(8 100 42)" opacity=".0"/><circle cx="100" cy="42" r="9" fill="#fffaf0" stroke="#1d1b1a" stroke-width="4"/></g>
      <g class="spin" style="transform-origin:100px 42px"><circle cx="100" cy="42" r="33" fill="none" stroke="#1d1b1a" stroke-width="7" stroke-dasharray="7 7.2"/></g>
      <g class="fl" style="--d:1s"><circle cx="30" cy="92" r="9" fill="#ff6b5a" stroke="#1d1b1a" stroke-width="4"/><circle cx="62" cy="112" r="7" fill="#4d7cff" stroke="#1d1b1a" stroke-width="4"/><circle cx="76" cy="80" r="6" fill="#2bb673" stroke="#1d1b1a" stroke-width="4"/><path d="M38 95 L56 108 M35 87 L72 80" stroke="#1d1b1a" stroke-width="3" stroke-linecap="round"/></g>
      <path d="M8 30 q12 -22 24 0 t24 0" fill="none" stroke="#ff8fb8" stroke-width="6" stroke-linecap="round"/></svg>`;
    return d;
  }

  function robotFace() {
    return `<circle r="9" fill="var(--coral)" stroke="var(--line)" stroke-width="2.5"/><circle cx="-3" cy="-1" r="1.7" fill="#1d1b1a"/><circle cx="3" cy="-1" r="1.7" fill="#1d1b1a"/><path d="M-3 3 q3 3 6 0" fill="none" stroke="#1d1b1a" stroke-width="1.6" stroke-linecap="round"/><path d="M0 -9 v-5" stroke="var(--line)" stroke-width="2"/><circle cy="-15" r="2.4" fill="var(--yellow)" stroke="var(--line)" stroke-width="1.5"/>`;
  }

  function build() {
    const lesson = document.getElementById("lesson");
    if (!lesson) return;
    const isHome = current === "home";
    document.body.classList.toggle("home", isHome);
    const done = getDone();

    // fonts
    const f = document.createElement("link");
    f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Fredoka:wght@500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
    document.head.appendChild(f);
    bgDeco();

    // ---- sidebar (journey path) ----
    let sb = null;
    if (!isHome) {
      sb = document.createElement("aside");
      sb.id = "sidebar";
      let html = `<a class="brand" href="${root}index.html"><span class="logo">∑</span>ML, Visually</a><div class="jn"><svg><path class="track"/><path class="trail"/></svg>`;
      ML.topics.forEach((s, si) => {
        html += `<h4 style="--hc:${HEAD_COLORS[si % HEAD_COLORS.length]}">${s.section}</h4>`;
        s.items.forEach((t) => {
          const isCur = t.id === current, isDone = done.includes(t.id) && t.ready;
          const state = isCur ? "current" : isDone ? "done" : t.ready ? "ready" : "soon";
          const cls = ["nav", t.sub ? "sub" : "", isCur ? "current" : "", t.ready ? "" : "soon"].join(" ");
          html += `<a class="${cls}" data-id="${t.id}" href="${t.ready ? root + t.href : "#"}"><span class="node ${state}"></span>${t.title}${t.ready ? "" : '<span class="soon-tag">soon</span>'}</a>`;
        });
      });
      html += "</div>";
      sb.innerHTML = html;
    }

    // ---- main column + topbar ----
    const main = document.createElement("div");
    main.id = "main";
    const cur = all.find((t) => t.id === current);
    main.innerHTML = `<header id="topbar">
      ${isHome
        ? `<a class="home-brand" href="${root}index.html"><span class="logo">∑</span>ML, Visually</a><nav class="nav-links"><a href="#syllabus">Syllabus</a><a href="${root}${all[0].href}">Start learning</a></nav>`
        : `<button class="iconbtn" id="menuBtn" aria-label="Menu">☰</button><div class="crumb">${cur ? cur.title : "Interactive Machine Learning"}</div>`}
      <span id="progTxt"></span>
      <svg id="trail" width="150" height="40" viewBox="0 0 150 40" data-tip="Your journey"></svg>
      <button class="iconbtn" id="themeBtn" aria-label="Toggle theme">◐</button></header>`;
    const wrap = document.createElement("div");
    wrap.id = "wrap";
    lesson.parentNode.insertBefore(main, lesson);
    main.appendChild(wrap);
    wrap.appendChild(lesson);

    const app = document.createElement("div");
    app.id = "app";
    document.body.insertBefore(app, document.body.firstChild);
    if (sb) app.appendChild(sb);
    app.appendChild(main);

    // callout labels + demo tabs
    const titles = { analogy: "💡 Analogy", math: "🧮 The math, step by step", real: "🌍 In the real world", task: "✍️ Try it yourself (optional)", warn: "⚠️ Watch out", tip: "📌 Key idea" };
    lesson.querySelectorAll(".callout").forEach((c) => {
      const k = Object.keys(titles).find((x) => c.classList.contains(x));
      if (k && !c.querySelector(".ct")) {
        const d = document.createElement("div");
        d.className = "ct";
        d.textContent = c.dataset.title || titles[k];
        c.insertBefore(d, c.firstChild);
      }
    });
    lesson.querySelectorAll(".demo[data-title]").forEach((d) => {
      const t = document.createElement("div");
      t.className = "dt";
      t.textContent = "Interactive · " + d.dataset.title;
      d.insertBefore(t, d.firstChild);
    });

    // code highlight + copy
    lesson.querySelectorAll("pre.code").forEach((pre) => {
      const code = pre.querySelector("code") || pre;
      const text = code.textContent.replace(/^\n/, "").replace(/\s+$/, "");
      const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const re = /(#.*$)|("""[\s\S]*?"""|"[^"\n]*"|'[^'\n]*')|\b(import|from|as|def|return|for|in|if|elif|else|while|class|with|lambda|not|and|or|is|try|except|yield)\b|\b(True|False|None)\b|\b(\d+\.?\d*(?:e-?\d+)?)\b|\b([A-Za-z_]\w*)(?=\()/gm;
      const out = esc.replace(re, (m, c, s, k, b, n, f) =>
        c ? `<span class="c">${c}</span>` : s ? `<span class="s">${s}</span>` : k ? `<span class="k">${k}</span>` : b ? `<span class="k">${b}</span>` : n ? `<span class="n">${n}</span>` : `<span class="f">${f}</span>`);
      const el = document.createElement("code");
      el.innerHTML = out;
      pre.innerHTML = "";
      pre.appendChild(el);
      const btn = document.createElement("button");
      btn.className = "cp"; btn.textContent = "Copy";
      btn.onclick = () => { safe(() => navigator.clipboard.writeText(text)); btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = "Copy"), 1400); };
      pre.appendChild(btn);
    });

    if (!isHome) {
      lesson.insertBefore(titleDeco(), lesson.firstChild);
      // TOC
      const hs = [...lesson.querySelectorAll("h2")];
      hs.forEach((h, i) => (h.id = h.id || "s" + (i + 1)));
      if (hs.length > 2) {
        const toc = document.createElement("aside");
        toc.id = "toc";
        toc.innerHTML = "<b>On this page</b>" + hs.map((h) => `<a href="#${h.id}">${h.textContent}</a>`).join("");
        wrap.appendChild(toc);
        const links = [...toc.querySelectorAll("a")];
        const io = new IntersectionObserver((es) => {
          es.forEach((e) => { if (e.isIntersecting) { links.forEach((l) => l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id)); } });
        }, { rootMargin: "-80px 0px -70% 0px" });
        hs.forEach((h) => io.observe(h));
      }
      // pager
      const idx = readyList.findIndex((t) => t.id === current);
      const prev = readyList[idx - 1], next = readyList[idx + 1];
      const pager = document.createElement("nav");
      pager.id = "pager";
      const isDone = () => getDone().includes(current);
      pager.innerHTML =
        (prev ? `<a href="${root + prev.href}"><small>← Previous</small>${prev.title}</a>` : "") +
        `<button id="doneBtn"></button>` +
        (next ? `<a class="next" href="${root + next.href}"><small>Next →</small>${next.title}</a>` : `<a class="next" style="pointer-events:none;opacity:.7"><small>Next</small>More lessons coming soon</a>`);
      lesson.appendChild(pager);
      const db = pager.querySelector("#doneBtn");
      const paintDone = () => { db.className = isDone() ? "done" : ""; db.textContent = isDone() ? "✓ Completed (click to undo)" : "Mark as complete"; };
      db.onclick = () => { let a = getDone(); a = a.includes(current) ? a.filter((x) => x !== current) : a.concat(current); setDone(a); paintDone(); paintProg(); };
      paintDone();
    }
    const foot = document.createElement("footer");
    foot.className = "foot";
    foot.textContent = "ML, Visually · learn by doing";
    lesson.appendChild(foot);

    // ---- journey path (sidebar) ----
    function layoutJourney() {
      if (!sb) return;
      const jn = sb.querySelector(".jn"), svg = jn.querySelector("svg"), items = [...jn.querySelectorAll("a.nav")];
      const H = jn.scrollHeight;
      svg.setAttribute("width", 56); svg.setAttribute("height", H);
      const pts = items.map((a, i) => ({ x: 26 + 9 * Math.sin(i * 0.95 + 0.3), y: a.offsetTop + a.offsetHeight / 2, a }));
      pts.forEach((p) => { const n = p.a.querySelector(".node"); n.style.left = p.x - n.offsetWidth / 2 + "px"; });
      const path = [{ x: pts[0].x, y: pts[0].y - 16 }, ...pts];
      const d = smooth(path);
      svg.querySelector(".track").setAttribute("d", d);
      const tr = svg.querySelector(".trail");
      tr.setAttribute("d", d);
      const L = tr.getTotalLength();
      const doneNow = getDone();
      let last = pts.findIndex((p) => p.a.dataset.id === current);
      pts.forEach((p, i) => { if (doneNow.includes(p.a.dataset.id) && i > last) last = i; });
      const frac = last < 0 ? 0 : (pts[last].y - path[0].y) / (pts[pts.length - 1].y - path[0].y);
      tr.style.strokeDasharray = `${(L * frac).toFixed(1)} ${L.toFixed(1)}`;
    }
    layoutJourney();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutJourney);
    window.addEventListener("resize", layoutJourney);
    if (sb) { const c = sb.querySelector("a.current"); if (c) sb.scrollTop = Math.max(0, c.offsetTop - sb.clientHeight / 2); }

    // ---- progress trail (top bar) ----
    function paintProg() {
      const total = readyList.length, d = getDone().filter((id) => readyList.some((t) => t.id === id)).length;
      const svg = document.getElementById("trail"), W = 150, Hh = 40, n = Math.max(total, 2);
      const pts = Array.from({ length: n }, (_, i) => ({ x: 12 + (i * (W - 24)) / (n - 1), y: 22 + 8 * Math.sin(i * 1.7) }));
      const dd = smooth(pts), frac = Math.min(1, d / (n - 1));
      svg.innerHTML = `<path class="bt" d="${dd}"/><path class="pt" d="${dd}" pathLength="100" stroke-dasharray="${(frac * 100).toFixed(1)} 100"/>` +
        pts.map((p, i) => `<circle class="dt ${i < d ? "d" : ""}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5.5"/>`).join("") +
        `<g class="rb" style="transform:translate(${pts[Math.min(d, n - 1)].x.toFixed(1)}px,${(pts[Math.min(d, n - 1)].y - 12).toFixed(1)}px)">${robotFace()}</g>`;
      document.getElementById("progTxt").textContent = d + "/" + total + " done";
      if (sb) {
        sb.querySelectorAll("a.nav").forEach((a) => {
          const t = all.find((x) => x.id === a.dataset.id), n = a.querySelector(".node");
          if (!t || !t.ready || t.id === current) return;
          n.className = "node " + (getDone().includes(t.id) ? "done" : "ready");
        });
        layoutJourney();
      }
    }
    paintProg();

    document.getElementById("themeBtn").onclick = () => {
      const nt = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nt;
      safe(() => localStorage.setItem("ml-theme", nt));
      document.dispatchEvent(new Event("themechange"));
    };
    const mb = document.getElementById("menuBtn");
    if (mb) { mb.onclick = (e) => { e.stopPropagation(); document.body.classList.toggle("menu"); }; main.addEventListener("click", () => document.body.classList.remove("menu")); if (sb) sb.addEventListener("click", (e) => { if (e.target.closest("a.nav")) document.body.classList.remove("menu"); }); }
    if (isHome) {
      const tb = document.getElementById("topbar"), sc = () => tb.classList.toggle("scrolled", window.scrollY > 40);
      window.addEventListener("scroll", sc, { passive: true }); sc();
    }

    // page transitions
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.getAttribute("href").startsWith("#") || a.getAttribute("href") === "javascript:void(0)") return;
      if (a.protocol !== location.protocol || (a.host !== location.host) || (a.pathname === location.pathname && a.hash)) return;
      e.preventDefault(); document.body.classList.add("leaving"); setTimeout(() => (location.href = a.href), 170);
    });
    window.addEventListener("pageshow", () => document.body.classList.remove("leaving"));

    // KaTeX (CDN; falls back to raw TeX offline)
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
    document.head.appendChild(css);
    const s1 = document.createElement("script");
    s1.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
    s1.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js";
      s2.onload = () => window.renderMathInElement(document.getElementById("lesson"), {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false });
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);

    document.dispatchEvent(new Event("mlready"));
    // titles -> illustrated tooltips (after demos have created their elements)
    document.querySelectorAll("#app [title]").forEach((el) => { el.dataset.tip = el.getAttribute("title"); el.removeAttribute("title"); });
    document.dispatchEvent(new Event("mlbuilt"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();
