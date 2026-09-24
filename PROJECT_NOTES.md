# ML, Visually: project notes / handoff

An interactive website that teaches machine learning. Static HTML + CSS + vanilla JS (no build step), opens from a local server or even file://. Cream/charcoal illustrated design with journey paths (see css/style.css). KaTeX (CDN) for maths: use `\( \)` inline and `$$ $$` for display; plain `$...$` is NOT rendered.

## Run it
```
cd C:\Users\malia\OneDrive\Desktop\Machine-Learning
python -m http.server 8765
```
Open http://localhost:8765/index.html

## Structure
- `index.html` landing page.
- `css/style.css` the design system. Reuse existing classes only: `callout analogy|math|real|task|warn|tip`, `demo`, `cards`/`card`, `flow`, `tw` (table wrapper), `chip`, `lede`, `meta`, `code`.
- `js/topics.js` syllabus manifest. A lesson is shown as available when its entry has `ready: true`. Ids: intro, types, workflow, preprocessing, metrics, linreg, ridge, lasso, logreg, nb, knn, dt, svm, rf, ada, gb, xgb, grid, cluster, kmeans, dbscan, hier, pca, lda, arl, lprop, lspread, mbased, mfree, deploy, streamlit.
- `js/layout.js` builds the sidebar path, top progress trail, table of contents, pager, code highlighting and theme toggle.
- `js/lib/viz.js` demo helpers (canvas, plane, axes, dot, line, slider, btn, rng, randn, mean, clamp, css, h, $). `js/lib/svm.js` kernel SVM.
- `topics/` lesson pages: `01-introduction`, `02-types-of-ml`, `03a-ml-workflow`, `03b-data-preprocessing`, `03c-evaluation-metrics`, and folders `04-supervised`, `05-unsupervised`, `06-semi-supervised`, `07-reinforcement`, `08-deployment`.
- `js/pages/<lesson>.js` holds the demos of each lesson (wrapped in `ML.ready(...)`).

Page skeleton:
```html
<body data-root="../../" data-topic="<id from topics.js>">
<article id="lesson"> ... </article>
<script src="../../js/topics.js"></script>
<script src="../../js/lib/viz.js"></script>
<script src="../../js/layout.js"></script>
<script src="../../js/pages/<lesson>.js"></script>
```
Demo markup: `<div class="demo" data-title=".."><div class="db" data-canvas></div><div class="controls" data-controls></div><div class="readout" data-out></div></div>`

## Lesson template (how every lesson is written)
1. Big idea + an analogy, in simple English.
2. Maths by hand on a tiny dataset, plain-words version first, numbers verified in Node/Python BEFORE writing.
3. 3-4 interactive demos, tested by driving them with JavaScript in the browser.
4. scikit-learn (or library) code with REAL outputs (state the library version); a parameter table.
5. Strengths/limits, real-world cards, key takeaways, a small optional task with answers in `<details>`. No quizzes.
6. Report honestly anything that was not run or verified. If a demo contradicts the planned story, change the lesson to what really happened.

## Progress
DONE (31): Introduction, Types of ML, ML Workflow, Data Pre-processing, Evaluation Metrics (added later), Linear Regression, Ridge, LASSO, Logistic Regression, Naive Bayes, KNN, Decision Tree, SVM, Random Forest, AdaBoost, Gradient Boosting, XGBoost, Grid Search CV, Clustering Overview, K-Means, DBSCAN, Hierarchical, PCA, LDA, Association Rules, Label Propagation, Label Spreading, RL Model-Based, RL Model-Free, Deployment overview, Deployment using Streamlit (streamlit.html + js/pages/streamlit.js; verified with Streamlit 1.64.0 AppTest).

REMAINING: none. Optional polish only: the planned Pyodide "run real scikit-learn in the browser" cells, a per-page console-error sweep, a landing-page text review.

## Environment notes
- Windows. Python + scikit-learn 1.9.0 + numpy + pandas + scipy are installed globally; Node 22 available.
- xgboost, mlxtend, gymnasium, fastapi/httpx were installed ONLY into isolated scratch folders (`pip install <pkg> --target <folder>`, then set `PYTHONPATH`). They may be gone in a new session: reinstall the same way, never into the user's own environment without asking.
- Canvas gotchas: `ML.canvas` calls the draw callback immediately, so initialise all state before creating the canvas and never reference the canvas variable inside draw. Use `ML.css("--x")` for canvas colours (no `var()` strings).
- Screenshots often come back blank right after navigation/resize: wait ~3 s or check pixels with `getImageData`.
