# ML Learning Website: Build Plan

## Goal
An interactive site where a beginner can learn every topic on the syllabus. Each topic page is a full lesson, not a summary: plain-English explanation, an analogy, the math worked by hand on a tiny dataset, live visualisations you can play with, scikit-learn code, and a short quiz.

Your handwritten notes (Linear Regression, Encoding, ML Workflow, Types of ML) are the **content baseline**. Their examples are reused, for instance the x=[1,2,3], y=[1,2,3] example with θ1 = 0 / 0.5 / 1 / 1.5 / 2. Each page then goes deeper than the notes.

## Tech stack
- Static site: plain HTML, CSS and vanilla JS (ES modules). No build step and no npm install. Open `index.html` or run one command to serve it.
- Visuals: Canvas and SVG written in JS, with a few small shared helpers (`plot.js`, `slider.js`, `quiz.js`).
- Math: KaTeX from a CDN.
- Code blocks: syntax-highlighted scikit-learn snippets with a copy button. Each demo's numbers match what sklearn would produce.
- Optional later phase: "Run this code" cells with Pyodide (real scikit-learn in the browser).

## Folder layout
```
Machine-Learning/
  index.html              landing page and syllabus map
  css/style.css           shared theme (light and dark)
  js/lib/                 plot.js, slider.js, quiz.js, katex helpers, tiny ML math utils
  topics/
    01-introduction.html
    02-types-of-ml.html
    03a-ml-workflow.html
    03b-data-preprocessing.html
    04-supervised/
      linear-regression.html  ridge.html  lasso.html  logistic-regression.html
      naive-bayes.html  knn.html  decision-tree.html  svm.html
      random-forest.html  adaboost.html  gradient-boosting.html  xgboost.html
      grid-search-cv.html
    05-unsupervised/
      clustering-overview.html  kmeans.html  dbscan.html  hierarchical.html
      pca.html  lda.html  association-rules.html
    06-semi-supervised/  label-propagation.html  label-spreading.html
    07-reinforcement/    model-based.html  model-free.html
    08-deployment/       streamlit.html
```

## Standard lesson template (every page)
1. **Big idea** in one sentence, plus a real-world **analogy**
2. **Why it exists**: the problem it solves
3. **Intuition** with an interactive visual
4. **The math, step by step**: a tiny dataset (3 to 6 points) worked by hand, with every number shown
5. **Playground**: sliders and buttons that change the algorithm live
6. **scikit-learn code**: imports, `fit`, `predict`, key parameters explained
7. **Pitfalls and when to use it**, with pros and cons
8. **Quiz** (3 to 5 questions) and a "key takeaways" box

## Build phases (one topic at a time, each reviewed before the next)

| Phase | Deliverable | Interactive highlights |
|---|---|---|
| 0 | Site shell: landing page, sidebar navigation, theme, shared JS lib, lesson template | progress tracking (localStorage) |
| 1 | Introduction, Types of ML | sort-the-example-into-the-right-type game; supervised vs unsupervised vs RL animation |
| 2 | ML Workflow (all 10 steps) | clickable pipeline with a mini case study at each step |
| 3 | Data Pre-processing | Label / One-Hot / Ordinal encoders with editable tables and the exact sklearn syntax (`fit_transform`, `get_feature_names_out`, `categories=[...]`, `sparse_output=False`), plus feature scaling (Standard and MinMax) |
| 4 | Linear Regression | drag points, fit the line, gradient-descent animation, cost curve J(θ1) built from your 0 / 0.5 / 1 / 1.5 / 2 example |
| 5 | Ridge, LASSO | regularisation slider, coefficient shrinkage paths |
| 6 | Logistic Regression | sigmoid, decision boundary, log-loss worked example |
| 7 | Naive Bayes | Bayes' theorem calculated on a spam example, editable priors |
| 8 | KNN | click to add a point, K slider, distance calculations shown for each neighbour |
| 9 | Decision Tree | entropy / Gini / information gain worked by hand, step-through splitting |
| 10 | SVM | margin, support vectors, C and kernel sliders |
| 11 | Random Forest, AdaBoost, Gradient Boosting, XGBoost | bagging vs boosting visualised round by round, weight updates worked out |
| 12 | Grid Search CV | k-fold diagram, parameter grid heatmap |
| 13 | Clustering: K-Means, DBSCAN, Hierarchical | step-by-step centroid moves, eps/minPts sliders, dendrogram builder |
| 14 | PCA, LDA, Association Rules | covariance and eigenvectors worked in 2D, support/confidence/lift on a basket table |
| 15 | Semi-supervised: Label Propagation and Spreading | graph animation |
| 16 | Reinforcement Learning: Model-Based and Model-Free | grid-world agent, Q-table updates by hand |
| 17 | Deployment with Streamlit | annotated `app.py`, live mock of the UI, save/load with joblib |
| 18 | Polish: search, glossary, cheat-sheets, mobile pass, optional Pyodide cells | |

## Working rules
- One phase at a time. I build it, you open it and give feedback, then we move on.
- Every algorithm page includes hand-computed math with real numbers.
- I will not copy text or code from the reference sites. They are used only for inspiration on interaction style.
- Anything from your notes is kept and expanded, not dropped.

## Open decisions
1. Stack: static HTML/JS as above (recommended) or React/Vite?
2. Include Pyodide "run real scikit-learn" cells (adds about 10 MB load, only on pages that use it)?
3. Visual style: clean light theme with a dark-mode toggle (default), or dark-first?
